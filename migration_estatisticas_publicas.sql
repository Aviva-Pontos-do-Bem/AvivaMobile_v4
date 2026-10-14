-- Números agregados para a página inicial do site (visitante sem login).
-- Devolve só totais, nunca dados de pessoas. Rode no SQL Editor do Supabase.

create or replace function public.estatisticas_publicas()
returns table (
  horas_voluntariado bigint,
  acoes_concluidas bigint,
  ongs bigint,
  voluntarios bigint,
  arvores numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(sum(v.horas_estimadas), 0)::bigint,
    count(*)::bigint,
    (select count(*) from profiles where user_type = 'ong')::bigint,
    (select count(*) from profiles where user_type = 'voluntario')::bigint,
    coalesce(sum(case when v.impacto_tipo = 'arvores' then v.impacto_por_voluntario end), 0)
  from candidaturas c
  join vagas v on v.id = c.vaga_id
  where c.status = 'concluido';
$$;

revoke all on function public.estatisticas_publicas() from public;
grant execute on function public.estatisticas_publicas() to anon, authenticated;
