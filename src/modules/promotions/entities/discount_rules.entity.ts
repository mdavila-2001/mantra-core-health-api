import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `discount_rules`.
 */
@Entity({ schema: 'promotions', tableName: 'discount_rules' })
export class DiscountRules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a promotion.
   */
  @Property({ fieldName: 'promotion_id', type: 'uuid' }) // FK → promotions.promotions
  promotionId!: string;

  /**
   * Identificador asociado a discount type concept.
   */
  @Property({ fieldName: 'discount_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  discountTypeConceptId!: string;

  /**
   * Valor de percentage mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  percentage?: string;

  /**
   * Valor de fixed amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'fixed_amount',
    columnType: 'numeric',
    nullable: true,
  })
  fixedAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de max discount amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'max_discount_amount',
    columnType: 'numeric',
    nullable: true,
  })
  maxDiscountAmount?: string;

  /**
   * Valor de min purchase amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'min_purchase_amount',
    columnType: 'numeric',
    nullable: true,
  })
  minPurchaseAmount?: string;

  /**
   * Identificador asociado a applies to concept.
   */
  @Property({
    fieldName: 'applies_to_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  appliesToConceptId?: string;

  /**
   * Valor de target filter json mantenido por la instancia.
   */
  @Property({
    fieldName: 'target_filter_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  targetFilterJson?: unknown;

  /**
   * Valor de buy quantity mantenido por la instancia.
   */
  @Property({ fieldName: 'buy_quantity', columnType: 'int', nullable: true })
  buyQuantity?: number;

  /**
   * Valor de get quantity mantenido por la instancia.
   */
  @Property({ fieldName: 'get_quantity', columnType: 'int', nullable: true })
  getQuantity?: number;

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
