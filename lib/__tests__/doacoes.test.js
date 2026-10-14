import { parseValorBR, formatarBRL, somarDedutivelConfirmado, ROTULO_STATUS_DOACAO } from '../doacoes';

describe('parseValorBR', () => {
  it('aceita formatos comuns de valor em reais', () => {
    expect(parseValorBR('50')).toBe(50);
    expect(parseValorBR('50,5')).toBe(50.5);
    expect(parseValorBR('1.234,56')).toBe(1234.56);
    expect(parseValorBR('R$ 1.234,56')).toBe(1234.56);
    expect(parseValorBR('5000,00')).toBe(5000);
  });

  it('rejeita valor zero, negativo ou fora de formato', () => {
    expect(parseValorBR('0')).toBeNull();
    expect(parseValorBR('-10')).toBeNull();
    expect(parseValorBR('abc')).toBeNull();
    expect(parseValorBR('10,999')).toBeNull();
    expect(parseValorBR('1,234.56')).toBeNull();
    expect(parseValorBR('')).toBeNull();
    expect(parseValorBR(undefined)).toBeNull();
  });

  it('rejeita valor absurdamente alto (erro de digitação)', () => {
    expect(parseValorBR('999999999999')).toBeNull();
  });
});

describe('formatarBRL', () => {
  it('formata como moeda brasileira', () => {
    expect(formatarBRL(1234.5).replace(/\s/g, ' ')).toBe('R$ 1.234,50');
  });
});

describe('somarDedutivelConfirmado', () => {
  it('só conta dedutíveis já confirmados pela ONG', () => {
    const lista = [
      { valor: 1000, dedutivel: true, status: 'confirmada' },
      { valor: 500, dedutivel: true, status: 'pendente' },
      { valor: 700, dedutivel: true, status: 'nao_recebida' },
      { valor: 300, dedutivel: false, status: 'confirmada' },
    ];
    expect(somarDedutivelConfirmado(lista)).toBe(1000);
    expect(somarDedutivelConfirmado(null)).toBe(0);
  });
});

describe('rótulos', () => {
  it('têm texto para todos os status', () => {
    expect(ROTULO_STATUS_DOACAO.pendente).toBeTruthy();
    expect(ROTULO_STATUS_DOACAO.confirmada).toBeTruthy();
    expect(ROTULO_STATUS_DOACAO.nao_recebida).toBeTruthy();
  });
});
