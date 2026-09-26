-- Rode este script no SQL Editor do Supabase do projeto Aviva.
-- Depende das migrações anteriores já terem sido aplicadas.
--
-- Este script adiciona a base de dados que faltava para o Dashboard ESG da
-- Empresa parar de ser mockado:
--   1) patrocinios: vínculo simples empresa <-> ONG (sem valor monetário,
--      só "eu apoio essa organização"), usado para contar "ONGs apoiadas" e
--      as vagas dessas ONGs.
--   2) profiles.empresa_id: liga a conta de um Voluntário à Empresa onde ele
--      trabalha, para o dashboard poder somar horas de voluntariado dos
--      funcionários.
--   3) vagas.horas_estimadas: duração estimada da ação (opcional, definida
--      pela ONG ao criar a vaga), base real para a soma de horas — sem esse
--      campo não existiria nenhum número de "horas" para somar.

-- 1) Patrocínios (Empresa apoia ONG) -----------------------------------------
create table if not exists patrocinios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references profiles(id) on delete cascade,
  ong_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (empresa_id, ong_id)
);

alter table patrocinios enable row level security;

drop policy if exists "patrocinios sao publicos para leitura" on patrocinios;
create policy "patrocinios sao publicos para leitura"
  on patrocinios for select
  using (true);

drop policy if exists "empresa cria seu proprio patrocinio" on patrocinios;
create policy "empresa cria seu proprio patrocinio"
  on patrocinios for insert
  with check (auth.uid() = empresa_id);

drop policy if exists "empresa remove seu proprio patrocinio" on patrocinios;
create policy "empresa remove seu proprio patrocinio"
  on patrocinios for delete
  using (auth.uid() = empresa_id);

create index if not exists patrocinios_empresa_id_idx on patrocinios (empresa_id);
create index if not exists patrocinios_ong_id_idx on patrocinios (ong_id);

-- 2) Vínculo funcionário -> empresa ------------------------------------------
alter table profiles add column if not exists empresa_id uuid references profiles(id) on delete set null;

create index if not exists profiles_empresa_id_idx on profiles (empresa_id);

-- 3) Duração estimada da vaga, em horas ---------------------------------------
alter table vagas add column if not exists horas_estimadas integer;
