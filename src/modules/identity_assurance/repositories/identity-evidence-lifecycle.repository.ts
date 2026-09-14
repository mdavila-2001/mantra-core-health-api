import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { StorageLifecycleDenied } from '../../../common/storage/storage-lifecycle.protocol';
import { bindStorageReferenceIds } from '../../../common/storage/storage-reference.repository';
import { IdentityEvidenceRecords } from '../entities/identity_evidence_records.entity';
import { IdentityVerificationCases } from '../entities/identity_verification_cases.entity';
import { Files } from '../../common/entities/files.entity';
import { FileVersions } from '../../common/entities/file_versions.entity';
import { FileDerivatives } from '../../common/entities/file_derivatives.entity';
import { PersonAccountLinks } from '../../profiles/entities/person_account_links.entity';
import { JurisdictionAuthorizations } from '../../profiles/entities/jurisdiction_authorizations.entity';
import { Persons } from '../../profiles/entities/persons.entity';
import { TenantMemberships } from '../../directory/entities/tenant_memberships.entity';
import { Tenants } from '../../directory/entities/tenants.entity';
import { Consents } from '../../consent/entities/consents.entity';
import { EntityRegistry } from '../../system_ops/entities/entity_registry.entity';
import { IDA } from '../identity_assurance.concepts';
import { DIR } from '../../directory/directory.concepts';
import { PROF } from '../../profiles/profiles.concepts';
import { CONCEPTS, SEED } from '../../../common/constants/concepts';

export interface IdentityEvidenceGraph {
  tenantId: string;
  ownerResolved: boolean;
  subjectId: string;
  evidence: Pick<
    IdentityEvidenceRecords,
    | 'id'
    | 'identityVerificationCaseId'
    | 'evidenceTypeConceptId'
    | 'evidenceFileId'
    | 'createdAt'
    | 'issuedAt'
    | 'expiresAt'
    | 'createdByUserId'
    | 'collectedUnderConsentId'
  >;
  case: Pick<
    IdentityVerificationCases,
    | 'id'
    | 'subjectTypeConceptId'
    | 'subjectEntityId'
    | 'statusConceptId'
    | 'createdAt'
    | 'openedAt'
    | 'completedAt'
    | 'expiresAt'
    | 'rowVersion'
  >;
  files: Pick<
    Files,
    | 'id'
    | 'tenantId'
    | 'createdByUserId'
    | 'currentVersionId'
    | 'deletedAt'
    | 'legalHoldUntil'
    | 'lifecycleStatusConceptId'
  >[];
  versions: Pick<
    FileVersions,
    | 'id'
    | 'fileId'
    | 'storageUri'
    | 'contentHash'
    | 'objectVersion'
    | 'objectKey'
    | 'bucketOrContainer'
    | 'externalSourceUri'
    | 'sizeBytes'
  >[];
  derivatives: Pick<
    FileDerivatives,
    'id' | 'sourceFileVersionId' | 'derivativeFileVersionId'
  >[];
  registryIds: string[];
  recordIds: string[];
  holdCoverage: 'PROVEN' | 'UNKNOWN';
  externalReferenceCount: number;
  opaqueReference: boolean;
}

const dateInRange = (from: Date, until: Date | undefined, now: Date) =>
  from instanceof Date &&
  Number.isFinite(from.getTime()) &&
  from <= now &&
  (until == null ||
    (until instanceof Date && Number.isFinite(until.getTime()) && until > now));

