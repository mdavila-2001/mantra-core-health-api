import {
  productByExternalCode,
  translateExternalStock,
} from './external-mapping';

const CATALOG = [
  { code: 'ERP-0001', name: 'Paracetamol 500 mg' },
  { code: 'ERP-0002', name: 'Ibuprofeno 400 mg' },
  { code: 'ERP-0003', name: 'Amoxicilina 500 mg' },
];

describe('external mapping', () => {
  it('a mapped code becomes an item with its product', () => {
    const { items, unmapped } = translateExternalStock(
      [{ externalProductCode: 'ERP-0001', pharmacyProductId: 'product-a' }],
      CATALOG,
      'SEDE-1',
      [{ code: 'ERP-0001', quantity: 7 }],
    );
    expect(items).toEqual([
      {
        externalProductCode: 'ERP-0001',
        externalLocationCode: 'SEDE-1',
        externalQuantity: 7,
        pharmacyProductId: 'product-a',
      },
    ]);
    expect(unmapped).toEqual([]);
  });

  it('a code without mapping goes to the batch without product and is reported with its name', () => {
    const { items, unmapped } = translateExternalStock([], CATALOG, 'SEDE-1', [
      { code: 'ERP-0002', quantity: 3 },
    ]);
    expect(items[0].pharmacyProductId).toBeUndefined();
    expect(unmapped).toEqual([
      { externalCode: 'ERP-0002', name: 'Ibuprofeno 400 mg' },
    ]);
  });

  it('a code mapped to two products is treated as unmapped', () => {
    const mappings = [
      { externalProductCode: 'ERP-0003', pharmacyProductId: 'product-a' },
      { externalProductCode: 'ERP-0003', pharmacyProductId: 'product-b' },
    ];
    expect(productByExternalCode(mappings).has('ERP-0003')).toBe(false);
    const { items, unmapped } = translateExternalStock(
      mappings,
      CATALOG,
      'SEDE-1',
      [{ code: 'ERP-0003', quantity: 1 }],
    );
    expect(items[0].pharmacyProductId).toBeUndefined();
    expect(unmapped.map((u) => u.externalCode)).toEqual(['ERP-0003']);
  });

  it('the same mapping repeated is still one product', () => {
    const mappings = [
      { externalProductCode: 'ERP-0001', pharmacyProductId: 'product-a' },
      { externalProductCode: 'ERP-0001', pharmacyProductId: 'product-a' },
    ];
    expect(productByExternalCode(mappings).get('ERP-0001')).toBe('product-a');
  });

  it('an unknown code keeps the code as its name', () => {
    const { unmapped } = translateExternalStock([], CATALOG, 'S', [
      { code: 'ERP-9999', quantity: 0 },
    ]);
    expect(unmapped).toEqual([{ externalCode: 'ERP-9999', name: 'ERP-9999' }]);
  });
});
