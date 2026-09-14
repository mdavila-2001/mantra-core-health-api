/* eslint-disable @typescript-eslint/unbound-method -- Only inspect Jest spies; no detached method invocation. */
import { jest } from '@jest/globals';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IdentityEvidenceLifecycleService } from './identity-evidence-lifecycle.service';
import { IdentityEvidenceEligibilityService } from './identity-evidence-eligibility.service';
import { IdentityEvidenceDispositionExecutor } from './identity-evidence-disposition.executor';
import { StorageReferenceResolver } from '../../../common/storage/storage-reference-resolver.service';
import type { StorageReferenceSnapshot } from '../../../common/storage/storage-reference.repository';
import type { FileStorageAdapter } from '../../../common/storage/file-storage.adapter';
import type { KnownPhysicalObjectIdentity } from '../../../common/storage/physical-object-identity';
import type {
  ResolvedIdentityLifecycleRule,
  IdentityDisposition,
} from '../identity-evidence-lifecycle.config';
import type { IdentityEvidenceGraph } from '../repositories/identity-evidence-lifecycle.repository';
import { StorageLifecycleDenied } from '../../../common/storage/storage-lifecycle.protocol';

const now = new Date('2026-01-03T00:00:00Z');
const past = new Date('2026-01-01T00:00:00Z');
function build(operation: IdentityDisposition = 'PURGE') {
  const identity: KnownPhysicalObjectIdentity = {
    kind: 'KNOWN',
    protocolVersion: 1,
    bindingRevision: 'synthetic',
    backendIdentity: 'synthetic',
    physicalContainer: 'synthetic',
    exactObjectKey: 'synthetic-key',
    versionSelector: { kind: 'UNVERSIONED' },
  };
  const config: ResolvedIdentityLifecycleRule = {
    configRevision: 'synthetic-v1',
    retentionPeriodDays: 1,
    evidenceTypeConceptId: 'synthetic-type',
    allowedCaseStatusConceptIds: ['synthetic-terminal'],
    fieldOperations: [
      { columnName: 'evidence_identifier_hash', operation: 'CLEAR' },
    ],
    rule: {
      tenantId: 'synthetic-tenant',
      evidenceTypeConceptCode: 'SYNTHETIC_TYPE',
      operation,
      retentionPolicyCode: 'synthetic-policy',
      expectedRowVersion: 1,
      expectedDispositionConceptCode: 'SYNTHETIC_DISPOSITION',
      entityRegistryId: 'synthetic-registry',
      baseEvent: 'case.completedAt',
      additionalWaitSeconds: 0,
      allowedCaseStatusConceptCodes: ['SYNTHETIC_TERMINAL'],
      fieldRules: [],
      metadataDisposition:
        operation === 'PURGE'
          ? 'REMOVE'
          : operation === 'ANONYMIZATION'
            ? 'MINIMIZE'
            : 'PRESERVE',
      storageDisposition: operation === 'PURGE' ? 'PURGE' : 'PRESERVE',
      preserveProfile: 'CASE_ANCHOR_WORM_TECHNICAL_REVISION',
      authorizationRevision: 'synthetic-authorized-test',
    },
  };
  const graph: IdentityEvidenceGraph = {
    tenantId: 'synthetic-tenant',
    ownerResolved: true,
    subjectId: 'synthetic-subject',
    evidence: {
      id: 'synthetic-evidence',
      identityVerificationCaseId: 'synthetic-case',
      evidenceTypeConceptId: 'synthetic-type',
      evidenceFileId: 'synthetic-file',
      createdAt: past,
    },
    case: {
      id: 'synthetic-case',
      subjectTypeConceptId: 'synthetic-subject-type',
      subjectEntityId: 'synthetic-subject',
      statusConceptId: 'synthetic-terminal',
      createdAt: past,
      completedAt: past,
      rowVersion: 1,
    },
    files: [
      {
        id: 'synthetic-file',
        tenantId: 'synthetic-tenant',
        lifecycleStatusConceptId: 'synthetic-live',
        currentVersionId: 'synthetic-version',
      },
    ],
    versions: [
      {
        id: 'synthetic-version',
        fileId: 'synthetic-file',
        storageUri: 'synthetic://object',
        contentHash: 'a'.repeat(64),
        sizeBytes: '1',
      },
    ],
    derivatives: [],
    registryIds: ['synthetic-registry'],
    recordIds: [
      'synthetic-evidence',
      'synthetic-case',
      'synthetic-file',
      'synthetic-subject',
    ],
    holdCoverage: 'PROVEN',
    externalReferenceCount: 0,
    opaqueReference: false,
  };
  const saved: { dataSnapshot: unknown }[] = [];
  const sql = jest
    .fn<(...args: unknown[]) => Promise<unknown[]>>()
    .mockResolvedValue([]);
  const tx = {
    getConnection: () => ({ execute: sql }),
    getTransactionContext: () => 'synthetic-tx',
    find: jest
      .fn<() => Promise<unknown[]>>()
      .mockImplementation(async () => saved),
    flush: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  } as unknown as EntityManager;
  const em = {
    fork: () => em,
    transactional: async <T>(callback: (tx: EntityManager) => Promise<T>) =>
      callback(tx),
  } as unknown as EntityManager;
  const resolve = jest
    .fn<() => Promise<ResolvedIdentityLifecycleRule>>()
    .mockImplementation(async () => config);
  const repo = {
    graph: jest
      .fn<() => Promise<IdentityEvidenceGraph>>()
      .mockImplementation(async () => graph),
  };
  const holds = {
    resolveWithObjects: jest
      .fn<
        () => Promise<{
          state: 'CLEAR' | 'ACTIVE' | 'UNKNOWN';
          reasonCode: string;
        }>
      >()
      .mockResolvedValue({ state: 'CLEAR', reasonCode: 'SYNTHETIC_CLEAR' }),
  };
  const coordinator = {
    excludeNamespaces: jest
      .fn<() => Promise<void>>()
      .mockResolvedValue(undefined),
    assertNoContender: jest
      .fn<() => Promise<void>>()
      .mockResolvedValue(undefined),
  };
  const adapter: FileStorageAdapter = {
    resolvePhysicalIdentity: jest
      .fn<FileStorageAdapter['resolvePhysicalIdentity'] & object>()
      .mockReturnValue(identity),
    store: jest.fn<FileStorageAdapter['store']>(),
    retrieve: jest.fn<FileStorageAdapter['retrieve']>(),
    exists: jest.fn<FileStorageAdapter['exists']>(),
    delete: jest.fn<FileStorageAdapter['delete']>(),
  };
  const snapshot: StorageReferenceSnapshot = {
    rows: [],
    incomingReferences: 0,
    opaqueReferencesPresent: false,
  };
  const references = {
    snapshot: jest
      .fn<() => Promise<StorageReferenceSnapshot>>()
      .mockImplementation(async () => snapshot),
  };
  const append = jest.fn((_tx: unknown, data: { dataSnapshot: unknown }) => {
    saved.push(data);
  });
  const apply = jest
    .fn<() => Promise<'ANONYMIZED'>>()
    .mockResolvedValue('ANONYMIZED');
  const executor = new IdentityEvidenceDispositionExecutor(
    { createRevision: append } as never,
    { apply } as never,
  );
  const configuredRules = jest.fn(() => []);
  const service = new IdentityEvidenceLifecycleService(
    em,
    { resolve, configuredRules } as never,
    repo as never,
    new IdentityEvidenceEligibilityService(),
    holds as never,
    { lockNamespace: async () => undefined } as never,
    coordinator as never,
    references as never,
    new StorageReferenceResolver(references as never, adapter),
    executor,
    adapter,
  );
  return {
    service,
    config,
    graph,
    holds,
    snapshot,
    coordinator,
    adapter,
    resolve,
    append,
    apply,
    saved,
    repo,
    sql,
    run: () =>
      service.execute(
        graph.evidence.id,
        'synthetic-tenant',
        'SYNTHETIC_TYPE',
        operation,
        now,
      ),
  };
}

