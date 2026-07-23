import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'invoice_regeneration_requests' })
export class InvoiceRegenerationRequests {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'gateway_connection_id', type: 'uuid' }) // FK → payments.gateway_connections
  gatewayConnectionId!: string;

  @Property({ fieldName: 'payment_transaction_id', type: 'uuid' }) // FK → payments.payment_transactions
  paymentTransactionId!: string;

  @Property({ fieldName: 'payment_debt_id', type: 'uuid', nullable: true }) // FK → payments.payment_debts
  paymentDebtId?: string;

  @Property({ fieldName: 'request_number', columnType: 'varchar' })
  requestNumber!: string;

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

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'external_request_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalRequestId?: string;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

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
