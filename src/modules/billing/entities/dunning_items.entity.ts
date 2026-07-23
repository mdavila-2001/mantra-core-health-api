import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'billing', tableName: 'dunning_items' })
export class DunningItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'dunning_run_id', type: 'uuid' }) // FK → billing.dunning_runs
  dunningRunId!: string;

  @Property({ fieldName: 'invoice_id', type: 'uuid' }) // FK → billing.invoices
  invoiceId!: string;

  @Property({ fieldName: 'open_item_id', type: 'uuid', nullable: true }) // FK → accounting.open_items
  openItemId?: string;

  @Property({ fieldName: 'business_partner_id', type: 'uuid', nullable: true }) // FK → erp.business_partners
  businessPartnerId?: string;

  @Property({
    fieldName: 'outstanding_amount',
    columnType: 'numeric',
    nullable: true,
  })
  outstandingAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'days_overdue', columnType: 'int', nullable: true })
  daysOverdue?: number;

  @Property({ fieldName: 'dunning_fee', columnType: 'numeric', nullable: true })
  dunningFee?: string;

  @Property({ fieldName: 'notice_file_id', type: 'uuid', nullable: true }) // FK → common.files
  noticeFileId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
