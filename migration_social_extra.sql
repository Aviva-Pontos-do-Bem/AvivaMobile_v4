-- Rode este script no SQL Editor do Supabase do projeto Aviva.
-- Ele soma com as migrações já existentes (posts, curtidas, recomendações,
-- seguidores) e adiciona: comentários em publicações, exclusão de conta
-- (LGPD) e reclamações/denúncias.

-- 1) Comentários em publicações -------------------------------------------
create table if not exists post_comentarios (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  autor_id uuid not null references profiles(id) on delete cascade,
  conteudo text not null check (char_length(conteudo) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table post_comentarios enable row level security;

drop policy if exists "Comentarios sao publicos para leitura" on post_comentarios;
create policy "Comentarios sao publicos para leitura"
  on post_comentarios for select
  using (true);

drop policy if exists "Usuarios autenticados podem comentar" on post_comentarios;
create policy "Usuarios autenticados podem comentar"
  on post_comentarios for insert
  with check (auth.uid() = autor_id);

drop policy if exists "Autor pode excluir seu comentario" on post_comentarios;
create policy "Autor pode excluir seu comentario"
  on post_comentarios for delete
  using (auth.uid() = autor_id);

create index if not exists post_comentarios_post_id_idx on post_comentarios (post_id);

-- 2) Solicitação de exclusão de conta --------------------------------------
-- O app não apaga a conta na hora (isso exige a service role, que não roda
-- no cliente) — ele registra o pedido aqui, desloga a pessoa, e a exclusão
-- definitiva de auth.users + dados deve ser concluída por um processo do
-- lado do servidor (edge function / job) que varre esse campo.
alter table profiles add column if not exists exclusao_solicitada_em timestamptz;

-- 3) Reclamações / denúncias -----------------------------------------------
create table if not exists reclamacoes (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references profiles(id) on delete cascade,
  categoria text not null,
  assunto text not null,
  descricao text not null,
  perfil_relacionado_id uuid references profiles(id) on delete set null,
  post_relacionado_id uuid references posts(id) on delete set null,
  status text not null default 'aberta',
  created_at timestamptz not null default now()
);

alter table reclamacoes enable row level security;

drop policy if exists "Usuario ve suas proprias reclamacoes" on reclamacoes;
create policy "Usuario ve suas proprias reclamacoes"
  on reclamacoes for select
  using (auth.uid() = autor_id);

drop policy if exists "Usuario pode abrir reclamacao" on reclamacoes;
create policy "Usuario pode abrir reclamacao"
  on reclamacoes for insert
  with check (auth.uid() = autor_id);
