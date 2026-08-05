import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `open_items`.
 */
@Entity({ schema: 'accounting', tableName: 'open_items' })
export class OpenItems {
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
   * Identificador asociado a subledger account.
   */
  @Property({ fieldName: 'subledger_account_id', type: 'uuid' }) // FK → accounting.subledger_accounts
  subledgerAccountId!: string;

  /**
   * Identificador asociado a ledger entry.
   */
  @Property({ fieldName: 'ledger_entry_id', type: 'uuid' }) // FK → accounting.ledger_entries
  ledgerEntryId!: string;

  /**
   * Identificador asociado a document type concept.
   */
  @Property({ fieldName: 'document_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  documentTypeConceptId!: string;

  /**
   * Valor de document number mantenido por la instancia.
   */
  @Property({
    fieldName: 'document_number',
    columnType: 'varchar',
    nullable: true,
  })
  documentNumber?: string;

  /**
   * Identificador asociado a invoice.
   */
  @Property({ fieldName: 'invoice_id', type: 'uuid', nullable: true }) // FK → billing.invoices
  invoiceId?: string;

  /**
   * Identificador asociado a bill.
   */
  @Property({ fieldName: 'bill_id', type: 'uuid', nullable: true }) // FK → billing.bills
  billId?: string;

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

  /**
   * Valor de baseline date mantenido por la instancia.
   */
  @Property({ fieldName: 'baseline_date', columnType: 'date', nullable: true })
  baselineDate?: Date;

  /**
   * Valor de due date mantenido por la instancia.
   */
  @Property({ fieldName: 'due_date', columnType: 'date', nullable: true })
  dueDate?: Date;

  /**
   * Valor de original amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'original_amount',
    columnType: 'numeric',
    nullable: true,
  })
  originalAmount?: string;

  /**
   * Valor de outstanding amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'outstanding_amount',
    columnType: 'numeric',
    nullable: true,
  })
  outstandingAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
