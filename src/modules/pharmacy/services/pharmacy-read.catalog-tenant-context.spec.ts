import { describe, expect, it, jest } from '@jest/globals';
import { EntitySchema, TransactionContext } from '@mikro-orm/core';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { ResourceNotFoundException, runWithTenant } from '../../../common';
import { PharmacyReadService } from './pharmacy-read.service';

const TENANT = 'tenant-a';
const methods = ['listSites', 'searchProducts', 'getSitePrices'] as const;
type ReadMethod = (typeof methods)[number];

function fixture(visible = true) {
  const orm = new MikroORM({
    entities: [
      new EntitySchema({
        name: 'OfflinePharmacyCatalogContext',
        properties: { id: { type: 'number', primary: true } },
      }),
    ],
    dbName: 'offline',
    allowGlobalContext: true,
    metadataCache: { enabled: false },
    logger: () => undefined,
  });
  const request = orm.em.fork();
  const transaction = { syntheticTransaction: 'catalog-tenant-a' };
  request.setTransactionContext(transaction as never);
  const observed: Array<{ operation: string; transaction: unknown }> = [];
  const tenants: Array<string | undefined> = [];
  const observe = (operation: string, em: EntityManager) => {
    observed.push({ operation, transaction: em.getTransactionContext() });
  };
  const stub = <T>(operation: string, value: T) =>
    jest.fn(async (em: EntityManager) => {
      observe(operation, em);
      return value;
    });
  const pharmacy = {
    id: 'pharmacy-a',
    tenantId: TENANT,
    legalName: 'Synthetic QA Pharmacy',
    code: 'QA-A',
  };
  const site = {
    id: 'site-a',
    pharmacyId: pharmacy.id,
    practiceSiteId: 'practice-a',
    name: 'Synthetic QA Site',
  };
  const product = {
    id: 'product-a',
    pharmacyId: pharmacy.id,
    productCode: 'QA-P',
    stockQuantity: 1,
  };
  const readRepo = {
    findVisibleByTenant: jest.fn(
      async (em: EntityManager, tenant: string | undefined) => {
        observe('visibleByTenant', em);
        tenants.push(tenant);
        return visible ? [pharmacy] : [];
      },
    ),
    findVisibleById: jest.fn(
      async (em: EntityManager, tenant: string | undefined) => {
        observe('visibleById', em);
        tenants.push(tenant);
        return visible ? pharmacy : null;
      },
    ),
    findActiveSites: stub('sites', [site]),
    findActiveSiteById: stub('site', site),
    findActiveProductOwners: stub('owners', []),
    findPracticeSites: stub('practices', []),
    findAddresses: stub('addresses', []),
    findConcepts: stub('concepts', []),
    findCurrentOnCallShifts: stub('shifts', []),
    findActiveProducts: stub('products', [product]),
    findCurrentPublicPriceLists: stub('priceLists', []),
    findCurrentPrices: stub('prices', []),
    findSellableProductsByIds: stub('sellable', []),
    findAvailableProductIdsAtSite: stub('availableAtSite', new Set<string>()),
  };
  const service = new PharmacyReadService(
    orm.em,
    readRepo as never,
    {
      findCurrentPrices: stub('catalogPrices', new Map()),
      findCategoriesByIds: stub('categories', []),
    } as never,
  );
  const invoke = (method: ReadMethod): Promise<unknown> => {
    if (method === 'listSites') return service.listSites({ limit: 10 });
    if (method === 'searchProducts')
      return service.searchProducts({ pharmacyId: pharmacy.id }, 10);
    return service.getSitePrices(site.id);
  };
  const run = (method: ReadMethod, withTransaction = true) =>
    runWithTenant(TENANT, () =>
      withTransaction
        ? TransactionContext.create(request, () => invoke(method))
        : invoke(method),
    );
  return { run, transaction, observed, tenants };
}

/** Real ORM context propagation offline; repository results are synthetic, not a live RLS proof. */
describe('pharmacy catalog reads preserve the request transaction and tenant filter', () => {
  it.each(methods)(
    '%s retains the same transaction through all its reads',
    async (method) => {
      const f = fixture();

      await f.run(method);

      expect(f.tenants).toEqual([TENANT]);
      expect(f.observed.length).toBeGreaterThan(1);
      for (const read of f.observed)
        expect(read.transaction).toBe(f.transaction);
    },
  );

  it.each(methods)(
    '%s does not invent a transaction outside a request transaction',
    async (method) => {
      const f = fixture();

      await f.run(method, false);

      expect(f.tenants).toEqual([TENANT]);
      for (const read of f.observed) expect(read.transaction).toBeUndefined();
    },
  );

  it.each(methods)(
    '%s preserves the denial when the pharmacy is not visible in the tenant',
    async (method) => {
      const f = fixture(false);

      if (method === 'getSitePrices') {
        await expect(f.run(method)).rejects.toBeInstanceOf(
          ResourceNotFoundException,
        );
        expect(f.observed.map((read) => read.operation)).toEqual([
          'site',
          'visibleById',
        ]);
      } else {
        await expect(f.run(method)).resolves.toMatchObject({ items: [] });
        expect(f.observed.map((read) => read.operation)).toEqual([
          'visibleByTenant',
        ]);
      }
      expect(f.tenants).toEqual([TENANT]);
    },
  );
});
