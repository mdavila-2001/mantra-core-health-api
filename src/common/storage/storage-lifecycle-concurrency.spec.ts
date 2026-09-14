import { jest } from '@jest/globals';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { QueuedJobs } from '../../modules/messaging/entities/queued_jobs.entity';
import { QueuesRepository } from '../../modules/messaging/repositories/queues.repository';
import {
  StorageLifecycleCoordinator,
  type BeginPublication,
} from './storage-lifecycle-coordinator.service';
import { CONCEPTS } from '../constants/concepts';
import type { KnownPhysicalObjectIdentity } from './physical-object-identity';

const input: BeginPublication & { identity: KnownPhysicalObjectIdentity } = {
  operationId: 'synthetic-op',
  ownerToken: 'synthetic-owner',
  queueCode: 'synthetic-queue',
  producer: 'synthetic',
  tenantId: 'synthetic-tenant',
  targetId: 'synthetic-target',
  contentHash: 'a'.repeat(64),
  sizeBytes: 1,
  identity: {
    kind: 'KNOWN',
    protocolVersion: 1,
    bindingRevision: 'test',
    backendIdentity: 'test',
    physicalContainer: 'test',
    exactObjectKey: 'same-physical-key',
    versionSelector: { kind: 'UNVERSIONED' },
  },
};

/** Two connection doubles, independent UoWs, shared durable state, lock held until commit/rollback.
 * It verifies the PostgreSQL protocol, NOT a real PostgreSQL deployment. */
function database() {
  let persisted: QueuedJobs[] = [];
  let tail = Promise.resolve();
  const local = new WeakMap<EntityManager, { rows: QueuedJobs[] }>();
  const sqlCalls: string[] = [];
  const makeEm = (): EntityManager =>
    ({
      fork: makeEm,
      transactional: async <T>(callback: (tx: EntityManager) => Promise<T>) => {
        let release: (() => void) | undefined;
        const state = { rows: [] as QueuedJobs[] };
        const tx = {
          getTransactionContext: () => tx,
          flush: async () => undefined,
          getConnection: () => ({
            execute: async (sql: string) => {
              sqlCalls.push(sql);
              if (sql.includes('pg_roles'))
                return [{ primary: true, global_visibility: true }];
              if (!sql.includes('pg_advisory_xact_lock'))
                throw new Error('unexpected SQL');
              if (!release) {
                const predecessor = tail;
                tail = new Promise<void>((resolve) => {
                  release = resolve;
                });
                await predecessor;
                state.rows = structuredClone(persisted);
              }
              return [];
            },
          }),
        } as unknown as EntityManager;
        local.set(tx, state);
        try {
          const value = await callback(tx);
          persisted = state.rows;
          return value;
        } finally {
          release?.();
        }
      },
    }) as unknown as EntityManager;
  const repo = new QueuesRepository();
  jest.spyOn(repo, 'findQueueByCode').mockResolvedValue({
    id: 'synthetic-queue',
    stateConceptId: CONCEPTS.STATE_ACTIVE,
  } as never);
  jest
    .spyOn(repo, 'findStorageIntents')
    .mockImplementation(async (tx) => local.get(tx)!.rows);
  jest
    .spyOn(repo, 'findJobByDedupeKey')
    .mockImplementation(
      async (tx, key) =>
        local.get(tx)!.rows.find((row) => row.dedupeKey === key) ?? null,
    );
  jest.spyOn(repo, 'createJob').mockImplementation((tx, data) => {
    const row = {
      ...data,
      id: 'synthetic-job',
      createdAt: new Date(),
    } as QueuedJobs;
    local.get(tx)!.rows.push(row);
    return row;
  });
  return {
    first: new StorageLifecycleCoordinator(makeEm(), repo),
    second: new StorageLifecycleCoordinator(makeEm(), repo),
    rows: () => persisted,
    sqlCalls,
  };
}

describe('multi-instance storage exclusion with controlled PostgreSQL connections', () => {
  it('concurrent producers on the same key cannot both obtain a reservation, even across tenants', async () => {
    const db = database();
    const results = await Promise.allSettled([
      db.first.begin(input),
      db.second.begin({
        ...input,
        operationId: 'synthetic-op-2',
        tenantId: 'other-tenant',
      }),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
    expect(db.rows()).toHaveLength(1);
    expect(
      db.sqlCalls.filter((sql) => sql.includes('pg_advisory_xact_lock')),
    ).toHaveLength(2);
  });
  it('metadata rollback leaves the settled reservation blocking the second instance', async () => {
    const db = database();
    const reservation = await db.first.begin(input);
    const attempt = await db.first.dispatch(reservation);
    await db.first.settle(reservation, attempt, input);
    await expect(
      db.first.commit(reservation, async () => {
        throw new Error('synthetic rollback');
      }),
    ).rejects.toThrow('synthetic rollback');
    await expect(
      db.second.begin({ ...input, operationId: 'synthetic-second' }),
    ).rejects.toThrow('PRODUCER_OR_PURGE_IN_FLIGHT');
    expect(db.rows()[0].payloadJson).toMatchObject({ phase: 'STORED' });
  });
  it('a late dispatch cannot revive an aborted reservation from another process', async () => {
    const db = database();
    const reservation = await db.first.begin(input);
    await db.second.abort(reservation);
    await expect(db.first.dispatch(reservation)).rejects.toThrow(
      'DISPATCH_REPLAY',
    );
  });
});
