// Objetivos de Desenvolvimento Sustentável (ONU, Agenda 2030): nomes em
// português e cores oficiais, mais as regras de classificação das vagas.
// Funções puras, para poderem ser testadas.

export const ODS = {
  1: { nome: 'Erradicação da pobreza', cor: '#E5243B' },
  2: { nome: 'Fome zero e agricultura sustentável', cor: '#DDA63A' },
  3: { nome: 'Saúde e bem-estar', cor: '#4C9F38' },
  4: { nome: 'Educação de qualidade', cor: '#C5192D' },
  5: { nome: 'Igualdade de gênero', cor: '#FF3A21' },
  6: { nome: 'Água potável e saneamento', cor: '#26BDE2' },
  7: { nome: 'Energia limpa e acessível', cor: '#FCC30B' },
  8: { nome: 'Trabalho decente e crescimento econômico', cor: '#A21942' },
  9: { nome: 'Indústria, inovação e infraestrutura', cor: '#FD6925' },
  10: { nome: 'Redução das desigualdades', cor: '#DD1367' },
  11: { nome: 'Cidades e comunidades sustentáveis', cor: '#FD9D24' },
  12: { nome: 'Consumo e produção responsáveis', cor: '#BF8B2E' },
  13: { nome: 'Ação contra a mudança global do clima', cor: '#3F7E44' },
  14: { nome: 'Vida na água', cor: '#0A97D9' },
  15: { nome: 'Vida terrestre', cor: '#56C02B' },
  16: { nome: 'Paz, justiça e instituições eficazes', cor: '#00689D' },
  17: { nome: 'Parcerias e meios de implementação', cor: '#19486A' },
};

export const NUMEROS_ODS = Object.keys(ODS).map(Number);
export const MAX_ODS_POR_VAGA = 3;

// Ponto de partida ao escolher a categoria da vaga; a ONG ajusta.
const SUGESTAO_POR_CATEGORIA = {
  'Meio ambiente': [13, 15],
  'Educação': [4],
  'Saúde': [3],
  'Assistência social': [1, 10],
  'Tecnologia': [9],
};

export function sugerirOds(categoria) {
  return [...(SUGESTAO_POR_CATEGORIA[categoria] || [])];
}

// Liga/desliga um ODS respeitando o limite por vaga (evita marcar tudo "pra
// constar" e esvaziar o indicador).
export function alternarOds(lista, numero, max = MAX_ODS_POR_VAGA) {
  const atual = lista || [];
  if (atual.includes(numero)) return atual.filter((n) => n !== numero);
  if (atual.length >= max) return atual;
  return [...atual, numero].sort((a, b) => a - b);
}

// Soma as horas e ações concluídas por ODS. Uma ação marcada com 2 ODS conta
// nos dois — por isso a soma dos ODS pode passar do total, e o relatório avisa.
// Ações de vagas ainda sem ODS ficam em `semClassificacao`.
export function agruparPorOds(candidaturasConcluidas) {
  const mapa = new Map();
  let semClassificacao = { acoes: 0, horas: 0 };

  (candidaturasConcluidas || []).forEach((c) => {
    const horas = Number(c.vagas?.horas_estimadas) || 0;
    const lista = (c.vagas?.ods || []).filter((n) => ODS[n]);
    if (lista.length === 0) {
      semClassificacao = { acoes: semClassificacao.acoes + 1, horas: semClassificacao.horas + horas };
      return;
    }
    lista.forEach((n) => {
      const atual = mapa.get(n) || { ods: n, acoes: 0, horas: 0 };
      mapa.set(n, { ods: n, acoes: atual.acoes + 1, horas: atual.horas + horas });
    });
  });

  const lista = [...mapa.values()].sort((a, b) => b.horas - a.horas || b.acoes - a.acoes || a.ods - b.ods);
  return { lista, semClassificacao };
}
