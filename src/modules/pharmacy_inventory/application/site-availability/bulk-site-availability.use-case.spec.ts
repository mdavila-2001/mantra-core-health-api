import { jest } from '@jest/globals';
import { runWithTenant } from '../../../../common';
import { PHARM } from '../../../pharmacy/pharmacy.concepts';
import { PharmacyErrorReason } from '../../../pharmacy/pharmacy.error-reasons';
import { PharmacyBulkService } from '../../../pharmacy/services/pharmacy-bulk.service';
import { PharmacyInventoryErrorReason } from '../../pharmacy_inventory.error-reasons';
import { allowAllScope } from '../scope/pharmacy-inventory-scope.testing';
import { BulkSiteAvailabilityUseCase } from './bulk-site-availability.use-case';
import { SetSiteProductAvailabilityUseCase } from './set-site-product-availability.use-case';

const ACTOR = { id: 'user-1', tenantIds: ['tenant-1'] } as any;
const REF = { pharmacyId: 'pharmacy-1', siteId: 'site-1' };

/** El catálogo de la farmacia por código; `TRACKED` ya lo lleva la sede. */
const PRODUCTS: Record<string, Record<string, unknown>> = {
  NEW: { id: 'p-new', stockQuantity: 7 },
  TRACKED: { id: 'p-tracked', stockQuantity: 3 },
  SAME: { id: 'p-same', stockQuantity: 3 },
  LOTS: { id: 'p-lots', stockQuantity: 3 },
  DRAFT: { id: 'p-draft', statusConceptId: PHARM.PRODUCT_DRAFT },
};

function build() {
  const tx = {
    execute: jest.fn(async () => []),
    flush: jest.fn(async () => undefined),
  };
  const em = {
    fork: jest.fn(() => ({})),
    transactional: jest.fn(async (work: (tx: any) => unknown) => work(tx)),
  };
  const scope = allowAllScope();
  const scopeRepo = {
    findProductByCodeInPharmacy: jest.fn(async (_tx: unknown, code: string) =>
      PRODUCTS[code]
        ? {
            pharmacyId: 'pharmacy-1',
            statusConceptId: PHARM.PRODUCT_ACTIVE,
            outOfStockDeclared: false,
            ...PRODUCTS[code],
          }
        : null,
    ),
  };
  const positions = {
    countLoosePositionsInSite: jest.fn(
      async (_tx: unknown, _site: string, productId: string) =>
        ['p-tracked', 'p-same'].includes(productId) ? 1 : 0,
    ),
    countLotPositionsInSite: jest.fn(
      async (_tx: unknown, _site: string, productId: string) =>
        productId === 'p-lots' ? 2 : 0,
    ),
  };
  const writer = {
    write: jest.fn(async (_tx: unknown, _site: unknown, targets: any[]) =>
      targets.map((target) => ({
        productId: target.productId,
        changed: target.productId !== 'p-same',
        position: {
          availableQuantity: String(target.availableQuantity),
          updatedAt: new Date('2026-10-31T12:00:00Z'),
        },
      })),
    ),
  };
  const setAvailability = new SetSiteProductAvailabilityUseCase(
    em as any,
    scope,
    scopeRepo as any,
    positions as any,
    writer as any,
    { info: jest.fn() } as any,
  );
  const pharmaciesRepo = {
    findByIdInTenant: jest.fn(async () => ({
      id: 'pharmacy-1',
      tenantId: 'tenant-1',
      statusConceptId: PHARM.PHARMACY_ACTIVE,
    })),
  };
  const bulk = new PharmacyBulkService(
    em as any,
    pharmaciesRepo as any,
    {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    } as any,
  );
  const useCase = new BulkSiteAvailabilityUseCase(
    em as any,
    scope,
    scopeRepo as any,
    positions as any,
    bulk,
    setAvailability,
  );
  return { useCase, scope, writer, em };
}

function run(
  d: ReturnType<typeof build>,
  rows: Record<string, unknown>[],
  options: { mode?: 'CREATE' | 'UPDATE' | 'UPSERT'; dryRun?: unknown } = {},
) {
  return runWithTenant('tenant-1', () =>
    d.useCase.execute(
      REF,
      {
        mode: options.mode ?? 'UPSERT',
        rows,
        dryRun: options.dryRun as boolean | undefined,
      },
      ACTOR,
    ),
  );
}

