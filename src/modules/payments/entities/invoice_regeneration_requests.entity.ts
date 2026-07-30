import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `invoice_regeneration_requests`.
 */
@Entity({ schema: 'payments', tableName: 'invoice_regeneration_requests' })
export class InvoiceRegenerationRequests {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

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
   * Identificador asociado a payment debt.
   */
  @Property({ fieldName: 'payment_debt_id', type: 'uuid', nullable: true }) // FK → payments.payment_debts
  paymentDebtId?: string;

  /**
   * Valor de request number mantenido por la instancia.
   */
  @Property({ fieldName: 'request_number', columnType: 'varchar' })
  requestNumber!: string;

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
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a external request.
   */
  @Property({
    fieldName: 'external_request_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalRequestId?: string;

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
