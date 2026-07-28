import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `product_catalogs`.
 */
@Entity({ schema: 'ads', tableName: 'product_catalogs' })
export class ProductCatalogs {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a business manager.
   */
  @Property({ fieldName: 'business_manager_id', type: 'uuid' }) // FK → ads.business_managers
  businessManagerId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a vertical concept.
   */
  @Property({ fieldName: 'vertical_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verticalConceptId!: string;

  /**
   * Identificador asociado a default currency concept.
   */
  @Property({
    fieldName: 'default_currency_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  defaultCurrencyConceptId?: string;

  /**
   * Valor de item count mantenido por la instancia.
   */
  @Property({ fieldName: 'item_count', columnType: 'int', nullable: true })
  itemCount?: number;

  /**
   * Valor de external catalog ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_catalog_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalCatalogRef?: string;

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
