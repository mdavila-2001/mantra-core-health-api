import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `bills`.
 */
@Entity({ schema: 'billing', tableName: 'bills' })
export class Bills {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  /**
   * Identificador asociado a vendor.
   */
  @Property({ fieldName: 'vendor_id', type: 'uuid' }) // FK → billing.vendors
  vendorId!: string;

  /**
   * Valor de bill number mantenido por la instancia.
   */
  @Property({ fieldName: 'bill_number', columnType: 'varchar' })
  billNumber!: string;

  /**
   * Valor de issue date mantenido por la instancia.
   */
  @Property({ fieldName: 'issue_date', columnType: 'date' })
  issueDate!: Date;

  /**
   * Valor de due date mantenido por la instancia.
   */
  @Property({ fieldName: 'due_date', columnType: 'date', nullable: true })
  dueDate?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de subtotal mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  subtotal?: string;

  /**
   * Valor de tax total mantenido por la instancia.
   */
  @Property({ fieldName: 'tax_total', columnType: 'numeric', nullable: true })
  taxTotal?: string;

  /**
   * Valor de total mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  total?: string;

  /**
   * Valor de paid total mantenido por la instancia.
   */
  @Property({ fieldName: 'paid_total', columnType: 'numeric', nullable: true })
  paidTotal?: string;

  /**
   * Valor de balance mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  balance?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a supplier business partner.
   */
  @Property({
    fieldName: 'supplier_business_partner_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.business_partners
  supplierBusinessPartnerId?: string;

  /**
   * Identificador asociado a supplier subledger account.
   */
  @Property({
    fieldName: 'supplier_subledger_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.subledger_accounts
  supplierSubledgerAccountId?: string;

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

  /**
   * Identificador asociado a purchase order.
   */
  @Property({ fieldName: 'purchase_order_id', type: 'uuid', nullable: true }) // FK → erp.purchase_orders
  purchaseOrderId?: string;

  /**
   * Identificador asociado a transaction.
   */
  @Property({ fieldName: 'transaction_id', type: 'uuid', nullable: true }) // FK → accounting.journal_transactions
  transactionId?: string;

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
