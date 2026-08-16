-- Rode este script no SQL Editor do Supabase do projeto Aviva.
-- Depende do migration_posts_midia_localizacao.sql já ter sido aplicado antes.
--
-- Este script adiciona:
--   1) Suporte a MÚLTIPLAS imagens/vídeos por publicação (tabela post_midia),
--      substituindo o limite de "1 imagem OU 1 vídeo" por post.
--   2) Latitude/longitude no perfil da ONG, para a busca "ONGs perto de você".

-- 1) Tabela post_midia -------------------------------------------------------
-- Cada publicação passa a poder ter várias linhas aqui (em vez de usar só as
-- colunas posts.imagem_url / posts.video_url, que seguem existindo para não
-- quebrar publicações antigas e continuam sendo usadas como capa/fallback).
create table if not exists post_midia (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  tipo text not null check (tipo in ('imagem', 'video')),
  url text not null,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists post_midia_post_id_idx on post_midia (post_id, ordem);

-- A checagem antiga "imagem OU vídeo, nunca os dois" deixa de fazer sentido
-- agora que uma publicação pode ter várias mídias misturadas.
alter table posts drop constraint if exists posts_imagem_ou_video_check;

alter table post_midia enable row level security;

drop policy if exists "post_midia é público para leitura" on post_midia;
create policy "post_midia é público para leitura"
  on post_midia for select
  using (true);

-- Só o autor da publicação pode anexar mídia a ela.
drop policy if exists "post_midia só é criada pelo autor do post" on post_midia;
create policy "post_midia só é criada pelo autor do post"
  on post_midia for insert
  with check (
    exists (select 1 from posts where posts.id = post_id and posts.autor_id = auth.uid())
  );

drop policy if exists "post_midia só é apagada pelo autor do post" on post_midia;
create policy "post_midia só é apagada pelo autor do post"
  on post_midia for delete
  using (
    exists (select 1 from posts where posts.id = post_id and posts.autor_id = auth.uid())
  );

-- 2) Geolocalização do perfil (usada por ONGs, para aparecer no mapa) --------
alter table profiles add column if not exists lat double precision;
alter table profiles add column if not exists lng double precision;

-- Índice simples para acelerar "quais ONGs têm localização cadastrada".
create index if not exists profiles_ong_com_localizacao_idx
  on profiles (user_type)
  where lat is not null and lng is not null;
