import { jest } from '@jest/globals';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IdentityEvidenceStoragePurgeService } from './identity-evidence-storage-purge.service';
import { IdentityVerificationCases } from '../entities/identity_verification_cases.entity';
import { technicalDispositionReceipt } from '../identity-evidence-lifecycle.receipt';
import type { ResolvedIdentityLifecycleRule } from '../identity-evidence-lifecycle.config';
import type { StorageIntent } from '../../../common/storage/storage-lifecycle.protocol';
import {
  StorageLifecycleDenied,
  assertDestructiveRuntimeAuthorized,
} from '../../../common/storage/storage-lifecycle.protocol';

function build() {
  process.env.FILE_STORAGE_LIFECYCLE_BINDING = '{}'; // Presence enables review; the fake adapter owns synthetic identity proof.
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
    allowedCaseStatusConceptIds: ['synthetic-terminal'],
    rule: {
      storageDisposition: 'PURGE',
      authorizationRevision: 'synthetic',
      entityRegistryId: 'synthetic-registry',
    },
  } as ResolvedIdentityLifecycleRule;
  const receipt = technicalDispositionReceipt(
    { operation: 'PURGE', config },
    'METADATA_RETIRED',
  );
  const context = {
    caseId: 'synthetic-case',
    subjectId: 'synthetic-subject',
    storageUri: 'synthetic://object',
    evidenceTypeCode: 'synthetic-type',
    configRevision: 'synthetic',
    authorizationRevision: 'synthetic',
    eligibleAt: '2000-01-01T00:00:00Z',
    contractDigest: receipt.contractDigest,
    fileIds: ['synthetic-file'],
    versionIds: ['synthetic-version'],
    registryIds: ['synthetic-registry'],
    recordIds: [
      'synthetic-case',
      'synthetic-subject',
      'synthetic-evidence',
      'synthetic-file',
      'synthetic-version',
    ],
  };
  const intent = {
    producer: 'identity-evidence.purge',
    targetId: 'synthetic-evidence',
    tenantId: 'synthetic-tenant',
    identity,
    phase: 'PURGE_PREPARED',
    purgeContext: context,
  } as unknown as StorageIntent;
  const tx = {
    findOne: jest
      .fn<(...args: unknown[]) => Promise<unknown>>()
      .mockImplementation(async (entity) =>
        entity === IdentityVerificationCases
          ? {
              id: context.caseId,
              subjectEntityId: context.subjectId,
              statusConceptId: 'synthetic-terminal',
            }
          : null,
      ),
    find: jest
      .fn<(...args: unknown[]) => Promise<unknown[]>>()
      .mockResolvedValue([{ dataSnapshot: receipt }]),
  } as unknown as EntityManager;
  const pendingPurges = jest
    .fn<() => Promise<unknown[]>>()
    .mockResolvedValue([intent]);
  const reviewPurge = jest
    .fn<
      (
        candidate: unknown,
        callback: (tx: EntityManager, intent: StorageIntent) => Promise<void>,
      ) => Promise<void>
    >()
    .mockImplementation(async (_candidate, callback) => {
      await callback(tx, intent);
      assertDestructiveRuntimeAuthorized();
    });
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
  const storage = {
    resolvePhysicalIdentity: jest.fn<() => unknown>().mockReturnValue(identity),
    delete: jest.fn(),
  };
  const service = new IdentityEvidenceStoragePurgeService(
    { pendingPurges, dispatchPurge: reviewPurge } as never,
    references as never,
    holds as never,
    configuration as never,
    storage as never,
    { createRevision: jest.fn() } as never,
  );
  return {
    service,
    intent,
    context,
    config,
    tx,
    pendingPurges,
    reviewPurge,
    references,
    holds,
    configuration,
    storage,
  };
}
afterEach(() => {
  delete process.env.FILE_STORAGE_LIFECYCLE_BINDING;
});
describe('post-retirement physical stage (no native I/O)', () => {
  it('rechecks actual zero, holds and durable exclusion, then stops at hard gate', async () => {
    const test = build();
    await expect(test.service.review()).resolves.toEqual({
      inspected: 1,
      denied: 0,
      boundary: 1,
    });
    expect(test.reviewPurge).toHaveBeenCalledTimes(1);
    expect(test.references.resolve).toHaveBeenCalled();
    expect(test.holds.resolveWithObjects).toHaveBeenCalled();
    expect(test.storage.delete).not.toHaveBeenCalled();
    await test.service.review();
    expect(test.storage.delete).not.toHaveBeenCalled();
  });
  it.each(['REFERENCED', 'UNKNOWN'])(
    'denies reference state %s before physical I/O',
    async (state) => {
      const test = build();
      test.references.resolve.mockResolvedValue({ state });
      await expect(test.service.review()).resolves.toEqual({
        inspected: 1,
        denied: 1,
        boundary: 0,
      });
      expect(test.storage.delete).not.toHaveBeenCalled();
    },
  );
  it.each(['ACTIVE', 'UNKNOWN'])(
    'denies legal hold %s before reference count',
    async (state) => {
      const test = build();
      test.holds.resolveWithObjects.mockResolvedValue({ state });
      await expect(test.service.review()).resolves.toMatchObject({
        denied: 1,
        boundary: 0,
      });
      expect(test.references.resolve).not.toHaveBeenCalled();
    },
  );
  it('denies active producer/unknown reservation without entering the callback', async () => {
    const test = build();
    test.reviewPurge.mockRejectedValue(
      new StorageLifecycleDenied('PRODUCER_IN_FLIGHT'),
    );
    await expect(test.service.review()).resolves.toMatchObject({ denied: 1 });
    expect(test.holds.resolveWithObjects).not.toHaveBeenCalled();
  });
  it('denies unknown physical identity or version selector', async () => {
    const test = build();
    test.storage.resolvePhysicalIdentity.mockReturnValue({
      kind: 'UNKNOWN',
      reasonCode: 'VERSION_UNKNOWN',
    });
    await expect(test.service.review()).resolves.toMatchObject({ denied: 1 });
    expect(test.references.resolve).not.toHaveBeenCalled();
  });
  it('requires the same case anchor and technical retirement receipt', async () => {
    const test = build();
    jest.spyOn(test.tx, 'find').mockResolvedValue([]);
    await expect(test.service.review()).resolves.toMatchObject({ denied: 1 });
    expect(test.holds.resolveWithObjects).not.toHaveBeenCalled();
  });
  it('rejects changed policy and incomplete hold coverage', async () => {
    const test = build();
    test.context.recordIds = ['synthetic-case'];
    await expect(test.service.review()).resolves.toMatchObject({ denied: 1 });
    expect(test.configuration.resolve).not.toHaveBeenCalled();
  });
  it('does not read intents when unconfigured', async () => {
    const test = build();
    test.configuration.configuredRules.mockReturnValue([]);
    await expect(test.service.review()).resolves.toEqual({
      inspected: 0,
      denied: 0,
      boundary: 0,
    });
    expect(test.pendingPurges).not.toHaveBeenCalled();
  });
});
