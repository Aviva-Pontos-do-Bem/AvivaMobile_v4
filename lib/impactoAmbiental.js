// Impacto ambiental declarado pelas ONGs nas vagas (quantidade POR VOLUNTÁRIO
// que concluiu a ação) e a estimativa de CO₂ que o Aviva faz a partir dele.
//
// Só árvores viram CO₂: é o único fator com fonte brasileira que encontramos.
// Resíduos aparecem em quilos, sem conversão — não adotamos um fator que não
// conseguimos sustentar.

export const TIPOS_IMPACTO = {
  arvores: { rotulo: 'Árvores plantadas', unidade: 'árvores', rotuloCampo: 'Árvores plantadas por voluntário' },
  residuos_kg: { rotulo: 'Resíduos destinados à reciclagem', unidade: 'kg', rotuloCampo: 'Quilos de resíduo por voluntário' },
};

// Cenário conservador do estudo Totum/ESALQ-USP/SOS Mata Atlântica: a pior
// amostra observada projeta 140 kg de CO₂ equivalente por árvore nativa da Mata
// Atlântica aos 20 anos (o valor médio do mesmo estudo é 163,14 kg).
export const KG_CO2_POR_ARVORE_EM_20_ANOS = 140;
export const FONTE_FATOR_CO2 =
  'Estudo Instituto Totum / ESALQ-USP / SOS Mata Atlântica (cenário conservador de 140 kg CO₂e por árvore nativa em 20 anos).';
export const AVISO_CO2 =
  'Estimativa baseada em quantidades declaradas pelas ONGs e em fator médio de sequestro ao longo de 20 anos; não é crédito de carbono nem foi verificada por terceira parte.';

export function somarImpactoAmbiental(candidaturasConcluidas) {
  let arvores = 0;
  let residuosKg = 0;
  (candidaturasConcluidas || []).forEach((c) => {
    const qtd = Number(c.vagas?.impacto_por_voluntario) || 0;
    if (c.vagas?.impacto_tipo === 'arvores') arvores += qtd;
    if (c.vagas?.impacto_tipo === 'residuos_kg') residuosKg += qtd;
  });
  return {
    arvores,
    residuosKg,
    co2Kg: Math.round(arvores * KG_CO2_POR_ARVORE_EM_20_ANOS),
  };
}

export function temImpactoAmbiental(impacto) {
  return !!impacto && (impacto.arvores > 0 || impacto.residuosKg > 0);
}

export function formatarQuantidade(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}
