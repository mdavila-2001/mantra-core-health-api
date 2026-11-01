import { jest } from '@jest/globals';
import { EntitySchema, TransactionContext } from '@mikro-orm/core';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import {
  getCurrentTenantId,
  runWithTenant,
} from '../../../../common/tenant/tenant-context';
import { INTEG } from '../../../integrations/integrations.concepts';
import { ErpConnectionUseCases } from './erp-connection.use-cases';
import { OrderStockSourceResolver } from './order-stock-source.resolver';

const ACTOR = { id: 'synthetic-user', roles: ['PHARMACY_STAFF'] } as never;

function fixture(checkReads = true, tenantId = 'synthetic-tenant-a') {
  // Real installed ORM and AsyncLocalStorage, without init/connect or SQL.
  const orm = new MikroORM({
    entities: [
      new EntitySchema({
        name: 'C9OfflineContext',
        properties: { id: { type: 'number', primary: true } },
      }),
    ],
    dbName: 'c9_offline_only',
    host: '127.0.0.1',
    port: 1,
    user: 'synthetic',
    password: 'synthetic',
    allowGlobalContext: true,
    metadataCache: { enabled: false },
    logger: () => undefined,
  });
  const root = orm.em;
  const request = root.fork();
  const marker = { syntheticTransaction: tenantId };
  request.setTransactionContext(marker as never);
  const statements: string[] = [];
  const observations: {
    operation: string;
    sameTransaction: boolean;
    tenant: string | undefined;
  }[] = [];

  function wrap(manager: EntityManager): EntityManager {
    const fork = manager.fork.bind(manager);
    // Invoke the real fork with the PRODUCTION options. Never return the same manager mock.
    jest
      .spyOn(manager, 'fork')
      .mockImplementation((options) => wrap(fork(options)));
    // Only SQL/transaction I/O is replaced; context selection and copying remain real.
    jest
      .spyOn(manager, 'transactional')
      .mockImplementation(async (work) => work(manager.getContext()));
    jest.spyOn(manager, 'flush').mockResolvedValue(undefined);
    jest.spyOn(manager, 'execute').mockImplementation(async () => {
      statements.push('UNEXPECTED_SQL');
      throw new Error('Offline context test forbids SQL');
    });
    return manager;
  }
  wrap(root);
  wrap(request);

  function observe(manager: EntityManager, operation: string, required = true) {
    const sameTransaction = manager.getTransactionContext() === marker;
    observations.push({
      operation,
      sameTransaction,
      tenant: getCurrentTenantId(),
    });
    expect(getCurrentTenantId()).toBe(tenantId);
    if (required) expect(sameTransaction).toBe(true);
  }
  const config = {
    version: 1,
    baseUrl: 'http://synthetic.invalid',
    pharmacyCode: 'FARM',
    siteCodes: { site: 'SITE' },
    keyLast4: 'abcd',
    keyHintSafe: true,
    statusCode: null,
    reasonCode: null,
    checkedAt: null,
  };
  const connection = {
    id: 'connection',
    stateConceptId: INTEG.CONN_ACTIVE,
    configJson: config,
  };
  const record = {
    connection,
    config,
    link: { id: 'link' },
    systemCode: 'ALOVIDA_STANDARD',
    credential: { secretRef: 'synthetic-sealed' },
  };
  const connections = {
    findSite: jest.fn(async (manager: EntityManager) => {
      observe(manager, 'site', checkReads);
      return { id: 'site', code: 'SITE', pharmacyId: 'pharmacy' };
    }),
    findPharmacy: jest.fn(async (manager: EntityManager) => {
      observe(manager, 'pharmacy');
      return { id: 'pharmacy', tenantId, code: 'FARM' };
    }),
    findForPharmacy: jest.fn(async (manager: EntityManager) => {
      observe(manager, 'connection', checkReads);
      return record;
    }),
    findConnectionById: jest.fn(async (manager: EntityManager) => {
      observe(manager, 'record-status');
      return connection;
    }),
    findActiveSites: jest.fn(async (manager: EntityManager) => {
      observe(manager, 'sites', checkReads);
      return [{ id: 'site', code: 'SITE', name: 'Synthetic site' }];
    }),
    findProviderByCode: jest.fn(async () => ({ id: 'provider' })),
    updateConnection: jest.fn(
      (_connection: unknown, update: { config: object }) =>
        Object.assign(config, update.config),
    ),
    rotateCredential: jest.fn(() => ({ id: 'synthetic-credential' })),
    recordStatus: jest.fn(),
  };
  const reads = {
    findMappings: jest.fn(async (manager: EntityManager) => {
      observe(manager, 'mappings', checkReads);
      return [{ pharmacyProductId: 'product', externalProductCode: 'E1' }];
    }),
  };
  const adapter = {
    checkHealth: jest.fn(async () => undefined),
    stockForSite: jest.fn(async () => [{ code: 'E1', quantity: 7 }]),
  };
  const catalogs = { forAccess: jest.fn(() => adapter) };
  const cipher = {
    isConfigured: () => true,
    decrypt: () => 'synthetic-key-only',
    encrypt: () => 'synthetic-sealed-new',
  };
  const logger = { setContext: jest.fn(), warn: jest.fn(), info: jest.fn() };
  const scope = {
    requireManagedPharmacy: jest.fn(async (manager: EntityManager) =>
      observe(manager, 'scope'),
    ),
  };
  const useCases = new ErpConnectionUseCases(
    root,
    scope as never,
    connections as never,
    catalogs as never,
    cipher as never,
    logger as never,
  );
  const resolver = new OrderStockSourceResolver(
    root,
    connections as never,
    reads as never,
    catalogs as never,
    cipher as never,
    logger as never,
  );
  const run = <T>(work: () => T): T =>
    runWithTenant(tenantId, () => TransactionContext.create(request, work));
  return {
    run,
    root,
    request,
    marker,
    observations,
    statements,
    useCases,
    resolver,
    connections,
    adapter,
  };
}

