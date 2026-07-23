import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'catalog_products' })
export class CatalogProducts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'product_catalog_id', type: 'uuid' }) // FK → ads.product_catalogs
  productCatalogId!: string;

  @Property({ fieldName: 'retailer_product_id', columnType: 'varchar' })
  retailerProductId!: string;

  @Property({ columnType: 'varchar' })
  title!: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({ fieldName: 'availability_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  availabilityConceptId!: string;

  @Property({ fieldName: 'condition_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  conditionConceptId!: string;

  @Property({ columnType: 'numeric', nullable: true })
  price?: string;

  @Property({ fieldName: 'sale_price', columnType: 'numeric', nullable: true })
  salePrice?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ columnType: 'varchar', nullable: true })
  brand?: string;

  @Property({ fieldName: 'category_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  categoryConceptId?: string;

  @Property({ fieldName: 'image_url', columnType: 'text', nullable: true })
  imageUrl?: string;

  @Property({ fieldName: 'link_url', columnType: 'text', nullable: true })
  linkUrl?: string;

  @Property({
    fieldName: 'source_product_type',
    columnType: 'varchar',
    nullable: true,
  })
  sourceProductType?: string;

  @Property({
    fieldName: 'source_product_ref_id',
    type: 'uuid',
    nullable: true,
  })
  sourceProductRefId?: string;

  @Property({ columnType: 'varchar', nullable: true })
  gtin?: string;

  @Property({
    fieldName: 'custom_labels_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  customLabelsJson?: unknown;

  @Property({ fieldName: 'inventory_count', columnType: 'int', nullable: true })
  inventoryCount?: number;

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
