import { jest } from '@jest/globals';
import type { EntityManager } from '@mikro-orm/postgresql';
import { QueuesRepository } from '../../modules/messaging/repositories/queues.repository';
import type { QueuedJobs } from '../../modules/messaging/entities/queued_jobs.entity';
import type { KnownPhysicalObjectIdentity } from './physical-object-identity';
import { CONCEPTS } from '../constants/concepts';
import {
  StorageLifecycleCoordinator,
  type BeginPublication,
} from './storage-lifecycle-coordinator.service';
import {
  readStorageIntent,
  assertDestructiveRuntimeAuthorized,
} from './storage-lifecycle.protocol';

const input: BeginPublication & { identity: KnownPhysicalObjectIdentity } = {
  operationId: 'synthetic-operation',
  ownerToken: 'synthetic-owner',
  queueCode: 'synthetic-queue',
  tenantId: 'synthetic-tenant',
  targetId: 'synthetic-target',
  producer: 'synthetic-producer',
  contentHash: 'a'.repeat(64),
  sizeBytes: 12,
  identity: {
    kind: 'KNOWN',
    protocolVersion: 1,
    bindingRevision: 'test-v1',
    backendIdentity: 'test-authority',
    physicalContainer: 'test-container',
    exactObjectKey: 'test-object',
    versionSelector: { kind: 'UNVERSIONED' },
  },
};

/** Controlled transaction/queue doubles: no connection, filesystem or native adapter. */
function build() {
  const rows: QueuedJobs[] = [];
  const context = { synthetic: true };
  const execute = jest
    .fn<(...args: unknown[]) => Promise<unknown>>()
    .mockImplementation(async (sql) =>
      String(sql).includes('pg_roles')
        ? [{ primary: true, global_visibility: true }]
        : [],
    );
  const tx = {
    getTransactionContext: () => context,
    getConnection: () => ({ execute }),
    flush: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  } as unknown as EntityManager;
  const em = {
    fork: () => em,
    transactional: async <T>(cb: (active: EntityManager) => Promise<T>) =>
      cb(tx),
  } as unknown as EntityManager;
  const repo = new QueuesRepository();
  jest.spyOn(repo, 'findQueueByCode').mockResolvedValue({
    id: 'queue',
    stateConceptId: CONCEPTS.STATE_ACTIVE,
  } as never);
  jest
    .spyOn(repo, 'findJobByDedupeKey')
    .mockImplementation(
      async (_tx, key) => rows.find((row) => row.dedupeKey === key) ?? null,
    );
  jest.spyOn(repo, 'findStorageIntents').mockImplementation(async () => rows);
  jest.spyOn(repo, 'createJob').mockImplementation((_tx, data) => {
    const row = { ...data, id: `job-${rows.length}` } as QueuedJobs;
    rows.push(row);
    return row;
  });
  return {
    service: new StorageLifecycleCoordinator(em, repo),
    rows,
    execute,
    tx,
    context,
    repo,
    em,
  };
}

