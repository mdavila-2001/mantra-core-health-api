import { jest } from '@jest/globals';
import { createHash } from 'node:crypto';
import type { EntityManager } from '@mikro-orm/postgresql';
import { StorageLifecycleCoordinator } from '../../src/common/storage/storage-lifecycle-coordinator.service';
import {
  readStorageIntent,
  type StorageIntent,
} from '../../src/common/storage/storage-lifecycle.protocol';
import type {
  StorageDeletePermit,
  StorageDeleteReceipt,
} from '../../src/common/storage/file-storage.adapter';
import { QueuesRepository } from '../../src/modules/messaging/repositories/queues.repository';
import type { QueuedJobs } from '../../src/modules/messaging/entities/queued_jobs.entity';
import { CONCEPTS } from '../../src/common/constants/concepts';
import { IdentityEvidenceStoragePurgeService } from '../../src/modules/identity_assurance/services/identity-evidence-storage-purge.service';
import { technicalDispositionReceipt } from '../../src/modules/identity_assurance/identity-evidence-lifecycle.receipt';
import type { ResolvedIdentityLifecycleRule } from '../../src/modules/identity_assurance/identity-evidence-lifecycle.config';
import { RetentionExecutionRepository } from '../../src/modules/system_ops/repositories/retention-execution.repository';

/** Integration of real service/coordinator/receipt repository, with independent
 * transaction/transport doubles. No sockets, filesystem, DB fixture or native delete. */
