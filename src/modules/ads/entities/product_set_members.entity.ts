import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `product_set_members`.
 */
@Entity({ schema: 'ads', tableName: 'product_set_members' })
export class ProductSetMembers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a product set.
   */
  @Property({ fieldName: 'product_set_id', type: 'uuid' }) // FK → ads.product_sets
  productSetId!: string;

  /**
   * Identificador asociado a catalog product.
   */
  @Property({ fieldName: 'catalog_product_id', type: 'uuid' }) // FK → ads.catalog_products
  catalogProductId!: string;

  /**
   * Valor de added by rule mantenido por la instancia.
   */
  @Property({ fieldName: 'added_by_rule', type: 'boolean', nullable: true })
  addedByRule?: boolean;

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