describe('A03: ERP keeps the actual request transaction context', () => {
  it('reads the view in the transaction selected through real ORM AsyncLocalStorage', async () => {
    const d = fixture();
    await expect(
      d.run(() => d.useCases.view('pharmacy', ACTOR)),
    ).resolves.toMatchObject({ pharmacyId: 'pharmacy' });
    expect(d.observations.length).toBeGreaterThan(0);
    expect(d.observations.every((o) => o.sameTransaction)).toBe(true);
    expect(d.statements).toEqual([]);
  });

  it('validates a draft under the same tenant transaction without SQL escalation', async () => {
    const d = fixture();
    await expect(
      d.run(() =>
        d.useCases.testDraft(
          'pharmacy',
          {
            systemCode: 'ALOVIDA_STANDARD',
            baseUrl: 'http://synthetic.invalid',
            pharmacyCode: 'FARM',
            apiKey: 'synthetic-key',
          },
          ACTOR,
        ),
      ),
    ).resolves.toEqual({ result: 'OK' });
    expect(d.observations.every((o) => o.sameTransaction)).toBe(true);
    expect(d.statements).toEqual([]);
  });

  it('rereads a save before the outer request transaction commits', async () => {
    const d = fixture();
    await expect(
      d.run(() =>
        d.useCases.save(
          'pharmacy',
          {
            mode: 'CONNECTED',
            systemCode: 'ALOVIDA_STANDARD',
            baseUrl: 'http://synthetic.invalid/changed',
            pharmacyCode: 'FARM',
            apiKey: 'synthetic-new-key',
          },
          ACTOR,
        ),
      ),
    ).resolves.toMatchObject({ baseUrl: 'http://synthetic.invalid/changed' });
    expect(d.connections.updateConnection).toHaveBeenCalledTimes(1);
    expect(d.observations.every((o) => o.sameTransaction)).toBe(true);
    expect(d.statements).toEqual([]);
  });

  it('rereads test-saved under the same outer request transaction', async () => {
    const d = fixture();
    await expect(
      d.run(() => d.useCases.testSaved('pharmacy', ACTOR)),
    ).resolves.toMatchObject({ result: 'OK' });
    expect(d.connections.recordStatus).toHaveBeenCalledTimes(1);
    expect(d.observations.every((o) => o.sameTransaction)).toBe(true);
    expect(d.statements).toEqual([]);
  });

  it('does not silently turn a visible connected pharmacy into manual after a fork', async () => {
    const d = fixture();
    await expect(
      d.run(() => d.resolver.resolve('site', ['product'])),
    ).resolves.toEqual({
      mode: 'CONNECTED',
      liveQuantities: new Map([['product', 7]]),
    });
    expect(d.observations.every((o) => o.sameTransaction)).toBe(true);
    expect(d.statements).toEqual([]);
  });

  it('records connection status with the inherited transaction even when repository reads are permissive', async () => {
    const d = fixture(false);
    await expect(
      d.run(() => d.resolver.resolve('site', ['product'])),
    ).resolves.toMatchObject({ mode: 'CONNECTED' });
    expect(d.connections.recordStatus).toHaveBeenCalledTimes(1);
    expect(
      d.observations.find((o) => o.operation === 'record-status')
        ?.sameTransaction,
    ).toBe(true);
    expect(d.statements).toEqual([]);
  });

  it.each(['synthetic-tenant-a', 'synthetic-tenant-b'])(
    'preserves the caller context %s instead of manufacturing a system context',
    async (tenant) => {
      const d = fixture(true, tenant);
      await d.run(() => d.useCases.view('pharmacy', ACTOR));
      expect(
        d.observations.every((o) => o.tenant === tenant && o.sameTransaction),
      ).toBe(true);
      expect(d.statements).toEqual([]);
    },
  );
});
