import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'ad_policy_appeals' })
export class AdPolicyAppeals {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_policy_violation_id', type: 'uuid' }) // FK → ads.ad_policy_violations
  adPolicyViolationId!: string;

  @Property({ fieldName: 'submitted_at', columnType: 'timestamptz' })
  submittedAt!: Date;

  @Property({ fieldName: 'submitted_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  submittedByUserId?: string;

  @Property({ fieldName: 'appeal_reason', columnType: 'text' })
  appealReason!: string;

  @Property({ fieldName: 'evidence_file_id', type: 'uuid', nullable: true }) // FK → common.files
  evidenceFileId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'external_appeal_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalAppealId?: string;

  @Property({
    fieldName: 'decided_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  decidedAt?: Date;

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
