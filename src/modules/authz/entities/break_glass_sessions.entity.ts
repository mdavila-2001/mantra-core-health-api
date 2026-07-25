import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'authz', tableName: 'break_glass_sessions' })
export class BreakGlassSessions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'user_id', type: 'uuid' })
  userId!: string;

  @Property({ fieldName: 'patient_ref_id', type: 'uuid' })
  patientRefId!: string;

  @Property({ fieldName: 'patient_ref_type_concept_id', type: 'uuid' })
  patientRefTypeConceptId!: string;

  @Property({ columnType: 'varchar' })
  justification!: string;

  @Property({ fieldName: 'reason_concept_id', type: 'uuid' })
  reasonConceptId!: string;

  @Property({ fieldName: 'granted_by_policy_id', type: 'uuid', nullable: true })
  grantedByPolicyId?: string;

  @Property({
    fieldName: 'activated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  activatedAt?: Date;

  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  @Property({
    fieldName: 'deactivated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  deactivatedAt?: Date;

  @Property({ fieldName: 'reviewed_by_user_id', type: 'uuid', nullable: true })
  reviewedByUserId?: string;

  @Property({
    fieldName: 'reviewed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  reviewedAt?: Date;

  @Property({
    fieldName: 'review_outcome_concept_id',
    type: 'uuid',
    nullable: true,
  })
  reviewOutcomeConceptId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' })
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
