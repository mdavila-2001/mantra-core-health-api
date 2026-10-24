import { jest } from '@jest/globals';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IdentityEvidenceLifecycleRepository } from './identity-evidence-lifecycle.repository';
import { IDA } from '../identity_assurance.concepts';
import { DIR } from '../../directory/directory.concepts';
import { PROF } from '../../profiles/profiles.concepts';
import { CONCEPTS, SEED } from '../../../common/constants/concepts';

const now = new Date('2026-01-02T00:00:00Z');
const past = new Date('2026-01-01T00:00:00Z');
const fileId = '10000000-0000-4000-8000-000000000001';
const versionId = '20000000-0000-4000-8000-000000000002';
function build() {
  const evidence = {
    id: 'synthetic-evidence',
    identityVerificationCaseId: 'synthetic-case',
    evidenceTypeConceptId: 'synthetic-type',
    evidenceFileId: fileId,
    createdAt: past,
    createdByUserId: 'synthetic-user',
    collectedUnderConsentId: undefined as string | undefined,
  };
  const kase = {
    id: 'synthetic-case',
    subjectTypeConceptId: IDA.SUBJECT_TENANT_IDENTITY,
    subjectEntityId: 'synthetic-tenant',
    statusConceptId: 'synthetic-terminal',
    createdAt: past,
    rowVersion: 1,
  };
  const file = {
    id: fileId,
    tenantId: 'synthetic-tenant',
    createdByUserId: 'synthetic-user',
    currentVersionId: versionId,
    lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
  };
  const version = {
    id: versionId,
    fileId: file.id,
    storageUri: 'synthetic://object',
    contentHash: 'a'.repeat(64),
    sizeBytes: '1',
  };
  const members = [
    {
      id: 'synthetic-member',
      userId: 'synthetic-user',
      tenantId: 'synthetic-tenant',
      statusConceptId: DIR.MEMBERSHIP_ACTIVE,
      startDate: past,
    },
  ];
  const rows: Record<string, unknown[]> = {
    IdentityEvidenceRecords: [evidence],
    IdentityVerificationCases: [kase],
    Files: [file],
    FileVersions: [version],
    FileDerivatives: [],
    TenantMemberships: members,
    Tenants: [{ id: 'synthetic-tenant' }],
    Persons: [{ id: 'synthetic-person' }],
    PersonAccountLinks: [
      {
        id: 'synthetic-account-link',
        personId: 'synthetic-person',
        userId: 'synthetic-user',
        statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
        validFrom: past,
      },
    ],
    JurisdictionAuthorizations: [
      { id: 'synthetic-license', practitionerProfileId: 'synthetic-person' },
    ],
    Consents: [],
  };
  let opaque = false;
  let count = 0;
  const find = jest.fn(
    async (entity: { name: string }, where: Record<string, unknown>) => {
      if (entity.name === 'EntityRegistry')
        return [
          {
            id: `registry:${String(where.schemaName)}.${String(where.tableName)}`,
            stateConceptId: CONCEPTS.STATE_ACTIVE,
          },
        ];
      return rows[entity.name] ?? [];
    },
  );
  const execute = jest.fn(async (sql: string) =>
    sql.includes('pg_constraint')
      ? [
          {
            source_schema: 'common',
            source_table: 'file_links',
            column_name: 'file_id',
            target_schema: 'common',
            target_table: 'files',
            columns: 1,
          },
        ]
      : sql.includes('count(*)')
        ? [{ count: String(count) }]
        : [{ present: opaque }],
  );
  const tx = {
    find,
    findOne: async (entity: { name: string }, where: Record<string, unknown>) =>
      (await find(entity, where))[0] ?? null,
    getConnection: () => ({ execute }),
    getTransactionContext: () => 'synthetic-transaction',
  } as unknown as EntityManager;
  return {
    evidence,
    kase,
    file,
    members,
    rows,
    execute,
    find,
    opaque: () => {
      opaque = true;
    },
    referenced: () => {
      count = 1;
    },
    run: (tenantId = 'synthetic-tenant') =>
      new IdentityEvidenceLifecycleRepository().graph(
        tx,
        evidence.id,
        tenantId,
        now,
      ),
  };
}

describe('real ownership graph queries with controlled metadata only', () => {
  it('requires subject + exact tenant + owner + file + membership, not a claimed tenant alone', async () => {
    const test = build();
    const graph = await test.run();
    expect(graph).toMatchObject({
      ownerResolved: true,
      tenantId: 'synthetic-tenant',
      externalReferenceCount: 0,
      holdCoverage: 'PROVEN',
    });
    expect(graph.recordIds).toEqual(
      expect.arrayContaining([
        'synthetic-tenant',
        'synthetic-case',
        'synthetic-evidence',
        fileId,
        versionId,
      ]),
    );
  });
  it('does not infer ownership from the default upload tenant', async () => {
    const test = build();
    test.kase.subjectEntityId = SEED.tenantId;
    await expect(test.run(SEED.tenantId)).rejects.toThrow(
      'OWNER_TENANT_UNPROVEN',
    );
  });
  it('denies cross-tenant file inclusion', async () => {
    const test = build();
    test.file.tenantId = 'other-tenant';
    await expect(test.run()).rejects.toThrow('CROSS_TENANT_OR_OWNER_FILE');
  });
  it('denies a file belonging to another user', async () => {
    const test = build();
    test.file.createdByUserId = 'other-user';
    await expect(test.run()).rejects.toThrow('CROSS_TENANT_OR_OWNER_FILE');
  });
  it('denies missing owners and ambiguous tenant memberships', async () => {
    const missing = build();
    missing.evidence.createdByUserId = '';
    await expect(missing.run()).rejects.toThrow('OWNER_UNKNOWN');
    const multiple = build();
    multiple.members.push({ ...multiple.members[0], tenantId: 'other-tenant' });
    await expect(multiple.run()).rejects.toThrow('TENANT_AMBIGUOUS');
  });
  it('traces practitioner license through its real practitioner/person relationship', async () => {
    const test = build();
    test.kase.subjectTypeConceptId = IDA.SUBJECT_PRACTITIONER_LICENSE;
    test.kase.subjectEntityId = 'synthetic-license';
    await expect(test.run()).resolves.toMatchObject({
      subjectId: 'synthetic-person',
      ownerResolved: true,
    });
  });
  it('keeps opaque locators unknown without opening or decoding their contents', async () => {
    const test = build();
    test.opaque();
    await expect(test.run()).resolves.toMatchObject({ opaqueReference: true });
  });
  it('counts external links instead of treating a planned retirement as refcount zero', async () => {
    const test = build();
    test.referenced();
    await expect(test.run()).resolves.toMatchObject({
      externalReferenceCount: 1,
    });
    expect(test.execute).toHaveBeenCalledWith(
      expect.stringContaining('ANY(?::uuid[])'),
      [`{${fileId}}`],
      'all',
      'synthetic-transaction',
    );
  });
  it('rejects a current-version pointer outside the evidence file', async () => {
    const test = build();
    test.file.currentVersionId = 'other-version';
    await expect(test.run()).rejects.toThrow('CURRENT_VERSION_UNKNOWN');
  });
  it('does not accept a consent from another subject or tenant', async () => {
    const test = build();
    test.evidence.collectedUnderConsentId = 'synthetic-consent';
    test.rows.Consents = [
      {
        id: 'synthetic-consent',
        tenantId: 'other-tenant',
        patientProfileId: 'other-person',
      },
    ];
    await expect(test.run()).rejects.toThrow('CONSENT_OWNERSHIP_UNKNOWN');
  });
});
