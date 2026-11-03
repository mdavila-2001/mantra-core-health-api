import { EntitySchema, TransactionContext } from '@mikro-orm/core';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import {
  runWithTenant,
  getCurrentTenantId,
} from '../../../../common/tenant/tenant-context';
import { jest } from '@jest/globals';
import { ExternalOrderStock } from './external-order-stock';
import { PHARM } from '../../../pharmacy/pharmacy.concepts';
import { ExternalCatalogUnavailableError } from '../../domain/sync/external-catalog';

function fixture() {
  const tx = {
    getTransactionContext: () => undefined,
    execute: jest.fn(async () => []),
  };
  const em = {
    getTransactionContext: () => undefined,
    isInTransaction: () => false,
    fork: jest.fn(() => em),
    transactional: jest.fn(async (fn: any) => fn(tx)),
  };
  const link = {
    id: 'link',
    connectionId: 'provider',
    statusConceptId: PHARM.CONNECTION_ACTIVE,
    supportsStockQuery: true,
    pharmacySiteId: null,
  };
  const reads = {
    findConnections: jest.fn(async () => [link]),
    findActiveSites: jest.fn(async () => [{ id: 'site', code: 'BRANCH' }]),
    findMappings: jest.fn(async () => [
      {
        pharmacyProductId: 'product',
        externalProductCode: 'SKU',
        externalUnitCode: null,
      },
    ]),
  };
  const client = {
    listProducts: jest.fn(async () => [] as any[]),
    stockForSite: jest.fn(async () => [{ code: 'SKU', quantity: 4 }]),
  };
  const check = {
    connectionId: 'provider',
    credentialId: 'credential',
    configJson: { kind: 'PHARMACY_EXTERNAL_SYSTEM' },
  };
  const systems = {
    resolve: jest.fn(
      async () =>
        ({ status: 'READY', source: 'PHARMACY', client, check }) as any,
    ),
    recordCheck: jest.fn(async () => undefined),
  };
  const logger = { warn: jest.fn() };
  const service = new ExternalOrderStock(
    em as any,
    reads as any,
    systems as any,
    logger as any,
  );
  const resolve = () =>
    service.resolve(
      { id: 'site', pharmacyId: 'pharmacy' } as any,
      { id: 'pharmacy', tenantId: 'tenant' } as any,
      ['product'],
      'actor',
    );
  return { em, tx, link, reads, client, check, systems, resolve };
}
describe('own external-system order stock', () => {
  it('no connection means MANUAL; never asks the SERVER fallback', async () => {
    const d = fixture();
    d.reads.findConnections.mockResolvedValue([]);
    expect(await d.resolve()).toEqual({ mode: 'MANUAL' });
    expect(d.systems.resolve).not.toHaveBeenCalled();
  });
  it('null link is MANUAL', async () => {
    const d = fixture();
    d.link.connectionId = null as any;
    expect(await d.resolve()).toEqual({ mode: 'MANUAL' });
    expect(d.systems.resolve).not.toHaveBeenCalled();
  });
  it('overlap stays CONTRACT_PENDING, without choosing newest or branch precedence', async () => {
    const d = fixture();
    d.reads.findConnections.mockResolvedValue([
      d.link,
      { ...d.link, id: 'branch-link', pharmacySiteId: 'site' } as any,
    ]);
    expect(await d.resolve()).toEqual({
      mode: 'CONTRACT_PENDING',
      reason: 'CONNECTION_PRECEDENCE',
    });
    expect(d.systems.resolve).not.toHaveBeenCalled();
  });
  it('ignores connections for another branch', async () => {
    const d = fixture();
    d.reads.findConnections.mockResolvedValue([
      { ...d.link, pharmacySiteId: 'elsewhere' } as any,
    ]);
    expect(await d.resolve()).toEqual({ mode: 'MANUAL' });
  });
  it('uses canonical site code and preserves tenant transaction context', async () => {
    const d = fixture();
    expect(await d.resolve()).toEqual({
      mode: 'CONNECTED',
      liveQuantities: new Map([['product', 4]]),
    });
    expect(d.client.stockForSite).toHaveBeenCalledWith('BRANCH', undefined, {
      signal: expect.any(AbortSignal),
    });
    expect(d.em.fork).toHaveBeenCalledWith({ keepTransactionContext: true });
    expect(d.systems.recordCheck).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: 'tenant',
        check: d.check,
        result: 'OK',
      }),
    );
  });
  it.each(['AUTH_REJECTED', 'UNREACHABLE'] as const)(
    'failure %s records ERROR and uses MANUAL',
    async (reason) => {
      const d = fixture();
      d.client.stockForSite.mockRejectedValue(
        new ExternalCatalogUnavailableError('internal', reason),
      );
      expect(await d.resolve()).toEqual({ mode: 'MANUAL' });
      expect(d.systems.recordCheck).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ result: reason }),
      );
    },
  );
  it('preparation failure records UNREACHABLE (M2)', async () => {
    const d = fixture();
    d.systems.resolve.mockResolvedValue({
      status: 'UNAVAILABLE',
      errorReason: 'UNREACHABLE',
      check: d.check,
    });
    expect(await d.resolve()).toEqual({ mode: 'MANUAL' });
    expect(d.systems.recordCheck).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ result: 'UNREACHABLE' }),
    );
  });
  it('does not translate an ERP code ambiguous with a product outside the order (P1)', async () => {
    const d = fixture();
    d.reads.findMappings.mockResolvedValue([
      {
        pharmacyProductId: 'product',
        externalProductCode: 'SKU',
        externalUnitCode: null,
      },
      {
        pharmacyProductId: 'other',
        externalProductCode: 'SKU',
        externalUnitCode: null,
      },
    ]);
    expect(await d.resolve()).toEqual({
      mode: 'CONNECTED',
      liveQuantities: new Map(),
    });
    expect(d.client.stockForSite).not.toHaveBeenCalled();
  });
  it('unit mismatch does not assign quantities (P1)', async () => {
    const d = fixture();
    d.reads.findMappings.mockResolvedValue([
      {
        pharmacyProductId: 'product',
        externalProductCode: 'SKU',
        externalUnitCode: 'BOX',
      } as any,
    ]);
    d.client.listProducts.mockResolvedValue([
      { code: 'SKU', name: 'synthetic', unitCode: 'UNIT' },
    ]);
    expect(await d.resolve()).toEqual({
      mode: 'CONNECTED',
      liveQuantities: new Map(),
    });
  });
  it('duplicate ERP stock code is not resolved by last-wins', async () => {
    const d = fixture();
    d.client.stockForSite.mockResolvedValue([
      { code: 'SKU', quantity: 4 },
      { code: 'SKU', quantity: 40 },
    ]);
    expect(await d.resolve()).toEqual({
      mode: 'CONNECTED',
      liveQuantities: new Map(),
    });
  });
  it('missing stock row keeps the ledger contract rather than inventing zero', async () => {
    const d = fixture();
    d.client.stockForSite.mockResolvedValue([]);
    expect(await d.resolve()).toEqual({
      mode: 'CONNECTED',
      liveQuantities: new Map(),
    });
  });
  it('unrelated errors are not swallowed as a connection fault', async () => {
    const d = fixture();
    d.reads.findMappings.mockRejectedValue(new Error('database failure'));
    await expect(d.resolve()).rejects.toThrow('database failure');
  });
});

