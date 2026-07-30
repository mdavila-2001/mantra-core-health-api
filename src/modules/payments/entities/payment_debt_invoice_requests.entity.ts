import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `payment_debt_invoice_requests`.
 */
@Entity({ schema: 'payments', tableName: 'payment_debt_invoice_requests' })
export class PaymentDebtInvoiceRequests {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a payment debt.
   */
  @Property({ fieldName: 'payment_debt_id', type: 'uuid' }) // FK → payments.payment_debts
  paymentDebtId!: string;

  /**
   * Valor de request number mantenido por la instancia.
   */
  @Property({ fieldName: 'request_number', columnType: 'int' })
  requestNumber!: number;

  /**
   * Valor de requested at mantenido por la instancia.
   */
  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  /**
   * Identificador asociado a requested by user.
   */
  @Property({ fieldName: 'requested_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  requestedByUserId?: string;

  /**
   * Valor de invoice name mantenido por la instancia.
   */
  @Property({
    fieldName: 'invoice_name',
    columnType: 'varchar',
    nullable: true,
  })
  invoiceName?: string;

  /**
   * Valor de tax identifier mantenido por la instancia.
   */
  @Property({
    fieldName: 'tax_identifier',
    columnType: 'varchar',
    nullable: true,
  })
  taxIdentifier?: string;

  /**
   * Valor de invoice email mantenido por la instancia.
   */
  @Property({
    fieldName: 'invoice_email',
    columnType: 'varchar',
    nullable: true,
  })
  invoiceEmail?: string;

  /**
   * Valor de invoice metadata json mantenido por la instancia.
   */
  @Property({
    fieldName: 'invoice_metadata_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  invoiceMetadataJson?: unknown;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a external invoice request.
   */
  @Property({
    fieldName: 'external_invoice_request_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalInvoiceRequestId?: string;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
