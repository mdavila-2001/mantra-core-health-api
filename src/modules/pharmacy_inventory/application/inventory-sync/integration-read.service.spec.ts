import { jest } from '@jest/globals';
import { allowAllScope } from '../scope/pharmacy-inventory-scope.testing';
import { IntegrationReadService } from './integration-read.service';

const REF = { pharmacyId: 'pharmacy-1', connectionId: 'conn-1' };
const ACTOR = { id: 'user-1' } as any;

function build(mappings: Record<string, unknown>[]) {
  const em = { fork: jest.fn(() => ({})) };
  const reads = {
    findConnection: jest.fn(async () => ({
      id: 'conn-1',
      pharmacyId: 'pharmacy-1',
    })),
    findMappings: jest.fn(async () => mappings),
    findProducts: jest.fn(async () => [
      { id: 'product-a', productCode: 'P-A', brandName: 'Producto A' },
    ]),
  };
  const external = {
    isConfigured: jest.fn(() => true),
    listProducts: jest.fn(async () => [
      { code: 'ERP-0001', name: 'Paracetamol', unitCode: 'BOX' },
      { code: 'ERP-0002', name: 'Ibuprofeno' },
      { code: 'ERP-0003', name: 'Amoxicilina' },
    ]),
    stockForSite: jest.fn(async () => []),
  };
  const service = new IntegrationReadService(
    em as any,
    allowAllScope(),
    reads as any,
    external,
  );
  return { service };
}

describe('IntegrationReadService', () => {
  it('the external catalogue tells a missing mapping from an ambiguous one', async () => {
    const d = build([
      { externalProductCode: 'ERP-0001', pharmacyProductId: 'product-a' },
      { externalProductCode: 'ERP-0003', pharmacyProductId: 'product-b' },
      { externalProductCode: 'ERP-0003', pharmacyProductId: 'product-c' },
    ]);
    const { items } = await d.service.externalProducts(REF, ACTOR);
    expect(
      items.map(
        ({ code, mappedProductId, mappingStatus, mappedProductIds }) => ({
          code,
          mappedProductId,
          mappingStatus,
          mappedProductIds,
        }),
      ),
    ).toEqual([
      {
        code: 'ERP-0001',
        mappedProductId: 'product-a',
        mappingStatus: 'MAPPED',
        mappedProductIds: ['product-a'],
      },
      {
        code: 'ERP-0002',
        mappedProductId: null,
        mappingStatus: 'UNMAPPED',
        mappedProductIds: [],
      },
      {
        code: 'ERP-0003',
        mappedProductId: null,
        mappingStatus: 'AMBIGUOUS',
        mappedProductIds: ['product-b', 'product-c'],
      },
    ]);
  });

  it('a mapping shows the unit it declared', async () => {
    const d = build([
      {
        id: 'map-1',
        externalProductCode: 'ERP-0001',
        pharmacyProductId: 'product-a',
        externalUnitCode: 'BOX',
        createdAt: new Date('2026-10-01T00:00:00Z'),
      },
      {
        id: 'map-2',
        externalProductCode: 'ERP-0002',
        pharmacyProductId: 'product-z',
        createdAt: new Date('2026-10-01T00:00:00Z'),
      },
    ]);
    const { items } = await d.service.mappings(REF, ACTOR);
    expect(items.map((item) => item.externalUnitCode)).toEqual(['BOX', null]);
    expect(items[0]).toMatchObject({ productName: 'Producto A' });
  });
});
