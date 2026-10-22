import { Inject, Injectable } from '@nestjs/common';
import {
  FILE_STORAGE_ADAPTER,
  type FileStorageAdapter,
} from '../../../common/storage/file-storage.adapter';
import type { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { StorageLifecycleCoordinator } from '../../../common/storage/storage-lifecycle-coordinator.service';
import {
  StorageLifecycleDenied,
  assertDestructiveRuntimeAuthorized,
} from '../../../common/storage/storage-lifecycle.protocol';
import {
  physicalObjectKey,
  samePhysicalObject,
} from '../../../common/storage/physical-object-identity';
import type { IdentityDispositionPlan } from '../services/identity-evidence-disposition.executor';
import { technicalDispositionReceipt } from '../identity-evidence-lifecycle.receipt';
import { bindStorageReferenceIds } from '../../../common/storage/storage-reference.repository';

/** Real DB write adapter, gated before the first mutation. No native storage I/O. */
@Injectable()
export class IdentityEvidenceDispositionRepository {
  constructor(
    private readonly coordinator: StorageLifecycleCoordinator,
    @Inject(FILE_STORAGE_ADAPTER) private readonly storage: FileStorageAdapter,
  ) {}

  async apply(
    tx: EntityManager,
    plan: IdentityDispositionPlan,
  ): Promise<'ANONYMIZED' | 'METADATA_RETIRED'> {
    assertDestructiveRuntimeAuthorized(plan.graph.evidence.id);
    const query = (sql: string, params: unknown[]) =>
      tx
        .getConnection('write')
        .execute(sql, params, 'run', tx.getTransactionContext());
    if (
      !tx.getTransactionContext() ||
      !plan.graph.ownerResolved ||
      plan.graph.externalReferenceCount !== 0 ||
      plan.graph.opaqueReference
    )
      throw new StorageLifecycleDenied('DISPOSITION_GUARDS_UNPROVEN');
    if (plan.operation === 'ANONYMIZATION') {
      if (
        plan.config.rule.storageDisposition !== 'PRESERVE' ||
        !plan.config.fieldOperations?.length
      )
        throw new StorageLifecycleDenied('ANONYMIZATION_RULES_MISSING');
      const allowed = new Set([
        'issuer_authority_id',
        'evidence_identifier_hash',
        'evidence_file_id',
        'encrypted_evidence_reference',
        'evidence_quality_concept_id',
        'issued_at',
        'expires_at',
        'collected_under_consent_id',
        'created_by_user_id',
      ]);
      for (const field of plan.config.fieldOperations) {
        if (!allowed.has(field.columnName) || field.operation !== 'CLEAR')
          throw new StorageLifecycleDenied('FIELD_OPERATION_UNSUPPORTED');
      }
      await query(
        `UPDATE identity_assurance.identity_evidence_records SET ${plan.config.fieldOperations.map((field) => `"${field.columnName}" = NULL`).join(', ')} WHERE id = ? AND identity_verification_case_id = ?`,
        [plan.graph.evidence.id, plan.graph.case.id],
      );
      return 'ANONYMIZED';
    }
    if (
      plan.operation !== 'PURGE' ||
      plan.config.rule.metadataDisposition !== 'REMOVE'
    )
      throw new StorageLifecycleDenied('OPERATION_NOT_AUTHORIZED');
    const fileIds = plan.graph.files.map((file) => file.id);
    const versionIds = plan.graph.versions.map((version) => version.id);
    const derivativeIds = plan.graph.derivatives.map((edge) => edge.id);
    const boundFileIds = bindStorageReferenceIds(fileIds);
    const boundVersionIds = bindStorageReferenceIds(versionIds);
    const boundDerivativeIds = bindStorageReferenceIds(derivativeIds);
    for (const identity of plan.config.rule.storageDisposition === 'PURGE'
      ? plan.identities
      : []) {
      const version = plan.graph.versions.find((item) => {
        const physical = this.storage.resolvePhysicalIdentity?.(
          item.storageUri,
          item.objectVersion,
        );
        return physical && samePhysicalObject(physical, identity);
      });
      if (!version)
        throw new StorageLifecycleDenied('PHYSICAL_METADATA_CONFLICT');
      await this.coordinator.preparePurgeRetirement(tx, {
        identity,
        operationId: `${plan.graph.evidence.id}:${plan.config.configRevision}:${physicalObjectKey(identity)}`,
        ownerToken: randomUUID(),
        producer: 'identity-evidence.purge',
        targetId: plan.graph.evidence.id,
        tenantId: plan.graph.tenantId,
        contentHash: version.contentHash,
        sizeBytes: Number(version.sizeBytes),
        queueCode: process.env.FILE_STORAGE_LIFECYCLE_QUEUE_CODE ?? '',
        purgeContext: {
          caseId: plan.graph.case.id,
          subjectId: plan.graph.case.subjectEntityId,
          contractDigest: technicalDispositionReceipt(plan, 'METADATA_RETIRED')
            .contractDigest,
          evidenceTypeCode: plan.config.rule.evidenceTypeConceptCode,
          configRevision: plan.config.configRevision,
          authorizationRevision: plan.config.rule.authorizationRevision,
          storageUri: version.storageUri,
          eligibleAt: plan.eligibleAt.toISOString(),
          fileIds: plan.graph.files.map((file) => file.id),
          versionIds: plan.graph.versions.map((item) => item.id),
          recordIds: plan.graph.recordIds,
          registryIds: plan.graph.registryIds,
        },
      });
    }
    // The case PK, WORM events, actors and consent rows are NEVER deleted/updated.
    await query(
      'DELETE FROM identity_assurance.identity_evidence_records WHERE id = ? AND identity_verification_case_id = ?',
      [plan.graph.evidence.id, plan.graph.case.id],
    );
    if (fileIds.length) {
      await query(
        'UPDATE common.files SET current_version_id = NULL WHERE id = ANY(?::uuid[]) AND tenant_id = ?',
        [boundFileIds, plan.graph.tenantId],
      );
      if (
        plan.graph.derivatives.some(
          (edge) =>
            !versionIds.includes(edge.sourceFileVersionId) ||
            !versionIds.includes(edge.derivativeFileVersionId),
        )
      )
        throw new StorageLifecycleDenied('SHARED_DERIVATIVE_REFERENCE');
      if (derivativeIds.length)
        await query(
          'DELETE FROM common.file_derivatives WHERE id = ANY(?::uuid[])',
          [boundDerivativeIds],
        );
      if (versionIds.length)
        await query(
          'DELETE FROM common.file_versions WHERE id = ANY(?::uuid[]) AND file_id = ANY(?::uuid[])',
          [boundVersionIds, boundFileIds],
        );
      await query(
        'DELETE FROM common.files WHERE id = ANY(?::uuid[]) AND tenant_id = ?',
        [boundFileIds, plan.graph.tenantId],
      );
    }
    // Not PURGED: only the separately guarded physical stage may assert that outcome.
    return 'METADATA_RETIRED';
  }
}
