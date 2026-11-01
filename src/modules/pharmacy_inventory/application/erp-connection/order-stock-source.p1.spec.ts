import { jest } from '@jest/globals';
import { INTEG } from '../../../integrations/integrations.concepts';
import type { ExternalMapping } from '../../domain/sync/external-mapping';
import type { ExternalProduct } from '../../domain/sync/external-catalog';
import { ExternalCatalogUnavailableError } from '../../domain/sync/external-catalog';
import { OrderStockSourceResolver } from './order-stock-source.resolver';

function fixture(mappings: readonly ExternalMapping[]) {
  const connection = {
    id: 'connection',
    stateConceptId: INTEG.CONN_ACTIVE,
    configJson: { version: 1 },
  };
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

describe('A02: connected orders preserve C8 unit validation', () => {
  it.each([
    { declared: 'BOX', reported: 'BOX', accepted: true },
    { declared: ' box ', reported: ' BOX ', accepted: true },
    { declared: 'TABLET', reported: 'BOX', accepted: false },
    { declared: 'TABLET', reported: undefined, accepted: false },
  ])(
    'validates declared=$declared reported=$reported without conversion',
    async ({ declared, reported, accepted }) => {
      const d = fixture([
        {
          pharmacyProductId: 'P1',
          externalProductCode: 'E-1',
          externalUnitCode: declared,
        },
      ]);
      d.adapter.listProducts.mockResolvedValue([
        { code: 'E-1', name: 'Synthetic', unitCode: reported },
      ]);
      expect(await d.resolver.resolve('site', ['P1'])).toEqual({
        mode: 'CONNECTED',
        liveQuantities: accepted ? new Map([['P1', 7]]) : new Map(),
      });
      expect(d.adapter.listProducts).toHaveBeenCalledWith();
    },
  );

  it('does not turn a catalog omission into a trusted zero quantity', async () => {
    const d = fixture([
      {
        pharmacyProductId: 'P1',
        externalProductCode: 'E-1',
        externalUnitCode: 'BOX',
      },
    ]);
    d.adapter.listProducts.mockResolvedValue([]);
    expect(await d.resolver.resolve('site', ['P1'])).toEqual({
      mode: 'CONNECTED',
      liveQuantities: new Map(),
    });
  });

  it('preserves the C8 compatibility rule when no unit was declared', async () => {
    const d = fixture([
      { pharmacyProductId: 'P1', externalProductCode: 'E-1' },
    ]);
    expect(await d.resolver.resolve('site', ['P1'])).toEqual({
      mode: 'CONNECTED',
      liveQuantities: new Map([['P1', 7]]),
    });
    expect(d.adapter.listProducts).not.toHaveBeenCalled();
  });

  it('keeps a compatible product while excluding an incompatible one', async () => {
    const d = fixture([
      {
        pharmacyProductId: 'P1',
        externalProductCode: 'E-1',
        externalUnitCode: 'TABLET',
      },
      {
        pharmacyProductId: 'P2',
        externalProductCode: 'E-2',
        externalUnitCode: 'BOX',
      },
    ]);
    d.adapter.listProducts.mockResolvedValue([
      { code: 'E-1', name: 'Synthetic one', unitCode: 'BOX' },
      { code: 'E-2', name: 'Synthetic two', unitCode: 'BOX' },
    ]);
    expect(await d.resolver.resolve('site', ['P1', 'P2'])).toEqual({
      mode: 'CONNECTED',
      liveQuantities: new Map([['P2', 3]]),
    });
  });

  it('uses manual fallback and records the error if the required unit catalog fails', async () => {
    const d = fixture([
      {
        pharmacyProductId: 'P1',
        externalProductCode: 'E-1',
        externalUnitCode: 'BOX',
      },
    ]);
    d.adapter.listProducts.mockRejectedValue(
      new ExternalCatalogUnavailableError('Synthetic catalog unavailable'),
    );
    expect(await d.resolver.resolve('site', ['P1'])).toEqual({
      mode: 'MANUAL',
    });
    expect(d.connections.recordStatus).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        statusCode: 'PINV_ERP_CONNECTION_ERROR',
        reasonCode: 'PINV_ERP_REASON_UNREACHABLE',
      }),
    );
  });

  it('shares the three-second transport budget across catalog and stock', async () => {
    jest.useFakeTimers();
    try {
      const d = fixture([
        {
          pharmacyProductId: 'P1',
          externalProductCode: 'E-1',
          externalUnitCode: 'BOX',
        },
      ]);
      d.adapter.listProducts.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve([{ code: 'E-1', name: 'Synthetic', unitCode: 'BOX' }]),
              4000,
            ),
          ),
      );
      d.adapter.stockForSite.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve([{ code: 'E-1', quantity: 7 }]), 4000),
          ),
      );
      let observed: unknown;
      const finished = d.resolver.resolve('site', ['P1']).then((result) => {
        observed = result;
      });
      await jest.advanceTimersByTimeAsync(3000);
      const atDeadline = observed;
      await jest.advanceTimersByTimeAsync(1000);
      await finished;
      expect(atDeadline).toEqual({ mode: 'MANUAL' });
    } finally {
      jest.useRealTimers();
    }
  });
});
