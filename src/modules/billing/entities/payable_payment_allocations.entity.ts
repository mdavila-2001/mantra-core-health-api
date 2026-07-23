import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'billing', tableName: 'payable_payment_allocations' })
export class PayablePaymentAllocations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'payment_made_id', type: 'uuid' }) // FK (destino no resuelto)
  paymentMadeId!: string;

  @Property({ fieldName: 'bill_id', type: 'uuid' }) // FK → billing.bills
  billId!: string;

  @Property({ fieldName: 'open_item_id', type: 'uuid', nullable: true }) // FK → accounting.open_items
  openItemId?: string;

  @Property({ fieldName: 'clearing_item_id', type: 'uuid', nullable: true }) // FK → accounting.clearing_items
  clearingItemId?: string;

  @Property({ fieldName: 'allocated_amount', columnType: 'numeric' })
  allocatedAmount!: string;

  @Property({
    fieldName: 'discount_amount',
    columnType: 'numeric',
    nullable: true,
  })
  discountAmount?: string;

  @Property({
    fieldName: 'withholding_amount',
    columnType: 'numeric',
    nullable: true,
  })
  withholdingAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
