import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `provider_invoice_artifacts`.
 */
@Entity({ schema: 'payments', tableName: 'provider_invoice_artifacts' })
export class ProviderInvoiceArtifacts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a gateway connection.
   */
  @Property({ fieldName: 'gateway_connection_id', type: 'uuid' }) // FK → payments.gateway_connections
  gatewayConnectionId!: string;

  /**
   * Identificador asociado a payment transaction.
   */
  @Property({ fieldName: 'payment_transaction_id', type: 'uuid' }) // FK → payments.payment_transactions
  paymentTransactionId!: string;

  /**
   * Identificador asociado a invoice regeneration request.
   */
  @Property({
    fieldName: 'invoice_regeneration_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.invoice_regeneration_requests
  invoiceRegenerationRequestId?: string;

  /**
   * Identificador asociado a artifact type concept.
   */
  @Property({ fieldName: 'artifact_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  artifactTypeConceptId!: string;

  /**
   * Identificador asociado a external invoice.
   */
  @Property({ fieldName: 'external_invoice_id', columnType: 'varchar' })
  externalInvoiceId!: string;

  /**
   * Valor de invoice number mantenido por la instancia.
   */
  @Property({
    fieldName: 'invoice_number',
    columnType: 'varchar',
    nullable: true,
  })
  invoiceNumber?: string;

  /**
   * Valor de authorization code mantenido por la instancia.
   */
  @Property({
    fieldName: 'authorization_code',
    columnType: 'varchar',
    nullable: true,
  })
  authorizationCode?: string;

  /**
   * Valor de issue date mantenido por la instancia.
   */
  @Property({ fieldName: 'issue_date', columnType: 'date', nullable: true })
  issueDate?: Date;

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  /**
   * Valor de download url encrypted mantenido por la instancia.
   */
  @Property({
    fieldName: 'download_url_encrypted',
    columnType: 'text',
    nullable: true,
  })
  downloadUrlEncrypted?: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  contentHash?: string;

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

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
