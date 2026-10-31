import { jest } from '@jest/globals';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../common';
import { PHARM } from '../../../pharmacy/pharmacy.concepts';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { ExternalCatalogUnavailableError } from '../../domain/sync/external-catalog';
import { PharmacyInventoryErrorReason } from '../../pharmacy_inventory.error-reasons';
import { allowAllScope } from '../scope/pharmacy-inventory-scope.testing';
import { SyncExternalPharmacyCatalogUseCase } from './sync-external-pharmacy-catalog.use-case';

const REF = { pharmacyId: 'pharmacy-1', connectionId: 'conn-1' };
const ACTOR = { id: 'user-1' } as any;
const SITES = [
  { id: 'site-1', code: 'CENTRAL', name: 'Casa central' },
  { id: 'site-2', code: 'NORTE', name: 'Sucursal Norte' },
];
const CATALOG = [
  { code: 'ERP-0001', name: 'Paracetamol' },
  { code: 'ERP-0002', name: 'Ibuprofeno' },
  { code: 'ERP-0003', name: 'Amoxicilina' },
];

function connection(overrides: Record<string, unknown> = {}) {
  return {
    id: 'conn-1',
    pharmacyId: 'pharmacy-1',
    statusConceptId: PHARM.CONNECTION_ACTIVE,
    supportsStockQuery: true,
    pharmacySiteId: undefined,
    ...overrides,
  };
}

function build(
  options: {
    connection?: Record<string, unknown> | null;
    configured?: boolean;
    fail?: boolean;
    product?: Record<string, unknown> | null;
    lots?: number;
    changed?: boolean;
    mappings?: Record<string, unknown>[];
    catalog?: Record<string, unknown>[];
    /** Productos con «No lo tengo» manual en la sede. */
    marked?: string[];
    /** Códigos que el sistema externo manda por sede (todos, si falta). */
    sentCodes?: string[];
  } = {},
) {
  // Una transacción distinta por llamada, para ver qué corre en cuál.
  const transactions: { n: number }[] = [];
  const em = {
    transactional: jest.fn(async (work: (tx: any) => unknown) => {
      const tx = { n: transactions.length + 1 };
      transactions.push(tx);
      return work(tx);
    }),
  };
  const catalog = options.catalog ?? CATALOG;
  const reads = {
    findConnection: jest.fn(async () =>
      options.connection === undefined ? connection() : options.connection,
    ),
    findActiveSites: jest.fn(
      async (_tx: unknown, _p: string, siteId?: string) =>
        siteId ? SITES.filter((s) => s.id === siteId) : SITES,
    ),
    findMappings: jest.fn(
      async () =>
        options.mappings ?? [
          { externalProductCode: 'ERP-0001', pharmacyProductId: 'product-a' },
          { externalProductCode: 'ERP-0002', pharmacyProductId: 'product-b' },
        ],
    ),
    findPharmacyCode: jest.fn(async () => 'FARM-1'),
    findMarkedNotAvailable: jest.fn(
      async (_tx: unknown, _site: string, ids: readonly string[]) =>
        new Set(ids.filter((id) => (options.marked ?? []).includes(id))),
    ),
    findMatchedItems: jest.fn(async () =>
      createdItems
        .filter((item) => item.pharmacyProductId)
        .map((item) => ({
          ...item,
          normalizedQuantity: String(item.externalQuantity),
        })),
    ),
  };
  let createdItems: any[] = [];
  const createBatch = {
    execute: jest.fn(async (dto: any) => {
      createdItems = dto.items;
      return { id: 'batch-1', itemIds: [] };
    }),
  };
  const reconcile = { execute: jest.fn(async () => ({})) };
  const writer = {
    lockSite: jest.fn(async () => undefined),
    write: jest.fn(async (_tx: unknown, _site: unknown, targets: any[]) =>
      targets.map((t) => ({
        productId: t.productId,
        changed: options.changed ?? true,
        position: {},
      })),
    ),
  };
  const scopeRepo = {
    findProductInPharmacy: jest.fn(async () =>
      options.product === undefined
        ? { id: 'product-a', statusConceptId: PHARM.PRODUCT_ACTIVE }
        : options.product,
    ),
  };
  const positions = {
    countLotPositionsInSite: jest.fn(async () => options.lots ?? 0),
  };
  const external = {
    isConfigured: jest.fn(() => options.configured ?? true),
    listProducts: jest.fn(async () => {
      if (options.fail) throw new ExternalCatalogUnavailableError('down');
      return catalog as any[];
    }),
    stockForSite: jest.fn(async (code: string, _pharmacyCode?: string) =>
      CATALOG.map((p, i) => ({
        code: p.code,
        quantity: code === 'CENTRAL' ? i + 1 : 10 + i,
      })).filter(
        (line) => !options.sentCodes || options.sentCodes.includes(line.code),
      ),
    ),
  };
  const logger = { info: jest.fn(), warn: jest.fn() };
  const useCase = new SyncExternalPharmacyCatalogUseCase(
    em as any,
    allowAllScope(),
    scopeRepo as any,
    reads as any,
    positions as any,
    createBatch as any,
    reconcile as any,
    writer as any,
    external,
    logger as any,
  );
  return {
    useCase,
    reads,
    createBatch,
    reconcile,
    writer,
    external,
    em,
    transactions,
  };
}

