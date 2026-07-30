import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `product_sets`.
 */
@Entity({ schema: 'ads', tableName: 'product_sets' })
export class ProductSets {
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
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de filter json mantenido por la instancia.
   */
  @Property({
    fieldName: 'filter_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  filterJson?: unknown;

  /**
   * Valor de is dynamic mantenido por la instancia.
   */
  @Property({ fieldName: 'is_dynamic', type: 'boolean', nullable: true })
  isDynamic?: boolean;

  /**
   * Valor de product count mantenido por la instancia.
   */
  @Property({ fieldName: 'product_count', columnType: 'int', nullable: true })
  productCount?: number;

  /**
   * Valor de external set ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_set_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalSetRef?: string;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
