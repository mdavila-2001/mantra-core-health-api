import { Inject, Injectable } from '@nestjs/common';
import {
  FILE_STORAGE_ADAPTER,
  type FileStorageAdapter,
} from '../../../common/storage/file-storage.adapter';
import { StorageLifecycleCoordinator } from '../../../common/storage/storage-lifecycle-coordinator.service';
import { StorageReferenceResolver } from '../../../common/storage/storage-reference-resolver.service';
import { StorageLifecycleDenied } from '../../../common/storage/storage-lifecycle.protocol';
import { samePhysicalObject } from '../../../common/storage/physical-object-identity';
import { IdentityLifecycleConfigResolver } from '../identity-evidence-lifecycle.config';
import { IdentityEvidenceHoldResolver } from '../../system_ops/services/identity-evidence-hold-resolver.service';
import { IdentityVerificationCases } from '../entities/identity_verification_cases.entity';
import { RecordRevisions } from '../../system_ops/entities/record_revisions.entity';
import { SYSOPS } from '../../system_ops/system_ops.concepts';
import { loadStorageEnv } from '../../../common/storage/storage.env';
import { technicalDispositionReceipt } from '../identity-evidence-lifecycle.receipt';
import { RetentionExecutionRepository } from '../../system_ops/repositories/retention-execution.repository';

/** Same post-retirement guards execute at preparation and immediately before dispatch. */
@Injectable()
export class IdentityEvidenceStoragePurgeService {
  constructor(
    private readonly coordinator: StorageLifecycleCoordinator,
    private readonly references: StorageReferenceResolver,
    private readonly holds: IdentityEvidenceHoldResolver,
    private readonly config: IdentityLifecycleConfigResolver,
    @Inject(FILE_STORAGE_ADAPTER) private readonly storage: FileStorageAdapter,
    private readonly revisions: RetentionExecutionRepository,
  ) {}

