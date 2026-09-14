import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS as C } from '../../src/common/constants/concepts';
import { DIR } from '../../src/modules/directory/directory.concepts';
import { IDA } from '../../src/modules/identity_assurance/identity_assurance.concepts';
import { SYSOPS } from '../../src/modules/system_ops/system_ops.concepts';
import type { StoragePublicationService } from '../../src/common/storage/storage-publication.service';
import type { IdentityLifecycleConfig } from '../../src/modules/identity_assurance/identity-evidence-lifecycle.config';
import spec from '../fixtures/identity-evidence-lifecycle.json';

export const syntheticId = (n: number) =>
  `07200000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export const fixtureSpec = spec;
export const registryTables = [
  'directory.tenants',
  'directory.tenant_memberships',
  'identity_assurance.identity_verification_cases',
  'identity_assurance.identity_evidence_records',
  'common.files',
  'common.file_versions',
  'common.file_derivatives',
  'common.file_links',
];
type Row = {
  table: string;
  values: Record<string, string | number | boolean | null>;
};
const stamp = {
  created_at: spec.createdAt,
  updated_at: spec.createdAt,
  row_version: 1,
};

/** Literal synthetic records only. No schema generation, business-row copying or cleanup. */
export function fixtureRows(concept: (code: string) => string): Row[] {
  const rows: Row[] = [];
  const add = (table: string, values: Row['values']) =>
    rows.push({ table, values });
  spec.ownerUserIds.forEach((id, i) =>
    add('iam.users', {
      id,
      display_name: `SYNTHETIC-7.2-${i}`,
      status_concept_id: C.USER_ACTIVE,
      ...stamp,
    }),
  );
  spec.tenantIds.forEach((id, i) => {
    add('directory.tenants', {
      id,
      code: `SYNTHETIC-7.2-${i}`,
      legal_name: `SYNTHETIC-7.2-${i}`,
      tenant_type_concept_id: C.TENANT_TYPE_PROVIDER,
      legal_entity_type_concept_id: C.LEGAL_ENTITY_COMPANY,
      status_concept_id: C.TENANT_ACTIVE,
      verification_status_concept_id: C.TENANT_VERIFIED,
      ...stamp,
    });
    add('directory.tenant_memberships', {
      id: spec.membershipIds[i],
      user_id: spec.ownerUserIds[i],
      tenant_id: id,
      tenant_role_concept_id: DIR.ROLE_OWNER,
      status_concept_id: DIR.MEMBERSHIP_ACTIVE,
      access_scope_concept_id: DIR.SCOPE_ALL_TENANT,
      start_date: spec.createdAt,
      ...stamp,
    });
  });
  add('identity_assurance.identity_verification_policies', {
    id: syntheticId(910),
    policy_code: 'SYNTHETIC-7.2-IDENTITY',
    subject_type_concept_id: IDA.SUBJECT_TENANT_IDENTITY,
    transaction_risk_concept_id: IDA.TRANSACTION_RISK_STANDARD,
    required_identity_assurance_level_concept_id: IDA.ASSURANCE_LEVEL_IAL2,
    version_number: 1,
    effective_from: spec.createdAt,
    status_concept_id: C.STATE_ACTIVE,
    created_at: spec.createdAt,
  });
  add('system_ops.retention_policies', {
    id: syntheticId(911),
    code: 'SYNTHETIC-7.2-RETENTION',
    name: 'SYNTHETIC test vector; not a legal period',
    retention_period_days: 0,
    disposition_concept_id: SYSOPS.DISPOSITION_DELETE,
    state_concept_id: C.STATE_ACTIVE,
    ...stamp,
  });
  add('messaging.message_queues', {
    id: syntheticId(912),
    code: 'SYNTHETIC-7.2-STORAGE',
    name: 'SYNTHETIC-7.2-STORAGE',
    state_concept_id: C.STATE_ACTIVE,
    ...stamp,
  });
  for (const graph of spec.graphs) {
    add('identity_assurance.identity_verification_cases', {
      id: graph.caseId,
      subject_type_concept_id: IDA.SUBJECT_TENANT_IDENTITY,
      subject_entity_id: graph.tenantId,
      identity_verification_policy_id: syntheticId(910),
      status_concept_id: IDA.CASE_VERIFIED,
      ...stamp,
    });
  }
  add('system_ops.legal_holds', {
    id: spec.hold.id,
    tenant_id: spec.hold.tenantId,
    target_type_concept_id: concept(spec.hold.targetTypeConceptCode),
    target_id: spec.hold.targetId,
    reason_concept_id: concept(spec.hold.reasonConceptCode),
    status_concept_id: C.STATE_ACTIVE,
    authority_reference: spec.hold.authorityReference,
    starts_at: spec.hold.startsAt,
    ends_at: null,
    ...stamp,
  });
  for (const row of spec.auditBaseline.rows)
    add(spec.auditBaseline.table, {
      id: row.id,
      verification_case_id: row.verificationCaseId,
      actor_user_id: row.actorUserId,
      action_concept_id: concept(row.actionConceptCode),
      purpose_of_use_concept_id: concept(row.purposeOfUseConceptCode),
      outcome_concept_id: C.OUTCOME_SUCCESS,
      evidence_type_concept_id: IDA.EVIDENCE_TYPE_INSTITUTION_DOCUMENT,
      occurred_at: row.occurredAt,
    });
  return rows;
}

/** Table/column names originate exclusively from this module's literal builders. */
async function insert(tx: EntityManager, row: Row): Promise<void> {
  if (
    !/^[a-z_]+\.[a-z_]+$/.test(row.table) ||
    Object.keys(row.values).some((key) => !/^[a-z_]+$/.test(key))
  )
    throw new Error('FIXTURE_IDENTIFIER_INVALID');
  const columns = Object.keys(row.values);
  await tx
    .getConnection('write')
    .execute(
      `INSERT INTO ${row.table} (${columns.map((c) => `"${c}"`).join(',')}) VALUES (${columns.map(() => '?').join(',')})`,
      Object.values(row.values),
      'run',
      tx.getTransactionContext(),
    );
}

export async function createIdentityFixture(
  em: EntityManager,
  publication: StoragePublicationService,
): Promise<IdentityLifecycleConfig> {
  if (
    process.env.IDENTITY_7_2_LIVE_PROOF !== '/proof/input.json' ||
    process.env.ENVIRONMENT_CLASS !== 'LOCAL_TEST' ||
    process.env.NODE_ENV !== 'test' ||
    process.env.DB_HOST !== '127.0.0.1' ||
    process.env.DB_PORT !== '55492' ||
    process.env.DB_NAME !== 'identity_evidence_7_2_test' ||
    !publication.protectedNamespace
  )
    throw new Error('SYNTHETIC_FIXTURE_ENVIRONMENT_UNPROVEN');
  const tx = em.fork();
  const concepts = await tx
    .getConnection('write')
    .execute<{ code: string; id: string }[]>(
      'SELECT code,id FROM terminology.catalog_concepts WHERE state_concept_id = ?',
      [C.STATE_ACTIVE],
    );
  const concept = (code: string): string => {
    const found = concepts.filter((row) => row.code === code);
    if (found.length !== 1)
      throw new Error(`FIXTURE_CONCEPT_UNRESOLVED:${code}`);
    return found[0].id;
  };
  const rows = fixtureRows(concept);
  // Prove every fixture ID absent BEFORE writing any row or physical object.
  const identities = rows.map((row) => ({
    table: row.table,
    id: row.values.id,
  }));
  for (const g of spec.graphs)
    identities.push(
      { table: 'common.files', id: g.fileId },
      { table: 'common.file_versions', id: g.versionId },
      {
        table: 'identity_assurance.identity_evidence_records',
        id: g.evidenceId,
      },
    );
  for (const row of identities) {
    const found = await tx
      .getConnection('write')
      .execute(`SELECT id FROM ${row.table} WHERE id = ?`, [row.id]);
    if (found.length) throw new Error('FIXTURE_COLLISION_DO_NOT_REUSE');
  }
  let evidenceRegistryId = '';
  await tx.transactional(async (t) => {
    for (const row of rows) await insert(t, row);
    for (let i = 0; i < registryTables.length; i++) {
      const [schema, table] = registryTables[i].split('.');
      const found = await t
        .getConnection('write')
        .execute<
          { id: string; state_concept_id: string; is_append_only: boolean }[]
        >(
          'SELECT id,state_concept_id,is_append_only FROM system_ops.entity_registry WHERE schema_name = ? AND table_name = ?',
          [schema, table],
          'all',
          t.getTransactionContext(),
        );
      if (
        found.length > 1 ||
        (found.length &&
          (found[0].state_concept_id !== C.STATE_ACTIVE ||
            found[0].is_append_only))
      )
        throw new Error('FIXTURE_REGISTRY_INCOMPATIBLE');
      const id = found[0]?.id ?? syntheticId(920 + i);
      if (!found.length)
        await insert(t, {
          table: 'system_ops.entity_registry',
          values: {
            id,
            schema_name: schema,
            table_name: table,
            is_append_only: false,
            is_soft_delete: false,
            has_history: false,
            state_concept_id: C.STATE_ACTIVE,
            ...stamp,
          },
        });
      if (table === 'identity_evidence_records') evidenceRegistryId = id;
    }
  });
  for (const g of spec.graphs)
    await publication.publish(
      {
        buffer: Buffer.from(g.object.bytesUtf8),
        originalName: g.filename,
        mimeType: g.mimeType,
      },
      {
        tenantId: g.tenantId,
        producer: 'synthetic-7.2-fixture',
        targetId: g.fileId,
      },
      async ({ tx: t, stored }) => {
        if (
          stored.contentHash !== g.object.sha256 ||
          stored.storageUri !== `file://local/${g.object.sha256}`
        )
          throw new Error('FIXTURE_STORAGE_MISMATCH');
        await insert(t, {
          table: 'common.files',
          values: {
            id: g.fileId,
            tenant_id: g.tenantId,
            category_concept_id: C.FILE_CATEGORY_DOCUMENT,
            sensitivity_concept_id: C.SENSITIVITY_NORMAL,
            lifecycle_status_concept_id: C.FILE_ACTIVE,
            original_name: g.filename,
            created_by_user_id: g.ownerUserId,
            ...stamp,
          },
        });
        await insert(t, {
          table: 'common.file_versions',
          values: {
            id: g.versionId,
            file_id: g.fileId,
            version_number: 1,
            storage_provider_concept_id: C.STORAGE_PROVIDER_S3,
            storage_region_concept_id: C.STORAGE_REGION_DEFAULT,
            storage_uri: stored.storageUri,
            mime_type: g.mimeType,
            size_bytes: stored.sizeBytes,
            checksum_algorithm_concept_id: C.CHECKSUM_SHA256,
            content_hash: stored.contentHash,
            encryption_status_concept_id: C.ENCRYPTION_NONE,
            malware_scan_status_concept_id: C.SCAN_CLEAN,
            recorded_at: spec.createdAt,
            recorded_by_user_id: g.ownerUserId,
          },
        });
        await t
          .getConnection('write')
          .execute(
            'UPDATE common.files SET current_version_id = ? WHERE id = ? AND tenant_id = ?',
            [g.versionId, g.fileId, g.tenantId],
            'run',
            t.getTransactionContext(),
          );
        await insert(t, {
          table: 'identity_assurance.identity_evidence_records',
          values: {
            id: g.evidenceId,
            identity_verification_case_id: g.caseId,
            evidence_type_concept_id: IDA.EVIDENCE_TYPE_INSTITUTION_DOCUMENT,
            evidence_file_id: g.fileId,
            verification_status_concept_id: IDA.EVIDENCE_PENDING,
            created_at: spec.createdAt,
            created_by_user_id: g.ownerUserId,
          },
        });
        return g.fileId;
      },
    );
  return {
    schemaVersion: 1,
    revision: 'SYNTHETIC-7.2-v1',
    enabled: true,
    rules: [
      {
        tenantId: spec.tenantIds[0],
        evidenceTypeConceptCode: spec.evidenceTypeConceptCode,
        operation: 'PURGE',
        retentionPolicyCode: 'SYNTHETIC-7.2-RETENTION',
        expectedRowVersion: 1,
        expectedDispositionConceptCode: 'SO_DISP_DELETE',
        entityRegistryId: evidenceRegistryId,
        baseEvent: 'evidence.createdAt',
        allowedCaseStatusConceptCodes: [spec.caseStatusConceptCode],
        additionalWaitSeconds: 0,
        fieldRules: [],
        metadataDisposition: 'REMOVE',
        preserveProfile: 'CASE_ANCHOR_WORM_TECHNICAL_REVISION',
        storageDisposition: 'PURGE',
        authorizationRevision: 'ENDER-D01-D08:SYNTHETIC-7.2-v1',
      },
    ],
  };
}
