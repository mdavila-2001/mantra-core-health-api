import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'audit', tableName: 'delegated_access_audit_log' })
export class DelegatedAccessAuditLog {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'delegate_user_id', type: 'uuid' }) // FK → iam.users
  delegateUserId!: string;

  @Property({ fieldName: 'delegating_practitioner_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  delegatingPractitionerProfileId!: string;

  @Property({
    fieldName: 'delegated_assignment_id',
    type: 'uuid',
    nullable: true,
  }) // FK → delegated_access.practitioner_delegate_assignments
  delegatedAssignmentId?: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid', nullable: true }) // FK → profiles.patient_profiles
  patientProfileId?: string;

  @Property({
    fieldName: 'resource_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  resourceTypeConceptId?: string;

  @Property({ fieldName: 'resource_id', type: 'uuid', nullable: true })
  resourceId?: string;

  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;
}
