import { jest } from '@jest/globals';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { IdentityDispositionPlan } from '../services/identity-evidence-disposition.executor';
import type { IdentityEvidenceDispositionRepository as RepositoryType } from './identity-evidence-disposition.repository';
import type { IdentityEvidenceDispositionExecutor as ExecutorType } from '../services/identity-evidence-disposition.executor';
import * as protocol from '../../../common/storage/storage-lifecycle.protocol';

// Explicit test-only module substitution. There is no env flag/production provider
// that disables the gate. The ORM below is a recorder, never a database connection.
let IdentityEvidenceDispositionRepository: typeof RepositoryType;
let IdentityEvidenceDispositionExecutor: typeof ExecutorType;
const fileId = '10000000-0000-4000-8000-000000000001';
const versionId = '20000000-0000-4000-8000-000000000002';
const derivativeId = '30000000-0000-4000-8000-000000000003';
beforeAll(async () => {
  jest.unstable_mockModule(
    '../../../common/storage/storage-lifecycle.protocol',
    () => ({
      ...protocol,
      assertDestructiveRuntimeAuthorized: jest.fn(() => undefined),
    }),
  );
  const repositoryPath = './identity-evidence-disposition.repository';
  const executorPath = '../services/identity-evidence-disposition.executor';
  ({ IdentityEvidenceDispositionRepository } = (await import(
    repositoryPath
  )) as { IdentityEvidenceDispositionRepository: typeof RepositoryType });
  ({ IdentityEvidenceDispositionExecutor } = (await import(executorPath)) as {
    IdentityEvidenceDispositionExecutor: typeof ExecutorType;
  });
});

function build(operation: 'ANONYMIZATION' | 'PURGE' = 'ANONYMIZATION') {
  const identity = {
    kind: 'KNOWN',
    protocolVersion: 1,
    bindingRevision: 'synthetic',
    backendIdentity: 'synthetic',
    physicalContainer: 'synthetic-container',
    exactObjectKey: 'synthetic-key',
    versionSelector: { kind: 'UNVERSIONED' },
  };
  const plan = {
    operation,
    identities: [identity],
    eligibleAt: new Date('2000-01-01T00:00:00Z'),
    graph: {
      ownerResolved: true,
      externalReferenceCount: 0,
      opaqueReference: false,
      tenantId: 'synthetic-tenant',
      evidence: { id: 'synthetic-evidence' },
      case: { id: 'synthetic-case', subjectEntityId: 'synthetic-subject' },
      files: [{ id: fileId }],
      recordIds: [
        'synthetic-evidence',
        'synthetic-case',
        'synthetic-subject',
        fileId,
        versionId,
      ],
      registryIds: ['synthetic-registry'],
      versions: [
        {
          id: versionId,
          storageUri: 'synthetic://object',
          objectKey: 'synthetic-key',
          bucketOrContainer: 'synthetic-container',
          contentHash: 'a'.repeat(64),
          sizeBytes: '1',
        },
      ],
      derivatives: [],
    },
    config: {
      configRevision: 'synthetic-v1',
      fieldOperations: [
        { columnName: 'evidence_identifier_hash', operation: 'CLEAR' },
      ],
      rule: {
        storageDisposition: operation === 'PURGE' ? 'PURGE' : 'PRESERVE',
        metadataDisposition: operation === 'PURGE' ? 'REMOVE' : 'MINIMIZE',
        authorizationRevision: 'synthetic-test',
        retentionPolicyCode: 'synthetic-policy',
        expectedRowVersion: 1,
      },
    },
  } as unknown as IdentityDispositionPlan;
  const calls: { sql: string; params: unknown[] }[] = [];
  const saved: { dataSnapshot: unknown }[] = [];
  const tx = {
    getTransactionContext: () => 'synthetic-tx',
    getConnection: () => ({
      execute: async (sql: string, params: unknown[]) => {
        calls.push({ sql, params });
        return [];
      },
    }),
    find: async () => saved,
    flush: async () => undefined,
  } as unknown as EntityManager;
  const prepare = jest
    .fn<(...args: unknown[]) => Promise<void>>()
    .mockResolvedValue(undefined);
  const repository = new IdentityEvidenceDispositionRepository(
    { preparePurgeRetirement: prepare } as never,
    { resolvePhysicalIdentity: () => identity } as never,
  );
  const append = jest.fn((_tx: unknown, data: { dataSnapshot: unknown }) => {
    saved.push(data);
  });
  const executor = new IdentityEvidenceDispositionExecutor(
    { createRevision: append } as never,
    repository,
  );
  return { plan, calls, saved, prepare, repository, tx, append, executor };
}

