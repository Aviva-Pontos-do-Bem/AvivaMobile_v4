-- Rode este script no SQL Editor do Supabase do projeto Aviva.
--
-- Cada vaga passa a ter:
--   - ods: até 3 Objetivos de Desenvolvimento Sustentável (1 a 17);
--   - impacto ambiental opcional declarado pela ONG, POR VOLUNTÁRIO que
--     concluir a ação (árvores plantadas ou quilos de resíduo reciclado).
-- O painel ESG da empresa soma isso para os funcionários dela.

alter table public.vagas
  add column if not exists ods smallint[] not null default '{}',
  add column if not exists impacto_tipo text,
  add column if not exists impacto_por_voluntario numeric(10,2);

alter table public.vagas drop constraint if exists vagas_ods_check;
alter table public.vagas
  add constraint vagas_ods_check
  check (ods <@ array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17]::smallint[] and cardinality(ods) <= 3);

alter table public.vagas drop constraint if exists vagas_impacto_check;
alter table public.vagas
  add constraint vagas_impacto_check
  check (
    (impacto_tipo is null and impacto_por_voluntario is null)
    or (
      impacto_tipo in ('arvores', 'residuos_kg')
      and impacto_por_voluntario is not null   -- sem isso, NULL > 0 vira NULL e o CHECK deixa passar
      and impacto_por_voluntario > 0
      and impacto_por_voluntario <= 10000
    )
  );

-- Vagas que já existiam recebem um ODS inicial a partir da categoria (a ONG
-- pode ajustar editando a vaga).
update public.vagas
   set ods = case categoria
     when 'Meio ambiente' then '{13,15}'::smallint[]
     when 'Educação' then '{4}'::smallint[]
     when 'Saúde' then '{3}'::smallint[]
     when 'Assistência social' then '{1,10}'::smallint[]
     when 'Tecnologia' then '{9}'::smallint[]
     else '{}'::smallint[]
   end
 where cardinality(ods) = 0;
