import { jest } from '@jest/globals';
import { EntitySchema, TransactionContext } from '@mikro-orm/core';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import {
  getCurrentTenantId,
  runWithTenant,
} from '../../../../common/tenant/tenant-context';
import { IntegrationReadService } from './integration-read.service';

describe('canonical external-system readers retain request transaction', () => {
  it.each([
    'connections',
    'mappings',
    'externalProducts',
    'syncBatches',
  ] as const)(
    '%s keeps the real ORM transaction context without SQL',
    async (method) => {
      const orm = new MikroORM({
        entities: [
          new EntitySchema({
            name: 'OfflineReaderContext',
            properties: { id: { type: 'number', primary: true } },
          }),
        ],
        dbName: 'offline',
        allowGlobalContext: true,
        metadataCache: { enabled: false },
        logger: () => undefined,
      });
      const request = orm.em.fork();
      const marker = { syntheticTransaction: 'tenant' };
      request.setTransactionContext(marker as never);
      const observe = (em: EntityManager) => {
        expect(getCurrentTenantId()).toBe('tenant');
        expect(em.getTransactionContext()).toBe(marker);
      };
      const scope = {
        requireManagedPharmacy: jest.fn(async (em: EntityManager) => {
          observe(em);
          return { pharmacyId: 'pharmacy', tenantId: 'tenant' };
        }),
        notAvailable: () => new Error('not available'),
      };
      const connection = {
        id: 'link',
        pharmacyId: 'pharmacy',
        connectionId: 'connection',
        createdAt: new Date('2026-11-01T00:00:00Z'),
      };
      const reads = {
        findConnections: jest.fn(async (em: EntityManager) => {
          observe(em);
          return [connection];
        }),
        findSites: jest.fn(async () => []),
        findConnection: jest.fn(async (em: EntityManager) => {
          observe(em);
          return connection;
        }),
        findMappings: jest.fn(async () => []),
        findProducts: jest.fn(async () => []),
        findBatches: jest.fn(async () => []),
        countDiscrepancies: jest.fn(async () => new Map()),
      };
      const catalog = { listProducts: jest.fn(async () => []) };
      const systems = {
        serverConfigured: () => false,
        describe: jest.fn(async (em: EntityManager) => {
          observe(em);
          return new Map();
        }),
        resolve: jest.fn(async (em: EntityManager) => {
          observe(em);
          return { status: 'READY', source: 'PHARMACY', client: catalog };
        }),
      };
      const service = new IntegrationReadService(
        orm.em,
        scope as never,
        reads as never,
        catalog as never,
        systems as never,
      );
      await runWithTenant('tenant', () =>
        TransactionContext.create(request, () =>
          method === 'connections'
            ? service.connections('pharmacy', {} as never)
            : method === 'syncBatches'
              ? service.syncBatches(
                  { pharmacyId: 'pharmacy', connectionId: 'link' },
                  undefined,
                  {} as never,
                )
              : service[method](
                  { pharmacyId: 'pharmacy', connectionId: 'link' },
                  {} as never,
                ),
        ),
      );
    },
  );
});
