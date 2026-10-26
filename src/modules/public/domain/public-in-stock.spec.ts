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

describe('publicInStock (P31 con el catálogo de P47)', () => {
  it('sin los datos del catálogo, como antes: lo disponible del ledger', () => {
    expect(publicInStock(row({ availableQuantity: '3' }))).toBe(true);
    expect(publicInStock(row({ availableQuantity: '0' }))).toBe(false);
  });

  it('el «no tengo» del catálogo manda aunque el ledger tenga', () => {
    expect(
      publicInStock(
        row({
          availableQuantity: '5',
          stockPositions: '1',
          declaredInStock: false,
        }),
      ),
    ).toBe(false);
  });

  it('con ledger, decide lo disponible del ledger', () => {
    expect(
      publicInStock(
        row({
          availableQuantity: '0',
          stockPositions: '2',
          declaredInStock: true,
        }),
      ),
    ).toBe(false);
    expect(
      publicInStock(
        row({
          availableQuantity: '4',
          stockPositions: '2',
          declaredInStock: true,
        }),
      ),
    ).toBe(true);
  });

  it('sin ledger, vale la declaración del catálogo', () => {
    expect(
      publicInStock(
        row({
          availableQuantity: '0',
          stockPositions: '0',
          declaredInStock: true,
        }),
      ),
    ).toBe(true);
  });
});
