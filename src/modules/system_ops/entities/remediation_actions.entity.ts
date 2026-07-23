import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'remediation_actions' })
export class RemediationActions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'remediation_plan_id', type: 'uuid' }) // FK → system_ops.remediation_plans
  remediationPlanId!: string;

  @Property({ fieldName: 'assessment_finding_id', type: 'uuid' }) // FK → system_ops.assessment_findings
  assessmentFindingId!: string;

  @Property({ fieldName: 'action_code', columnType: 'varchar' })
  actionCode!: string;

  @Property({ columnType: 'text' })
  description!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'assigned_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  assignedUserId?: string;

  @Property({
    fieldName: 'assigned_team',
    columnType: 'varchar',
    nullable: true,
  })
  assignedTeam?: string;

  @Property({ fieldName: 'due_at', columnType: 'timestamptz', nullable: true })
  dueAt?: Date;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({ fieldName: 'verification_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  verificationUserId?: string;

  @Property({
    fieldName: 'verification_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  verificationAt?: Date;

  @Property({
    fieldName: 'verification_evidence_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  verificationEvidenceJson?: unknown;

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
