import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'delegated_access',
  tableName: 'delegated_access_approval_requests',
})
export class DelegatedAccessApprovalRequests {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'practitioner_delegate_assignment_id', type: 'uuid' }) // FK → delegated_access.practitioner_delegate_assignments
  practitionerDelegateAssignmentId!: string;

  @Property({ fieldName: 'requested_permission_id', type: 'uuid' }) // FK → authz.permissions
  requestedPermissionId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid', nullable: true }) // FK → profiles.patient_profiles
  patientProfileId?: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

  @Property({
    fieldName: 'requested_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  requestedAt?: Date;

  @Property({
    fieldName: 'decided_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  decidedAt?: Date;

  @Property({ fieldName: 'decided_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  decidedByUserId?: string;

  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  decisionConceptId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
