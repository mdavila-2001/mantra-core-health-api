import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'organization_extensions',
  tableName: 'organization_data_boundaries',
})
export class OrganizationDataBoundaries {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'boundary_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  boundaryTypeConceptId!: string;

  @Property({ fieldName: 'data_controller_tenant_id', type: 'uuid' }) // FK → directory.tenants
  dataControllerTenantId!: string;

  @Property({
    fieldName: 'data_processor_tenant_id',
    type: 'uuid',
    nullable: true,
  }) // FK → directory.tenants
  dataProcessorTenantId?: string;

  @Property({
    fieldName: 'jurisdiction_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  jurisdictionConceptId?: string;

  @Property({
    fieldName: 'residency_region_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  residencyRegionConceptId?: string;

  @Property({
    fieldName: 'allowed_purpose_value_set_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.value_sets
  allowedPurposeValueSetId?: string;

  @Property({
    fieldName: 'isolation_schema_name',
    columnType: 'varchar',
    nullable: true,
  })
  isolationSchemaName?: string;

  @Property({
    fieldName: 'isolation_policy_version',
    columnType: 'varchar',
    nullable: true,
  })
  isolationPolicyVersion?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

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