/** Loads technical graph only, never binary, names, document hashes or WORM payloads. */
@Injectable()
export class IdentityEvidenceLifecycleRepository {
  async graph(
    tx: EntityManager,
    evidenceId: string,
    tenantId: string,
    now: Date,
  ): Promise<IdentityEvidenceGraph> {
    const evidence = await tx.findOne(
      IdentityEvidenceRecords,
      { id: evidenceId },
      {
        refresh: true,
        fields: [
          'id',
          'identityVerificationCaseId',
          'evidenceTypeConceptId',
          'evidenceFileId',
          'createdAt',
          'issuedAt',
          'expiresAt',
          'createdByUserId',
          'collectedUnderConsentId',
        ],
      },
    );
    if (!evidence) throw new StorageLifecycleDenied('EVIDENCE_NOT_FOUND');
    const kase = await tx.findOne(
      IdentityVerificationCases,
      { id: evidence.identityVerificationCaseId },
      {
        refresh: true,
        fields: [
          'id',
          'subjectTypeConceptId',
          'subjectEntityId',
          'statusConceptId',
          'createdAt',
          'openedAt',
          'completedAt',
          'expiresAt',
          'rowVersion',
        ],
      },
    );
    if (!kase) throw new StorageLifecycleDenied('CASE_UNKNOWN');
    const versions = evidence.evidenceFileId
      ? await tx.find(
          FileVersions,
          { fileId: evidence.evidenceFileId },
          {
            refresh: true,
            fields: [
              'id',
              'fileId',
              'storageUri',
              'contentHash',
              'objectVersion',
              'objectKey',
              'bucketOrContainer',
              'externalSourceUri',
              'sizeBytes',
            ],
          },
        )
      : [];
    const versionIds = versions.map((version) => version.id);
    // Both ends are checked. Cross-file derivatives remain a blocking reference,
    // never silently expand the deletion target to another aggregate/tenant.
    const derivatives = versionIds.length
      ? await tx.find(
          FileDerivatives,
          {
            $or: [
              { sourceFileVersionId: { $in: versionIds } },
              { derivativeFileVersionId: { $in: versionIds } },
            ],
          },
          {
            fields: ['id', 'sourceFileVersionId', 'derivativeFileVersionId'],
            refresh: true,
          },
        )
      : [];
    const files = evidence.evidenceFileId
      ? await tx.find(
          Files,
          { id: evidence.evidenceFileId },
          {
            refresh: true,
            fields: [
              'id',
              'tenantId',
              'createdByUserId',
              'currentVersionId',
              'deletedAt',
              'legalHoldUntil',
              'lifecycleStatusConceptId',
            ],
          },
        )
      : [];
    let subjectId = kase.subjectEntityId;
    const subjectTables = ['directory.tenants'];
    if (kase.subjectTypeConceptId === IDA.SUBJECT_PRACTITIONER_LICENSE) {
      const authorization = await tx.findOne(
        JurisdictionAuthorizations,
        { id: subjectId },
        { fields: ['id', 'practitionerProfileId'], refresh: true },
      );
      if (!authorization) throw new StorageLifecycleDenied('OWNER_UNKNOWN');
      subjectId = authorization.practitionerProfileId;
      subjectTables.push('profiles.jurisdiction_authorizations');
    }
    const tenantSubject =
      kase.subjectTypeConceptId === IDA.SUBJECT_TENANT_IDENTITY;
    if (
      !tenantSubject &&
      ![
        IDA.SUBJECT_PATIENT_IDENTITY,
        IDA.SUBJECT_PRACTITIONER_IDENTITY,
        IDA.SUBJECT_PRACTITIONER_LICENSE,
      ].includes(kase.subjectTypeConceptId)
    )
      throw new StorageLifecycleDenied('SUBJECT_TYPE_UNKNOWN');
    if (tenantSubject && subjectId !== tenantId)
      throw new StorageLifecycleDenied('TENANT_MISMATCH');
    if (!tenantId || tenantId === SEED.tenantId)
      throw new StorageLifecycleDenied('OWNER_TENANT_UNPROVEN');
    if (
      !(await tx.findOne(
        Tenants,
        { id: tenantId },
        { fields: ['id'], refresh: true },
      ))
    )
      throw new StorageLifecycleDenied('TENANT_UNKNOWN');
    let ownerUserIds: string[];
    const ownershipRecordIds: string[] = [];
    if (tenantSubject) {
      ownerUserIds = evidence.createdByUserId ? [evidence.createdByUserId] : [];
    } else {
      subjectTables.push('profiles.persons', 'profiles.person_account_links');
      if (
        !(await tx.findOne(
          Persons,
          { id: subjectId },
          { fields: ['id'], refresh: true },
        ))
      )
        throw new StorageLifecycleDenied('SUBJECT_UNKNOWN');
      const links = await tx.find(
        PersonAccountLinks,
        { personId: subjectId, statusConceptId: PROF.ACCOUNT_LINK_ACTIVE },
        { fields: ['id', 'userId', 'validFrom', 'validTo'], refresh: true },
      );
      ownerUserIds = links
        .filter((link) => dateInRange(link.validFrom, link.validTo, now))
        .map((link) => link.userId);
      ownershipRecordIds.push(...links.map((link) => link.id));
    }
    if (
      ownerUserIds.length !== 1 ||
      !evidence.createdByUserId ||
      !ownerUserIds.includes(evidence.createdByUserId)
    )
      throw new StorageLifecycleDenied('OWNER_UNKNOWN');
    const memberships = await tx.find(
      TenantMemberships,
      { userId: { $in: ownerUserIds }, statusConceptId: DIR.MEMBERSHIP_ACTIVE },
      {
        fields: ['id', 'tenantId', 'userId', 'startDate', 'endDate'],
        refresh: true,
      },
    );
    const tenants = new Set(
      memberships
        .filter((member) => dateInRange(member.startDate, member.endDate, now))
        .map((member) => member.tenantId),
    );
    ownershipRecordIds.push(...memberships.map((member) => member.id));
    if (tenants.size !== 1 || !tenants.has(tenantId))
      throw new StorageLifecycleDenied('TENANT_AMBIGUOUS');
    if (evidence.evidenceFileId && (files.length !== 1 || !versions.length))
      throw new StorageLifecycleDenied('FILE_GRAPH_UNKNOWN');
    for (const file of files) {
      if (
        file.tenantId !== tenantId ||
        !file.createdByUserId ||
        !ownerUserIds.includes(file.createdByUserId)
      )
        throw new StorageLifecycleDenied('CROSS_TENANT_OR_OWNER_FILE');
      if (file.currentVersionId && !versionIds.includes(file.currentVersionId))
        throw new StorageLifecycleDenied('CURRENT_VERSION_UNKNOWN');
    }
    if (evidence.collectedUnderConsentId) {
      const consent = await tx.findOne(
        Consents,
        { id: evidence.collectedUnderConsentId },
        { fields: ['id', 'tenantId', 'patientProfileId'], refresh: true },
      );
      if (
        !consent ||
        consent.tenantId !== tenantId ||
        tenantSubject ||
        consent.patientProfileId !== subjectId
      )
        throw new StorageLifecycleDenied('CONSENT_OWNERSHIP_UNKNOWN');
      subjectTables.push('consent.consents');
    }
    const tables = [
      ...subjectTables,
      'directory.tenant_memberships',
      'identity_assurance.identity_verification_cases',
      'identity_assurance.identity_evidence_records',
      ...(files.length
        ? [
            'common.files',
            'common.file_versions',
            'common.file_derivatives',
            'common.file_links',
          ]
        : []),
    ];
    const registryIds: string[] = [];
    let holdCoverage: 'PROVEN' | 'UNKNOWN' = 'PROVEN';
    for (const table of new Set(tables)) {
      const [schemaName, tableName] = table.split('.');
      const registry = await tx.find(
        EntityRegistry,
        { schemaName, tableName },
        { fields: ['id', 'stateConceptId'], refresh: true },
      );
      if (
        registry.length !== 1 ||
        registry[0].stateConceptId !== CONCEPTS.STATE_ACTIVE
      )
        holdCoverage = 'UNKNOWN';
      else registryIds.push(registry[0].id);
    }
    const opaque = await tx
      .getConnection('write')
      .execute<{ present: boolean }[]>(
        'SELECT encrypted_evidence_reference IS NOT NULL AS present FROM identity_assurance.identity_evidence_records WHERE id = ?',
        [evidenceId],
        'all',
        tx.getTransactionContext(),
      );
    if (opaque.length !== 1 || typeof opaque[0].present !== 'boolean')
      throw new StorageLifecycleDenied('EXTERNAL_REFERENCE_UNKNOWN');
    const graph: IdentityEvidenceGraph = {
      tenantId,
      ownerResolved: true,
      subjectId,
      evidence,
      case: kase,
      files,
      versions,
      derivatives,
      registryIds,
      recordIds: [
        ...new Set([
          subjectId,
          kase.subjectEntityId,
          tenantId,
          kase.id,
          evidenceId,
          ...ownerUserIds,
          ...ownershipRecordIds,
          ...files.map((file) => file.id),
          ...versionIds,
          ...derivatives.map((item) => item.id),
          ...(evidence.collectedUnderConsentId
            ? [evidence.collectedUnderConsentId]
            : []),
        ]),
      ],
      holdCoverage,
      opaqueReference:
        opaque[0].present ||
        versions.some((version) => Boolean(version.externalSourceUri)),
      externalReferenceCount: 0,
    };
    graph.externalReferenceCount = await this.externalIncoming(tx, graph);
    return graph;
  }