function fixture() {
  process.env.FILE_STORAGE_LIFECYCLE_BINDING = '{}';
  const identity = {
    kind: 'KNOWN',
    protocolVersion: 1,
    bindingRevision: 'synthetic',
    backendIdentity: 'synthetic',
    physicalContainer: 'synthetic',
    exactObjectKey: 'synthetic',
    versionSelector: { kind: 'UNVERSIONED' },
  } as const;
  const config = {
    configRevision: 'synthetic',
    allowedCaseStatusConceptIds: ['terminal'],
    rule: {
      storageDisposition: 'PURGE',
      authorizationRevision: 'synthetic',
      entityRegistryId: 'registry',
    },
  } as ResolvedIdentityLifecycleRule;
  const baseline = technicalDispositionReceipt(
    { operation: 'PURGE', config },
    'METADATA_RETIRED',
  );
  const intent: StorageIntent = {
    schemaVersion: 1,
    operationId: 'synthetic-operation',
    ownerToken: 'synthetic-owner',
    identity,
    tenantId: 'synthetic-tenant',
    targetId: 'synthetic-evidence',
    producer: 'identity-evidence.purge',
    contentHash: 'a'.repeat(64),
    sizeBytes: 1,
    phase: 'PURGE_PREPARED',
    purgeContext: {
      storageUri: 'synthetic://object',
      eligibleAt: '2000-01-01T00:00:00Z',
      contractDigest: baseline.contractDigest,
      caseId: 'case',
      subjectId: 'subject',
      evidenceTypeCode: 'type',
      configRevision: 'synthetic',
      authorizationRevision: 'synthetic',
      fileIds: ['file'],
      versionIds: ['version'],
      recordIds: ['case', 'subject', 'synthetic-evidence', 'file', 'version'],
      registryIds: ['registry'],
    },
  };
  let state = {
    jobs: [
      {
        id: 'job',
        jobType: 'storage.purge',
        tenantId: intent.tenantId,
        payloadJson: intent,
        dedupeKey: `storage-lifecycle:v1:${createHash('sha256').update(intent.operationId).digest('hex')}`,
        statusConceptId: CONCEPTS.JOB_RUNNING,
        updatedAt: new Date(),
      } as QueuedJobs,
    ],
    revisions: [{ dataSnapshot: baseline }],
  };
  const worm = Object.freeze([{ id: 'synthetic-worm', caseId: 'case' }]);
  let tail = Promise.resolve();
  const cloneState = () => {
    const copy = structuredClone(state);
    for (const job of copy.jobs)
      job.payloadJson = JSON.parse(JSON.stringify(job.payloadJson));
    // structuredClone crosses Jest's VM realm; model ORM Date instances in this realm.
    for (const job of copy.jobs)
      if (job.updatedAt) job.updatedAt = new Date(job.updatedAt);
    return copy;
  };
  const local = new WeakMap<EntityManager, typeof state>();
  const fail = { commitReceipt: false, commitDispatch: false };
  const sql: string[] = [];
  const caseRow = {
    id: 'case',
    subjectEntityId: 'subject',
    statusConceptId: 'terminal',
  };
  const em = (): EntityManager =>
    ({
      fork: em,
      transactional: async <T>(callback: (tx: EntityManager) => Promise<T>) => {
        let release: (() => void) | undefined;
        let locked = false;
        let copy = cloneState();
        const tx = {
          getTransactionContext: () => tx,
          flush: async () => undefined,
          findOne: async () => caseRow,
          find: async () => copy.revisions,
          create: (
            _entity: unknown,
            data: { dataSnapshot: typeof baseline },
          ) => {
            copy.revisions.push(data);
            return data;
          },
          getConnection: () => ({
            execute: async (query: string) => {
              sql.push(query);
              if (query.includes('pg_roles'))
                return [{ primary: true, global_visibility: true }];
              if (!query.includes('pg_advisory_xact_lock'))
                throw new Error('unexpected query');
              if (!locked) {
                const previous = tail;
                tail = new Promise<void>((resolve) => {
                  release = resolve;
                });
                await previous;
                locked = true;
                copy = cloneState();
                local.set(tx, copy);
              }
              return [];
            },
          }),
        } as unknown as EntityManager;
        local.set(tx, copy);
        try {
          const result = await callback(tx);
          if (
            fail.commitReceipt &&
            copy.jobs[0].payloadJson &&
            readStorageIntent(copy.jobs[0].payloadJson).phase === 'PURGED'
          )
            throw new Error('synthetic receipt transaction crash');
          if (
            fail.commitDispatch &&
            readStorageIntent(copy.jobs[0].payloadJson).phase ===
              'DELETE_DISPATCHED'
          )
            throw new Error('synthetic pre-dispatch commit failure');
          if (locked) state = copy;
          return result;
        } finally {
          release?.();
        }
      },
    }) as unknown as EntityManager;
  const queues = new QueuesRepository();
  jest
    .spyOn(queues, 'findJobByDedupeKey')
    .mockImplementation(
      async (tx, key) =>
        local.get(tx)!.jobs.find((j) => j.dedupeKey === key) ?? null,
    );
  jest
    .spyOn(queues, 'findStorageIntents')
    .mockImplementation(async (tx) => local.get(tx)!.jobs);
  const first = new StorageLifecycleCoordinator(em(), queues);
  const second = new StorageLifecycleCoordinator(em(), queues);
  // This replaces only the coordinator gate for this controlled in-memory test.
  // Native adapters and the real runtime gate are not patched or instantiated.
  jest.spyOn(first, 'assertPurgeRuntime').mockImplementation(() => undefined);
  jest.spyOn(second, 'assertPurgeRuntime').mockImplementation(() => undefined);
  const deletion = jest
    .fn<
      (
        _uri: string,
        permit?: StorageDeletePermit,
      ) => Promise<StorageDeleteReceipt>
    >()
    .mockImplementation(async (_uri, permit) => {
      expect(readStorageIntent(state.jobs[0].payloadJson).phase).toBe(
        'DELETE_DISPATCHED',
      );
      permit!.consume(identity);
      return { state: 'DELETED', identity, ioAttemptId: permit!.ioAttemptId };
    });
  const storage = {
    resolvePhysicalIdentity: jest.fn<() => unknown>(() => identity),
    delete: deletion,
  };
  const references = {
    resolve: jest
      .fn<() => Promise<{ state: string }>>()
      .mockResolvedValue({ state: 'ZERO' }),
  };
  const holds = {
    resolveWithObjects: jest
      .fn<() => Promise<{ state: string }>>()
      .mockResolvedValue({ state: 'CLEAR' }),
  };
  const configuration = {
    configuredRules: jest.fn(() => [config.rule]),
    resolve: jest
      .fn<() => Promise<ResolvedIdentityLifecycleRule>>()
      .mockResolvedValue(config),
  };
  const service = (coordinator: StorageLifecycleCoordinator) =>
    new IdentityEvidenceStoragePurgeService(
      coordinator,
      references as never,
      holds as never,
      configuration as never,
      storage as never,
      new RetentionExecutionRepository(),
    );
  return {
    first,
    second,
    service,
    state: () => state,
    intent,
    identity,
    deletion,
    storage,
    references,
    holds,
    configuration,
    caseRow,
    fail,
    sql,
    worm,
    config,
    phase: () => readStorageIntent(state.jobs[0].payloadJson).phase,
  };
}
afterEach(() => {
  jest.useRealTimers();
  delete process.env.FILE_STORAGE_LIFECYCLE_BINDING;
});

