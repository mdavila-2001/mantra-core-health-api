import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'promotions', tableName: 'discount_rules' })
export class DiscountRules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'promotion_id', type: 'uuid' }) // FK → promotions.promotions
  promotionId!: string;

  @Property({ fieldName: 'discount_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  discountTypeConceptId!: string;

  @Property({ columnType: 'numeric', nullable: true })
  percentage?: string;

  @Property({
    fieldName: 'fixed_amount',
    columnType: 'numeric',
    nullable: true,
  })
  fixedAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({
    fieldName: 'max_discount_amount',
    columnType: 'numeric',
    nullable: true,
  })
  maxDiscountAmount?: string;

  @Property({
    fieldName: 'min_purchase_amount',
    columnType: 'numeric',
    nullable: true,
  })
  minPurchaseAmount?: string;

  @Property({
    fieldName: 'applies_to_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  appliesToConceptId?: string;

  @Property({
    fieldName: 'target_filter_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  targetFilterJson?: unknown;

  @Property({ fieldName: 'buy_quantity', columnType: 'int', nullable: true })
  buyQuantity?: number;

  @Property({ fieldName: 'get_quantity', columnType: 'int', nullable: true })
  getQuantity?: number;

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