  /** Planned target edges are NOT a physical zero. Executor must re-count after retirement. */
  async externalIncoming(
    tx: EntityManager,
    graph: IdentityEvidenceGraph,
  ): Promise<number> {
    const targets: Record<string, string[]> = {
      'common.files': graph.files.map((file) => file.id),
      'common.file_versions': graph.versions.map((version) => version.id),
      'identity_assurance.identity_evidence_records': [graph.evidence.id],
    };
    const internal: Record<string, string[]> = {
      ...targets,
      'common.file_derivatives': graph.derivatives
        .filter(
          (edge) =>
            targets['common.file_versions'].includes(
              edge.sourceFileVersionId,
            ) &&
            targets['common.file_versions'].includes(
              edge.derivativeFileVersionId,
            ),
        )
        .map((edge) => edge.id),
    };
    const edges = await tx.getConnection('write').execute<
      {
        source_schema: string;
        source_table: string;
        column_name: string;
        target_schema: string;
        target_table: string;
        columns: number;
      }[]
    >(
      `
      SELECT ns.nspname AS source_schema, c.relname AS source_table, a.attname AS column_name,
        rn.nspname AS target_schema, r.relname AS target_table, cardinality(f.conkey) AS columns
      FROM pg_constraint f JOIN pg_class c ON c.oid=f.conrelid JOIN pg_namespace ns ON ns.oid=c.relnamespace
      JOIN pg_class r ON r.oid=f.confrelid JOIN pg_namespace rn ON rn.oid=r.relnamespace
      JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum=f.conkey[1]
      WHERE f.contype='f' AND ((rn.nspname='common' AND r.relname IN ('files','file_versions'))
        OR (rn.nspname='identity_assurance' AND r.relname='identity_evidence_records'))`,
      [],
      'all',
      tx.getTransactionContext(),
    );
    if (!edges.length)
      throw new StorageLifecycleDenied('REFERENCE_CATALOG_UNKNOWN');
    let total = 0;
    for (const edge of edges) {
      if (
        edge.columns !== 1 ||
        ![edge.source_schema, edge.source_table, edge.column_name].every(
          (name) => /^[a-z_][a-z0-9_]*$/.test(name),
        )
      )
        throw new StorageLifecycleDenied('REFERENCE_CATALOG_UNKNOWN');
      const ids = targets[`${edge.target_schema}.${edge.target_table}`];
      if (!ids?.length) continue;
      const planned =
        internal[`${edge.source_schema}.${edge.source_table}`] ?? [];
      const rows = await tx
        .getConnection('write')
        .execute<{ count: string }[]>(
          `SELECT count(*)::text AS count FROM "${edge.source_schema}"."${edge.source_table}" WHERE "${edge.column_name}" = ANY(?::uuid[])${planned.length ? ' AND id <> ALL(?::uuid[])' : ''}`,
          planned.length
            ? [bindStorageReferenceIds(ids), bindStorageReferenceIds(planned)]
            : [bindStorageReferenceIds(ids)],
          'all',
          tx.getTransactionContext(),
        );
      const count = Number(rows[0]?.count);
      if (rows.length !== 1 || !Number.isSafeInteger(count) || count < 0)
        throw new StorageLifecycleDenied('REFERENCE_STATE_UNKNOWN');
      total += count;
    }
    return total;
  }
}
