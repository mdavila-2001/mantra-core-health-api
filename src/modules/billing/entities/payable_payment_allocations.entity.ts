import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `payable_payment_allocations`.
 */
@Entity({ schema: 'billing', tableName: 'payable_payment_allocations' })
export class PayablePaymentAllocations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a payment made.
   */
  @Property({ fieldName: 'payment_made_id', type: 'uuid' }) // FK → billing.payments_made
  paymentMadeId!: string;

  /**
   * Identificador asociado a bill.
   */
  @Property({ fieldName: 'bill_id', type: 'uuid' }) // FK → billing.bills
  billId!: string;

  /**
   * Identificador asociado a open item.
   */
  @Property({ fieldName: 'open_item_id', type: 'uuid', nullable: true }) // FK → accounting.open_items
  openItemId?: string;

  /**
   * Identificador asociado a clearing item.
   */
  @Property({ fieldName: 'clearing_item_id', type: 'uuid', nullable: true }) // FK → accounting.clearing_items
  clearingItemId?: string;

  /**
   * Valor de allocated amount mantenido por la instancia.
   */
  @Property({ fieldName: 'allocated_amount', columnType: 'numeric' })
  allocatedAmount!: string;

  /**
   * Valor de discount amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'discount_amount',
    columnType: 'numeric',
    nullable: true,
  })
  discountAmount?: string;

  /**
   * Valor de withholding amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'withholding_amount',
    columnType: 'numeric',
    nullable: true,
  })
  withholdingAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
