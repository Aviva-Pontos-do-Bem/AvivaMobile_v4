-- Rode este script no SQL Editor do Supabase do projeto Aviva, depois de
-- todas as migrations anteriores.
--
-- Base para a feature de "doação dedutível" (Empresa -> ONG), fundamentada
-- na pesquisa sobre incentivos fiscais: desde a Lei 13.204/2015, uma doação
-- direta de empresa no Lucro Real para uma OSC comum já é dedutível do IRPJ
-- (art. 13, §2º, III, "c" da Lei 9.249/1995), até 2% do lucro operacional,
-- desde que a ONG cumpra os arts. 3º e 16 da Lei 9.790/1999 — sem precisar
-- de OSCIP/CEBAS/Utilidade Pública. Este script modela exatamente isso:
--   1) Regime tributário da empresa (só Lucro Real tem esse benefício).
--   2) Checklist de elegibilidade da ONG (autodeclarado, como já fazemos
--      hoje com CNPJ/selo verificado — sem verificação automática).
--   3) Parâmetro anual de lucro operacional da empresa, pra calcular o teto
--      de 2% dedutível por exercício.
--   4) Registro de doações, com comprovante, pra virar o relatório
--      estruturado pra contabilidade.

-- 1) Regime tributário (Empresa) -------------------------------------------
alter table profiles add column if not exists regime_tributario text
  check (regime_tributario in ('lucro_real', 'lucro_presumido', 'simples_nacional'));

-- 2) Checklist de elegibilidade (ONG) ---------------------------------------
-- Autodeclarado pela própria ONG, no espírito dos arts. 3º (finalidades
-- elegíveis) e 16 (vedações) da Lei 9.790/1999 — não exigimos título de
-- OSCIP, só que a organização afirme cumprir os requisitos materiais.
alter table profiles add column if not exists elegivel_doacao_dedutivel boolean not null default false;
alter table profiles add column if not exists finalidade_estatutaria_ok boolean not null default false;
alter table profiles add column if not exists nao_distribui_sobras_ok boolean not null default false;
alter table profiles add column if not exists sem_atuacao_politica_ok boolean not null default false;
alter table profiles add column if not exists estatuto_url text;
alter table profiles add column if not exists elegibilidade_atualizada_em timestamptz;

-- 3) Parâmetro fiscal anual da empresa ---------------------------------------
create table if not exists parametros_fiscais_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references profiles(id) on delete cascade,
  ano integer not null check (ano >= 2020 and ano <= 2100),
  lucro_operacional numeric(14,2) not null check (lucro_operacional >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, ano)
);

alter table parametros_fiscais_empresa enable row level security;

create policy "empresa ve seus proprios parametros fiscais"
  on parametros_fiscais_empresa for select
  using (auth.uid() = empresa_id);

create policy "empresa cria seus proprios parametros fiscais"
  on parametros_fiscais_empresa for insert
  with check (
    auth.uid() = empresa_id
    and exists (select 1 from profiles where id = auth.uid() and user_type = 'empresa')
  );

create policy "empresa atualiza seus proprios parametros fiscais"
  on parametros_fiscais_empresa for update
  using (auth.uid() = empresa_id)
  with check (auth.uid() = empresa_id);

-- 4) Doações registradas ------------------------------------------------------
-- Cada linha é uma doação de uma empresa para uma ONG parceira, com o
-- comprovante bancário anexado. Não é editável nem exclúivel depois de
-- criada — é um registro para fins fiscais, então tratamos como trilha de
-- auditoria (se a empresa errou um valor, registra uma nova doação e anota
-- a correção nas observações, em vez de apagar o histórico).
create table if not exists doacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references profiles(id) on delete cascade,
  ong_id uuid not null references profiles(id) on delete cascade,
  valor numeric(14,2) not null check (valor > 0),
  data_doacao date not null,
  comprovante_url text,
  observacoes text,
  created_at timestamptz not null default now()
);

alter table doacoes enable row level security;

create policy "empresa e ong veem as doacoes que participam"
  on doacoes for select
  using (auth.uid() = empresa_id or auth.uid() = ong_id);

create policy "somente empresa registra sua propria doacao"
  on doacoes for insert
  with check (
    auth.uid() = empresa_id
    and exists (select 1 from profiles where id = auth.uid() and user_type = 'empresa')
    and exists (select 1 from profiles where id = ong_id and user_type = 'ong')
  );

create index if not exists doacoes_empresa_id_idx on doacoes (empresa_id);
create index if not exists doacoes_ong_id_idx on doacoes (ong_id);

-- 5) Storage: comprovantes e estatutos ---------------------------------------
-- Reaproveita o padrão já usado pelos buckets "avatars"/"posts": cada
-- arquivo vive em <bucket>/<userId>/..., e só o dono da pasta pode
-- enviar/apagar. Bucket privado (não público) — comprovante bancário e
-- estatuto social não deveriam ser acessíveis por URL pública direta.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos-fiscais', 'documentos-fiscais', false, 10485760,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "documentos-fiscais: só dono envia na própria pasta" on storage.objects;
create policy "documentos-fiscais: só dono envia na própria pasta"
  on storage.objects for insert
  with check (bucket_id = 'documentos-fiscais' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "documentos-fiscais: só dono lê a própria pasta" on storage.objects;
create policy "documentos-fiscais: só dono lê a própria pasta"
  on storage.objects for select
  using (
    bucket_id = 'documentos-fiscais'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      -- a empresa também precisa conseguir abrir o comprovante que ela
      -- mesma anexou a uma doação, mesmo estando na pasta da ONG (estatuto)
      or exists (
        select 1 from doacoes
        where doacoes.empresa_id = auth.uid()
          and doacoes.comprovante_url like '%' || name
      )
    )
  );

drop policy if exists "documentos-fiscais: só dono apaga da própria pasta" on storage.objects;
create policy "documentos-fiscais: só dono apaga da própria pasta"
  on storage.objects for delete
  using (bucket_id = 'documentos-fiscais' and (storage.foldername(name))[1] = auth.uid()::text);

-- 6) Expor o selo de elegibilidade na função de perfil público -------------
-- perfil_publico() foi criada em migration_seguranca_rls.sql com uma lista
-- fixa de colunas — precisa incluir elegivel_doacao_dedutivel pra empresa
-- decidir, na tela do perfil da ONG, se mostra o botão de registrar doação.
-- Postgres não deixa trocar as colunas de retorno com CREATE OR REPLACE
-- quando a assinatura de saída muda — precisa apagar a função antes.
drop function if exists public.perfil_publico(uuid);

create function public.perfil_publico(perfil_id uuid)
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
  documento text,
  elegivel_doacao_dedutivel boolean
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
    case when auth.uid() = p.id or p.user_type <> 'voluntario' then p.documento else null end as documento,
    p.elegivel_doacao_dedutivel
  from profiles p
  where p.id = perfil_id;
$$;

revoke all on function public.perfil_publico(uuid) from public;
grant execute on function public.perfil_publico(uuid) to authenticated;
