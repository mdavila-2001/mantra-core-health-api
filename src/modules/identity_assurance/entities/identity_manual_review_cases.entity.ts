import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'identity_assurance',
  tableName: 'identity_manual_review_cases',
})
export class IdentityManualReviewCases {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'identity_verification_case_id', type: 'uuid' }) // FK → identity_assurance.identity_verification_cases
  identityVerificationCaseId!: string;

  @Property({ fieldName: 'review_reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reviewReasonConceptId!: string;

  @Property({ fieldName: 'assigned_to_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  assignedToUserId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'opened_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  openedAt?: Date;

  @Property({
    fieldName: 'decided_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  decidedAt?: Date;

  @Property({ fieldName: 'decision_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  decisionConceptId?: string;

  @Property({
    fieldName: 'decision_reason',
    columnType: 'text',
    nullable: true,
  })
  decisionReason?: string;

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
