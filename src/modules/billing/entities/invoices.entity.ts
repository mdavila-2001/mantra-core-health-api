import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `invoices`.
 */
@Entity({ schema: 'billing', tableName: 'invoices' })
export class Invoices {
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
   * Valor de invoice number mantenido por la instancia.
   */
  @Property({ fieldName: 'invoice_number', columnType: 'varchar' })
  invoiceNumber!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

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
   * Valor de discount total mantenido por la instancia.
   */
  @Property({
    fieldName: 'discount_total',
    columnType: 'numeric',
    nullable: true,
  })
  discountTotal?: string;

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
   * Identificador asociado a customer business partner.
   */
  @Property({
    fieldName: 'customer_business_partner_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.business_partners
  customerBusinessPartnerId?: string;

  /**
   * Identificador asociado a customer subledger account.
   */
  @Property({
    fieldName: 'customer_subledger_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.subledger_accounts
  customerSubledgerAccountId?: string;

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

  /**
   * Identificador asociado a sales order.
   */
  @Property({ fieldName: 'sales_order_id', type: 'uuid', nullable: true }) // FK → erp.sales_orders
  salesOrderId?: string;

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
