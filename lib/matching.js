// Heurística de "match" usada nas telas de busca (Parcerias Sugeridas).
//
// O documento do projeto descreve, como próximo passo, um motor de
// recomendação com IA que cruza interesses/habilidades declarados com as
// necessidades de cada ONG. Esse motor ainda não existe — o que este
// arquivo faz é uma versão simples e explicável do mesmo princípio,
// usando só o que já está no banco hoje (vagas ativas, categoria, bio,
// verificação), para a busca já ficar útil enquanto o motor de IA não
// entra. Trocar essa função por uma chamada ao motor de recomendação real
// no futuro não deve exigir mudar nada nas telas que a usam.

const PALAVRAS_IGNORADAS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'as', 'os', 'em', 'para',
  'com', 'que', 'um', 'uma', 'no', 'na', 'nos', 'nas', 'por', 'se', 'ao',
]);

function palavrasRelevantes(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((p) => p.length > 3 && !PALAVRAS_IGNORADAS.has(p));
}

function sobreposicaoDePalavras(textoA, textoB) {
  const setA = new Set(palavrasRelevantes(textoA));
  const setB = new Set(palavrasRelevantes(textoB));
  if (setA.size === 0 || setB.size === 0) return 0;
  let comuns = 0;
  setA.forEach((p) => { if (setB.has(p)) comuns += 1; });
  return comuns / Math.min(setA.size, setB.size);
}

// Retorna um número de 60 a 97 (%). Nunca 100 — deixa claro que é uma
// estimativa, não uma garantia.
export function calcularMatch({ bioViewer, ong, vagasAbertasCount = 0 }) {
  let pontos = 60;

  pontos += Math.min(18, vagasAbertasCount * 4); // ONG com ações abertas agora é mais relevante
  if (ong?.verificado) pontos += 7;

  const sobreposicao = sobreposicaoDePalavras(bioViewer, `${ong?.bio || ''} ${ong?.full_name || ''}`);
  pontos += Math.round(sobreposicao * 12);

  return Math.max(60, Math.min(97, Math.round(pontos)));
}