const ROWS = [
  { productCode: 'NEW', available: true, quantity: 4 },
  { productCode: 'TRACKED', available: false },
  { productCode: 'SAME', available: true, quantity: 3 },
  { productCode: 'NOPE', available: true },
  { productCode: 'LOTS', available: true },
  { productCode: 'DRAFT', available: true },
  { productCode: 'TWICE', available: true },
  { productCode: 'TWICE', available: false },
  { productCode: 'NEW', available: 'true' },
];

describe('BulkSiteAvailabilityUseCase', () => {
  it('one row per product of the site, with the rules of the PUT of a site', async () => {
    const response = await run(build(), ROWS.slice(0, 6));
    expect(response.results.map((r) => r.outcome)).toEqual([
      'CREATED',
      'UPDATED',
      'UNCHANGED',
      'REJECTED',
      'REJECTED',
      'REJECTED',
    ]);
    expect(response.results[0].id).toBe('p-new');
    expect(response.results.slice(3).map((r) => r.errors?.[0].reason)).toEqual([
      PharmacyErrorReason.PRODUCT_NOT_FOUND,
      PharmacyInventoryErrorReason.SITE_PRODUCT_KEPT_BY_LOTS,
      PharmacyInventoryErrorReason.PRODUCT_NOT_PUBLISHED,
    ]);
  });

  it('writes the site position by the stock writer, not the catalog count', async () => {
    const d = build();
    await run(d, [ROWS[0]]);
    expect(d.writer.write).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ siteId: 'site-1', pharmacyId: 'pharmacy-1' }),
      [{ productId: 'p-new', availableQuantity: 4 }],
      expect.objectContaining({ actorUserId: 'user-1' }),
    );
  });

  it('the preview answers the same as the real load, and every row is rolled back', async () => {
    const real = await run(build(), ROWS);
    const d = build();
    const preview = await run(d, ROWS, { dryRun: true });
    const strip = (r: typeof real) =>
      r.results.map(({ outcome, errors }) => ({ outcome, errors }));
    expect(preview.dryRun).toBe(true);
    expect(strip(preview)).toEqual(strip(real));
    for (const call of d.em.transactional.mock.results) {
      await expect(call.value).rejects.toThrow();
    }
  });

  it('a repeated product code rejects every row with it; a text "true" is not a boolean', async () => {
    const response = await run(build(), ROWS);
    expect(response.results.slice(6).map((r) => r.outcome)).toEqual([
      'REJECTED',
      'REJECTED',
      'REJECTED',
    ]);
    expect(response.results[6].errors?.[0].reason).toBe(
      PharmacyErrorReason.DUPLICATE_IN_FILE,
    );
    // «NEW» viene dos veces (filas 1 y 9): ninguna se carga.
    expect(response.results[0].outcome).toBe('REJECTED');
    expect(response.results[8].errors?.map((e) => e.reason)).toEqual([
      PharmacyErrorReason.DUPLICATE_IN_FILE,
    ]);
  });

  it('the mode reads the site: CREATE is a product the site does not keep yet, UPDATE one it keeps', async () => {
    const rows = [ROWS[0], ROWS[1]];
    const create = await run(build(), rows, { mode: 'CREATE' });
    expect(create.results.map((r) => r.outcome)).toEqual([
      'CREATED',
      'REJECTED',
    ]);
    const update = await run(build(), rows, { mode: 'UPDATE' });
    expect(update.results.map((r) => r.outcome)).toEqual([
      'REJECTED',
      'UPDATED',
    ]);
  });

  it('a site out of the scope of the actor is the usual 404, before any row', async () => {
    const d = build();
    d.scope.requireSite.mockRejectedValue(d.scope.notAvailable());
    await expect(run(d, [ROWS[0]])).rejects.toMatchObject({ status: 404 });
    expect(d.em.transactional).not.toHaveBeenCalled();
  });

  it('a dryRun that is not a boolean is a 400 and nothing runs', async () => {
    const d = build();
    await expect(run(d, [ROWS[0]], { dryRun: 0 })).rejects.toMatchObject({
      status: 400,
    });
    expect(d.writer.write).not.toHaveBeenCalled();
  });
});
