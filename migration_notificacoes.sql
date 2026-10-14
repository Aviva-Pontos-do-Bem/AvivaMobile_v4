-- Rode este script no SQL Editor do Supabase do projeto Aviva.
--
-- Notificações dentro do app. As linhas são criadas SOMENTE por triggers no
-- banco (nenhum cliente consegue inserir notificação para outra pessoa, nem
-- para si mesmo), então não dá para forjar um aviso. A pessoa só lê, marca
-- como lida e apaga as próprias.
--   - Voluntário se candidata  -> a ONG da vaga é avisada.
--   - ONG aceita/recusa/conclui -> o voluntário é avisado.

-- 1) Tabela ----------------------------------------------------------------
create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.profiles(id) on delete cascade,
  tipo text not null check (tipo in ('candidatura_nova', 'candidatura_aceita', 'candidatura_recusada', 'acao_concluida')),
  titulo text not null,
  mensagem text,
  link text,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notificacoes_usuario_idx
  on public.notificacoes (usuario_id, lida, created_at desc);

-- 2) Acesso ----------------------------------------------------------------
alter table public.notificacoes enable row level security;

drop policy if exists "ve as proprias notificacoes" on public.notificacoes;
create policy "ve as proprias notificacoes"
  on public.notificacoes for select
  using (auth.uid() = usuario_id);

drop policy if exists "marca as proprias como lidas" on public.notificacoes;
create policy "marca as proprias como lidas"
  on public.notificacoes for update
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

drop policy if exists "apaga as proprias notificacoes" on public.notificacoes;
create policy "apaga as proprias notificacoes"
  on public.notificacoes for delete
  using (auth.uid() = usuario_id);

-- Sem policy de INSERT: só os triggers abaixo (SECURITY DEFINER) criam linhas.
-- Além disso, o cliente só pode alterar a coluna "lida" — título, texto e
-- destino ficam imutáveis.
revoke update on public.notificacoes from authenticated, anon;
grant update (lida) on public.notificacoes to authenticated;
revoke insert on public.notificacoes from authenticated, anon;

-- 3) Triggers --------------------------------------------------------------
create or replace function public.notificar_nova_candidatura()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ong uuid;
  v_titulo text;
  v_nome text;
begin
  select ong_id, titulo into v_ong, v_titulo from vagas where id = new.vaga_id;
  if v_ong is null then return new; end if;

  select coalesce(full_name, 'Um voluntário') into v_nome from profiles where id = new.voluntario_id;

  insert into notificacoes (usuario_id, tipo, titulo, mensagem, link)
  values (
    v_ong,
    'candidatura_nova',
    'Nova candidatura',
    v_nome || ' se candidatou à vaga "' || v_titulo || '".',
    '/candidaturas'
  );
  return new;
end;
$$;

create or replace function public.notificar_mudanca_status_candidatura()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_titulo text;
  v_tipo text;
  v_assunto text;
  v_texto text;
begin
  if new.status is not distinct from old.status then return new; end if;

  if new.status = 'aceito' then
    v_tipo := 'candidatura_aceita';
    v_assunto := 'Candidatura aceita';
    v_texto := 'Você foi aceito(a) na vaga "%s". Confira os detalhes.';
  elsif new.status = 'recusado' then
    v_tipo := 'candidatura_recusada';
    v_assunto := 'Candidatura não aprovada';
    v_texto := 'Sua candidatura à vaga "%s" não foi aprovada desta vez. Que tal procurar outras ações?';
  elsif new.status = 'concluido' then
    v_tipo := 'acao_concluida';
    v_assunto := 'Ação concluída';
    v_texto := 'A ONG marcou a ação "%s" como concluída. Seus pontos de impacto foram atualizados.';
  else
    return new;
  end if;

  select titulo into v_titulo from vagas where id = new.vaga_id;

  insert into notificacoes (usuario_id, tipo, titulo, mensagem, link)
  values (new.voluntario_id, v_tipo, v_assunto, format(v_texto, coalesce(v_titulo, 'sem título')), '/vaga/' || new.vaga_id);
  return new;
end;
$$;

drop trigger if exists trg_notificar_nova_candidatura on public.candidaturas;
create trigger trg_notificar_nova_candidatura
  after insert on public.candidaturas
  for each row execute function public.notificar_nova_candidatura();

drop trigger if exists trg_notificar_status_candidatura on public.candidaturas;
create trigger trg_notificar_status_candidatura
  after update of status on public.candidaturas
  for each row execute function public.notificar_mudanca_status_candidatura();

-- 4) Tempo real (a bolinha de não lidas atualiza sem recarregar) ----------
do $$
begin
  alter publication supabase_realtime add table public.notificacoes;
exception when duplicate_object then
  null;
end $$;
