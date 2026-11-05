import { publicInStock } from './public-catalog.domain';

const row = (extra: object) =>
  ({
    id: 'p',
    sortName: 'Paracetamol',
    brandName: null,
    strengthText: null,
    packageSizeText: null,
    price: null,
    currency: null,
    requiresPrescription: false,
    availableQuantity: '0',
    ...extra,
  }) as any;

describe('publicInStock (P31 con la regla única de existencias por sede)', () => {
  it('sin los datos del catálogo, como antes: lo disponible del ledger', () => {
    expect(publicInStock(row({ availableQuantity: '3' }))).toBe(true);
    expect(publicInStock(row({ availableQuantity: '0' }))).toBe(false);
  });

  it('con la regla única por sede: hay si está disponible en alguna sede activa', () => {
    expect(publicInStock(row({ availableSites: '1' }))).toBe(true);
    expect(publicInStock(row({ availableSites: 2 }))).toBe(true);
  });

  it('con la regla única por sede: ninguna sede lo tiene, no hay aunque el libro sume', () => {
    // Lo que el libro suma en sedes donde el producto se marcó «no tengo» no
    // vuelve a contar acá: la sede ya lo excluyó (ver la integración de A1).
    expect(
      publicInStock(row({ availableSites: '0', availableQuantity: '5' })),
    ).toBe(false);
  });
});
