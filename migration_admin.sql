-- Rode este script no SQL Editor do Supabase do projeto Aviva, depois das
-- migrations anteriores (inclusive migration_notificacoes.sql).
--
-- Painel administrativo (aviva-web):
--   1) Quem é admin vive em uma tabela que NENHUM cliente consegue alterar —
--      só você, pelo SQL Editor (veja o final deste arquivo).
--   2) Toda ação de admin é uma função no banco que confere is_admin() antes
--      de fazer qualquer coisa. O site só chama essas funções; mesmo que
--      alguém altere o JavaScript do painel, o banco continua recusando.
--   3) Aprovar/recusar a verificação de ONG/Empresa e atender reclamações
--      geram um registro de auditoria e avisam a pessoa por notificação.

-- 1) Admins ------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists "admin ve a propria linha" on public.admins;
create policy "admin ve a propria linha"
  on public.admins for select
  using (auth.uid() = user_id);

revoke insert, update, delete on public.admins from authenticated, anon;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- 2) Auditoria ---------------------------------------------------------------
create table if not exists public.admin_acoes (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  acao text not null,
  alvo_id uuid,
  detalhe jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_acoes enable row level security;

drop policy if exists "admin le a auditoria" on public.admin_acoes;
create policy "admin le a auditoria"
  on public.admin_acoes for select
  using (public.is_admin());

revoke insert, update, delete on public.admin_acoes from authenticated, anon;

-- 3) Campos novos ------------------------------------------------------------
alter table public.profiles
  add column if not exists verificacao_status text not null default 'pendente',
  add column if not exists verificacao_motivo text,
  add column if not exists verificado_em timestamptz;

alter table public.profiles drop constraint if exists profiles_verificacao_status_check;
alter table public.profiles
  add constraint profiles_verificacao_status_check
  check (verificacao_status in ('pendente', 'aprovada', 'recusada'));

-- Quem já estava verificado continua aprovado.
update public.profiles
   set verificacao_status = 'aprovada', verificado_em = coalesce(verificado_em, now())
 where verificado = true and verificacao_status <> 'aprovada';

-- O motivo da recusa só interessa à própria conta e ao admin (a conta lê
-- pela função meu_perfil, que já devolve a linha inteira).
revoke select (verificacao_motivo) on public.profiles from authenticated, anon;

alter table public.reclamacoes
  add column if not exists resposta_admin text,
  add column if not exists atualizado_em timestamptz;

alter table public.reclamacoes drop constraint if exists reclamacoes_status_check;
alter table public.reclamacoes
  add constraint reclamacoes_status_check
  check (status in ('aberta', 'em_analise', 'resolvida', 'descartada'));

-- Novos tipos de notificação (verificação e resposta de reclamação).
alter table public.notificacoes drop constraint if exists notificacoes_tipo_check;
alter table public.notificacoes
  add constraint notificacoes_tipo_check
  check (tipo in (
    'candidatura_nova', 'candidatura_aceita', 'candidatura_recusada', 'acao_concluida',
    'verificacao_aprovada', 'verificacao_recusada', 'reclamacao_respondida'
  ));

-- 4) O usuário não pode mexer no próprio status de verificação ---------------
create or replace function public.protege_campos_sensiveis_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id then
    if old.user_type is not null then
      new.user_type := old.user_type;
    end if;
    new.verificado := old.verificado;
    new.verificacao_status := old.verificacao_status;
    new.verificacao_motivo := old.verificacao_motivo;
    new.verificado_em := old.verificado_em;
  end if;

  if new.empresa_id is not null and new.empresa_id is distinct from old.empresa_id then
    if not exists (select 1 from profiles where id = new.empresa_id and user_type = 'empresa') then
      raise exception 'empresa_id precisa apontar para um perfil do tipo empresa';
    end if;
  end if;

  return new;
end;
$$;

