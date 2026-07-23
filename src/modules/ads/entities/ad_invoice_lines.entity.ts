import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'ad_invoice_lines' })
export class AdInvoiceLines {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_invoice_id', type: 'uuid' }) // FK → ads.ad_invoices
  adInvoiceId!: string;

  @Property({ fieldName: 'campaign_ref_id', type: 'uuid' })
  campaignRefId!: string;

  @Property({ columnType: 'varchar', nullable: true })
  description?: string;

  @Property({ type: 'bigint', nullable: true })
  impressions?: string;

  @Property({ type: 'bigint', nullable: true })
  clicks?: string;

  @Property({ columnType: 'numeric' })
  amount!: string;

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
