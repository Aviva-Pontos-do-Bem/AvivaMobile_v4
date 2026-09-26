import { calcularMatch } from '../matching';

describe('calcularMatch', () => {
  it('nunca retorna menos que 60 ou mais que 97', () => {
    const semNada = calcularMatch({ bioViewer: '', ong: {}, vagasAbertasCount: 0 });
    expect(semNada).toBeGreaterThanOrEqual(60);
    expect(semNada).toBeLessThanOrEqual(97);

    const maximoPossivel = calcularMatch({
      bioViewer: 'meio ambiente sustentabilidade reciclagem educação',
      ong: { verificado: true, bio: 'meio ambiente sustentabilidade reciclagem educação', full_name: 'ONG Verde' },
      vagasAbertasCount: 999,
    });
    expect(maximoPossivel).toBeLessThanOrEqual(97);
  });

  it('ONG verificada com vagas abertas pontua mais que uma sem nada disso', () => {
    const semNada = calcularMatch({ bioViewer: 'voluntariado', ong: { verificado: false, bio: '' }, vagasAbertasCount: 0 });
    const comTudo = calcularMatch({ bioViewer: 'voluntariado', ong: { verificado: true, bio: '' }, vagasAbertasCount: 5 });
    expect(comTudo).toBeGreaterThan(semNada);
  });

  it('bio parecida aumenta o match em relação a bios sem nenhuma palavra em comum', () => {
    const bioParecida = calcularMatch({
      bioViewer: 'gosto de educação e tecnologia',
      ong: { bio: 'projetos de educação e tecnologia para jovens' },
    });
    const bioDiferente = calcularMatch({
      bioViewer: 'gosto de educação e tecnologia',
      ong: { bio: 'resgate e cuidado de animais abandonados' },
    });
    expect(bioParecida).toBeGreaterThan(bioDiferente);
  });

  it('lida com bio/ong ausentes sem quebrar', () => {
    expect(() => calcularMatch({})).not.toThrow();
    expect(calcularMatch({})).toBeGreaterThanOrEqual(60);
  });
});
