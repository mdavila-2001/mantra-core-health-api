import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'invoice_match_runs' })
export class InvoiceMatchRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'bill_id', type: 'uuid' }) // FK → billing.bills
  billId!: string;

  @Property({ fieldName: 'match_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  matchTypeConceptId!: string;

  @Property({ fieldName: 'purchase_order_id', type: 'uuid', nullable: true }) // FK → erp.purchase_orders
  purchaseOrderId?: string;

  @Property({ fieldName: 'run_at', columnType: 'timestamptz', nullable: true })
  runAt?: Date;

  @Property({
    fieldName: 'matched_amount',
    columnType: 'numeric',
    nullable: true,
  })
  matchedAmount?: string;

  @Property({
    fieldName: 'variance_amount',
    columnType: 'numeric',
    nullable: true,
  })
  varianceAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'result_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  resultConceptId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
