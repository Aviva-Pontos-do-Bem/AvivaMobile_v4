import { distanciaKm, formatarDistancia } from '../geo';

describe('distanciaKm', () => {
  it('retorna 0 para o mesmo ponto', () => {
    expect(distanciaKm(-23.55, -46.63, -23.55, -46.63)).toBeCloseTo(0, 5);
  });

  it('calcula uma distância conhecida (São Paulo -> Rio de Janeiro, ~360km)', () => {
    const distancia = distanciaKm(-23.5505, -46.6333, -22.9068, -43.1729);
    expect(distancia).toBeGreaterThan(340);
    expect(distancia).toBeLessThan(380);
  });

  it('retorna null quando falta alguma coordenada', () => {
    expect(distanciaKm(null, -46.6333, -22.9068, -43.1729)).toBeNull();
    expect(distanciaKm(-23.5505, undefined, -22.9068, -43.1729)).toBeNull();
    expect(distanciaKm(-23.5505, -46.6333, NaN, -43.1729)).toBeNull();
  });
});

describe('formatarDistancia', () => {
  it('mostra metros quando menor que 1km', () => {
    expect(formatarDistancia(0.8)).toBe('800 m');
  });

  it('mostra km com vírgula quando maior ou igual a 1km', () => {
    expect(formatarDistancia(3.2)).toBe('3,2 km');
  });

  it('retorna vazio quando não há distância', () => {
    expect(formatarDistancia(null)).toBe('');
  });
});
