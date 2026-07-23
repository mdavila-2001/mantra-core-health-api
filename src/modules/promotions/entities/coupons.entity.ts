import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'promotions', tableName: 'coupons' })
export class Coupons {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'promotion_id', type: 'uuid' }) // FK → promotions.promotions
  promotionId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'coupon_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  couponTypeConceptId!: string;

  @Property({
    fieldName: 'assigned_member_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  assignedMemberTypeConceptId?: string;

  @Property({
    fieldName: 'assigned_member_ref_id',
    type: 'uuid',
    nullable: true,
  })
  assignedMemberRefId?: string;

  @Property({ fieldName: 'max_redemptions', columnType: 'int', nullable: true })
  maxRedemptions?: number;

  @Property({
    fieldName: 'redemption_count',
    columnType: 'int',
    nullable: true,
  })
  redemptionCount?: number;

  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

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
