import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'journal_entry_assignments' })
export class JournalEntryAssignments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ledger_entry_id', type: 'uuid' }) // FK → accounting.ledger_entries
  ledgerEntryId!: string;

  @Property({ fieldName: 'branch_id', type: 'uuid', nullable: true }) // FK → directory.branches
  branchId?: string;

  @Property({ fieldName: 'department_id', type: 'uuid', nullable: true }) // FK → erp.departments
  departmentId?: string;

  @Property({ fieldName: 'cost_center_id', type: 'uuid', nullable: true }) // FK → accounting.cost_centers
  costCenterId?: string;

  @Property({ fieldName: 'profit_center_id', type: 'uuid', nullable: true }) // FK → accounting.profit_centers
  profitCenterId?: string;

  @Property({ fieldName: 'functional_area_id', type: 'uuid', nullable: true }) // FK → accounting.functional_areas
  functionalAreaId?: string;

  @Property({ fieldName: 'segment_id', type: 'uuid', nullable: true }) // FK → accounting.segments
  segmentId?: string;

  @Property({ fieldName: 'internal_order_id', type: 'uuid', nullable: true }) // FK → accounting.internal_orders
  internalOrderId?: string;

  @Property({ fieldName: 'project_id', type: 'uuid', nullable: true }) // FK → erp.projects
  projectId?: string;

  @Property({ fieldName: 'wbs_element_id', type: 'uuid', nullable: true }) // FK → erp.wbs_elements
  wbsElementId?: string;

  @Property({ fieldName: 'business_partner_id', type: 'uuid', nullable: true }) // FK → erp.business_partners
  businessPartnerId?: string;

  @Property({ fieldName: 'subledger_account_id', type: 'uuid', nullable: true }) // FK → accounting.subledger_accounts
  subledgerAccountId?: string;

  @Property({ fieldName: 'asset_id', type: 'uuid', nullable: true }) // FK → accounting.assets
  assetId?: string;

  @Property({ fieldName: 'asset_component_id', type: 'uuid', nullable: true }) // FK → accounting.asset_components
  assetComponentId?: string;

  @Property({ fieldName: 'liability_id', type: 'uuid', nullable: true }) // FK → accounting.liabilities
  liabilityId?: string;

  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

  @Property({ fieldName: 'invoice_id', type: 'uuid', nullable: true }) // FK → billing.invoices
  invoiceId?: string;

  @Property({ fieldName: 'bill_id', type: 'uuid', nullable: true }) // FK → billing.bills
  billId?: string;

  @Property({
    fieldName: 'purchase_order_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.purchase_order_items
  purchaseOrderItemId?: string;

  @Property({
    fieldName: 'goods_receipt_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.goods_receipt_items
  goodsReceiptItemId?: string;

  @Property({ fieldName: 'sales_order_item_id', type: 'uuid', nullable: true }) // FK → erp.sales_order_items
  salesOrderItemId?: string;

  @Property({
    fieldName: 'payment_transaction_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.payment_transactions
  paymentTransactionId?: string;

  @Property({
    fieldName: 'company_bank_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.company_bank_accounts
  companyBankAccountId?: string;

  @Property({ fieldName: 'employee_id', type: 'uuid', nullable: true }) // FK → erp.employees
  employeeId?: string;

  @Property({
    fieldName: 'assignment_source_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  assignmentSourceConceptId?: string;

  @Property({ fieldName: 'derived_by_rule_id', type: 'uuid', nullable: true }) // FK → accounting.account_determination_rules
  derivedByRuleId?: string;

  @Property({ fieldName: 'is_statistical', type: 'boolean', nullable: true })
  isStatistical?: boolean;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
