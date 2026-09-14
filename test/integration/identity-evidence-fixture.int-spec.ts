import { describe, it, expect, jest, afterEach } from '@jest/globals';
import { createHash } from 'node:crypto';
import {
  fixtureRows,
  fixtureSpec,
  syntheticId,
  registryTables,
  createIdentityFixture,
} from './identity-evidence-fixture';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { StoragePublicationService } from '../../src/common/storage/storage-publication.service';
import type { FileStorageAdapter } from '../../src/common/storage/file-storage.adapter';
import type { IdentityEvidenceLifecycleService } from '../../src/modules/identity_assurance/services/identity-evidence-lifecycle.service';
import {
  verifyAnonymizationControl,
  type FixtureSnapshot,
} from './identity-evidence-anonymization';
import { IdentityLifecycleConfigResolver } from '../../src/modules/identity_assurance/identity-evidence-lifecycle.config';
import { GovernanceRepository } from '../../src/modules/system_ops/repositories/governance.repository';
import { EntityRegistry } from '../../src/modules/system_ops/entities/entity_registry.entity';
import { CONCEPTS } from '../../src/common/constants/concepts';
import { SYSOPS } from '../../src/modules/system_ops/system_ops.concepts';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('7.2 synthetic fixture construction (no DB/storage I/O)', () => {
  it('contains only deterministic synthetic IDs, minimal values and canonical table/column names', () => {
    const rows = fixtureRows((code) => `resolved:${code}`);
    expect(rows).toHaveLength(22);
    expect(new Set(rows.map((r) => r.values.id)).size).toBe(rows.length);
    expect(
      rows.every((r) =>
        String(r.values.id).startsWith('07200000-0000-4000-8000-000000000'),
      ),
    ).toBe(true);
    expect(
      rows.filter((r) => r.table === 'audit.identity_verification_access_log'),
    ).toHaveLength(5);
    expect(
      rows
        .filter((r) => r.table === 'directory.tenant_memberships')
        .map((r) => r.values.tenant_id),
    ).toEqual(fixtureSpec.tenantIds);
    expect(
      rows
        .filter(
          (r) => r.table === 'identity_assurance.identity_verification_cases',
        )
        .map((r) => r.values.id),
    ).toEqual(fixtureSpec.graphs.map((g) => g.caseId));
    expect(
      rows.find((r) => r.table === 'system_ops.legal_holds')?.values.ends_at,
    ).toBeNull();
    expect(registryTables).toHaveLength(8);
    expect(
      rows.find((r) => r.table === 'system_ops.anonymization_rules')?.values
        .parameters_json,
    ).toBe(JSON.stringify({ schemaVersion: 1, operation: 'CLEAR' }));
    expect(syntheticId(911)).toBe('07200000-0000-4000-8000-000000000911');
  });
  it('has no cleanup/reset path and rejects unaccredited environments before accessing a DB', async () => {
    await expect(
      createIdentityFixture(
        {} as EntityManager,
        {} as StoragePublicationService,
      ),
    ).rejects.toThrow('SYNTHETIC_FIXTURE_ENVIRONMENT_UNPROVEN');
  });
  it('wires the synthetic governance rows into the real configuration resolver without DB/storage I/O', async () => {
    jest.replaceProperty(process, 'env', {
      NODE_ENV: 'test',
      ENVIRONMENT_CLASS: 'LOCAL_TEST',
      IDENTITY_7_2_LIVE_PROOF: '/proof/input.json',
      DB_HOST: '127.0.0.1',
      DB_PORT: '55492',
      DB_NAME: 'identity_evidence_7_2_test',
    });
    const inserted: { table: string; values: Record<string, unknown> }[] = [];
    const rows = fixtureRows((code) => code);
    const codes = [
      ...new Set([
        fixtureSpec.hold.targetTypeConceptCode,
        fixtureSpec.hold.reasonConceptCode,
        ...fixtureSpec.auditBaseline.rows.flatMap((row) => [
          row.actionConceptCode,
          row.purposeOfUseConceptCode,
        ]),
      ]),
    ];
    const tx: any = {
      fork: () => tx,
      getTransactionContext: () => tx,
      transactional: async (action: (tx: EntityManager) => Promise<unknown>) =>
        action(tx),
      getConnection: () => ({
        execute: async (query: string, params: unknown[]) => {
          if (query.startsWith('SELECT code,id'))
            return codes.map((code) => ({ code, id: code }));
          if (query.startsWith('SELECT id')) return [];
          if (query.startsWith('UPDATE common.files SET current_version_id'))
            return [];
          const match = /^INSERT INTO ([a-z_.]+) \(([^)]+)\)/.exec(query);
          if (!match) throw new Error(`UNEXPECTED_FIXTURE_QUERY:${query}`);
          const columns = match[2].replaceAll('"', '').split(',');
          inserted.push({
            table: match[1],
            values: Object.fromEntries(
              columns.map((key, i) => [key, params[i]]),
            ),
          });
          return [];
        },
      }),
    };
    const publish = jest
      .fn<StoragePublicationService['publish']>()
      .mockImplementation(async (input, _context, action) =>
        action({
          tx,
          stored: {
            storageUri: `file://local/${createHash('sha256').update(input.buffer).digest('hex')}`,
            contentHash: createHash('sha256')
              .update(input.buffer)
              .digest('hex'),
            sizeBytes: input.buffer.length,
          },
        } as never),
      );
    const config = await createIdentityFixture(tx, {
      protectedNamespace: 'synthetic',
      publish,
    } as unknown as StoragePublicationService);
    expect(publish).toHaveBeenCalledTimes(5);
    const field = inserted.find(
      (row) => row.table === 'system_ops.field_registry',
    )!.values;
    expect(field).toMatchObject({
      id: syntheticId(914),
      anonymization_rule_id: syntheticId(915),
      column_name: 'evidence_identifier_hash',
      entity_registry_id: syntheticId(923),
    });
    const evidence = inserted.filter(
      (row) => row.table === 'identity_assurance.identity_evidence_records',
    );
    expect(evidence[0].values.evidence_identifier_hash).toBe(
      createHash('sha256')
        .update(fixtureSpec.anonymizationTest.syntheticIdentifier)
        .digest('hex'),
    );
    expect(
      evidence
        .slice(1)
        .every((row) => row.values.evidence_identifier_hash === null),
    ).toBe(true);
    const governance = new GovernanceRepository();
    jest
      .spyOn(governance, 'findRetentionPolicyByCode')
      .mockImplementation(async (_tx, code) => {
        const row = rows.find(
          (row) =>
            row.table === 'system_ops.retention_policies' &&
            row.values.code === code,
        )!.values;
        return {
          id: row.id,
          rowVersion: row.row_version,
          retentionPeriodDays: row.retention_period_days,
          dispositionConceptId: row.disposition_concept_id,
          stateConceptId: row.state_concept_id,
        } as never;
      });
    jest.spyOn(governance, 'findFieldById').mockResolvedValue({
      id: field.id,
      entityRegistryId: field.entity_registry_id,
      columnName: field.column_name,
      rowVersion: field.row_version,
      anonymizationRuleId: field.anonymization_rule_id,
    } as never);
    const rule = rows.find(
      (row) => row.table === 'system_ops.anonymization_rules',
    )!.values;
    jest.spyOn(governance, 'findAnonymizationRuleById').mockResolvedValue({
      id: rule.id,
      rowVersion: rule.row_version,
      techniqueConceptId: rule.technique_concept_id,
      parametersJson: JSON.parse(String(rule.parameters_json)),
    } as never);
    tx.find = async (entity: unknown, criteria: { code: string }) =>
      entity === EntityRegistry
        ? [
            {
              id: field.entity_registry_id,
              stateConceptId: CONCEPTS.STATE_ACTIVE,
              isAppendOnly: false,
            },
          ]
        : [
            {
              id:
                criteria.code === 'SO_DISP_ANONYMIZE'
                  ? SYSOPS.DISPOSITION_ANONYMIZE
                  : criteria.code === 'SO_DISP_DELETE'
                    ? SYSOPS.DISPOSITION_DELETE
                    : criteria.code,
              stateConceptId: CONCEPTS.STATE_ACTIVE,
            },
          ];
    const resolver = new IdentityLifecycleConfigResolver(governance, config);
    const resolve = (tenant: string, operation: 'ANONYMIZATION' | 'PURGE') =>
      resolver.resolve(
        tx,
        tenant,
        fixtureSpec.evidenceTypeConceptCode,
        operation,
      );
    await expect(
      resolve(fixtureSpec.tenantIds[0], 'ANONYMIZATION'),
    ).resolves.toMatchObject({
      fieldOperations: [
        { columnName: 'evidence_identifier_hash', operation: 'CLEAR' },
      ],
      rule: { storageDisposition: 'PRESERVE', metadataDisposition: 'MINIMIZE' },
    });
    await expect(
      resolve(fixtureSpec.tenantIds[0], 'PURGE'),
    ).resolves.toMatchObject({
      fieldOperations: [],
      rule: { storageDisposition: 'PURGE', metadataDisposition: 'REMOVE' },
    });
    await expect(
      resolve(fixtureSpec.tenantIds[1], 'ANONYMIZATION'),
    ).rejects.toThrow('MISSING_OR_DUPLICATE_BINDING');
  });
});

