-- Rode este script no SQL Editor do Supabase do projeto Aviva.
--
-- CORREÇÃO DE SEGURANÇA. Na migration_seguranca_rls.sql o acesso a colunas
-- sensíveis de "profiles" foi "escondido" com
--     revoke select (telefone, documento, ...) on profiles from authenticated
-- mas isso NÃO tem efeito no Postgres enquanto a tabela inteira continua com
-- GRANT SELECT: qualquer pessoa logada ainda conseguia ler CNPJ, telefone e
-- vínculo de empresa de qualquer perfil pela API. Aqui o acesso à tabela é
-- retirado por inteiro e só as colunas PÚBLICAS são liberadas, por lista.
--
-- ATENÇÃO para o futuro: coluna nova em "profiles" nasce PRIVADA. Se ela
-- precisar ser pública, acrescente-a ao GRANT abaixo (ou exponha-a numa função).
-- O próprio dono lê tudo dele por meu_perfil(); perfis de terceiros, por
-- perfil_publico(); a equipe, pelas funções admin_*.

revoke select on public.profiles from authenticated, anon;

grant select (
  id, full_name, user_type, created_at, bio, foto_url, capa_url, endereco, site,
  verificado, lat, lng, aceita_doacoes, chave_pix, mensagem_doacao,
  elegivel_doacao_dedutivel
) on public.profiles to authenticated;

-- Ficam privadas: documento, telefone, empresa_id, exclusao_solicitada_em,
-- regime_tributario, estatuto_url, finalidade_estatutaria_ok,
-- nao_distribui_sobras_ok, sem_atuacao_politica_ok, elegibilidade_atualizada_em,
-- verificacao_status, verificacao_motivo, verificado_em.

-- Painel ESG da empresa -------------------------------------------------------
-- A empresa NÃO pode ler as candidaturas dos funcionários (tem mensagem e
-- telefone do voluntário). Estas funções devolvem só o que o painel precisa:
-- dados da vaga das ações concluídas dos funcionários vinculados a ela.

create or replace function public.esg_total_funcionarios()
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(*)
    from profiles f
   where f.empresa_id = auth.uid()
     and exists (select 1 from profiles e where e.id = auth.uid() and e.user_type = 'empresa');
$$;

create or replace function public.esg_acoes_concluidas()
returns table (
  horas_estimadas integer,
  ods smallint[],
  impacto_tipo text,
  impacto_por_voluntario numeric
)
language sql
security definer
set search_path = public
stable
as $$
  select v.horas_estimadas, v.ods, v.impacto_tipo, v.impacto_por_voluntario
    from candidaturas c
    join vagas v on v.id = c.vaga_id
    join profiles f on f.id = c.voluntario_id
   where c.status = 'concluido'
     and f.empresa_id = auth.uid()
     and exists (select 1 from profiles e where e.id = auth.uid() and e.user_type = 'empresa');
$$;

revoke all on function public.esg_total_funcionarios() from public;
revoke all on function public.esg_acoes_concluidas() from public;
grant execute on function public.esg_total_funcionarios() to authenticated;
grant execute on function public.esg_acoes_concluidas() to authenticated;
