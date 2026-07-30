import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `redemptions`.
 */
@Entity({ schema: 'promotions', tableName: 'redemptions' })
export class Redemptions {
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
   * Identificador asociado a coupon.
   */
  @Property({ fieldName: 'coupon_id', type: 'uuid', nullable: true }) // FK → promotions.coupons
  couponId?: string;

  /**
   * Identificador asociado a discount rule.
   */
  @Property({ fieldName: 'discount_rule_id', type: 'uuid', nullable: true }) // FK → promotions.discount_rules
  discountRuleId?: string;

  /**
   * Identificador asociado a redeemer type concept.
   */
  @Property({ fieldName: 'redeemer_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  redeemerTypeConceptId!: string;

  /**
   * Identificador asociado a redeemer ref.
   */
  @Property({ fieldName: 'redeemer_ref_id', type: 'uuid' })
  redeemerRefId!: string;

  /**
   * Valor de discount amount mantenido por la instancia.
   */
  @Property({ fieldName: 'discount_amount', columnType: 'numeric' })
  discountAmount!: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  currencyConceptId!: string;

  /**
   * Valor de order ref type mantenido por la instancia.
   */
  @Property({
    fieldName: 'order_ref_type',
    columnType: 'varchar',
    nullable: true,
  })
  orderRefType?: string;

  /**
   * Identificador asociado a order ref.
   */
  @Property({ fieldName: 'order_ref_id', type: 'uuid', nullable: true })
  orderRefId?: string;

  /**
   * Identificador asociado a payment intent.
   */
  @Property({ fieldName: 'payment_intent_id', type: 'uuid', nullable: true }) // FK → payments.payment_intents
  paymentIntentId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de redeemed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'redeemed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  redeemedAt?: Date;

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
