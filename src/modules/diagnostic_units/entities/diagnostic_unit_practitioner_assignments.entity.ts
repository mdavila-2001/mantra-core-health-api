import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'diagnostic_units',
  tableName: 'diagnostic_unit_practitioner_assignments',
})
export class DiagnosticUnitPractitionerAssignments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'diagnostic_unit_id', type: 'uuid' }) // FK → diagnostic_units.diagnostic_units
  diagnosticUnitId!: string;

  @Property({ fieldName: 'practitioner_role_assignment_id', type: 'uuid' }) // FK → practice.practitioner_role_assignments
  practitionerRoleAssignmentId!: string;

  @Property({
    fieldName: 'diagnostic_unit_site_id',
    type: 'uuid',
    nullable: true,
  }) // FK → diagnostic_units.diagnostic_unit_sites
  diagnosticUnitSiteId?: string;

  @Property({ fieldName: 'specialty_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  specialtyConceptId?: string;

  @Property({
    fieldName: 'assignment_role_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  assignmentRoleConceptId?: string;

  @Property({
    fieldName: 'may_validate_results',
    type: 'boolean',
    nullable: true,
  })
  mayValidateResults?: boolean;

  @Property({ fieldName: 'may_sign_reports', type: 'boolean', nullable: true })
  maySignReports?: boolean;

  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
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
