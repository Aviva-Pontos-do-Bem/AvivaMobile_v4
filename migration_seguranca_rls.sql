-- Rode este script no SQL Editor do Supabase do projeto Aviva, depois de
-- todas as migrations anteriores.
--
-- Contexto: o app usa profiles.user_type ('voluntario' | 'ong' | 'empresa')
-- para decidir o que cada tela mostra, mas isso por si só NÃO impede que
-- alguém chame a API do Supabase diretamente (fora do app, via console do
-- navegador ou curl) e:
--   a) mude o próprio user_type pra 'ong' e passe a criar vagas fake, ou
--      pra 'empresa' e apareça como patrocinador de ONGs;
--   b) se autodeclare "verificado" (selo de confiança exibido em todo canto);
--   c) crie uma vaga/candidatura/patrocínio em nome de outra pessoa, ou sem
--      de fato ter o papel exigido para aquela ação.
-- Este script fecha essas brechas com policies de RLS + um trigger, sem
-- mudar nenhuma consulta que o app já faz (todas continuam permitidas).

-- ============================================================================
-- 1) Travar user_type e verificado contra o próprio usuário
-- ============================================================================
-- Ninguém deveria conseguir mudar seu próprio user_type depois de definido
-- (só a primeira vez, quando ainda é nulo — caso do login social, tratado em
-- app/completar-perfil.js) nem ligar o selo "verificado" sozinho. Alterações
-- administrativas (verificar uma ONG de verdade, corrigir um cadastro)
-- continuam possíveis rodando um UPDATE aqui no SQL Editor, porque isso roda
-- fora do contexto de um usuário logado (auth.uid() vem nulo).
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
  end if;

  -- Integridade extra: o vínculo funcionário -> empresa só pode apontar
  -- para um perfil que realmente é do tipo 'empresa' (evita um voluntário
  -- inflar as métricas ESG de qualquer conta aleatória).
  if new.empresa_id is not null and new.empresa_id is distinct from old.empresa_id then
    if not exists (select 1 from profiles where id = new.empresa_id and user_type = 'empresa') then
      raise exception 'empresa_id precisa apontar para um perfil do tipo empresa';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protege_campos_sensiveis_profile on profiles;
create trigger trg_protege_campos_sensiveis_profile
before update on profiles
for each row execute function public.protege_campos_sensiveis_profile();

-- ============================================================================
-- 2) Reconstruir as policies de vagas, candidaturas e patrocinios do zero
-- ============================================================================
-- Em vez de tentar adivinhar/alterar policies antigas com nomes que talvez
-- eu não conheça, apago todas as policies dessas 3 tabelas e recrio o
-- conjunto completo abaixo — assim não sobra nenhuma policy antiga mais
-- permissiva "por trás" das novas (no Postgres, RLS soma policies do mesmo
-- comando com OR: uma policy antiga solta continuaria liberando acesso
-- mesmo com uma nova mais restrita ao lado).
do $$
declare pol record;
begin
  for pol in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('vagas', 'candidaturas', 'patrocinios')
  loop
    execute format('drop policy %I on %I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- --- vagas -------------------------------------------------------------
create policy "vagas respeitam a visibilidade"
  on vagas for select
  using (
    visibilidade = 'publico'
    or ong_id = auth.uid()
    or exists (select 1 from seguidores where seguidor_id = auth.uid() and seguido_id = ong_id)
  );

create policy "somente ong cria sua propria vaga"
  on vagas for insert
  with check (
    auth.uid() = ong_id
    and exists (select 1 from profiles where id = auth.uid() and user_type = 'ong')
  );

create policy "somente a propria ong atualiza sua vaga"
  on vagas for update
  using (auth.uid() = ong_id)
  with check (auth.uid() = ong_id);

create policy "somente a propria ong exclui sua vaga"
  on vagas for delete
  using (auth.uid() = ong_id);

-- --- candidaturas --------------------------------------------------------
create policy "voluntario ve as proprias, ong ve as da sua vaga"
  on candidaturas for select
  using (
    auth.uid() = voluntario_id
    or exists (select 1 from vagas where vagas.id = candidaturas.vaga_id and vagas.ong_id = auth.uid())
  );

create policy "somente voluntario cria sua propria candidatura"
  on candidaturas for insert
  with check (
    auth.uid() = voluntario_id
    and exists (select 1 from profiles where id = auth.uid() and user_type = 'voluntario')
  );

create policy "somente a ong da vaga atualiza o status da candidatura"
  on candidaturas for update
  using (exists (select 1 from vagas where vagas.id = candidaturas.vaga_id and vagas.ong_id = auth.uid()))
  with check (exists (select 1 from vagas where vagas.id = candidaturas.vaga_id and vagas.ong_id = auth.uid()));

-- --- patrocinios ---------------------------------------------------------
create policy "patrocinios sao publicos para leitura"
  on patrocinios for select
  using (true);

create policy "somente empresa cria seu proprio patrocinio"
  on patrocinios for insert
  with check (
    auth.uid() = empresa_id
    and exists (select 1 from profiles where id = auth.uid() and user_type = 'empresa')
  );

create policy "somente a propria empresa remove seu patrocinio"
  on patrocinios for delete
  using (auth.uid() = empresa_id);

-- ============================================================================
-- 3) Reforçar Storage: upload só na própria pasta (avatars e posts)
-- ============================================================================
-- Cobre o caso de upsert (upload com upsert:true faz um UPDATE por baixo
-- quando o arquivo já existe) — sem uma policy de UPDATE em storage.objects,
-- um upsert que colidisse num mesmo path falharia silenciosamente.
drop policy if exists "avatars bucket: só dono envia na própria pasta" on storage.objects;
create policy "avatars bucket: só dono envia na própria pasta"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars bucket: só dono atualiza a própria pasta" on storage.objects;
create policy "avatars bucket: só dono atualiza a própria pasta"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars bucket: só dono apaga da própria pasta" on storage.objects;
create policy "avatars bucket: só dono apaga da própria pasta"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "posts bucket: só dono atualiza a própria pasta" on storage.objects;
create policy "posts bucket: só dono atualiza a própria pasta"
  on storage.objects for update
  using (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- 4) PII de profiles (telefone, CNPJ/documento) exposta a qualquer logado
