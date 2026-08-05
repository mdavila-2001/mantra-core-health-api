import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `organization_user_assignments`.
 */
@Entity({
  schema: 'delegated_access',
  tableName: 'organization_user_assignments',
})
export class OrganizationUserAssignments {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant membership.
   */
  @Property({ fieldName: 'tenant_membership_id', type: 'uuid' }) // FK → directory.tenant_memberships
  tenantMembershipId!: string;

  /**
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid', nullable: true }) // FK → practice.practices
  practiceId?: string;

  /**
   * Identificador asociado a practice site.
   */
  @Property({ fieldName: 'practice_site_id', type: 'uuid', nullable: true }) // FK → practice.practice_sites
  practiceSiteId?: string;

  /**
   * Identificador asociado a clinical unit.
   */
  @Property({ fieldName: 'clinical_unit_id', type: 'uuid', nullable: true }) // FK → practice.clinical_units
  clinicalUnitId?: string;

  /**
   * Identificador asociado a care space.
   */
  @Property({ fieldName: 'care_space_id', type: 'uuid', nullable: true }) // FK → practice.care_spaces
  careSpaceId?: string;

  /**
   * Identificador asociado a diagnostic unit.
   */
  @Property({ fieldName: 'diagnostic_unit_id', type: 'uuid', nullable: true }) // FK → diagnostic_units.diagnostic_units
  diagnosticUnitId?: string;

  /**
   * Identificador asociado a pharmacy.
   */
  @Property({ fieldName: 'pharmacy_id', type: 'uuid', nullable: true }) // FK → pharmacy.pharmacies
  pharmacyId?: string;

  /**
   * Identificador asociado a assignment role concept.
   */
  @Property({ fieldName: 'assignment_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  assignmentRoleConceptId!: string;

  /**
   * Identificador asociado a access scope concept.
   */
  @Property({ fieldName: 'access_scope_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  accessScopeConceptId!: string;

  /**
   * Identificador asociado a supervisor user.
   */
  @Property({ fieldName: 'supervisor_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  supervisorUserId?: string;

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