-- 5) Funções do painel -------------------------------------------------------
create or replace function public.admin_resumo()
returns table (verificacoes_pendentes bigint, reclamacoes_abertas bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not is_admin() then raise exception 'acesso negado' using errcode = '42501'; end if;
  return query
    select
      (select count(*) from profiles where user_type in ('ong', 'empresa') and verificacao_status = 'pendente'),
      (select count(*) from reclamacoes where status in ('aberta', 'em_analise'));
end;
$$;

drop function if exists public.admin_listar_perfis(text, text);
create function public.admin_listar_perfis(p_status text default null, p_tipo text default null)
returns table (
  id uuid, full_name text, user_type text, email text, documento text, telefone text,
  endereco text, site text, bio text, verificado boolean, verificacao_status text,
  verificacao_motivo text, verificado_em timestamptz, elegivel_doacao_dedutivel boolean,
  estatuto_url text, cadastrado_em timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not is_admin() then raise exception 'acesso negado' using errcode = '42501'; end if;
  return query
    select p.id, p.full_name, p.user_type, u.email::text, p.documento, p.telefone,
           p.endereco, p.site, p.bio, p.verificado, p.verificacao_status,
           p.verificacao_motivo, p.verificado_em, p.elegivel_doacao_dedutivel,
           p.estatuto_url, u.created_at
      from profiles p
      join auth.users u on u.id = p.id
     where p.user_type in ('ong', 'empresa')
       and (p_status is null or p.verificacao_status = p_status)
       and (p_tipo is null or p.user_type = p_tipo)
     order by (p.verificacao_status = 'pendente') desc, u.created_at desc
     limit 200;
end;
$$;

create or replace function public.admin_definir_verificacao(p_perfil uuid, p_aprovar boolean, p_motivo text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tipo text;
  v_nome text;
  v_motivo text := nullif(btrim(coalesce(p_motivo, '')), '');
begin
  if not is_admin() then raise exception 'acesso negado' using errcode = '42501'; end if;
  if v_motivo is not null and char_length(v_motivo) > 500 then
    raise exception 'o motivo pode ter no máximo 500 caracteres';
  end if;
  if not p_aprovar and v_motivo is null then
    raise exception 'informe o motivo da recusa';
  end if;

  select user_type, full_name into v_tipo, v_nome from profiles where id = p_perfil;
  if v_tipo is null then raise exception 'perfil não encontrado'; end if;
  if v_tipo not in ('ong', 'empresa') then
    raise exception 'só ONGs e empresas passam por verificação';
  end if;

  update profiles
     set verificado = p_aprovar,
         verificacao_status = case when p_aprovar then 'aprovada' else 'recusada' end,
         verificacao_motivo = case when p_aprovar then null else v_motivo end,
         verificado_em = now()
   where id = p_perfil;

  insert into admin_acoes (admin_id, acao, alvo_id, detalhe)
  values (auth.uid(), case when p_aprovar then 'verificacao_aprovada' else 'verificacao_recusada' end,
          p_perfil, jsonb_build_object('nome', v_nome, 'motivo', v_motivo));

  insert into notificacoes (usuario_id, tipo, titulo, mensagem, link)
  values (
    p_perfil,
    case when p_aprovar then 'verificacao_aprovada' else 'verificacao_recusada' end,
    case when p_aprovar then 'Perfil verificado' else 'Verificação não aprovada' end,
    case when p_aprovar
         then 'Os dados do seu perfil foram conferidos e o selo de verificado foi ativado.'
         else 'Não foi possível verificar o seu perfil: ' || v_motivo end,
    '/perfil'
  );
end;
$$;

create or replace function public.admin_listar_reclamacoes(p_status text default null)
returns table (
  id uuid, categoria text, assunto text, descricao text, status text,
  resposta_admin text, created_at timestamptz,
  autor_id uuid, autor_nome text, autor_email text,
  perfil_relacionado_id uuid, perfil_relacionado_nome text, post_relacionado_id uuid
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not is_admin() then raise exception 'acesso negado' using errcode = '42501'; end if;
  return query
    select r.id, r.categoria, r.assunto, r.descricao, r.status, r.resposta_admin, r.created_at,
           r.autor_id, a.full_name, u.email::text,
           r.perfil_relacionado_id, pr.full_name, r.post_relacionado_id
      from reclamacoes r
      left join profiles a on a.id = r.autor_id
      left join auth.users u on u.id = r.autor_id
      left join profiles pr on pr.id = r.perfil_relacionado_id
     where p_status is null or r.status = p_status
     order by (r.status in ('aberta', 'em_analise')) desc, r.created_at desc
     limit 200;
end;
$$;

create or replace function public.admin_atualizar_reclamacao(p_id uuid, p_status text, p_resposta text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_autor uuid;
  v_assunto text;
  v_resposta text := nullif(btrim(coalesce(p_resposta, '')), '');
begin
  if not is_admin() then raise exception 'acesso negado' using errcode = '42501'; end if;
  if p_status not in ('aberta', 'em_analise', 'resolvida', 'descartada') then
    raise exception 'status inválido';
  end if;
  if v_resposta is not null and char_length(v_resposta) > 1000 then
    raise exception 'a resposta pode ter no máximo 1000 caracteres';
  end if;

  select autor_id, assunto into v_autor, v_assunto from reclamacoes where id = p_id;
  if v_autor is null then raise exception 'reclamação não encontrada'; end if;

  update reclamacoes
     set status = p_status, resposta_admin = coalesce(v_resposta, resposta_admin), atualizado_em = now()
   where id = p_id;

  insert into admin_acoes (admin_id, acao, alvo_id, detalhe)
  values (auth.uid(), 'reclamacao_' || p_status, p_id, jsonb_build_object('assunto', v_assunto));

  if p_status in ('resolvida', 'descartada') then
    insert into notificacoes (usuario_id, tipo, titulo, mensagem, link)
    values (
      v_autor, 'reclamacao_respondida', 'Sua reclamação foi analisada',
      'Sobre "' || v_assunto || '": ' || coalesce(v_resposta, 'nossa equipe concluiu a análise.'),
      null
    );
  end if;
end;
$$;

revoke all on function public.admin_resumo() from public;
revoke all on function public.admin_listar_perfis(text, text) from public;
revoke all on function public.admin_definir_verificacao(uuid, boolean, text) from public;
revoke all on function public.admin_listar_reclamacoes(text) from public;
revoke all on function public.admin_atualizar_reclamacao(uuid, text, text) from public;
grant execute on function public.admin_resumo() to authenticated;
grant execute on function public.admin_listar_perfis(text, text) to authenticated;
grant execute on function public.admin_definir_verificacao(uuid, boolean, text) to authenticated;
grant execute on function public.admin_listar_reclamacoes(text) to authenticated;
grant execute on function public.admin_atualizar_reclamacao(uuid, text, text) to authenticated;

-- 6) Admin pode abrir o estatuto/comprovantes (bucket privado) ----------------
drop policy if exists "documentos-fiscais: admin le tudo" on storage.objects;
create policy "documentos-fiscais: admin le tudo"
  on storage.objects for select
  using (bucket_id = 'documentos-fiscais' and public.is_admin());

-- ============================================================================
-- PASSO MANUAL: torne a SUA conta admin (troque pelo e-mail com que você
-- entra no painel). Faça isso depois de criar a conta pelo app ou pelo site.
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'SEU_EMAIL_AQUI'
--   on conflict do nothing;
-- ============================================================================
