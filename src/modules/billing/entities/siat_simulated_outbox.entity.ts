import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'billing', tableName: 'siat_simulated_outbox' })
export class SiatSimulatedOutbox {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'siat_invoice_id', type: 'uuid' }) // FK → billing.siat_simulated_invoices
  siatInvoiceId!: string;

  @Property({ fieldName: 'to_email', columnType: 'varchar(320)' })
  toEmail!: string;

  @Property({ type: 'json', columnType: 'jsonb' })
  attachments!: unknown;

  @Property({ columnType: 'varchar(24)' })
  status!: string;

  @Property({ fieldName: 'siat_mode', columnType: 'varchar(12)', default: 'simulated' })
  siatMode: 'simulated' | 'real' = 'simulated';

  @Property({ fieldName: 'queued_at', columnType: 'timestamptz' })
  queuedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;
}
