import { jest } from '@jest/globals';
import { INTEG } from '../../../integrations/integrations.concepts';
import type { ExternalMapping } from '../../domain/sync/external-mapping';
import type { ExternalProduct } from '../../domain/sync/external-catalog';
import { OrderStockSourceResolver } from './order-stock-source.resolver';

function fixture(mappings: readonly ExternalMapping[]) {
  const connection = { id: 'connection', stateConceptId: INTEG.CONN_ACTIVE };
  const em = {
    fork: jest.fn(() => em),
    transactional: jest.fn(async (work: (tx: unknown) => Promise<void>) =>
      work(em),
    ),
  };
  const connections = {
    findSite: jest.fn(async () => ({
      id: 'site',
      pharmacyId: 'pharmacy',
      code: 'SITE',
    })),
    findForPharmacy: jest.fn(async () => ({
      link: { id: 'link' },
      connection,
      systemCode: 'ALOVIDA_STANDARD',
      credential: { secretRef: 'synthetic-sealed-only' },
      config: {
        baseUrl: 'http://synthetic.invalid',
        pharmacyCode: 'FARM',
        siteCodes: {},
      },
    })),
    findConnectionById: jest.fn(async () => connection),
    recordStatus: jest.fn(),
  };
  const products: ExternalProduct[] = [
    { code: 'E-1', name: 'Synthetic', unitCode: 'BOX' },
  ];
  const adapter = {
    stockForSite: jest.fn(async () => [
      { code: 'E-1', quantity: 7 },
      { code: 'E-2', quantity: 3 },
    ]),
    listProducts: jest.fn(async () => products),
  };
  const reads = { findMappings: jest.fn(async () => [...mappings]) };
  const catalogs = { forAccess: jest.fn(() => adapter) };
  const cipher = {
    isConfigured: () => true,
    decrypt: () => 'synthetic-key-only',
  };
  const logger = { setContext: jest.fn(), warn: jest.fn() };
  const resolver = new OrderStockSourceResolver(
    em as never,
    connections as never,
    reads as never,
    catalogs as never,
    cipher as never,
    logger as never,
  );
  return { resolver, adapter, connections, catalogs };
}

describe('A01: complete ERP mapping ambiguity', () => {
  const ambiguous: ExternalMapping[] = [
    { pharmacyProductId: 'P1', externalProductCode: 'E-1' },
    { pharmacyProductId: 'P2', externalProductCode: 'E-1' },
  ];

  it.each([['P1', 'P2'], ['P1'], ['P2']])(
    'never assigns the shared ERP quantity when the order requests %j',
    async (...wanted) => {
      const d = fixture(ambiguous);
      expect(await d.resolver.resolve('site', wanted)).toEqual({
        mode: 'CONNECTED',
        liveQuantities: new Map(),
      });
      expect(d.adapter.stockForSite).not.toHaveBeenCalled();
    },
  );

  it('keeps an independent unique mapping while excluding both ambiguous products', async () => {
    const d = fixture([
      ...ambiguous,
      { pharmacyProductId: 'P3', externalProductCode: 'E-2' },
    ]);
    expect(await d.resolver.resolve('site', ['P1', 'P3'])).toEqual({
      mode: 'CONNECTED',
      liveQuantities: new Map([['P3', 3]]),
    });
  });

  it('preserves the rejection of multiple external mappings for one product', async () => {
    const d = fixture([
      { pharmacyProductId: 'P1', externalProductCode: 'E-1' },
      { pharmacyProductId: 'P1', externalProductCode: 'E-2' },
    ]);
    expect(await d.resolver.resolve('site', ['P1'])).toEqual({
      mode: 'CONNECTED',
      liveQuantities: new Map(),
    });
    expect(d.catalogs.forAccess).not.toHaveBeenCalled();
  });
});
