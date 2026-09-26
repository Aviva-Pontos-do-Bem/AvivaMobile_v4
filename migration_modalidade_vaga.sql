-- Rode este script no SQL Editor do Supabase do projeto Aviva.
-- Adiciona o campo de modalidade (presencial/remoto/hibrido) na tabela
-- `vagas`, para permitir o filtro estruturado pedido no MVP (causa,
-- localização e presencial/remoto) além da busca textual livre já existente.

alter table vagas add column if not exists modalidade text not null default 'presencial'
  check (modalidade in ('presencial', 'remoto', 'hibrido'));

create index if not exists vagas_modalidade_idx on vagas (modalidade);
