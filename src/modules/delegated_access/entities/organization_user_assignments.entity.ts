import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'delegated_access',
  tableName: 'organization_user_assignments',
})
export class OrganizationUserAssignments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_membership_id', type: 'uuid' }) // FK → directory.tenant_memberships
  tenantMembershipId!: string;

  @Property({ fieldName: 'practice_id', type: 'uuid', nullable: true }) // FK → practice.practices
  practiceId?: string;

  @Property({ fieldName: 'practice_site_id', type: 'uuid', nullable: true }) // FK → practice.practice_sites
  practiceSiteId?: string;

  @Property({ fieldName: 'clinical_unit_id', type: 'uuid', nullable: true }) // FK → practice.clinical_units
  clinicalUnitId?: string;

  @Property({ fieldName: 'care_space_id', type: 'uuid', nullable: true }) // FK → practice.care_spaces
  careSpaceId?: string;

  @Property({ fieldName: 'diagnostic_unit_id', type: 'uuid', nullable: true }) // FK → diagnostic_units.diagnostic_units
  diagnosticUnitId?: string;

  @Property({ fieldName: 'pharmacy_id', type: 'uuid', nullable: true }) // FK → pharmacy.pharmacies
  pharmacyId?: string;

  @Property({ fieldName: 'assignment_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  assignmentRoleConceptId!: string;

  @Property({ fieldName: 'access_scope_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  accessScopeConceptId!: string;

  @Property({ fieldName: 'supervisor_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  supervisorUserId?: string;

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
