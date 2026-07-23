import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'insurance', tableName: 'claim_disputes' })
export class ClaimDisputes {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'insurance_claim_id', type: 'uuid' }) // FK → insurance.insurance_claims
  insuranceClaimId!: string;

  @Property({
    fieldName: 'claim_adjudication_version_id',
    type: 'uuid',
    nullable: true,
  }) // FK → insurance.claim_adjudication_versions
  claimAdjudicationVersionId?: string;

  @Property({ fieldName: 'dispute_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  disputeTypeConceptId!: string;

  @Property({ fieldName: 'dispute_reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  disputeReasonConceptId!: string;

  @Property({ fieldName: 'initiated_by_party_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  initiatedByPartyTypeConceptId!: string;

  @Property({
    fieldName: 'initiated_by_entity_id',
    type: 'uuid',
    nullable: true,
  })
  initiatedByEntityId?: string;

  @Property({
    fieldName: 'supporting_evidence_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  supportingEvidenceFileId?: string;

  @Property({
    fieldName: 'filing_deadline',
    columnType: 'date',
    nullable: true,
  })
  filingDeadline?: Date;

  @Property({
    fieldName: 'submitted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  submittedAt?: Date;

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