/** Real journey assertions, fake service/transport/state: no sockets, SQL or native delete. */
function anonymizationDouble() {
  const evidenceTable = 'identity_assurance.identity_evidence_records';
  const target = fixtureSpec.graphs[0];
  const state: FixtureSnapshot = {
    [evidenceTable]: fixtureSpec.graphs.map((graph) => ({
      id: graph.evidenceId,
      identity_verification_case_id: graph.caseId,
      evidence_file_id: graph.fileId,
      evidence_identifier_hash:
        graph.name === 'target'
          ? createHash('sha256')
              .update(fixtureSpec.anonymizationTest.syntheticIdentifier)
              .digest('hex')
          : null,
    })),
    'common.files': fixtureSpec.graphs.map((graph) => ({
      id: graph.fileId,
      tenant_id: graph.tenantId,
      current_version_id: graph.versionId,
    })),
    'common.file_versions': fixtureSpec.graphs.map((graph) => ({
      id: graph.versionId,
      file_id: graph.fileId,
    })),
    'identity_assurance.identity_verification_cases': fixtureSpec.graphs.map(
      (graph) => ({ id: graph.caseId, subject_entity_id: graph.tenantId }),
    ),
    'audit.identity_verification_access_log':
      fixtureSpec.auditBaseline.rows.map((row) => ({ ...row })),
    'system_ops.legal_holds': [{ ...fixtureSpec.hold }],
    revisions: [],
  };
  const bytes = new Map(
    fixtureSpec.graphs.map((graph) => [
      `file://local/${graph.object.sha256}`,
      Buffer.from(graph.object.bytesUtf8),
    ]),
  );
  const storage = {
    inspect: jest
      .fn<NonNullable<FileStorageAdapter['inspect']>>()
      .mockImplementation(async (uri) =>
        bytes.has(uri)
          ? {
              state: 'PRESENT',
              stored: {
                storageUri: uri,
                contentHash: uri.slice('file://local/'.length),
                sizeBytes: bytes.get(uri)!.length,
              },
            }
          : { state: 'ABSENT' },
      ),
    retrieve: jest
      .fn<FileStorageAdapter['retrieve']>()
      .mockImplementation(async (uri) => {
        if (!bytes.has(uri)) throw new Error('FAKE_OBJECT_ABSENT');
        return bytes.get(uri)!;
      }),
    delete: jest.fn<FileStorageAdapter['delete']>(),
  };
  let afterApply = () => {};
  let afterReplay = () => {};
  const execute = jest
    .fn<IdentityEvidenceLifecycleService['execute']>()
    .mockImplementation(async (id, tenant, _type, operation) => {
      expect([id, tenant, operation]).toEqual([
        target.evidenceId,
        target.tenantId,
        'ANONYMIZATION',
      ]);
      if (state.revisions.length) {
        afterReplay();
        return {
          status: 'DUPLICATE',
          reasonCode: 'DISPOSITION_ALREADY_RECORDED',
        };
      }
      state[evidenceTable][0].evidence_identifier_hash = null;
      state.revisions.push({
        id: syntheticId(950),
        schema_name: 'identity_assurance',
        table_name: 'identity_evidence_records',
        record_id: target.evidenceId,
        data_snapshot: {
          schemaVersion: 1,
          operation: 'ANONYMIZATION',
          outcome: 'ANONYMIZED',
          contractDigest: 'a'.repeat(64),
        },
      });
      afterApply();
      return {
        status: 'ANONYMIZED',
        reasonCode: 'PHYSICAL_DISPOSITION_NOT_EXECUTED',
      };
    });
  const snapshot = async () =>
    JSON.parse(JSON.stringify(state)) as FixtureSnapshot;
  return {
    state,
    bytes,
    storage,
    execute,
    onApply: (action: () => void) => {
      afterApply = action;
    },
    onReplay: (action: () => void) => {
      afterReplay = action;
    },
    run: () =>
      verifyAnonymizationControl({ lifecycle: { execute }, snapshot, storage }),
  };
}

