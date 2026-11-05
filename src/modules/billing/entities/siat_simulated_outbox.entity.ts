import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `siat_simulated_outbox`.
 */
@Entity({ schema: 'billing', tableName: 'siat_simulated_outbox' })
export class SiatSimulatedOutbox {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a siat invoice.
   */
  @Property({ fieldName: 'siat_invoice_id', type: 'uuid' }) // FK → billing.siat_simulated_invoices
  siatInvoiceId!: string;

  /**
   * Valor de to email mantenido por la instancia.
   */
  @Property({ fieldName: 'to_email', columnType: 'varchar(320)' })
  toEmail!: string;

  /**
   * Valor de attachments mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb' })
  attachments!: unknown;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar(24)' })
  status!: string;

  /**
   * Valor de siat mode mantenido por la instancia.
   */
  @Property({
    fieldName: 'siat_mode',
    columnType: 'varchar(12)',
    default: 'simulated',
  })
  siatMode: 'simulated' | 'real' = 'simulated';

  /**
   * Valor de queued at mantenido por la instancia.
   */
  @Property({ fieldName: 'queued_at', columnType: 'timestamptz' })
  queuedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;
}
