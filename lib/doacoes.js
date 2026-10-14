// Regras de apresentação e entrada das doações — puras, para poderem ser testadas.

// Aceita "50", "50,5", "1.234,56" e "R$ 1.234,56". Devolve null para
// qualquer coisa que não seja um valor monetário positivo e razoável.
export function parseValorBR(texto) {
  const limpo = (texto || '').replace(/R\$/gi, '').replace(/\s/g, '');
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(limpo)) return null;
  const valor = Number(limpo.replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(valor) || valor <= 0 || valor > 100000000) return null;
  return valor;
}

export function formatarBRL(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export const ROTULO_STATUS_DOACAO = {
  pendente: 'Aguardando confirmação',
  confirmada: 'Confirmada',
  nao_recebida: 'Não localizada',
};

// Chaves de cor do theme para cada status.
export const COR_STATUS_DOACAO = {
  pendente: { texto: 'warning', fundo: 'warningLight' },
  confirmada: { texto: 'success', fundo: 'successLight' },
  nao_recebida: { texto: 'error', fundo: 'errorLight' },
};

// Só doação confirmada e dedutível conta no teto de 2% do lucro operacional.
export function somarDedutivelConfirmado(doacoes) {
  return (doacoes || [])
    .filter((d) => d.dedutivel && d.status === 'confirmada')
    .reduce((soma, d) => soma + Number(d.valor || 0), 0);
}