describe('ANONYMIZATION journey wiring with controlled adapters', () => {
  it('clears only the configured field, preserves every object and WORM, and replays idempotently', async () => {
    const f = anonymizationDouble();
    await f.run();
    expect(f.execute).toHaveBeenCalledTimes(2);
    expect(f.storage.delete).not.toHaveBeenCalled();
    expect(f.state.revisions).toHaveLength(1);
    expect(f.bytes.size).toBe(4);
  });
  it.each(['DENIED', 'DESTRUCTIVE_BOUNDARY'] as const)(
    'does not misreport %s as applied',
    async (status) => {
      const f = anonymizationDouble();
      f.execute.mockResolvedValue({ status, reasonCode: 'SYNTHETIC_DENY' });
      await expect(f.run()).rejects.toThrow();
      expect(f.execute).toHaveBeenCalledTimes(1);
      expect(f.state.revisions).toHaveLength(0);
      expect(f.storage.delete).not.toHaveBeenCalled();
    },
  );
  it.each([
    'field-not-cleared',
    'extra-field',
    'other-tenant',
    'metadata',
    'version',
    'case',
    'hold',
    'worm',
    'missing-bytes',
    'changed-bytes',
    'shared-bytes',
    'sensitive-receipt',
    'missing-receipt',
    'wrong-receipt-target',
    'replay',
  ])('rejects a false successful control with %s drift', async (fault) => {
    const f = anonymizationDouble();
    f.onApply(() => {
      const rows = f.state['identity_assurance.identity_evidence_records'];
      if (fault === 'field-not-cleared')
        rows[0].evidence_identifier_hash = 'still-present';
      if (fault === 'extra-field') rows[0].evidence_file_id = null;
      if (fault === 'other-tenant') rows[1].evidence_file_id = null;
      const table = {
        metadata: 'common.files',
        version: 'common.file_versions',
        case: 'identity_assurance.identity_verification_cases',
        hold: 'system_ops.legal_holds',
        worm: 'audit.identity_verification_access_log',
      }[fault];
      if (table) f.state[table] = [];
      const targetUri = `file://local/${fixtureSpec.graphs[0].object.sha256}`;
      if (fault === 'missing-bytes') f.bytes.delete(targetUri);
      if (fault === 'changed-bytes')
        f.bytes.set(targetUri, Buffer.from('SYNTHETIC-CHANGED'));
      if (fault === 'shared-bytes')
        f.bytes.delete(`file://local/${fixtureSpec.graphs[2].object.sha256}`);
      if (fault === 'sensitive-receipt')
        (
          f.state.revisions[0].data_snapshot as Record<string, unknown>
        ).evidence = 'SYNTHETIC-SNAPSHOT-FORBIDDEN';
      if (fault === 'missing-receipt') f.state.revisions = [];
      if (fault === 'wrong-receipt-target')
        f.state.revisions[0].record_id = fixtureSpec.graphs[1].evidenceId;
    });
    if (fault === 'replay')
      f.onReplay(() => {
        f.state.revisions.push({ ...f.state.revisions[0] });
      });
    await expect(f.run()).rejects.toThrow();
    expect(f.storage.delete).not.toHaveBeenCalled();
  });
  it('rejects UNKNOWN storage inspection before any operation', async () => {
    const f = anonymizationDouble();
    f.storage.inspect.mockResolvedValue({ state: 'UNKNOWN' });
    await expect(f.run()).rejects.toThrow();
    expect(f.execute).not.toHaveBeenCalled();
  });
});
