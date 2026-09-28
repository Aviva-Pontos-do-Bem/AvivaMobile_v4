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
});
