import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'terminology', tableName: 'tenant_catalog_policies' })
export class TenantCatalogPolicies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'value_set_id', type: 'uuid' }) // FK → terminology.value_sets
  valueSetId!: string;

  @Property({ fieldName: 'mode_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  modeConceptId?: string;

  @Property({ fieldName: 'allow_subset', type: 'boolean', nullable: true })
  allowSubset?: boolean;

  @Property({ fieldName: 'allow_alias', type: 'boolean', nullable: true })
  allowAlias?: boolean;

  @Property({
    fieldName: 'allow_local_concepts',
    type: 'boolean',
    nullable: true,
  })
  allowLocalConcepts?: boolean;

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
