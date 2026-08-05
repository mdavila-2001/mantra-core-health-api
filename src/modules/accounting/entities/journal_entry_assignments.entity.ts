import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `journal_entry_assignments`.
 */
@Entity({ schema: 'accounting', tableName: 'journal_entry_assignments' })
export class JournalEntryAssignments {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a ledger entry.
   */
  @Property({ fieldName: 'ledger_entry_id', type: 'uuid' }) // FK → accounting.ledger_entries
  ledgerEntryId!: string;

  /**
   * Identificador asociado a branch.
   */
  @Property({ fieldName: 'branch_id', type: 'uuid', nullable: true }) // FK → directory.branches
  branchId?: string;

  /**
   * Identificador asociado a department.
   */
  @Property({ fieldName: 'department_id', type: 'uuid', nullable: true }) // FK → erp.departments
  departmentId?: string;

  /**
   * Identificador asociado a cost center.
   */
  @Property({ fieldName: 'cost_center_id', type: 'uuid', nullable: true }) // FK → accounting.cost_centers
  costCenterId?: string;

  /**
   * Identificador asociado a profit center.
   */
  @Property({ fieldName: 'profit_center_id', type: 'uuid', nullable: true }) // FK → accounting.profit_centers
  profitCenterId?: string;

  /**
   * Identificador asociado a functional area.
   */
  @Property({ fieldName: 'functional_area_id', type: 'uuid', nullable: true }) // FK → accounting.functional_areas
  functionalAreaId?: string;

  /**
   * Identificador asociado a segment.
   */
  @Property({ fieldName: 'segment_id', type: 'uuid', nullable: true }) // FK → accounting.segments
  segmentId?: string;

  /**
   * Identificador asociado a internal order.
   */
  @Property({ fieldName: 'internal_order_id', type: 'uuid', nullable: true }) // FK → accounting.internal_orders
  internalOrderId?: string;

  /**
   * Identificador asociado a project.
   */
  @Property({ fieldName: 'project_id', type: 'uuid', nullable: true }) // FK → erp.projects
  projectId?: string;

  /**
   * Identificador asociado a wbs element.
   */
  @Property({ fieldName: 'wbs_element_id', type: 'uuid', nullable: true }) // FK → erp.wbs_elements
  wbsElementId?: string;

  /**
   * Identificador asociado a business partner.
   */
  @Property({ fieldName: 'business_partner_id', type: 'uuid', nullable: true }) // FK → erp.business_partners
  businessPartnerId?: string;

  /**
   * Identificador asociado a subledger account.
   */
  @Property({ fieldName: 'subledger_account_id', type: 'uuid', nullable: true }) // FK → accounting.subledger_accounts
  subledgerAccountId?: string;

  /**
   * Identificador asociado a asset.
   */
  @Property({ fieldName: 'asset_id', type: 'uuid', nullable: true }) // FK → accounting.assets
  assetId?: string;

  /**
   * Identificador asociado a asset component.
   */
  @Property({ fieldName: 'asset_component_id', type: 'uuid', nullable: true }) // FK → accounting.asset_components
  assetComponentId?: string;

  /**
   * Identificador asociado a liability.
   */
  @Property({ fieldName: 'liability_id', type: 'uuid', nullable: true }) // FK → accounting.liabilities
  liabilityId?: string;

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

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
   * Identificador asociado a purchase order item.
   */
  @Property({
    fieldName: 'purchase_order_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.purchase_order_items
  purchaseOrderItemId?: string;

  /**
   * Identificador asociado a goods receipt item.
   */
  @Property({
    fieldName: 'goods_receipt_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.goods_receipt_items
  goodsReceiptItemId?: string;

  /**
   * Identificador asociado a sales order item.
   */
  @Property({ fieldName: 'sales_order_item_id', type: 'uuid', nullable: true }) // FK → erp.sales_order_items
  salesOrderItemId?: string;

  /**
   * Identificador asociado a payment transaction.
   */
  @Property({
    fieldName: 'payment_transaction_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.payment_transactions
  paymentTransactionId?: string;

  /**
   * Identificador asociado a company bank account.
   */
  @Property({
    fieldName: 'company_bank_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.company_bank_accounts
  companyBankAccountId?: string;

  /**
   * Identificador asociado a employee.
   */
  @Property({ fieldName: 'employee_id', type: 'uuid', nullable: true }) // FK → erp.employees
  employeeId?: string;

  /**
   * Identificador asociado a assignment source concept.
   */
  @Property({
    fieldName: 'assignment_source_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  assignmentSourceConceptId?: string;

  /**
   * Identificador asociado a derived by rule.
   */
  @Property({ fieldName: 'derived_by_rule_id', type: 'uuid', nullable: true }) // FK → accounting.account_determination_rules
  derivedByRuleId?: string;

  /**
   * Valor de is statistical mantenido por la instancia.
   */
  @Property({ fieldName: 'is_statistical', type: 'boolean', nullable: true })
  isStatistical?: boolean;

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
