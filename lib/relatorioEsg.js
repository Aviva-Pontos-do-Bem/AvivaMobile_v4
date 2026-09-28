// Gera o HTML do relatório ESG exportável em PDF (via expo-print). Fica num
// arquivo separado da tela pra poder ser testado como função pura, sem
// precisar montar toda a tela da empresa.

function escaparHtml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatarMoedaRelatorio(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function gerarHtmlRelatorioEsg({
  nomeEmpresa,
  ongsApoiadas,
  nomesOngs = [],
  vagasApoiadas,
  funcionarios,
  acoesConcluidas,
  horasVoluntariado,
  regimeTributario = null,
  totalDoado = null,
  tetoDedutivel = null,
  doacoes = [],
}) {
  const dataFormatada = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const listaOngs = nomesOngs.length
    ? `<ul>${nomesOngs.map((nome) => `<li>${escaparHtml(nome)}</li>`).join('')}</ul>`
    : '<p class="vazio">Nenhuma ONG apoiada ainda.</p>';

  const secaoDoacoes = regimeTributario === 'lucro_real' ? `
  <h2>Doações dedutíveis (art. 13, Lei 9.249/95) — ${new Date().getFullYear()}</h2>
  <div class="grid">
    <div class="card"><div class="valor">${formatarMoedaRelatorio(totalDoado)}</div><div class="rotulo">Total doado no ano</div></div>
    <div class="card"><div class="valor">${tetoDedutivel != null ? formatarMoedaRelatorio(tetoDedutivel) : '—'}</div><div class="rotulo">Teto dedutível (2% do lucro operacional)</div></div>
  </div>
  ${doacoes.length ? `
  <table class="tabela">
    <thead><tr><th>ONG</th><th>Data</th><th>Valor</th></tr></thead>
    <tbody>
      ${doacoes.map((d) => `<tr><td>${escaparHtml(d.profiles?.full_name)}</td><td>${new Date(d.data_doacao).toLocaleDateString('pt-BR')}</td><td>${formatarMoedaRelatorio(d.valor)}</td></tr>`).join('')}
    </tbody>
  </table>` : '<p class="vazio">Nenhuma doação registrada neste exercício.</p>'}
  ` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #333333; padding: 32px; }
    h1 { color: #1D3557; font-size: 24px; margin-bottom: 4px; }
    .subtitulo { color: #888888; font-size: 13px; margin-bottom: 32px; }
    .grid { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 32px; }
    .card { flex: 1; min-width: 140px; border: 1px solid #EEEEEE; border-radius: 12px; padding: 16px; text-align: center; }
    .card .valor { font-size: 28px; color: #2A9D8F; font-weight: bold; }
    .card .rotulo { font-size: 12px; color: #888888; margin-top: 4px; }
    h2 { color: #1D3557; font-size: 16px; border-bottom: 1px solid #EEEEEE; padding-bottom: 8px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 4px; }
    .vazio { color: #888888; font-style: italic; }
    .tabela { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .tabela th, .tabela td { border-bottom: 1px solid #EEEEEE; padding: 8px; text-align: left; font-size: 13px; }
    .tabela th { color: #888888; font-weight: normal; }
    .rodape { margin-top: 48px; font-size: 11px; color: #888888; text-align: center; }
  </style>
</head>
<body>
  <h1>Relatório de Impacto ESG</h1>
  <div class="subtitulo">${escaparHtml(nomeEmpresa)} — gerado em ${dataFormatada}</div>

  <div class="grid">
    <div class="card"><div class="valor">${horasVoluntariado}h</div><div class="rotulo">Horas de voluntariado</div></div>
    <div class="card"><div class="valor">${ongsApoiadas}</div><div class="rotulo">ONGs apoiadas</div></div>
    <div class="card"><div class="valor">${vagasApoiadas}</div><div class="rotulo">Vagas dessas ONGs</div></div>
    <div class="card"><div class="valor">${funcionarios}</div><div class="rotulo">Funcionários no app</div></div>
    <div class="card"><div class="valor">${acoesConcluidas}</div><div class="rotulo">Ações concluídas</div></div>
  </div>

  <h2>ONGs apoiadas</h2>
  ${listaOngs}
  ${secaoDoacoes}

  <div class="rodape">Relatório gerado automaticamente pelo Aviva — Pontos do Bem.</div>
</body>
</html>`;
}