describe('identity lifecycle orchestration — no DB/storage runtime', () => {
  it('a fully eligible purge reaches the gate without changing metadata, bytes or WORM', async () => {
    const test = build();
    const before = structuredClone(test.graph);
    await expect(test.run()).resolves.toEqual({
      status: 'DESTRUCTIVE_BOUNDARY',
      reasonCode: 'DESTRUCTIVE_RUNTIME_GATE_BLOCKED',
    });
    expect(test.graph).toEqual(before);
    expect(test.apply).not.toHaveBeenCalled();
    expect(test.append).not.toHaveBeenCalled();
    expect(test.adapter.delete).not.toHaveBeenCalled();
    expect(
      test.sql.mock.calls.every(
        (call) =>
          call.length === 0 || !/DELETE|UPDATE|INSERT/.test(String(call[0])),
      ),
    ).toBe(true);
  });
  it('missing configuration denies before graph lookup', async () => {
    const test = build();
    test.resolve.mockRejectedValue(
      new StorageLifecycleDenied('MISSING_CONFIGURATION'),
    );
    await expect(test.run()).resolves.toMatchObject({
      status: 'DENIED',
      reasonCode: 'MISSING_CONFIGURATION',
    });
    expect(test.repo.graph).not.toHaveBeenCalled();
  });
  it.each(['ACTIVE', 'UNKNOWN'] as const)(
    'legal hold %s prevents the executor boundary',
    async (state) => {
      const test = build();
      test.holds.resolveWithObjects.mockResolvedValue({
        state,
        reasonCode: 'synthetic-hold',
      });
      await expect(test.run()).resolves.toMatchObject({
        status: 'DENIED',
        reasonCode: 'LEGAL_HOLD_ACTIVE_OR_UNKNOWN',
      });
      expect(test.apply).not.toHaveBeenCalled();
    },
  );
  it.each([
    'owner',
    'state',
    'type',
    'cutoff',
    'external',
    'shared',
    'physical',
    'version',
    'reservation',
  ] as const)('denies adversarial %s state', async (scenario) => {
    const test = build();
    if (scenario === 'owner') test.graph.ownerResolved = false;
    if (scenario === 'state')
      test.graph.case.statusConceptId = 'synthetic-ineligible';
    if (scenario === 'type')
      test.graph.evidence.evidenceTypeConceptId = 'synthetic-other';
    if (scenario === 'cutoff') test.graph.case.completedAt = now;
    if (scenario === 'external') test.graph.opaqueReference = true;
    if (scenario === 'shared')
      test.snapshot.rows.push({
        id: 'other-tenant-version',
        source: 'common.file_versions',
        storage_uri: 'synthetic://shared',
      });
    if (scenario === 'physical' || scenario === 'version')
      jest
        .mocked(test.adapter.resolvePhysicalIdentity!)
        .mockReturnValue({ kind: 'UNKNOWN', reasonCode: 'SYNTHETIC_UNKNOWN' });
    if (scenario === 'reservation')
      test.coordinator.assertNoContender.mockRejectedValue(
        new StorageLifecycleDenied('PRODUCER_OR_PURGE_IN_FLIGHT'),
      );
    await expect(test.run()).resolves.toMatchObject({ status: 'DENIED' });
    expect(test.apply).not.toHaveBeenCalled();
    expect(test.adapter.delete).not.toHaveBeenCalled();
  });
  it('anonymization never implies binary deletion', async () => {
    const test = build('ANONYMIZATION');
    await expect(test.run()).resolves.toMatchObject({
      status: 'DESTRUCTIVE_BOUNDARY',
    });
    expect(test.adapter.delete).not.toHaveBeenCalled();
    expect(test.apply).not.toHaveBeenCalled();
  });
  it('retention is non-destructive and its technical outcome is idempotent and minimal', async () => {
    const test = build('RETENTION');
    await expect(test.run()).resolves.toMatchObject({ status: 'RETAINED' });
    await expect(test.run()).resolves.toMatchObject({ status: 'DUPLICATE' });
    expect(test.append).toHaveBeenCalledTimes(1);
    expect(test.apply).not.toHaveBeenCalled();
    expect(Object.keys(test.saved[0].dataSnapshot as object).sort()).toEqual([
      'contractDigest',
      'operation',
      'outcome',
      'schemaVersion',
    ]);
    expect(JSON.stringify(test.saved[0].dataSnapshot)).not.toMatch(
      /synthetic-subject|synthetic:\/\/|storageUri|contentHash/,
    );
  });
  it('a worker with no configured rules is NOOP before any graph access', async () => {
    const test = build();
    await expect(test.service.scan()).resolves.toEqual({
      scanned: 0,
      retained: 0,
      denied: 0,
      boundary: 0,
    });
    expect(test.repo.graph).not.toHaveBeenCalled();
  });
});