describe('physical purge dispatch — controlled integration only', () => {
  it('rechecks revoked authorization when consuming the permit, before native I/O', async () => {
    const f = fixture();
    const native = jest.fn();
    f.deletion.mockImplementation(async (_uri, permit) => {
      jest.spyOn(f.first, 'assertPurgeRuntime').mockImplementation(() => {
        throw new Error('scope revoked during inspection');
      });
      permit!.consume(f.identity);
      native();
      return {
        state: 'DELETED',
        identity: f.identity,
        ioAttemptId: permit!.ioAttemptId,
      };
    });
    await f.service(f.first).review();
    expect(native).not.toHaveBeenCalled();
    expect(f.phase()).toBe('UNKNOWN');
  });
  it('commits dispatch first, confirms exactly once, preserves WORM and writes only a minimal receipt', async () => {
    const f = fixture();
    await f.service(f.first).review();
    expect(f.phase()).toBe('PURGED');
    expect(f.deletion).toHaveBeenCalledTimes(1);
    expect(f.references.resolve).toHaveBeenCalledTimes(2);
    expect(f.holds.resolveWithObjects).toHaveBeenCalledTimes(2);
    expect(f.state().revisions).toHaveLength(2);
    expect(Object.keys(f.state().revisions[1].dataSnapshot).sort()).toEqual([
      'contractDigest',
      'ioAttemptId',
      'operation',
      'outcome',
      'schemaVersion',
    ]);
    expect(f.worm).toEqual([{ id: 'synthetic-worm', caseId: 'case' }]);
    await f.service(f.second).review();
    expect(f.deletion).toHaveBeenCalledTimes(1);
    expect(f.state().revisions).toHaveLength(2);
    expect(f.sql.some((query) => query.includes('pg_advisory_xact_lock'))).toBe(
      true,
    );
  });
  it.each(['REFERENCED', 'UNKNOWN'])(
    'references %s deny dispatch (count is global, including shared/other tenant)',
    async (state) => {
      const f = fixture();
      f.references.resolve.mockResolvedValue({ state });
      await f.service(f.first).review();
      expect(f.deletion).not.toHaveBeenCalled();
      expect(f.phase()).toBe('PURGE_PREPARED');
    },
  );
  it.each(['ACTIVE', 'UNKNOWN'])('hold %s denies dispatch', async (state) => {
    const f = fixture();
    f.holds.resolveWithObjects.mockResolvedValue({ state });
    await f.service(f.first).review();
    expect(f.deletion).not.toHaveBeenCalled();
  });
  it('missing configuration is a NOOP', async () => {
    const f = fixture();
    f.configuration.configuredRules.mockReturnValue([]);
    await f.service(f.first).review();
    expect(f.deletion).not.toHaveBeenCalled();
  });
  it('changed policy, unknown ownership and identity deny', async () => {
    for (const guard of [
      'policy',
      'owner',
      'identity',
      'cutoff',
      'status',
      'audit',
    ]) {
      const f = fixture();
      if (guard === 'policy') f.config.rule.authorizationRevision = 'changed';
      if (guard === 'owner') f.caseRow.subjectEntityId = 'other-tenant';
      if (guard === 'identity')
        f.storage.resolvePhysicalIdentity.mockReturnValue({ kind: 'UNKNOWN' });
      if (guard === 'cutoff')
        readStorageIntent(
          f.state().jobs[0].payloadJson,
        ).purgeContext!.eligibleAt = '2999-01-01';
      if (guard === 'status') f.caseRow.statusConceptId = 'not-terminal';
      if (guard === 'audit') f.state().revisions = [];
      await f.service(f.first).review();
      expect(f.deletion).not.toHaveBeenCalled();
    }
  });
  it('reservation from another tenant prevents dispatch', async () => {
    const f = fixture();
    const operationId = 'producer';
    f.state().jobs.push({
      ...f.state().jobs[0],
      id: 'producer-job',
      jobType: 'storage.publish',
      tenantId: 'other-tenant',
      dedupeKey: `storage-lifecycle:v1:${createHash('sha256').update(operationId).digest('hex')}`,
      payloadJson: {
        ...f.intent,
        operationId,
        phase: 'RESERVED',
        tenantId: 'other-tenant',
      },
    });
    await f.service(f.first).review();
    expect(f.deletion).not.toHaveBeenCalled();
  });
  it('rechecks guards after the durable dispatch commit, before native I/O', async () => {
    const f = fixture();
    f.holds.resolveWithObjects
      .mockResolvedValueOnce({ state: 'CLEAR' })
      .mockResolvedValue({ state: 'ACTIVE' });
    await f.service(f.first).review();
    expect(f.phase()).toBe('UNKNOWN');
    expect(f.deletion).not.toHaveBeenCalled();
  });
  it('two instances cannot dispatch the same intent twice', async () => {
    const f = fixture();
    await Promise.all([
      f.service(f.first).review(),
      f.service(f.second).review(),
    ]);
    expect(f.deletion).toHaveBeenCalledTimes(1);
    expect(f.phase()).toBe('PURGED');
  });
  it('known non-deletion retries with a different attempt and every guard again', async () => {
    const f = fixture();
    f.deletion.mockImplementationOnce(async (_uri, permit) => {
      permit!.consume(f.identity);
      return {
        state: 'NOT_DELETED',
        identity: f.identity,
        ioAttemptId: permit!.ioAttemptId,
      };
    });
    await f.service(f.first).review();
    expect(f.phase()).toBe('PURGE_PREPARED');
    expect(f.state().revisions).toHaveLength(1);
    const priorAttempt = readStorageIntent(
      f.state().jobs[0].payloadJson,
    ).ioAttemptId;
    await f.service(f.second).review();
    expect(f.phase()).toBe('PURGED');
    expect(
      readStorageIntent(f.state().jobs[0].payloadJson).ioAttemptId,
    ).not.toBe(priorAttempt);
    expect(f.deletion).toHaveBeenCalledTimes(2);
    expect(f.references.resolve).toHaveBeenCalledTimes(4);
  });
  it.each([
    'remote-error',
    'missing-receipt',
    'wrong-attempt',
    'unknown',
    'no-permit',
  ])('%s quarantines and never retries I/O', async (mode) => {
    const f = fixture();
    f.deletion.mockImplementation(async (_uri, permit) => {
      if (mode !== 'no-permit') permit!.consume(f.identity);
      if (mode === 'remote-error')
        throw new Error('SYNTHETIC provider secret not persisted');
      if (mode === 'missing-receipt') return undefined as never;
      return {
        state: mode === 'unknown' ? 'UNKNOWN' : 'DELETED',
        identity: f.identity,
        ioAttemptId: mode === 'wrong-attempt' ? 'wrong' : permit!.ioAttemptId,
      };
    });
    await f.service(f.first).review();
    expect(f.phase()).toBe('UNKNOWN');
    await f.service(f.second).review();
    expect(f.deletion).toHaveBeenCalledTimes(1);
    expect(f.state().revisions).toHaveLength(1);
    expect(JSON.stringify(f.state())).not.toContain('provider secret');
  });
  it('timeout quarantines; a late successful receipt cannot revive the intent', async () => {
    jest.useFakeTimers();
    const f = fixture();
    let finish!: () => void;
    f.deletion.mockImplementation(async (_uri, permit) => {
      permit!.consume(f.identity);
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
      return {
        state: 'DELETED',
        identity: f.identity,
        ioAttemptId: permit!.ioAttemptId,
      };
    });
    const review = f.service(f.first).review();
    await jest.advanceTimersByTimeAsync(30_001);
    await review;
    expect(f.phase()).toBe('UNKNOWN');
    finish();
    await Promise.resolve();
    await f.service(f.second).review();
    expect(f.phase()).toBe('UNKNOWN');
    expect(f.deletion).toHaveBeenCalledTimes(1);
  });
  it('receipt transaction crash rolls back completion, not the durable dispatch', async () => {
    const f = fixture();
    f.fail.commitReceipt = true;
    await f.service(f.first).review();
    expect(f.phase()).toBe('UNKNOWN');
    expect(f.state().revisions).toHaveLength(1);
    f.fail.commitReceipt = false;
    await f.service(f.second).review();
    expect(f.deletion).toHaveBeenCalledTimes(1);
  });
  it('failed dispatch commit grants no I/O; retry is safe', async () => {
    const f = fixture();
    f.fail.commitDispatch = true;
    await f.service(f.first).review();
    expect(f.deletion).not.toHaveBeenCalled();
    expect(f.phase()).toBe('PURGE_PREPARED');
    f.fail.commitDispatch = false;
    await f.service(f.second).review();
    expect(f.deletion).toHaveBeenCalledTimes(1);
  });
  it('stale crash post-dispatch is quarantined, not retried based on elapsed time', async () => {
    const f = fixture();
    const job = f.state().jobs[0];
    job.payloadJson = {
      ...f.intent,
      phase: 'DELETE_DISPATCHED',
      ioAttemptId: 'crashed-attempt',
    };
    job.updatedAt = new Date(0);
    await f.first.recover();
    expect(f.phase()).toBe('UNKNOWN');
    await f.service(f.second).review();
    expect(f.deletion).not.toHaveBeenCalled();
  });
  it('repeated capability consumption is rejected before a second native call', async () => {
    const f = fixture();
    f.deletion.mockImplementation(async (_uri, permit) => {
      permit!.consume(f.identity);
      expect(() => permit!.consume(f.identity)).toThrow(
        'DELETE_PERMIT_INVALID',
      );
      return {
        state: 'DELETED',
        identity: f.identity,
        ioAttemptId: permit!.ioAttemptId,
      };
    });
    await f.service(f.first).review();
    expect(f.phase()).toBe('PURGED');
  });
  it('real production gate stays closed even with all other guards passing', async () => {
    const f = fixture();
    jest.mocked(f.first.assertPurgeRuntime).mockRestore();
    await expect(f.service(f.first).review()).resolves.toMatchObject({
      boundary: 1,
    });
    expect(f.phase()).toBe('PURGE_PREPARED');
    expect(f.deletion).not.toHaveBeenCalled();
  });
});