async function reasonOf(
  promise: Promise<unknown>,
): Promise<string | undefined> {
  try {
    await promise;
  } catch (error) {
    return (error as PreconditionFailedException).reason;
  }
  return undefined;
}

describe('SyncExternalPharmacyCatalogUseCase', () => {
  it('a connection of another pharmacy (or none) → 404', async () => {
    const d = build({ connection: null });
    await expect(d.useCase.execute(REF, ACTOR)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(d.external.listProducts).not.toHaveBeenCalled();
  });

  it.each([[{ statusConceptId: 'other' }], [{ supportsStockQuery: false }]])(
    'an inactive connection or one without stock query → 422',
    async (overrides) => {
      const d = build({ connection: connection(overrides) });
      expect(await reasonOf(d.useCase.execute(REF, ACTOR))).toBe(
        PharmacyInventoryErrorReason.PHARMACY_INTEGRATION_CONNECTION_INACTIVE,
      );
    },
  );

  it('not configured → 422 without batch', async () => {
    const d = build({ configured: false });
    expect(await reasonOf(d.useCase.execute(REF, ACTOR))).toBe(
      PharmacyInventoryErrorReason.PHARMACY_INTEGRATION_NOT_CONFIGURED,
    );
    expect(d.createBatch.execute).not.toHaveBeenCalled();
  });

  it('provider down → 502 without batch', async () => {
    const d = build({ fail: true });
    const error = await d.useCase.execute(REF, ACTOR).catch((e) => e);
    expect(error.getStatus()).toBe(502);
    expect(error.reason).toBe(
      PharmacyInventoryErrorReason.PHARMACY_INTEGRATION_UNAVAILABLE,
    );
    expect(d.createBatch.execute).not.toHaveBeenCalled();
  });

  it('happy path: one batch, reconciled, applied with MV_SYNC_ADJUSTMENT and the batch as source', async () => {
    const d = build();
    const response = await d.useCase.execute(REF, ACTOR);
    expect(response).toEqual({
      batchId: 'batch-1',
      received: 6,
      mapped: 4,
      unmappedLines: 2,
      unmapped: [
        {
          externalCode: 'ERP-0003',
          name: 'Amoxicilina',
          reason: 'NO_MAPPING',
          productIds: [],
        },
      ],
      applied: 4,
      sites: [
        {
          siteId: 'site-1',
          siteCode: 'CENTRAL',
          siteName: 'Casa central',
          received: 3,
          mapped: 2,
          unmapped: 1,
          applied: 2,
          unchanged: 0,
          skipped: 0,
        },
        {
          siteId: 'site-2',
          siteCode: 'NORTE',
          siteName: 'Sucursal Norte',
          received: 3,
          mapped: 2,
          unmapped: 1,
          applied: 2,
          unchanged: 0,
          skipped: 0,
        },
      ],
      skipped: [],
      notSent: [],
    });
    expect(d.createBatch.execute).toHaveBeenCalledTimes(1);
    const items = (d.createBatch.execute.mock.calls[0] as any[])[0].items;
    expect(items.every((item: any) => item.idempotencyKey === undefined)).toBe(
      true,
    );
    expect(d.reconcile.execute).toHaveBeenCalledWith('batch-1', ACTOR);
    expect(d.writer.write).toHaveBeenCalledTimes(2);
    expect(d.writer.write).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({ siteId: 'site-1', pharmacyId: 'pharmacy-1' }),
      [
        { productId: 'product-a', availableQuantity: 1 },
        { productId: 'product-b', availableQuantity: 2 },
      ],
      {
        movementTypeConceptId: PINV.MV_SYNC_ADJUSTMENT,
        sourceId: 'batch-1',
        actorUserId: 'user-1',
      },
    );
  });

  it('a second run with the same data applies nothing', async () => {
    const d = build({ changed: false });
    const response = await d.useCase.execute(REF, ACTOR);
    expect(response.applied).toBe(0);
    expect(d.createBatch.execute).toHaveBeenCalledTimes(1);
  });

  it('a connection tied to a site syncs only that site', async () => {
    const d = build({ connection: connection({ pharmacySiteId: 'site-2' }) });
    const response = await d.useCase.execute(REF, ACTOR);
    expect(d.external.stockForSite).toHaveBeenCalledTimes(1);
    expect(d.external.stockForSite).toHaveBeenCalledWith('NORTE', 'FARM-1');
    expect(response.received).toBe(3);
    expect(d.writer.write).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ siteId: 'site-2' }),
      expect.any(Array),
      expect.any(Object),
    );
  });

  it('does not apply a retired product nor one kept by lots', async () => {
    const retired = build({
      product: { id: 'product-a', statusConceptId: PHARM.PRODUCT_RETIRED },
    });
    expect((await retired.useCase.execute(REF, ACTOR)).applied).toBe(0);
    expect(retired.writer.write).not.toHaveBeenCalled();
    const lots = build({ lots: 1 });
    expect((await lots.useCase.execute(REF, ACTOR)).applied).toBe(0);
  });

  describe('several sites (B-3, B-6)', () => {
    it('applies each site in its own transaction, site lock first', async () => {
      const d = build();
      await d.useCase.execute(REF, ACTOR);
      const [first, second] = d.writer.write.mock.calls.map(
        (call) => call[0] as { n: number },
      );
      expect(first).not.toBe(second);
      expect(d.writer.lockSite).toHaveBeenNthCalledWith(1, first, 'site-1');
      expect(d.writer.lockSite).toHaveBeenNthCalledWith(2, second, 'site-2');
      // The ledger lock of site 1 is released (commit) before site 2 is asked for.
      expect(d.writer.lockSite.mock.invocationCallOrder[1]).toBeGreaterThan(
        d.writer.write.mock.invocationCallOrder[0],
      );
      // The «No lo tengo» state is read under the site lock.
      expect(
        d.reads.findMarkedNotAvailable.mock.invocationCallOrder[0],
      ).toBeGreaterThan(d.writer.lockSite.mock.invocationCallOrder[0]);
    });

    it('the totals add up with the sites', async () => {
      const d = build({ marked: ['product-b'] });
      const r = await d.useCase.execute(REF, ACTOR);
      expect(r.received).toBe(r.mapped + r.unmappedLines);
      const sum = (key: 'received' | 'mapped' | 'unmapped' | 'applied') =>
        r.sites.reduce((total, site) => total + site[key], 0);
      expect(sum('received')).toBe(r.received);
      expect(sum('mapped')).toBe(r.mapped);
      expect(sum('unmapped')).toBe(r.unmappedLines);
      expect(sum('applied')).toBe(r.applied);
      for (const site of r.sites) {
        expect(site.received).toBe(site.mapped + site.unmapped);
        expect(site.mapped).toBe(site.applied + site.unchanged + site.skipped);
      }
      expect(r.skipped).toHaveLength(2);
    });

    it('asks the stock with the pharmacy code', async () => {
      const d = build();
      await d.useCase.execute(REF, ACTOR);
      expect(d.external.stockForSite).toHaveBeenCalledWith('CENTRAL', 'FARM-1');
      expect(d.external.stockForSite).toHaveBeenCalledWith('NORTE', 'FARM-1');
    });
  });

  describe('what is not applied is reported (B-7, B-8, §3)', () => {
    it.each([
      [PHARM.PRODUCT_RETIRED, 'PRODUCT_NOT_PUBLISHED'],
      ['draft-status', 'PRODUCT_NOT_PUBLISHED'],
    ])(
      'a product with status %p is not written: %p',
      async (statusConceptId, reason) => {
        const d = build({
          product: { id: 'product-a', statusConceptId },
        });
        const r = await d.useCase.execute(REF, ACTOR);
        expect(d.writer.write).not.toHaveBeenCalled();
        expect(r.applied).toBe(0);
        expect(r.skipped.map((entry) => entry.reason)).toEqual([
          reason,
          reason,
          reason,
          reason,
        ]);
      },
    );

    it('a product that is no longer of the pharmacy is reported', async () => {
      const d = build({ product: null });
      const r = await d.useCase.execute(REF, ACTOR);
      expect(r.skipped[0]).toMatchObject({
        reason: 'PRODUCT_NOT_AVAILABLE',
        siteId: 'site-1',
        externalCode: 'ERP-0001',
        productId: 'product-a',
        quantity: 1,
      });
    });

    it('a product kept by lots is reported, not silently skipped', async () => {
      const d = build({ lots: 1 });
      const r = await d.useCase.execute(REF, ACTOR);
      expect(new Set(r.skipped.map((entry) => entry.reason))).toEqual(
        new Set(['SITE_PRODUCT_KEPT_BY_LOTS']),
      );
    });

    it('a product marked out of stock in the catalogue is not given units', async () => {
      const d = build({
        product: {
          id: 'product-a',
          statusConceptId: PHARM.PRODUCT_ACTIVE,
          outOfStockDeclared: true,
        },
      });
      const r = await d.useCase.execute(REF, ACTOR);
      expect(d.writer.write).not.toHaveBeenCalled();
      expect(r.skipped[0].reason).toBe('PRODUCT_OUT_OF_STOCK_DECLARED');
    });

    it('a manual «No lo tengo» is not overwritten, and says so', async () => {
      const d = build({ marked: ['product-a'] });
      const r = await d.useCase.execute(REF, ACTOR);
      for (const call of d.writer.write.mock.calls) {
        expect(
          (call[2] as { productId: string }[]).map((t) => t.productId),
        ).toEqual(['product-b']);
      }
      expect(r.skipped).toEqual([
        expect.objectContaining({
          siteId: 'site-1',
          productId: 'product-a',
          externalCode: 'ERP-0001',
          quantity: 1,
          reason: 'SITE_MARKED_NOT_AVAILABLE',
        }),
        expect.objectContaining({
          siteId: 'site-2',
          productId: 'product-a',
          quantity: 10,
          reason: 'SITE_MARKED_NOT_AVAILABLE',
        }),
      ]);
    });

    it('only asks the «No lo tengo» state for lines that bring units', async () => {
      const d = build();
      await d.useCase.execute(REF, ACTOR);
      expect(d.reads.findMarkedNotAvailable).toHaveBeenCalledWith(
        expect.anything(),
        'site-1',
        ['product-a', 'product-b'],
      );
    });

    it('a line counted in another unit than the mapping is not applied, and no conversion is made', async () => {
      const d = build({
        mappings: [
          {
            externalProductCode: 'ERP-0001',
            pharmacyProductId: 'product-a',
            externalUnitCode: 'BOX',
          },
          {
            externalProductCode: 'ERP-0002',
            pharmacyProductId: 'product-b',
            externalUnitCode: 'TAB',
          },
        ],
        catalog: [
          { code: 'ERP-0001', name: 'Paracetamol', unitCode: 'box' },
          { code: 'ERP-0002', name: 'Ibuprofeno', unitCode: 'BOX' },
          { code: 'ERP-0003', name: 'Amoxicilina', unitCode: 'BOX' },
        ],
      });
      const r = await d.useCase.execute(REF, ACTOR);
      expect(d.writer.write).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        expect.anything(),
        [{ productId: 'product-a', availableQuantity: 1 }],
        expect.anything(),
      );
      expect(r.skipped).toEqual([
        expect.objectContaining({
          siteId: 'site-1',
          productId: 'product-b',
          reason: 'UNIT_MISMATCH',
          mappingUnitCode: 'TAB',
          externalUnitCode: 'BOX',
          quantity: 2,
        }),
        expect.objectContaining({ siteId: 'site-2', reason: 'UNIT_MISMATCH' }),
      ]);
    });

    it('a mapping with a unit the external system does not report is not applied', async () => {
      const d = build({
        mappings: [
          {
            externalProductCode: 'ERP-0001',
            pharmacyProductId: 'product-a',
            externalUnitCode: 'BOX',
          },
        ],
      });
      const r = await d.useCase.execute(REF, ACTOR);
      expect(d.writer.write).not.toHaveBeenCalled();
      expect(r.skipped[0]).toMatchObject({
        reason: 'UNIT_NOT_REPORTED',
        mappingUnitCode: 'BOX',
        externalUnitCode: null,
      });
    });

    it('a mapped code the external system stops sending keeps its stock and is reported', async () => {
      const d = build({ sentCodes: ['ERP-0001', 'ERP-0003'] });
      const r = await d.useCase.execute(REF, ACTOR);
      expect(r.notSent).toEqual([
        {
          siteId: 'site-1',
          siteCode: 'CENTRAL',
          externalCode: 'ERP-0002',
          productId: 'product-b',
        },
        {
          siteId: 'site-2',
          siteCode: 'NORTE',
          externalCode: 'ERP-0002',
          productId: 'product-b',
        },
      ]);
      for (const call of d.writer.write.mock.calls) {
        expect(
          (call[2] as { productId: string }[]).map((t) => t.productId),
        ).toEqual(['product-a']);
      }
    });

    it('an ambiguous code is told apart from a missing one', async () => {
      const d = build({
        mappings: [
          { externalProductCode: 'ERP-0001', pharmacyProductId: 'product-a' },
          { externalProductCode: 'ERP-0001', pharmacyProductId: 'product-c' },
        ],
      });
      const r = await d.useCase.execute(REF, ACTOR);
      expect(r.unmapped).toEqual([
        {
          externalCode: 'ERP-0001',
          name: 'Paracetamol',
          reason: 'AMBIGUOUS_MAPPING',
          productIds: ['product-a', 'product-c'],
        },
        {
          externalCode: 'ERP-0002',
          name: 'Ibuprofeno',
          reason: 'NO_MAPPING',
          productIds: [],
        },
        {
          externalCode: 'ERP-0003',
          name: 'Amoxicilina',
          reason: 'NO_MAPPING',
          productIds: [],
        },
      ]);
    });
  });
});