it('catalog and paginated stock share a cancellable three-second budget', async () => {
  jest.useFakeTimers();
  try {
    const d = fixture();
    let signal: AbortSignal | undefined;
    d.reads.findMappings.mockResolvedValue([
      {
        pharmacyProductId: 'product',
        externalProductCode: 'SKU',
        externalUnitCode: 'BOX',
      } as any,
    ]);
    d.client.stockForSite.mockImplementation((...args: any[]) => {
      signal = args[2].signal;
      return new Promise(() => {});
    });
    d.client.listProducts.mockImplementation(() => new Promise(() => {}));
    const pending = d.resolve();
    await jest.advanceTimersByTimeAsync(3001);
    expect(await pending).toEqual({ mode: 'MANUAL' });
    expect(signal?.aborted).toBe(true);
    expect(d.systems.recordCheck).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ result: 'UNREACHABLE' }),
    );
  } finally {
    jest.useRealTimers();
  }
});

it('uses the real ORM request transaction context without opening SQL or losing tenant identity', async () => {
  const orm = new MikroORM({
    entities: [
      new EntitySchema({
        name: 'OfflineOrderStockContext',
        properties: { id: { type: 'number', primary: true } },
      }),
    ],
    dbName: 'offline',
    allowGlobalContext: true,
    metadataCache: { enabled: false },
    logger: () => undefined,
  });
  const request = orm.em.fork();
  const marker = { syntheticTransaction: 'order-tenant' };
  request.setTransactionContext(marker as never);
  const observe = (em: EntityManager) => {
    expect(em.getTransactionContext()).toBe(marker);
    expect(getCurrentTenantId()).toBe('tenant');
  };
  const reads = {
    findConnections: jest.fn(async (em: EntityManager) => {
      observe(em);
      return [];
    }),
    findActiveSites: jest.fn(async (em: EntityManager) => {
      observe(em);
      return [];
    }),
  };
  const service = new ExternalOrderStock(
    orm.em,
    reads as never,
    {} as never,
    {} as never,
  );
  await runWithTenant('tenant', () =>
    TransactionContext.create(request, () =>
      service.resolve(
        { id: 'site' } as never,
        { id: 'pharmacy', tenantId: 'tenant' } as never,
        [],
        'actor',
      ),
    ),
  );
});
