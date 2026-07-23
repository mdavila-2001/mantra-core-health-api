import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'read_models', tableName: 'portal_surfaces' })
export class PortalSurfaces {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'portal_code', columnType: 'varchar' })
  portalCode!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'portal_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  portalTypeConceptId!: string;

  @Property({
    fieldName: 'audience_role_value_set_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.value_sets
  audienceRoleValueSetId?: string;

  @Property({ fieldName: 'tenant_scoped', type: 'boolean', nullable: true })
  tenantScoped?: boolean;

  @Property({ fieldName: 'patient_scoped', type: 'boolean', nullable: true })
  patientScoped?: boolean;

  @Property({
    fieldName: 'default_route',
    columnType: 'varchar',
    nullable: true,
  })
  defaultRoute?: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

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
