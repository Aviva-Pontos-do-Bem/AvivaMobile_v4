// Gera o HTML (via expo-print) da declaração que acompanha uma doação
// dedutível de empresa para ONG — modelo inspirado no Anexo I da IN RFB
// 2.335/2026, que substituiu a antiga IN SRF 87/1996 para doações do art.
// 13, §2º, III, "c" da Lei 9.249/1995. Não é um documento fiscal oficial
// emitido por órgão público — é um apoio organizacional pra empresa e ONG
// terem o registro padronizado da doação, com a mesma redação que a norma
// exige da entidade beneficiária.

function escaparHtml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarDataBR(dataIso) {
  if (!dataIso) return '';
  const [ano, mes, dia] = dataIso.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function gerarHtmlDeclaracaoDoacao({
  ongNome,
  ongCnpj,
  empresaNome,
  empresaCnpj,
  valor,
  dataDoacao,
}) {
  const dataFormatada = formatarDataBR(dataDoacao);
  const dataEmissao = new Date().toLocaleDateString('pt-BR');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #333333; padding: 40px; line-height: 1.6; }
    h1 { color: #1D3557; font-size: 18px; text-align: center; margin-bottom: 32px; }
    .campo { margin-bottom: 8px; }
    .campo b { color: #1D3557; }
    .texto { text-align: justify; margin-top: 24px; margin-bottom: 24px; }
    .assinatura { margin-top: 64px; text-align: center; }
    .linha { border-top: 1px solid #333333; width: 280px; margin: 0 auto 6px auto; }
    .rodape { margin-top: 48px; font-size: 11px; color: #888888; text-align: center; }
  </style>
</head>
<body>
  <h1>DECLARAÇÃO DE DOAÇÃO<br/>(art. 13, §2º, III, "c" da Lei nº 9.249/1995)</h1>

  <div class="campo"><b>Entidade beneficiária:</b> ${escaparHtml(ongNome)}</div>
  <div class="campo"><b>CNPJ da entidade:</b> ${escaparHtml(ongCnpj)}</div>
  <div class="campo"><b>Empresa doadora:</b> ${escaparHtml(empresaNome)}</div>
  <div class="campo"><b>CNPJ da empresa:</b> ${escaparHtml(empresaCnpj)}</div>
  <div class="campo"><b>Valor doado:</b> ${formatarMoeda(valor)}</div>
  <div class="campo"><b>Data da doação:</b> ${dataFormatada}</div>

  <p class="texto">
    A entidade acima identificada declara, para os fins previstos no art. 13, §2º, inciso III,
    alínea "c", da Lei nº 9.249/1995, que se qualifica como organização da sociedade civil nos
    termos da Lei nº 13.019/2014, que cumpre os requisitos previstos nos arts. 3º e 16 da Lei
    nº 9.790/1999, e que se compromete a aplicar integralmente os recursos recebidos em seus
    fins estatutários, sem distribuir lucros, sobras, dividendos ou qualquer parcela de seu
    patrimônio a diretores, associados, conselheiros ou equivalentes.
  </p>

  <div class="assinatura">
    <div class="linha"></div>
    <div>${escaparHtml(ongNome)}</div>
  </div>

  <div class="rodape">Documento gerado automaticamente pelo Aviva — Pontos do Bem, em ${dataEmissao}.<br/>Não substitui a declaração/recibo oficial que a entidade deve manter conforme a IN RFB nº 2.335/2026.</div>
</body>
</html>`;
}