describe('storage lifecycle coordinator — controlled persistence only', () => {
  it('accepts only the actual provider version receipt for a pending key reservation', async () => {
    const { service } = build();
    const reservation = await service.begin({
      ...input,
      identity: {
        ...input.identity,
        versionSelector: { kind: 'PENDING_VERSION' },
      },
    });
    const attempt = await service.dispatch(reservation);
    await expect(service.settle(reservation, attempt, input)).rejects.toThrow(
      'STORE_RECEIPT_MISMATCH',
    );
    await service.settle(reservation, attempt, {
      ...input,
      identity: {
        ...input.identity,
        versionSelector: {
          kind: 'VERSION',
          providerVersionId: 'synthetic-version-1',
        },
      },
    });
    await expect(
      service.settle(reservation, attempt, {
        ...input,
        identity: {
          ...input.identity,
          versionSelector: {
            kind: 'VERSION',
            providerVersionId: 'synthetic-version-2',
          },
        },
      }),
    ).rejects.toThrow('STORE_RECEIPT_MISMATCH');
  });
  it('does not quarantine a healthy in-flight operation merely because a tick ran', async () => {
    const { service, rows } = build();
    const reservation = await service.begin(input);
    await service.dispatch(reservation);
    await expect(service.recover()).resolves.toMatchObject({ quarantined: 0 });
    expect(readStorageIntent(rows[0].payloadJson).phase).toBe(
      'STORE_DISPATCHED',
    );
  });
  it('denies RLS-limited or unknown visibility before issuing a reservation', async () => {
    const { service, execute, rows } = build();
    execute.mockResolvedValue([{ primary: true, global_visibility: false }]);
    await expect(service.begin(input)).rejects.toThrow(
      'GLOBAL_RESERVATION_VISIBILITY_UNPROVEN',
    );
    expect(rows).toHaveLength(0);
  });
  it('binds advisory exclusion to the active primary transaction, not a session/mutex', async () => {
    const { service, execute, context } = build();
    await service.begin(input);
    expect(execute).toHaveBeenCalledWith(
      'SELECT pg_advisory_xact_lock(hashtextextended(?, 0))',
      [
        JSON.stringify([
          'storage-lifecycle:v1',
          'test-authority',
          'test-container',
        ]),
      ],
      'all',
      context,
    );
  });
  it('deduplicates begin and denies changed ownership or target', async () => {
    const { service, rows } = build();
    await service.begin(input);
    await service.begin(input);
    expect(rows).toHaveLength(1);
    await expect(
      service.begin({ ...input, ownerToken: 'other' }),
    ).rejects.toThrow('RESERVATION_OWNER_MISMATCH');
    await expect(
      service.begin({ ...input, targetId: 'other' }),
    ).rejects.toThrow('IDEMPOTENCY_CONFLICT');
  });
  it('denies another producer or tenant on the same object before bytes exist', async () => {
    const { service } = build();
    await service.begin(input);
    await expect(
      service.begin({ ...input, operationId: 'other', tenantId: 'other' }),
    ).rejects.toThrow('PRODUCER_OR_PURGE_IN_FLIGHT');
  });
  it('grants once and blocks replay by another coordinator instance', async () => {
    const { service, em, repo } = build();
    const reservation = await service.begin(input);
    await service.dispatch(reservation);
    const second = new StorageLifecycleCoordinator(em, repo);
    await expect(second.dispatch(reservation)).rejects.toThrow(
      'DISPATCH_REPLAY',
    );
  });
  it('keeps metadata and committed receipt on the same tx, with no duplicate callback', async () => {
    const { service, tx, rows } = build();
    const reservation = await service.begin(input);
    const attempt = await service.dispatch(reservation);
    await service.settle(reservation, attempt, input);
    const publish = jest
      .fn<(em: EntityManager) => Promise<string>>()
      .mockResolvedValue('synthetic-result');
    await expect(service.commit(reservation, publish)).resolves.toEqual({
      targetId: input.targetId,
      duplicate: false,
      result: 'synthetic-result',
    });
    await expect(service.commit(reservation, publish)).resolves.toEqual({
      targetId: input.targetId,
      duplicate: true,
    });
    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith(tx);
    expect(rows[0].resultJson).toEqual({ targetId: input.targetId });
  });
  it('does not equate delivery expiry, successful retry or 404 with settlement', async () => {
    const { service, rows } = build();
    const reservation = await service.begin(input);
    const attempt = await service.dispatch(reservation);
    rows[0].lockExpiresAt = new Date(0);
    rows[0].statusConceptId = CONCEPTS.JOB_DEAD_LETTER;
    await service.recover();
    expect(readStorageIntent(rows[0].payloadJson).phase).toBe('UNKNOWN');
    await expect(service.settle(reservation, attempt, input)).rejects.toThrow(
      'SETTLEMENT_UNKNOWN',
    );
    await expect(
      service.begin({ ...input, operationId: 'retry' }),
    ).rejects.toThrow('PRODUCER_OR_PURGE_IN_FLIGHT');
  });
  it('aborts only undispatched reservations without quarantine', async () => {
    const { service, rows } = build();
    const reservation = await service.begin(input);
    await service.abort(reservation);
    expect(readStorageIntent(rows[0].payloadJson).phase).toBe('ABORTED');
    await expect(service.dispatch(reservation)).rejects.toThrow(
      'DISPATCH_REPLAY',
    );
  });
  it('denies malformed durable state instead of returning a zero count', async () => {
    const { service, rows } = build();
    rows.push({ payloadJson: {}, jobType: 'storage.publish' } as QueuedJobs);
    await expect(service.begin(input)).rejects.toThrow('INTENT_UNKNOWN');
  });
  it('has no runtime flag or native I/O path that bypasses the destructive gate', () => {
    expect(() => assertDestructiveRuntimeAuthorized()).toThrow(
      'DESTRUCTIVE_RUNTIME_GATE_BLOCKED',
    );
  });
});
