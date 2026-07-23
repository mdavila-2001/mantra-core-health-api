import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'provider_invoice_artifacts' })
export class ProviderInvoiceArtifacts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'gateway_connection_id', type: 'uuid' }) // FK → payments.gateway_connections
  gatewayConnectionId!: string;

  @Property({ fieldName: 'payment_transaction_id', type: 'uuid' }) // FK → payments.payment_transactions
  paymentTransactionId!: string;

  @Property({
    fieldName: 'invoice_regeneration_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.invoice_regeneration_requests
  invoiceRegenerationRequestId?: string;

  @Property({ fieldName: 'artifact_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  artifactTypeConceptId!: string;

  @Property({ fieldName: 'external_invoice_id', columnType: 'varchar' })
  externalInvoiceId!: string;

  @Property({
    fieldName: 'invoice_number',
    columnType: 'varchar',
    nullable: true,
  })
  invoiceNumber?: string;

  @Property({
    fieldName: 'authorization_code',
    columnType: 'varchar',
    nullable: true,
  })
  authorizationCode?: string;

  @Property({ fieldName: 'issue_date', columnType: 'date', nullable: true })
  issueDate?: Date;

  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  @Property({
    fieldName: 'download_url_encrypted',
    columnType: 'text',
    nullable: true,
  })
  downloadUrlEncrypted?: string;

  @Property({
    fieldName: 'content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  contentHash?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
