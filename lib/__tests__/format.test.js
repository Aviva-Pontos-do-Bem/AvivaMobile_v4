import { formatarDataEvento, parseDataHoraBR, formatarCNPJ, formatarTelefoneBR } from '../format';

describe('parseDataHoraBR', () => {
  it('converte "DD/MM/AAAA HH:MM" para ISO', () => {
    const iso = parseDataHoraBR('16/08/2026 09:00');
    expect(iso).not.toBeNull();
    const data = new Date(iso);
    expect(data.getFullYear()).toBe(2026);
    expect(data.getMonth()).toBe(7); // agosto = índice 7
    expect(data.getDate()).toBe(16);
    expect(data.getHours()).toBe(9);
    expect(data.getMinutes()).toBe(0);
  });

  it('rejeita formatos fora do padrão', () => {
    expect(parseDataHoraBR('2026-08-16 09:00')).toBeNull();
    expect(parseDataHoraBR('16/08/2026')).toBeNull();
    expect(parseDataHoraBR('')).toBeNull();
    expect(parseDataHoraBR(undefined)).toBeNull();
  });

  // Comportamento atual documentado (não é o ideal): parseDataHoraBR só
  // valida o FORMATO com regex, não se o dia/mês fazem sentido no
  // calendário — "32/13/2026" não quebra, o JS Date silenciosamente
  // "rola" para 01/02/2027. Ver observação separada sobre esse ponto.
  it('não rejeita dia/mês fora do calendário — apenas "rola" para a data seguinte', () => {
    const iso = parseDataHoraBR('32/13/2026 09:00');
    expect(iso).not.toBeNull();
  });
});

describe('formatarDataEvento', () => {
  it('formata uma data ISO válida', () => {
    const resultado = formatarDataEvento('2026-08-16T09:00:00');
    expect(resultado).toMatch(/dom|seg|ter|qua|qui|sex|sáb/);
    expect(resultado).toContain('16 de ago');
    expect(resultado).toContain('09:00');
  });

  it('retorna null para entrada vazia ou inválida', () => {
    expect(formatarDataEvento(null)).toBeNull();
    expect(formatarDataEvento('data-invalida')).toBeNull();
  });
});

describe('formatarCNPJ', () => {
  it('aplica a máscara enquanto digita', () => {
    expect(formatarCNPJ('11122233000183')).toBe('11.122.233/0001-83');
  });

  it('lida com entrada parcial sem quebrar', () => {
    expect(formatarCNPJ('111')).toBe('11.1');
    expect(formatarCNPJ('')).toBe('');
  });

  it('ignora dígitos além do 14º', () => {
    expect(formatarCNPJ('111222330001839999')).toBe('11.122.233/0001-83');
  });
});

describe('formatarTelefoneBR', () => {
  it('formata celular (11 dígitos) com hífen antes dos 4 últimos', () => {
    expect(formatarTelefoneBR('11900000000')).toBe('(11) 90000-0000');
  });

  it('formata fixo (10 dígitos)', () => {
    expect(formatarTelefoneBR('1133334444')).toBe('(11) 3333-4444');
  });

  it('lida com entrada parcial sem quebrar', () => {
    expect(formatarTelefoneBR('11')).toBe('11');
    expect(formatarTelefoneBR('')).toBe('');
  });
});
