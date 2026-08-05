import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `diagnostic_unit_practitioner_assignments`.
 */
@Entity({
  schema: 'diagnostic_units',
  tableName: 'diagnostic_unit_practitioner_assignments',
})
export class DiagnosticUnitPractitionerAssignments {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a diagnostic unit.
   */
  @Property({ fieldName: 'diagnostic_unit_id', type: 'uuid' }) // FK → diagnostic_units.diagnostic_units
  diagnosticUnitId!: string;

  /**
   * Identificador asociado a practitioner role assignment.
   */
  @Property({ fieldName: 'practitioner_role_assignment_id', type: 'uuid' }) // FK → practice.practitioner_role_assignments
  practitionerRoleAssignmentId!: string;

  /**
   * Identificador asociado a diagnostic unit site.
   */
  @Property({
    fieldName: 'diagnostic_unit_site_id',
    type: 'uuid',
    nullable: true,
  }) // FK → diagnostic_units.diagnostic_unit_sites
  diagnosticUnitSiteId?: string;

  /**
   * Identificador asociado a specialty concept.
   */
  @Property({ fieldName: 'specialty_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  specialtyConceptId?: string;

  /**
   * Identificador asociado a assignment role concept.
   */
  @Property({
    fieldName: 'assignment_role_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  assignmentRoleConceptId?: string;

  /**
   * Valor de may validate results mantenido por la instancia.
   */
  @Property({
    fieldName: 'may_validate_results',
    type: 'boolean',
    nullable: true,
  })
  mayValidateResults?: boolean;

  /**
   * Valor de may sign reports mantenido por la instancia.
   */
  @Property({ fieldName: 'may_sign_reports', type: 'boolean', nullable: true })
  maySignReports?: boolean;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
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
