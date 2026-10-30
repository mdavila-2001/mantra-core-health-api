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
  } = {},
) {
  const tx = {};
  const em = {
    transactional: jest.fn(async (work: (tx: any) => unknown) => work(tx)),
  };
  const reads = {
    findConnection: jest.fn(async () =>
      options.connection === undefined ? connection() : options.connection,
    ),
    findActiveSites: jest.fn(
      async (_tx: unknown, _p: string, siteId?: string) =>
        siteId ? SITES.filter((s) => s.id === siteId) : SITES,
    ),
    findMappings: jest.fn(async () => [
      { externalProductCode: 'ERP-0001', pharmacyProductId: 'product-a' },
      { externalProductCode: 'ERP-0002', pharmacyProductId: 'product-b' },
    ]),
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
      return CATALOG;
    }),
    stockForSite: jest.fn(async (code: string) =>
      CATALOG.map((p, i) => ({
        code: p.code,
        quantity: code === 'CENTRAL' ? i + 1 : 10 + i,
      })),
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
  return { useCase, reads, createBatch, reconcile, writer, external };
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
      unmapped: [{ externalCode: 'ERP-0003', name: 'Amoxicilina' }],
      applied: 4,
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
      {},
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
    expect(d.external.stockForSite).toHaveBeenCalledWith('NORTE');
    expect(response.received).toBe(3);
    expect(d.writer.write).toHaveBeenCalledWith(
      {},
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
});
