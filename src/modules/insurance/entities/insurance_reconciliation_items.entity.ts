import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'insurance', tableName: 'insurance_reconciliation_items' })
export class InsuranceReconciliationItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'insurance_reconciliation_batch_id', type: 'uuid' }) // FK → insurance.insurance_reconciliation_batches
  insuranceReconciliationBatchId!: string;

  @Property({ fieldName: 'insurance_claim_id', type: 'uuid' }) // FK → insurance.insurance_claims
  insuranceClaimId!: string;

  @Property({ fieldName: 'claim_adjudication_version_id', type: 'uuid' }) // FK → insurance.claim_adjudication_versions
  claimAdjudicationVersionId!: string;

  @Property({
    fieldName: 'expected_amount',
    columnType: 'numeric',
    nullable: true,
  })
  expectedAmount?: string;

  @Property({
    fieldName: 'accepted_amount',
    columnType: 'numeric',
    nullable: true,
  })
  acceptedAmount?: string;

  @Property({
    fieldName: 'variance_amount',
    columnType: 'numeric',
    nullable: true,
  })
  varianceAmount?: string;

  @Property({
    fieldName: 'variance_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  varianceReasonConceptId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
