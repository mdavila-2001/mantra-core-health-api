import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `catalog_products`.
 */
@Entity({ schema: 'ads', tableName: 'catalog_products' })
export class CatalogProducts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a product catalog.
   */
  @Property({ fieldName: 'product_catalog_id', type: 'uuid' }) // FK → ads.product_catalogs
  productCatalogId!: string;

  /**
   * Identificador asociado a retailer product.
   */
  @Property({ fieldName: 'retailer_product_id', columnType: 'varchar' })
  retailerProductId!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Identificador asociado a availability concept.
   */
  @Property({ fieldName: 'availability_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  availabilityConceptId!: string;

  /**
   * Identificador asociado a condition concept.
   */
  @Property({ fieldName: 'condition_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  conditionConceptId!: string;

  /**
   * Valor de price mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  price?: string;

  /**
   * Valor de sale price mantenido por la instancia.
   */
  @Property({ fieldName: 'sale_price', columnType: 'numeric', nullable: true })
  salePrice?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de brand mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  brand?: string;

  /**
   * Identificador asociado a category concept.
   */
  @Property({ fieldName: 'category_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  categoryConceptId?: string;

  /**
   * Valor de image url mantenido por la instancia.
   */
  @Property({ fieldName: 'image_url', columnType: 'text', nullable: true })
  imageUrl?: string;

  /**
   * Valor de link url mantenido por la instancia.
   */
  @Property({ fieldName: 'link_url', columnType: 'text', nullable: true })
  linkUrl?: string;

  /**
   * Valor de source product type mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_product_type',
    columnType: 'varchar',
    nullable: true,
  })
  sourceProductType?: string;

  /**
   * Identificador asociado a source product ref.
   */
  @Property({
    fieldName: 'source_product_ref_id',
    type: 'uuid',
    nullable: true,
  })
  sourceProductRefId?: string;

  /**
   * Valor de gtin mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  gtin?: string;

  /**
   * Valor de custom labels json mantenido por la instancia.
   */
  @Property({
    fieldName: 'custom_labels_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  customLabelsJson?: unknown;

  /**
   * Valor de inventory count mantenido por la instancia.
   */
  @Property({ fieldName: 'inventory_count', columnType: 'int', nullable: true })
  inventoryCount?: number;

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
