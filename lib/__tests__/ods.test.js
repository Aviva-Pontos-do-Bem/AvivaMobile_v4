import { ODS, NUMEROS_ODS, sugerirOds, alternarOds, agruparPorOds } from '../ods';
import { somarImpactoAmbiental, temImpactoAmbiental, KG_CO2_POR_ARVORE_EM_20_ANOS } from '../impactoAmbiental';

describe('catálogo de ODS', () => {
  it('tem os 17 objetivos com nome e cor', () => {
    expect(NUMEROS_ODS).toHaveLength(17);
    NUMEROS_ODS.forEach((n) => {
      expect(ODS[n].nome).toBeTruthy();
      expect(ODS[n].cor).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });
});

describe('sugerirOds', () => {
  it('sugere ODS por categoria e devolve cópia', () => {
    expect(sugerirOds('Educação')).toEqual([4]);
    expect(sugerirOds('Meio ambiente')).toEqual([13, 15]);
    expect(sugerirOds('categoria inexistente')).toEqual([]);
    const a = sugerirOds('Educação');
    a.push(99);
    expect(sugerirOds('Educação')).toEqual([4]);
  });
});

describe('alternarOds', () => {
  it('liga, desliga e mantém ordenado', () => {
    expect(alternarOds([], 13)).toEqual([13]);
    expect(alternarOds([13], 4)).toEqual([4, 13]);
    expect(alternarOds([4, 13], 13)).toEqual([4]);
  });

  it('respeita o limite de 3 por vaga', () => {
    expect(alternarOds([1, 2, 3], 4)).toEqual([1, 2, 3]);
    expect(alternarOds([1, 2, 3], 2)).toEqual([1, 3]);
  });
});

describe('agruparPorOds', () => {
  const concluidas = [
    { vagas: { horas_estimadas: 4, ods: [4] } },
    { vagas: { horas_estimadas: 6, ods: [4, 10] } },
    { vagas: { horas_estimadas: 2, ods: [13] } },
    { vagas: { horas_estimadas: 3, ods: [] } },
    { vagas: { horas_estimadas: null } },
  ];

  it('soma horas e ações por ODS, ordenando pelas horas', () => {
    const { lista } = agruparPorOds(concluidas);
    expect(lista).toEqual([
      { ods: 4, acoes: 2, horas: 10 },
      { ods: 10, acoes: 1, horas: 6 },
      { ods: 13, acoes: 1, horas: 2 },
    ]);
  });

  it('separa o que ainda não foi classificado', () => {
    expect(agruparPorOds(concluidas).semClassificacao).toEqual({ acoes: 2, horas: 3 });
  });

  it('ignora números de ODS inválidos e lida com lista vazia', () => {
    expect(agruparPorOds([{ vagas: { horas_estimadas: 1, ods: [99] } }]).semClassificacao.acoes).toBe(1);
    expect(agruparPorOds(null)).toEqual({ lista: [], semClassificacao: { acoes: 0, horas: 0 } });
  });
});

describe('somarImpactoAmbiental', () => {
  it('soma árvores e resíduos e estima CO₂ só das árvores', () => {
    const r = somarImpactoAmbiental([
      { vagas: { impacto_tipo: 'arvores', impacto_por_voluntario: 5 } },
      { vagas: { impacto_tipo: 'arvores', impacto_por_voluntario: 3 } },
      { vagas: { impacto_tipo: 'residuos_kg', impacto_por_voluntario: 12.5 } },
      { vagas: { impacto_tipo: null, impacto_por_voluntario: null } },
    ]);
    expect(r.arvores).toBe(8);
    expect(r.residuosKg).toBe(12.5);
    expect(r.co2Kg).toBe(8 * KG_CO2_POR_ARVORE_EM_20_ANOS);
  });

  it('sem dados, tudo zero e sem seção', () => {
    const r = somarImpactoAmbiental([]);
    expect(r).toEqual({ arvores: 0, residuosKg: 0, co2Kg: 0 });
    expect(temImpactoAmbiental(r)).toBe(false);
    expect(temImpactoAmbiental({ arvores: 1, residuosKg: 0, co2Kg: 140 })).toBe(true);
  });
});
