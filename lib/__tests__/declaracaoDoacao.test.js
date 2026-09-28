import { gerarHtmlDeclaracaoDoacao } from '../declaracaoDoacao';

describe('gerarHtmlDeclaracaoDoacao', () => {
  it('inclui os dados da doação formatados', () => {
    const html = gerarHtmlDeclaracaoDoacao({
      ongNome: 'ONG Exemplo',
      ongCnpj: '11.122.233/0001-83',
      empresaNome: 'Empresa Exemplo',
      empresaCnpj: '44.455.566/0001-83',
      valor: 1500.5,
      dataDoacao: '2026-03-15',
    });

    expect(html).toContain('ONG Exemplo');
    expect(html).toContain('Empresa Exemplo');
    expect(html).toContain('15/03/2026');
    expect(html).toMatch(/R\$\s*1\.500,50/);
    expect(html).toContain('Lei nº 9.249/1995');
  });

  it('escapa HTML nos nomes pra não quebrar o layout do PDF', () => {
    const html = gerarHtmlDeclaracaoDoacao({
      ongNome: '<b>ONG</b>',
      ongCnpj: '11.122.233/0001-83',
      empresaNome: 'Empresa',
      empresaCnpj: '44.455.566/0001-83',
      valor: 100,
      dataDoacao: '2026-01-01',
    });

    expect(html).not.toContain('<b>ONG</b>');
    expect(html).toContain('&lt;b&gt;ONG&lt;/b&gt;');
  });
});
