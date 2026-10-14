// Regras de apresentação das notificações — puras, para poderem ser testadas.

export function tempoRelativo(isoTexto, agora = new Date()) {
  const data = new Date(isoTexto);
  if (!isoTexto || Number.isNaN(data.getTime())) return '';
  const seg = Math.max(0, Math.floor((agora.getTime() - data.getTime()) / 1000));
  if (seg < 60) return 'agora';
  const min = Math.floor(seg / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

const ICONES = {
  candidatura_nova: { nome: 'user-plus', cor: 'secondary' },
  candidatura_aceita: { nome: 'check-circle', cor: 'success' },
  candidatura_recusada: { nome: 'x-circle', cor: 'error' },
  acao_concluida: { nome: 'award', cor: 'accent' },
  verificacao_aprovada: { nome: 'shield', cor: 'success' },
  verificacao_recusada: { nome: 'shield-off', cor: 'error' },
  reclamacao_respondida: { nome: 'message-circle', cor: 'secondary' },
  doacao_nova: { nome: 'heart', cor: 'accent' },
  doacao_confirmada: { nome: 'check-circle', cor: 'success' },
  doacao_nao_recebida: { nome: 'alert-circle', cor: 'error' },
};

export function iconePorTipo(tipo) {
  return ICONES[tipo] || { nome: 'bell', cor: 'primary' };
}

// Mostra "9+" em vez de números que estouram a bolinha do sino.
export function textoContador(total) {
  if (!total || total < 1) return '';
  return total > 9 ? '9+' : String(total);
}
