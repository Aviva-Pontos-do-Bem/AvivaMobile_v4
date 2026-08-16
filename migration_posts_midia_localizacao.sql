-- Rode este script no SQL Editor do Supabase do projeto Aviva.
-- Adiciona suporte a vídeo e localização nas publicações (posts),
-- para o novo formulário de "Criar publicação" no estilo feed social.

-- 1) Novas colunas em posts -------------------------------------------------
alter table posts add column if not exists video_url text;
alter table posts add column if not exists localizacao_nome text;
alter table posts add column if not exists localizacao_lat double precision;
alter table posts add column if not exists localizacao_lng double precision;

-- Uma publicação não deve ter imagem e vídeo ao mesmo tempo (o app só
-- permite anexar um dos dois por publicação, como a maioria das redes
-- sociais faz).
alter table posts drop constraint if exists posts_imagem_ou_video_check;
alter table posts add constraint posts_imagem_ou_video_check
  check (imagem_url is null or video_url is null);

-- 2) Bucket "posts" precisa aceitar vídeos -----------------------------------
-- Se o bucket já foi criado com um limite de mime types restrito a imagens,
-- amplie manualmente em Storage > posts > Edit bucket, adicionando os tipos
-- abaixo (ou rode este update caso o bucket já exista):
-- update storage.buckets
--   set allowed_mime_types = array[
--     'image/jpeg','image/png','image/webp','image/heic','image/gif',
--     'video/mp4','video/quicktime','video/webm'
--   ]
--   where id = 'posts';
