import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'payout_items' })
export class PayoutItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'payout_id', type: 'uuid' }) // FK → payments.payouts
  payoutId!: string;

  @Property({ fieldName: 'source_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceTypeConceptId!: string;

  @Property({ fieldName: 'source_ref_id', type: 'uuid' })
  sourceRefId!: string;

  @Property({ columnType: 'numeric' })
  amount!: string;

  @Property({
    fieldName: 'commission_amount',
    columnType: 'numeric',
    nullable: true,
  })
  commissionAmount?: string;

  @Property({ columnType: 'varchar', nullable: true })
  description?: string;

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
