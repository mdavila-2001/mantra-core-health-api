import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { technicalDispositionReceipt } from '../identity-evidence-lifecycle.receipt';
import {
  assertDestructiveRuntimeAuthorized,
  StorageLifecycleDenied,
} from '../../../common/storage/storage-lifecycle.protocol';
import type { KnownPhysicalObjectIdentity } from '../../../common/storage/physical-object-identity';
import { RetentionExecutionRepository } from '../../system_ops/repositories/retention-execution.repository';
import { RecordRevisions } from '../../system_ops/entities/record_revisions.entity';
import { SYSOPS } from '../../system_ops/system_ops.concepts';
import type {
  ResolvedIdentityLifecycleRule,
  IdentityDisposition,
} from '../identity-evidence-lifecycle.config';
import type { IdentityEvidenceGraph } from '../repositories/identity-evidence-lifecycle.repository';
import { IdentityEvidenceDispositionRepository } from '../repositories/identity-evidence-disposition.repository';

export interface IdentityDispositionPlan {
  eligibleAt: Date;
  operation: IdentityDisposition;
  graph: IdentityEvidenceGraph;
  config: ResolvedIdentityLifecycleRule;
  identities: KnownPhysicalObjectIdentity[];
}
export interface IdentityDispositionOutcome {
  status:
    | 'RETAINED'
    | 'DENIED'
    | 'DESTRUCTIVE_BOUNDARY'
    | 'DUPLICATE'
    | 'ANONYMIZED'
    | 'METADATA_RETIRED';
  reasonCode: string;
}

/** Normal boot is deny-by-default. No env override or HTTP/queue-supplied grant. */
@Injectable()
export class IdentityEvidenceDispositionExecutor {
  constructor(
    private readonly revisions: RetentionExecutionRepository,
    private readonly disposition: IdentityEvidenceDispositionRepository,
  ) {}

  async execute(
    tx: EntityManager,
    plan: IdentityDispositionPlan,
  ): Promise<IdentityDispositionOutcome> {
    const receipt = technicalDispositionReceipt(
      plan,
      plan.operation === 'RETENTION'
        ? 'RETAINED'
        : plan.operation === 'ANONYMIZATION'
          ? 'ANONYMIZED'
          : 'METADATA_RETIRED',
    );
    const operationConceptId =
      plan.operation === 'RETENTION'
        ? SYSOPS.OP_UPDATE
        : plan.operation === 'ANONYMIZATION'
          ? SYSOPS.OP_ANONYMIZE
          : SYSOPS.OP_DELETE;
    const prior = await tx.find(
      RecordRevisions,
      {
        schemaName: 'identity_assurance',
        tableName: 'identity_evidence_records',
        recordId: plan.graph.evidence.id,
        operationConceptId,
      },
      { fields: ['id', 'dataSnapshot'] },
    );
    if (
      prior.some((row) => {
        const value = row.dataSnapshot as Partial<typeof receipt> | undefined;
        return (
          value?.schemaVersion === 1 &&
          value.contractDigest === receipt.contractDigest &&
          value.outcome === receipt.outcome
        );
      })
    )
      return {
        status: 'DUPLICATE',
        reasonCode: 'DISPOSITION_ALREADY_RECORDED',
      };
    if (plan.operation !== 'RETENTION') {
      // Before ANY DB anonymization/retirement as well as before physical delete.
      // We do not mark a planned or gate-blocked operation as applied.
      try {
        assertDestructiveRuntimeAuthorized(plan.graph.evidence.id);
      } catch (error) {
        if (error instanceof StorageLifecycleDenied)
          return {
            status: 'DESTRUCTIVE_BOUNDARY',
            reasonCode: error.reasonCode,
          };
        throw error;
      }
    }
    const applied =
      plan.operation === 'RETENTION'
        ? 'RETAINED'
        : await this.disposition.apply(tx, plan);
    this.revisions.createRevision(tx, {
      schemaName: 'identity_assurance',
      tableName: 'identity_evidence_records',
      recordId: plan.graph.evidence.id,
      operationConceptId,
      dataSnapshot: technicalDispositionReceipt(plan, applied),
    });
    await tx.flush();
    return {
      status: applied,
      reasonCode:
        applied === 'RETAINED'
          ? 'NO_DESTRUCTIVE_DISPOSITION'
          : 'PHYSICAL_DISPOSITION_NOT_EXECUTED',
    };
  }
}
