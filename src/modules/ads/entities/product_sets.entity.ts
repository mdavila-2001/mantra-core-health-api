import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'product_sets' })
export class ProductSets {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'product_catalog_id', type: 'uuid' }) // FK → ads.product_catalogs
  productCatalogId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({
    fieldName: 'filter_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  filterJson?: unknown;

  @Property({ fieldName: 'is_dynamic', type: 'boolean', nullable: true })
  isDynamic?: boolean;

  @Property({ fieldName: 'product_count', columnType: 'int', nullable: true })
  productCount?: number;

  @Property({
    fieldName: 'external_set_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalSetRef?: string;

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
