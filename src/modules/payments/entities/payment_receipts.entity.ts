import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `payment_receipts`.
 */
@Entity({ schema: 'payments', tableName: 'payment_receipts' })
export class PaymentReceipts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a payment transaction.
   */
  @Property({ fieldName: 'payment_transaction_id', type: 'uuid' }) // FK → payments.payment_transactions
  paymentTransactionId!: string;

  /**
   * Identificador asociado a payment debt.
   */
  @Property({ fieldName: 'payment_debt_id', type: 'uuid', nullable: true }) // FK → payments.payment_debts
  paymentDebtId?: string;

  /**
   * Valor de receipt number mantenido por la instancia.
   */
  @Property({ fieldName: 'receipt_number', columnType: 'varchar' })
  receiptNumber!: string;

  /**
   * Valor de issued at mantenido por la instancia.
   */
  @Property({ fieldName: 'issued_at', columnType: 'timestamptz' })
  issuedAt!: Date;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @Property({ columnType: 'numeric(20,6)' })
  amount!: string;

  /**
   * Valor de currency code mantenido por la instancia.
   */
  @Property({ fieldName: 'currency_code', columnType: 'char(3)' })
  currencyCode!: string;

  /**
   * Identificador asociado a payer business partner.
   */
  @Property({
    fieldName: 'payer_business_partner_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.business_partners
  payerBusinessPartnerId?: string;

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  contentHash?: string;

  /**
   * Valor de voided at mantenido por la instancia.
   */
  @Property({
    fieldName: 'voided_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  voidedAt?: Date;

  /**
   * Valor de void reason mantenido por la instancia.
   */
  @Property({ fieldName: 'void_reason', columnType: 'text', nullable: true })
  voidReason?: string;

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
