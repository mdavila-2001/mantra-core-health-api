import { describe, expect, it, jest } from '@jest/globals';
import { EntitySchema, TransactionContext } from '@mikro-orm/core';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { runWithTenant } from '../../../common';
import { PharmacyReadService } from './pharmacy-read.service';

function fixture(withPharmacy = false) {
  const orm = new MikroORM({
    entities: [
      new EntitySchema({
        name: 'OfflinePharmacyListContext',
        properties: { id: { type: 'number', primary: true } },
      }),
    ],
    dbName: 'offline',
    allowGlobalContext: true,
    metadataCache: { enabled: false },
    logger: () => undefined,
  });
  const request = orm.em.fork();
  const transaction = { syntheticTransaction: 'tenant-a-list' };
  request.setTransactionContext(transaction as never);
  const observed: Array<{ operation: string; transaction: unknown }> = [];
  const observe = (operation: string, em: EntityManager) => {
    observed.push({ operation, transaction: em.getTransactionContext() });
  };
  const findVisibleByTenant = jest.fn(
    async (em: EntityManager, tenant: string | undefined) => {
      observe('pharmacies', em);
      expect(tenant).toBe('tenant-a');
      return withPharmacy
        ? [
            {
              id: 'pharmacy-a',
              tenantId: 'tenant-a',
              code: 'QA-A',
              legalName: 'Synthetic QA Pharmacy',
            },
          ]
        : [];
    },
  );
  const relations = (operation: string) => async (em: EntityManager) => {
    observe(operation, em);
    return [];
  };
  const service = new PharmacyReadService(
    orm.em,
    {
      findVisibleByTenant,
      findActiveSites: relations('sites'),
      findActiveProductOwners: relations('products'),
      findConcepts: relations('concepts'),
    } as never,
    {} as never,
  );
  return { service, request, transaction, observed, findVisibleByTenant };
}

/** Uses real MikroORM context propagation offline; does not claim a SQL/RLS execution. */
describe('pharmacy directory retains the request transaction', () => {
  it('passes the actual request transaction to the directory reader with the same tenant filter', async () => {
    const f = fixture();

    const result = await runWithTenant('tenant-a', () =>
      TransactionContext.create(f.request, () => f.service.listPharmacies()),
    );

    expect(result).toEqual({ items: [], count: 0 });
    expect(f.findVisibleByTenant).toHaveBeenCalledTimes(1);
    expect(f.observed.map((read) => read.operation)).toEqual(['pharmacies']);
    expect(f.observed[0].transaction).toBe(f.transaction);
  });

  it('keeps the same request transaction for directory counts and related reads', async () => {
    const f = fixture(true);

    const result = await runWithTenant('tenant-a', () =>
      TransactionContext.create(f.request, () => f.service.listPharmacies()),
    );

    expect(result.items.map((item) => item.id)).toEqual(['pharmacy-a']);
    expect(f.observed.map((read) => read.operation)).toEqual([
      'pharmacies',
      'sites',
      'products',
      'concepts',
    ]);
    for (const read of f.observed) expect(read.transaction).toBe(f.transaction);
  });

  it('does not invent a transaction when the tenant has no request transaction', async () => {
    const f = fixture();

    await runWithTenant('tenant-a', () => f.service.listPharmacies());

    expect(f.observed).toEqual([
      { operation: 'pharmacies', transaction: undefined },
    ]);
  });
});
