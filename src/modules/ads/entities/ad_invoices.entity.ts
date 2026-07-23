import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'ad_invoices' })
export class AdInvoices {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  @Property({ fieldName: 'invoice_number', columnType: 'varchar' })
  invoiceNumber!: string;

  @Property({ fieldName: 'period_start', columnType: 'date' })
  periodStart!: Date;

  @Property({ fieldName: 'period_end', columnType: 'date' })
  periodEnd!: Date;

  @Property({ columnType: 'numeric', nullable: true })
  subtotal?: string;

  @Property({ fieldName: 'tax_total', columnType: 'numeric', nullable: true })
  taxTotal?: string;

  @Property({ columnType: 'numeric', nullable: true })
  total?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'payment_intent_id', type: 'uuid', nullable: true }) // FK → payments.payment_intents
  paymentIntentId?: string;

  @Property({
    fieldName: 'issued_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  issuedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
