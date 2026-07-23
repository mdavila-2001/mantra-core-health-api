import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'delegated_access',
  tableName: 'practitioner_delegate_assignments',
})
export class PractitionerDelegateAssignments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'practitioner_role_assignment_id', type: 'uuid' }) // FK → practice.practitioner_role_assignments
  practitionerRoleAssignmentId!: string;

  @Property({ fieldName: 'delegate_user_assignment_id', type: 'uuid' }) // FK (destino no resuelto)
  delegateUserAssignmentId!: string;

  @Property({ fieldName: 'delegated_permission_set_id', type: 'uuid' }) // FK → delegated_access.delegated_permission_sets
  delegatedPermissionSetId!: string;

  @Property({ fieldName: 'delegate_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  delegateRoleConceptId!: string;

  @Property({
    fieldName: 'patient_scope_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  patientScopeConceptId?: string;

  @Property({
    fieldName: 'appointment_scope_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  appointmentScopeConceptId?: string;

  @Property({
    fieldName: 'may_view_clinical_content',
    type: 'boolean',
    nullable: true,
  })
  mayViewClinicalContent?: boolean;

  @Property({ fieldName: 'may_edit_drafts', type: 'boolean', nullable: true })
  mayEditDrafts?: boolean;

  @Property({
    fieldName: 'may_sign_clinical_content',
    type: 'boolean',
    nullable: true,
  })
  maySignClinicalContent?: boolean;

  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

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