-- ============================================================================
-- Achado durante a auditoria: a policy de SELECT de "profiles" é `using
-- (true)` pra qualquer usuário autenticado — e o app usa isso de propósito
-- (feed, busca, embutidos via join), então não dá pra simplesmente trocar
-- pra "só a própria linha" sem quebrar telas inteiras.
--
-- O problema real são só 2 colunas: telefone e documento (CNPJ/CPF). Hoje
-- qualquer pessoa logada consegue ler o telefone/CNPJ de QUALQUER outro
-- perfil — inclusive o celular pessoal de um voluntário — bastando consultar
-- a tabela direto (a tela components/PerfilPublicoView.js já faz isso com
-- `select('*')` e mostra telefone na tela pública de qualquer pessoa).
--
-- RLS filtra LINHAS, não colunas — não dá pra dizer "essa coluna só é
-- visível se for a própria linha" numa única policy. A solução correta é
-- bloquear as colunas sensíveis por privilégio de coluna (não passa pela
-- policy de forma nenhuma) e devolver os dados certos através de duas
-- funções SECURITY DEFINER, que rodam com o dono da função (que continua
-- enxergando tudo) em vez de com o privilégio de quem chamou.
revoke select (telefone, documento, empresa_id, exclusao_solicitada_em) on public.profiles from authenticated, anon;

-- Perfil completo do PRÓPRIO usuário (substitui o
-- `.from('profiles').select('*').eq('id', session.user.id)` do
-- AuthContext) — aqui não tem problema nenhum devolver tudo, é o dono dos
-- dados vendo os próprios dados.
create or replace function public.meu_perfil()
returns setof profiles
language sql
security definer
set search_path = public
stable
as $$
  select * from profiles where id = auth.uid();
$$;

revoke all on function public.meu_perfil() from public;
grant execute on function public.meu_perfil() to authenticated;

-- Perfil público de QUALQUER usuário (substitui o
-- `.from('profiles').select('*').eq('id', userId)` de
-- components/PerfilPublicoView.js) — telefone só volta se for o próprio
-- usuário vendo o próprio perfil OU se for ONG/Empresa (telefone/CNPJ de
-- instituição é informação de contato pensada pra ser pública, diferente do
-- celular pessoal de um voluntário).
create or replace function public.perfil_publico(perfil_id uuid)
returns table (
  id uuid,
  full_name text,
  foto_url text,
  capa_url text,
  bio text,
  site text,
  endereco text,
  verificado boolean,
  user_type text,
  aceita_doacoes boolean,
  chave_pix text,
  mensagem_doacao text,
  lat double precision,
  lng double precision,
  telefone text,
  documento text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id, p.full_name, p.foto_url, p.capa_url, p.bio, p.site, p.endereco,
    p.verificado, p.user_type, p.aceita_doacoes, p.chave_pix, p.mensagem_doacao,
    p.lat, p.lng,
    case when auth.uid() = p.id or p.user_type <> 'voluntario' then p.telefone else null end as telefone,
    case when auth.uid() = p.id or p.user_type <> 'voluntario' then p.documento else null end as documento
  from profiles p
  where p.id = perfil_id;
$$;

revoke all on function public.perfil_publico(uuid) from public;
grant execute on function public.perfil_publico(uuid) to authenticated;
