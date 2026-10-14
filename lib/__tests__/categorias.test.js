import { estiloCategoria } from '../categorias';
import { CATEGORIAS } from '../constants';

describe('estiloCategoria', () => {
  it('toda categoria da plataforma tem estilo próprio (cor, fundo e ícone)', () => {
    CATEGORIAS.forEach((c) => {
      const e = estiloCategoria(c);
      expect(e.cor).toMatch(/^#[0-9A-F]{6}$/i);
      expect(e.fundo).toMatch(/^#[0-9A-F]{6}$/i);
      expect(e.icone).toBeTruthy();
    });
  });

  it('categorias diferentes têm cores diferentes', () => {
    const cores = new Set(CATEGORIAS.map((c) => estiloCategoria(c).cor));
    expect(cores.size).toBe(CATEGORIAS.length);
  });

  it('categoria desconhecida ou vazia cai num padrão', () => {
    expect(estiloCategoria('inexistente').icone).toBeTruthy();
    expect(estiloCategoria(undefined).icone).toBeTruthy();
  });
});
