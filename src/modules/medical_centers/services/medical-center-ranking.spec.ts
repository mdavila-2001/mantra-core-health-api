import {
  compareMedicalCenters,
  type RankableCenter,
} from './medical-center-ranking';

/**
 * Un centro con los campos que mueven el orden.
 *
 * @param name - Nombre de la sede.
 * @param overrides - Campos que cambian de un caso a otro.
 * @returns El centro de prueba.
 */
function center(
  name: string,
  overrides: Partial<RankableCenter> = {},
): RankableCenter {
  return {
    complete: true,
    distanceKm: 5,
    totalPrice: 100,
    name,
    ...overrides,
  };
}

/**
 * Ordena los nombres de un lote con el comparador.
 *
 * @param centers - Centros a ordenar.
 * @returns Los nombres en el orden resultante.
 */
function order(centers: RankableCenter[]): string[] {
  return [...centers].sort(compareMedicalCenters).map((c) => c.name);
}

describe('compareMedicalCenters', () => {
  it('un completo a 20 km va antes que un incompleto a 1 km', () => {
    expect(
      order([
        center('cerca-incompleto', { complete: false, distanceKm: 1 }),
        center('lejos-completo', { distanceKm: 20 }),
      ]),
    ).toEqual(['lejos-completo', 'cerca-incompleto']);
  });

  it('entre completos, el más cercano primero', () => {
    expect(
      order([center('b', { distanceKm: 9 }), center('a', { distanceKm: 2 })]),
    ).toEqual(['a', 'b']);
  });

  it('sin distancia va al final entre los de su grupo', () => {
    expect(
      order([
        center('sin-distancia', { distanceKm: null, totalPrice: 1 }),
        center('con-distancia', { distanceKm: 300 }),
      ]),
    ).toEqual(['con-distancia', 'sin-distancia']);
  });

  it('a igual distancia, el de menor precio total', () => {
    expect(
      order([
        center('caro', { totalPrice: 300 }),
        center('barato', { totalPrice: 100 }),
      ]),
    ).toEqual(['barato', 'caro']);
  });

  it('un precio total desconocido va después de uno conocido', () => {
    expect(
      order([
        center('sin-total', { totalPrice: null }),
        center('con-total', { totalPrice: 900 }),
      ]),
    ).toEqual(['con-total', 'sin-total']);
  });

  it('con todo igual, por nombre', () => {
    expect(order([center('Sur'), center('Norte')])).toEqual(['Norte', 'Sur']);
  });

  it('CI-2: el comparador no lee el vínculo del médico, invertirlo no cambia el orden', () => {
    const base = [
      center('a', { distanceKm: 1 }),
      center('b', { distanceKm: 2 }),
    ];
    const withLink = base.map((c, i) => ({
      ...c,
      practitionerWorksHere: i === 1,
      suggestedByPractitioner: i === 1,
    }));
    const inverted = base.map((c, i) => ({
      ...c,
      practitionerWorksHere: i === 0,
      suggestedByPractitioner: i === 0,
    }));

    expect(order(withLink)).toEqual(order(inverted));
    expect(order(withLink)).toEqual(['a', 'b']);
  });
});
