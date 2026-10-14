import { gerarHtmlRelatorioEsg } from '../relatorioEsg';

describe('gerarHtmlRelatorioEsg', () => {
  it('inclui as métricas e o nome da empresa no HTML', () => {
    const html = gerarHtmlRelatorioEsg({
      nomeEmpresa: 'Empresa Teste',
      ongsApoiadas: 2,
      nomesOngs: ['ONG Um', 'ONG Dois'],
      vagasApoiadas: 5,
      funcionarios: 3,
      acoesConcluidas: 4,
      horasVoluntariado: 16,
    });

    expect(html).toContain('Empresa Teste');
    expect(html).toContain('16h');
    expect(html).toContain('ONG Um');
    expect(html).toContain('ONG Dois');
    expect(html).toContain('<li>ONG Um</li>');
  });

  it('mostra mensagem vazia quando não há ONGs apoiadas', () => {
    const html = gerarHtmlRelatorioEsg({
      nomeEmpresa: 'Empresa Teste',
      ongsApoiadas: 0,
      nomesOngs: [],
      vagasApoiadas: 0,
      funcionarios: 0,
      acoesConcluidas: 0,
      horasVoluntariado: 0,
    });

    expect(html).toContain('Nenhuma ONG apoiada ainda.');
  });

  it('escapa HTML no nome da ONG para evitar quebrar o layout do PDF', () => {
    const html = gerarHtmlRelatorioEsg({
      nomeEmpresa: 'Empresa Teste',
      ongsApoiadas: 1,
      nomesOngs: ['<script>alert(1)</script>'],
      vagasApoiadas: 0,
      funcionarios: 0,
      acoesConcluidas: 0,
      horasVoluntariado: 0,
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  const base = { nomeEmpresa: 'Empresa Teste', ongsApoiadas: 1, nomesOngs: ['ONG'], vagasApoiadas: 1, funcionarios: 2, acoesConcluidas: 3, horasVoluntariado: 12 };

  it('inclui a tabela de ODS com nome oficial e a nota sobre ações em mais de um ODS', () => {
    const html = gerarHtmlRelatorioEsg({
      ...base,
      porOds: { lista: [{ ods: 4, acoes: 2, horas: 10 }, { ods: 13, acoes: 1, horas: 2 }], semClassificacao: { acoes: 1, horas: 3 } },
    });
    expect(html).toContain('Objetivos de Desenvolvimento Sustentável');
    expect(html).toContain('Educação de qualidade');
    expect(html).toContain('Ação contra a mudança global do clima');
    expect(html).toContain('Sem classificação de ODS');
    expect(html).toContain('mais de um ODS');
  });

  it('inclui impacto ambiental com aviso de estimativa e fonte do fator, só de árvores para CO₂', () => {
    const html = gerarHtmlRelatorioEsg({ ...base, impactoAmbiental: { arvores: 8, residuosKg: 12.5, co2Kg: 1120 } });
    expect(html).toContain('Impacto ambiental declarado');
    expect(html).toContain('Árvores plantadas');
    expect(html).toContain('Resíduos destinados à reciclagem');
    expect(html).toContain('estimativa');
    expect(html).toContain('ESALQ');
    expect(html).toContain('não é crédito de carbono');
  });

  it('omite as seções de ODS e de impacto ambiental quando não há dados', () => {
    const html = gerarHtmlRelatorioEsg({
      ...base,
      porOds: { lista: [], semClassificacao: { acoes: 0, horas: 0 } },
      impactoAmbiental: { arvores: 0, residuosKg: 0, co2Kg: 0 },
    });
    expect(html).not.toContain('Objetivos de Desenvolvimento Sustentável');
    expect(html).not.toContain('Impacto ambiental declarado');
  });
});