  async review(): Promise<{
    inspected: number;
    denied: number;
    boundary: number;
  }> {
    const result = { inspected: 0, denied: 0, boundary: 0 };
    if (
      !loadStorageEnv().lifecycleBinding ||
      !this.config.configuredRules().length
    )
      return result;
    for (const candidate of await this.coordinator.pendingPurges()) {
      result.inspected++;
      try {
        const outcome = await this.coordinator.dispatchPurge(
          candidate,
          async (tx, intent) => {
            const context = intent.purgeContext;
            if (
              intent.producer !== 'identity-evidence.purge' ||
              !context ||
              ![
                context.caseId,
                context.subjectId,
                context.storageUri,
                context.evidenceTypeCode,
                context.configRevision,
                context.authorizationRevision,
                context.eligibleAt,
                context.contractDigest,
              ].every(
                (value) => typeof value === 'string' && value.length > 0,
              ) ||
              ![
                context.fileIds,
                context.versionIds,
                context.recordIds,
                context.registryIds,
              ].every(
                (ids) =>
                  Array.isArray(ids) &&
                  ids.length > 0 &&
                  ids.every((id) => typeof id === 'string' && id.length > 0),
              )
            )
              throw new StorageLifecycleDenied('PURGE_CONTEXT_UNKNOWN');
            if (
              ![
                context.caseId,
                context.subjectId,
                intent.targetId,
                ...context.fileIds,
                ...context.versionIds,
              ].every((id) => context.recordIds.includes(id))
            )
              throw new StorageLifecycleDenied('PURGE_HOLD_COVERAGE_UNKNOWN');
            const now = new Date();
            const eligibleAt = new Date(context.eligibleAt);
            if (!Number.isFinite(eligibleAt.getTime()) || eligibleAt > now)
              throw new StorageLifecycleDenied('CUTOFF_UNKNOWN');
            const config = await this.config.resolve(
              tx,
              intent.tenantId,
              context.evidenceTypeCode,
              'PURGE',
            );
            if (
              config.configRevision !== context.configRevision ||
              config.rule.authorizationRevision !==
                context.authorizationRevision ||
              config.rule.storageDisposition !== 'PURGE'
            )
              throw new StorageLifecycleDenied('PURGE_POLICY_CHANGED');
            if (
              technicalDispositionReceipt(
                { operation: 'PURGE', config },
                'METADATA_RETIRED',
              ).contractDigest !== context.contractDigest ||
              !context.registryIds.includes(config.rule.entityRegistryId)
            )
              throw new StorageLifecycleDenied('PURGE_POLICY_CHANGED');
            const physical = this.storage.resolvePhysicalIdentity?.(
              context.storageUri,
              intent.identity.versionSelector.kind === 'VERSION'
                ? intent.identity.versionSelector.providerVersionId
                : undefined,
            );
            if (
              !physical ||
              physical.kind === 'UNKNOWN' ||
              intent.identity.versionSelector.kind === 'PENDING_VERSION' ||
              !samePhysicalObject(
                physical,
                intent.identity as typeof physical,
              ) ||
              physical.bindingRevision !== intent.identity.bindingRevision
            )
              throw new StorageLifecycleDenied('PHYSICAL_IDENTITY_UNKNOWN');
            const kase = await tx.findOne(
              IdentityVerificationCases,
              { id: context.caseId },
              {
                fields: ['id', 'subjectEntityId', 'statusConceptId'],
                refresh: true,
              },
            );
            if (
              !kase ||
              kase.subjectEntityId !== context.subjectId ||
              !config.allowedCaseStatusConceptIds.includes(kase.statusConceptId)
            )
              throw new StorageLifecycleDenied('CASE_OR_OWNER_CHANGED');
            const revisions = await tx.find(
              RecordRevisions,
              {
                schemaName: 'identity_assurance',
                tableName: 'identity_evidence_records',
                recordId: intent.targetId,
                operationConceptId: SYSOPS.OP_DELETE,
              },
              { fields: ['id', 'dataSnapshot'] },
            );
            if (
              !revisions.some((row) => {
                const receipt = row.dataSnapshot as
                  | {
                      outcome?: string;
                      contractDigest?: string;
                      operation?: string;
                      schemaVersion?: number;
                    }
                  | undefined;
                return (
                  receipt?.outcome === 'METADATA_RETIRED' &&
                  receipt.contractDigest === context.contractDigest &&
                  receipt.operation === 'PURGE' &&
                  receipt.schemaVersion === 1
                );
              })
            )
              throw new StorageLifecycleDenied('RETIREMENT_UNPROVEN');
            const hold = await this.holds.resolveWithObjects(
              tx,
              {
                tenantId: intent.tenantId,
                recordIds: context.recordIds,
                registryIds: context.registryIds,
                fileHoldUntil: [],
                objectHolds: [],
                objectRetentionLocks: [],
                coverage: 'PROVEN',
              },
              [physical],
              this.storage,
              now,
            );
            if (hold.state !== 'CLEAR')
              throw new StorageLifecycleDenied('LEGAL_HOLD_ACTIVE_OR_UNKNOWN');
            const references = await this.references.resolve(
              tx,
              physical,
              context.fileIds,
              context.versionIds,
            );
            if (references.state !== 'ZERO')
              throw new StorageLifecycleDenied('REFERENCES_BLOCKED_OR_UNKNOWN');
          },
          this.storage,
          async (tx, intent) => {
            // This callback runs only after an exact-attempt confirmed delete, in
            // the same transaction as PURGED. WORM events and case anchors are untouched.
            this.revisions.createRevision(tx, {
              schemaName: 'identity_assurance',
              tableName: 'identity_evidence_records',
              recordId: intent.targetId,
              operationConceptId: SYSOPS.OP_DELETE,
              dataSnapshot: {
                schemaVersion: 1,
                operation: 'PURGE',
                outcome: 'PURGED',
                contractDigest: intent.purgeContext!.contractDigest,
                ioAttemptId: intent.ioAttemptId,
              },
            });
          },
        );
        if (outcome !== 'PURGED') result.denied++;
      } catch (error) {
        if (
          error instanceof StorageLifecycleDenied &&
          error.reasonCode === 'DESTRUCTIVE_RUNTIME_GATE_BLOCKED'
        )
          result.boundary++;
        else result.denied++;
      }
    }
    return result;
  }
}
