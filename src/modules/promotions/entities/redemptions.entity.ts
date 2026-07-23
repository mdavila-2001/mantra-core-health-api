import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'promotions', tableName: 'redemptions' })
export class Redemptions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'promotion_id', type: 'uuid' }) // FK → promotions.promotions
  promotionId!: string;

  @Property({ fieldName: 'coupon_id', type: 'uuid', nullable: true }) // FK → promotions.coupons
  couponId?: string;

  @Property({ fieldName: 'discount_rule_id', type: 'uuid', nullable: true }) // FK → promotions.discount_rules
  discountRuleId?: string;

  @Property({ fieldName: 'redeemer_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  redeemerTypeConceptId!: string;

  @Property({ fieldName: 'redeemer_ref_id', type: 'uuid' })
  redeemerRefId!: string;

  @Property({ fieldName: 'discount_amount', columnType: 'numeric' })
  discountAmount!: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  currencyConceptId!: string;

  @Property({
    fieldName: 'order_ref_type',
    columnType: 'varchar',
    nullable: true,
  })
  orderRefType?: string;

  @Property({ fieldName: 'order_ref_id', type: 'uuid', nullable: true })
  orderRefId?: string;

  @Property({ fieldName: 'payment_intent_id', type: 'uuid', nullable: true }) // FK → payments.payment_intents
  paymentIntentId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'redeemed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  redeemedAt?: Date;

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
