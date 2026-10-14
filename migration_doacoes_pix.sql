  -- Rode este script no SQL Editor do Supabase do projeto Aviva, depois das
  -- migrations anteriores (incentivo_fiscal, notificacoes e admin).
  --
  -- Doações por Pix com confirmação manual — nenhum dinheiro passa pelo Aviva:
  --   1) Quem doa paga no app do próprio banco (chave Pix da ONG) e INFORMA a
  --      doação aqui, com comprovante opcional.
  --   2) A ONG recebe um aviso e confirma (ou diz que não recebeu).
  --   3) Só doação CONFIRMADA entra nos números e no teto dedutível da empresa.
  --
  -- Reaproveita a tabela "doacoes" (que já guardava a doação dedutível de
  -- empresa) em vez de criar um segundo conceito de doação.
  
  -- 1) Colunas novas ----------------------------------------------------------
  alter table public.doacoes
    add column if not exists doador_id uuid references public.profiles(id) on delete cascade,
    add column if not exists status text not null default 'pendente',
    add column if not exists confirmada_em timestamptz,
    add column if not exists resposta_ong text,
    add column if not exists dedutivel boolean not null default false;
  
  alter table public.doacoes drop constraint if exists doacoes_status_check;
  alter table public.doacoes
    add constraint doacoes_status_check check (status in ('pendente', 'confirmada', 'nao_recebida'));
  
  -- Linhas antigas vieram todas do fluxo de doação dedutível da empresa.
  update public.doacoes
     set doador_id = empresa_id, dedutivel = true, status = 'confirmada', confirmada_em = created_at
   where doador_id is null;
  
  alter table public.doacoes alter column doador_id set not null;
  alter table public.doacoes alter column empresa_id drop not null;
  
  create index if not exists doacoes_doador_id_idx on public.doacoes (doador_id);
  create index if not exists doacoes_ong_status_idx on public.doacoes (ong_id, status);
  
  -- 2) Regras de criação (no banco, não confiam no cliente) ---------------------
  create or replace function public.doacoes_preparar_insercao()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    v_tipo text;
    v_elegivel boolean;
    v_pendentes int;
  begin
    -- O cliente nunca decide o status nem a confirmação.
    new.status := 'pendente';
    new.confirmada_em := null;
    new.resposta_ong := null;
  
    select user_type into v_tipo from profiles where id = new.doador_id;
    new.empresa_id := case when v_tipo = 'empresa' then new.doador_id else null end;
  
    if new.doador_id = new.ong_id then
      raise exception 'não é possível doar para si mesmo';
    end if;
    if new.data_doacao > current_date then
      raise exception 'a data da doação não pode estar no futuro';
    end if;
  
    if new.dedutivel then
      if v_tipo <> 'empresa' then
        raise exception 'só empresas registram doação dedutível';
      end if;
      select elegivel_doacao_dedutivel into v_elegivel from profiles where id = new.ong_id;
      if not coalesce(v_elegivel, false) then
        raise exception 'a ONG ainda não declarou elegibilidade para doação dedutível';
      end if;
    end if;
  
    -- Freio simples contra enchente de avisos para uma ONG.
    select count(*) into v_pendentes from doacoes
     where doador_id = new.doador_id and ong_id = new.ong_id and status = 'pendente';
    if v_pendentes >= 10 then
      raise exception 'você já tem muitas doações aguardando confirmação desta ONG';
    end if;
  
    return new;
  end;
  $$;
  
  drop trigger if exists trg_doacoes_preparar_insercao on public.doacoes;
  create trigger trg_doacoes_preparar_insercao
    before insert on public.doacoes
    for each row execute function public.doacoes_preparar_insercao();
  
  -- 3) Acesso -------------------------------------------------------------------
  drop policy if exists "empresa e ong veem as doacoes que participam" on public.doacoes;
  drop policy if exists "somente empresa registra sua propria doacao" on public.doacoes;
  drop policy if exists "doador e ong veem as doacoes que participam" on public.doacoes;
  drop policy if exists "voluntario ou empresa informa a propria doacao" on public.doacoes;
  
  create policy "doador e ong veem as doacoes que participam"
    on public.doacoes for select
    using (auth.uid() = doador_id or auth.uid() = ong_id);
  
  create policy "voluntario ou empresa informa a propria doacao"
    on public.doacoes for insert
    with check (
      auth.uid() = doador_id
      and exists (select 1 from public.profiles where id = auth.uid() and user_type in ('voluntario', 'empresa'))
      and exists (select 1 from public.profiles where id = ong_id and user_type = 'ong')
    );
  
  -- Sem policy de UPDATE/DELETE: o registro é uma trilha de auditoria. O único
  -- jeito de mudar o status é a função responder_doacao, só para a ONG da doação.
  revoke update, delete on public.doacoes from authenticated, anon;
  
  -- 4) Notificações -------------------------------------------------------------
  alter table public.notificacoes drop constraint if exists notificacoes_tipo_check;
  alter table public.notificacoes
    add constraint notificacoes_tipo_check
    check (tipo in (
      'candidatura_nova', 'candidatura_aceita', 'candidatura_recusada', 'acao_concluida',
      'verificacao_aprovada', 'verificacao_recusada', 'reclamacao_respondida',
      'doacao_nova', 'doacao_confirmada', 'doacao_nao_recebida'
    ));
  
  create or replace function public.notificar_nova_doacao()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare v_nome text;
  begin
    select coalesce(full_name, 'Alguém') into v_nome from profiles where id = new.doador_id;
    insert into notificacoes (usuario_id, tipo, titulo, mensagem, link)
    values (
      new.ong_id, 'doacao_nova', 'Doação a confirmar',
      v_nome || ' informou uma doação de R$ ' || replace(to_char(new.valor, 'FM999999990.00'), '.', ',')
        || ' por Pix. Confira na sua conta e confirme o recebimento.',
      '/doacoes'
    );
    return new;
  end;
  $$;
  
  drop trigger if exists trg_notificar_nova_doacao on public.doacoes;
  create trigger trg_notificar_nova_doacao
    after insert on public.doacoes
    for each row execute function public.notificar_nova_doacao();
  
  -- 5) A ONG confirma ou diz que não recebeu ------------------------------------
  create or replace function public.responder_doacao(p_id uuid, p_recebida boolean, p_resposta text default null)
  returns void
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    d doacoes%rowtype;
    v_resposta text := nullif(btrim(coalesce(p_resposta, '')), '');
    v_ong text;
  begin
    select * into d from doacoes where id = p_id and ong_id = auth.uid() for update;
    if not found then raise exception 'doação não encontrada'; end if;
    if d.status <> 'pendente' then raise exception 'esta doação já foi respondida'; end if;
    if not p_recebida and v_resposta is null then
      raise exception 'conte por que o valor não foi recebido';
    end if;
    if v_resposta is not null and char_length(v_resposta) > 500 then
      raise exception 'a resposta pode ter no máximo 500 caracteres';
    end if;
  
    update doacoes
       set status = case when p_recebida then 'confirmada' else 'nao_recebida' end,
           confirmada_em = case when p_recebida then now() else null end,
           resposta_ong = v_resposta
     where id = p_id;
  
    select coalesce(full_name, 'A ONG') into v_ong from profiles where id = d.ong_id;
    insert into notificacoes (usuario_id, tipo, titulo, mensagem, link)
    values (
      d.doador_id,
      case when p_recebida then 'doacao_confirmada' else 'doacao_nao_recebida' end,
      case when p_recebida then 'Doação confirmada' else 'Doação não localizada' end,
      case when p_recebida
           then v_ong || ' confirmou o recebimento da sua doação de R$ ' || replace(to_char(d.valor, 'FM999999990.00'), '.', ',') || '. Obrigado!'
           else v_ong || ' não localizou a doação de R$ ' || replace(to_char(d.valor, 'FM999999990.00'), '.', ',') || ': ' || v_resposta end,
      '/doacoes'
    );
  end;
  $$;
  
  revoke all on function public.responder_doacao(uuid, boolean, text) from public;
  grant execute on function public.responder_doacao(uuid, boolean, text) to authenticated;
  
  -- 6) A ONG precisa conseguir abrir o comprovante que o doador anexou ----------
  drop policy if exists "documentos-fiscais: ong le comprovantes das doacoes recebidas" on storage.objects;
  create policy "documentos-fiscais: ong le comprovantes das doacoes recebidas"
    on storage.objects for select
    using (
      bucket_id = 'documentos-fiscais'
      and exists (
        select 1 from public.doacoes d
        where d.ong_id = auth.uid() and d.comprovante_url = name
      )
    );
