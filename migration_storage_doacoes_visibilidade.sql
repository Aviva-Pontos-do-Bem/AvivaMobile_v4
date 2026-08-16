-- Rode este script no SQL Editor do Supabase do projeto Aviva.
-- Depende das migrações anteriores já terem sido aplicadas.

-- ============================================================================
-- 1) CORREÇÃO: fotos/vídeos aparecendo em branco (posts E capa de vagas)
-- ============================================================================
-- Causa raiz: o bucket "posts" no Storage não estava marcado como público
-- (ou não tinha uma policy de leitura pública em storage.objects). O upload
-- funcionava normalmente — o app tinha permissão pra enviar o arquivo — mas
-- a URL pública gerada por getPublicUrl() não conseguia ser lida de volta,
-- então toda <Image>/<VideoView> que apontava pra ela ficava em branco. Isso
-- afeta fotos/vídeos de publicações E a imagem de capa de vagas, porque as
-- duas coisas usam o mesmo bucket "posts".
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'posts', 'posts', true, 52428800,
  array['image/jpeg','image/png','image/webp','image/heic','image/gif',
        'video/mp4','video/quicktime','video/webm','video/3gpp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','image/gif',
        'video/mp4','video/quicktime','video/webm','video/3gpp'];

drop policy if exists "posts bucket é público para leitura" on storage.objects;
create policy "posts bucket é público para leitura"
  on storage.objects for select
  using (bucket_id = 'posts');

drop policy if exists "posts bucket: só dono envia na própria pasta" on storage.objects;
create policy "posts bucket: só dono envia na própria pasta"
  on storage.objects for insert
  with check (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "posts bucket: só dono apaga da própria pasta" on storage.objects;
create policy "posts bucket: só dono apaga da própria pasta"
  on storage.objects for delete
  using (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);

-- Mesma checagem pro bucket "avatars" — se ele já estava público, isso não
-- muda nada; é só uma garantia, já que fotos de perfil usam o mesmo padrão.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 10485760, array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do update set public = true;

drop policy if exists "avatars bucket é público para leitura" on storage.objects;
create policy "avatars bucket é público para leitura"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- ============================================================================
-- 2) Doações para ONGs
-- ============================================================================
alter table profiles add column if not exists aceita_doacoes boolean not null default false;
alter table profiles add column if not exists chave_pix text;
alter table profiles add column if not exists mensagem_doacao text;

-- ============================================================================
-- 3) Visibilidade: público ou só para quem segue (posts e vagas)
-- ============================================================================
alter table posts add column if not exists visibilidade text not null default 'publico'
  check (visibilidade in ('publico', 'seguidores'));
alter table vagas add column if not exists visibilidade text not null default 'publico'
  check (visibilidade in ('publico', 'seguidores'));

-- Reforça a regra no próprio banco (não só no app): troca qualquer policy de
-- leitura antiga que fosse "libera tudo" (using (true)) por uma que respeita
-- a visibilidade. Só mexe em policies de SELECT permissivas com esse
-- comportamento exato — não toca em nenhuma outra regra que já exista.
do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('posts', 'vagas') and cmd = 'r' and qual = 'true'
  loop
    execute format('drop policy %I on %I', pol.policyname, pol.tablename);
  end loop;
end $$;

create policy "posts respeita a visibilidade"
  on posts for select
  using (
    visibilidade = 'publico'
    or autor_id = auth.uid()
    or exists (select 1 from seguidores where seguidor_id = auth.uid() and seguido_id = autor_id)
  );

create policy "vagas respeitam a visibilidade"
  on vagas for select
  using (
    visibilidade = 'publico'
    or ong_id = auth.uid()
    or exists (select 1 from seguidores where seguidor_id = auth.uid() and seguido_id = ong_id)
  );
