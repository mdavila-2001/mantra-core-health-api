import { jest } from '@jest/globals';
import { EntitySchema, TransactionContext } from '@mikro-orm/core';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { ResourceNotFoundException, runWithTenant } from '../../../common';
import { PharmacyReadService } from './pharmacy-read.service';

/** Reproduces the loss of the request transaction used by SET LOCAL RLS. */
describe('pharmacy detail retains the request transaction', () => {
  it('passes the actual tenant transaction to the reader without granting system context', async () => {
    const orm = new MikroORM({
      entities: [
        new EntitySchema({
          name: 'OfflinePharmacyReadContext',
          properties: { id: { type: 'number', primary: true } },
        }),
      ],
      dbName: 'offline',
      allowGlobalContext: true,
      metadataCache: { enabled: false },
      logger: () => undefined,
    });
    const request = orm.em.fork();
    const transaction = { syntheticTransaction: 'tenant-a' };
    request.setTransactionContext(transaction as never);
    const findVisibleById = jest.fn(
      async (em: EntityManager, tenant: string, id: string) => {
        expect(tenant).toBe('tenant-a');
        expect(id).toBe('pharmacy-a');
        expect(em.getTransactionContext()).toBe(transaction);
        return null;
      },
    );
    const service = new PharmacyReadService(
      orm.em,
      { findVisibleById } as never,
      {} as never,
    );
    await runWithTenant('tenant-a', () =>
      TransactionContext.create(request, async () => {
        await expect(service.getPharmacy('pharmacy-a')).rejects.toBeInstanceOf(
          ResourceNotFoundException,
        );
      }),
    );
    expect(findVisibleById).toHaveBeenCalledTimes(1);
  });
});
