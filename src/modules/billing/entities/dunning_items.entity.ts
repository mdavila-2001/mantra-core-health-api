import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dunning_items`.
 */
@Entity({ schema: 'billing', tableName: 'dunning_items' })
export class DunningItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a dunning run.
   */
  @Property({ fieldName: 'dunning_run_id', type: 'uuid' }) // FK → billing.dunning_runs
  dunningRunId!: string;

  /**
   * Identificador asociado a invoice.
   */
  @Property({ fieldName: 'invoice_id', type: 'uuid' }) // FK → billing.invoices
  invoiceId!: string;

  /**
   * Identificador asociado a open item.
   */
  @Property({ fieldName: 'open_item_id', type: 'uuid', nullable: true }) // FK → accounting.open_items
  openItemId?: string;

  /**
   * Identificador asociado a business partner.
   */
  @Property({ fieldName: 'business_partner_id', type: 'uuid', nullable: true }) // FK → erp.business_partners
  businessPartnerId?: string;

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
   * Valor de days overdue mantenido por la instancia.
   */
  @Property({ fieldName: 'days_overdue', columnType: 'int', nullable: true })
  daysOverdue?: number;

  /**
   * Valor de dunning fee mantenido por la instancia.
   */
  @Property({ fieldName: 'dunning_fee', columnType: 'numeric', nullable: true })
  dunningFee?: string;

  /**
   * Identificador asociado a notice file.
   */
  @Property({ fieldName: 'notice_file_id', type: 'uuid', nullable: true }) // FK → common.files
  noticeFileId?: string;

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
}
