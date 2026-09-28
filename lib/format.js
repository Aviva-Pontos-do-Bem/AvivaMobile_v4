// Pequenos helpers de formatação usados em vários lugares do app.
// Sem biblioteca externa de datas — só o suficiente para o que o app precisa.

const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// "há 2 dias", "há 5 min", "agora mesmo" — usado nos cards do feed e na
// lista de candidaturas.
export function formatarTempoRelativo(dataIso) {
  if (!dataIso) return '';
  const data = new Date(dataIso);
  const diffMs = Date.now() - data.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `há ${diffHoras}h`;
  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias < 7) return `há ${diffDias} ${diffDias === 1 ? 'dia' : 'dias'}`;
  const diffSemanas = Math.floor(diffDias / 7);
  if (diffSemanas < 5) return `há ${diffSemanas} ${diffSemanas === 1 ? 'semana' : 'semanas'}`;
  return data.toLocaleDateString('pt-BR');
}

// "Sáb, 16 de agosto às 09:00" — usado no detalhe da vaga, onde a data e
// hora do evento (campo data_hora) precisa ficar bem legível.
export function formatarDataEvento(dataIso) {
  if (!dataIso) return null;
  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return null;

  const diaSemana = DIAS_SEMANA[data.getDay()].slice(0, 3);
  const dia = data.getDate();
  const mes = MESES[data.getMonth()];
  const hora = String(data.getHours()).padStart(2, '0');
  const min = String(data.getMinutes()).padStart(2, '0');

  return `${diaSemana}, ${dia} de ${mes} às ${hora}:${min}`;
}

// Converte o texto digitado no formulário "DD/MM/AAAA HH:MM" para um
// ISO string aceito pelo Postgres. Retorna null se o formato for inválido.
export function parseDataHoraBR(texto) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/.exec((texto || '').trim());
  if (!match) return null;
  const [, dd, mm, yyyy, hh, min] = match;
  const data = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min));
  if (Number.isNaN(data.getTime())) return null;
  return data.toISOString();
}

// Converte "DD/MM/AAAA" (sem hora) para "AAAA-MM-DD" — usado no registro de
// doação, onde só a data importa (o horário exato do desembolso é
// irrelevante pro exercício fiscal). Retorna null se o formato for inválido.
export function parseDataBR(texto) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((texto || '').trim());
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const data = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (Number.isNaN(data.getTime())) return null;
  return `${yyyy}-${mm}-${dd}`;
}

// Máscaras aplicadas enquanto a pessoa digita — deixam o formulário de
// perfil da ONG/Empresa com cara de formulário de verdade, e ajudam a
// pessoa a perceber na hora se digitou um dígito a mais ou a menos.
export function formatarCNPJ(texto) {
  const d = (texto || '').replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function formatarTelefoneBR(texto) {
  const d = (texto || '').replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return d
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}