describe('real disposition SQL against a controlled recorder (no runtime fixture)', () => {
  it('minimizes only configured nullable evidence columns and never deletes binary or metadata', async () => {
    const test = build();
    await expect(test.repository.apply(test.tx, test.plan)).resolves.toBe(
      'ANONYMIZED',
    );
    expect(test.calls).toEqual([
      {
        sql: 'UPDATE identity_assurance.identity_evidence_records SET "evidence_identifier_hash" = NULL WHERE id = ? AND identity_verification_case_id = ?',
        params: ['synthetic-evidence', 'synthetic-case'],
      },
    ]);
    expect(test.prepare).not.toHaveBeenCalled();
  });
  it('rejects missing rules and a forged column before a simulated mutation', async () => {
    const test = build();
    test.plan.config.fieldOperations = [
      { columnName: 'id', operation: 'CLEAR' },
    ];
    await expect(test.repository.apply(test.tx, test.plan)).rejects.toThrow(
      'FIELD_OPERATION_UNSUPPORTED',
    );
    expect(test.calls).toHaveLength(0);
  });
  it('purge prepares the same coordinator before retiring only exact target rows, preserving case/WORM/consent', async () => {
    const test = build('PURGE');
    await expect(
      test.executor.execute(test.tx, test.plan),
    ).resolves.toMatchObject({ status: 'METADATA_RETIRED' });
    expect(test.prepare).toHaveBeenCalledWith(
      test.tx,
      expect.objectContaining({
        producer: 'identity-evidence.purge',
        tenantId: 'synthetic-tenant',
        targetId: 'synthetic-evidence',
      }),
    );
    expect(
      test.calls.every(
        (call) =>
          !/audit\.|identity_verification_cases|consent\./.test(call.sql),
      ),
    ).toBe(true);
    expect(
      test.calls.find((call) => call.sql.startsWith('DELETE FROM common.files'))
        ?.params,
    ).toEqual([`{${fileId}}`, 'synthetic-tenant']);
    expect(test.saved[0].dataSnapshot).toMatchObject({
      operation: 'PURGE',
      outcome: 'METADATA_RETIRED',
    });
    expect(JSON.stringify(test.saved)).not.toMatch(
      /storageUri|contentHash|subjectId/,
    );
    const count = test.calls.length;
    await expect(
      test.executor.execute(test.tx, test.plan),
    ).resolves.toMatchObject({ status: 'DUPLICATE' });
    expect(test.calls).toHaveLength(count);
  });
  it('an outside reference blocks even the controlled metadata mutation', async () => {
    const test = build('PURGE');
    test.plan.graph.externalReferenceCount = 1;
    await expect(test.repository.apply(test.tx, test.plan)).rejects.toThrow(
      'DISPOSITION_GUARDS_UNPROVEN',
    );
    expect(test.calls).toHaveLength(0);
    expect(test.prepare).not.toHaveBeenCalled();
  });

  it('binds metadata file/version/derivative arrays as scalar values, without executing SQL', async () => {
    const test = build('PURGE');
    test.plan.graph.derivatives = [
      {
        id: derivativeId,
        sourceFileVersionId: versionId,
        derivativeFileVersionId: versionId,
      },
    ];
    await test.repository.apply(test.tx, test.plan);
    const arrays = test.calls.filter((call) =>
      call.sql.includes('ANY(?::uuid[])'),
    );
    expect(arrays.map((call) => call.params)).toEqual([
      [`{${fileId}}`, 'synthetic-tenant'],
      [`{${derivativeId}}`],
      [`{${versionId}}`, `{${fileId}}`],
      [`{${fileId}}`, 'synthetic-tenant'],
    ]);
  });

  it('invalid retirement IDs fail closed before any recorded mutation or reservation', async () => {
    const test = build('PURGE');
    test.plan.graph.files[0].id = 'invalid-uuid';
    await expect(test.repository.apply(test.tx, test.plan)).rejects.toThrow(
      'REFERENCE_STATE_UNKNOWN',
    );
    expect(test.calls).toHaveLength(0);
    expect(test.prepare).not.toHaveBeenCalled();
  });
});
