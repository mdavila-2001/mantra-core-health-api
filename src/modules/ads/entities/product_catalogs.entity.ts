import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'product_catalogs' })
export class ProductCatalogs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'business_manager_id', type: 'uuid' }) // FK → ads.business_managers
  businessManagerId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'vertical_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verticalConceptId!: string;

  @Property({
    fieldName: 'default_currency_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  defaultCurrencyConceptId?: string;

  @Property({ fieldName: 'item_count', columnType: 'int', nullable: true })
  itemCount?: number;

  @Property({
    fieldName: 'external_catalog_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalCatalogRef?: string;

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
