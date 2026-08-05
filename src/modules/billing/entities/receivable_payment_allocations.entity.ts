import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `receivable_payment_allocations`.
 */
@Entity({ schema: 'billing', tableName: 'receivable_payment_allocations' })
export class ReceivablePaymentAllocations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a payment received.
   */
  @Property({ fieldName: 'payment_received_id', type: 'uuid' }) // FK → billing.payments_received
  paymentReceivedId!: string;

  /**
   * Identificador asociado a invoice.
   */
  @Property({ fieldName: 'invoice_id', type: 'uuid' }) // FK → billing.invoices
  invoiceId!: string;

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
   * Valor de write off amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'write_off_amount',
    columnType: 'numeric',
    nullable: true,
  })
  writeOffAmount?: string;

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
