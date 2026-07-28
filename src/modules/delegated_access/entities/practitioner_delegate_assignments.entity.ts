import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `practitioner_delegate_assignments`.
 */
@Entity({
  schema: 'delegated_access',
  tableName: 'practitioner_delegate_assignments',
})
export class PractitionerDelegateAssignments {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a practitioner role assignment.
   */
  @Property({ fieldName: 'practitioner_role_assignment_id', type: 'uuid' }) // FK → practice.practitioner_role_assignments
  practitionerRoleAssignmentId!: string;

  /**
   * Identificador asociado a delegate user assignment.
   */
  @Property({ fieldName: 'delegate_user_assignment_id', type: 'uuid' }) // FK → delegated_access.organization_user_assignments
  delegateUserAssignmentId!: string;

  /**
   * Identificador asociado a delegated permission set.
   */
  @Property({ fieldName: 'delegated_permission_set_id', type: 'uuid' }) // FK → delegated_access.delegated_permission_sets
  delegatedPermissionSetId!: string;

  /**
   * Identificador asociado a delegate role concept.
   */
  @Property({ fieldName: 'delegate_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  delegateRoleConceptId!: string;

  /**
   * Identificador asociado a patient scope concept.
   */
  @Property({
    fieldName: 'patient_scope_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  patientScopeConceptId?: string;

  /**
   * Identificador asociado a appointment scope concept.
   */
  @Property({
    fieldName: 'appointment_scope_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  appointmentScopeConceptId?: string;

  /**
   * Valor de may view clinical content mantenido por la instancia.
   */
  @Property({
    fieldName: 'may_view_clinical_content',
    type: 'boolean',
    nullable: true,
  })
  mayViewClinicalContent?: boolean;

  /**
   * Valor de may edit drafts mantenido por la instancia.
   */
  @Property({ fieldName: 'may_edit_drafts', type: 'boolean', nullable: true })
  mayEditDrafts?: boolean;

  /**
   * Valor de may sign clinical content mantenido por la instancia.
   */
  @Property({
    fieldName: 'may_sign_clinical_content',
    type: 'boolean',
    nullable: true,
  })
  maySignClinicalContent?: boolean;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
