import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'health_source_systems' })
export class HealthSourceSystems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'source_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceTypeConceptId!: string;

  @Property({ fieldName: 'organization_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  organizationId?: string;

  @Property({ fieldName: 'vendor_name', columnType: 'varchar', nullable: true })
  vendorName?: string;

  @Property({
    fieldName: 'product_name',
    columnType: 'varchar',
    nullable: true,
  })
  productName?: string;

  @Property({ columnType: 'varchar', nullable: true })
  version?: string;

  @Property({ fieldName: 'base_url', columnType: 'varchar', nullable: true })
  baseUrl?: string;

  @Property({ fieldName: 'trust_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  trustLevelConceptId!: string;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
