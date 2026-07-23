import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'payment_debt_invoice_requests' })
export class PaymentDebtInvoiceRequests {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'payment_debt_id', type: 'uuid' }) // FK → payments.payment_debts
  paymentDebtId!: string;

  @Property({ fieldName: 'request_number', columnType: 'int' })
  requestNumber!: number;

  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  @Property({ fieldName: 'requested_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  requestedByUserId?: string;

  @Property({
    fieldName: 'invoice_name',
    columnType: 'varchar',
    nullable: true,
  })
  invoiceName?: string;

  @Property({
    fieldName: 'tax_identifier',
    columnType: 'varchar',
    nullable: true,
  })
  taxIdentifier?: string;

  @Property({
    fieldName: 'invoice_email',
    columnType: 'varchar',
    nullable: true,
  })
  invoiceEmail?: string;

  @Property({
    fieldName: 'invoice_metadata_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  invoiceMetadataJson?: unknown;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'external_invoice_request_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalInvoiceRequestId?: string;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
