import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `payment_checkout_sessions`.
 */
@Entity({ schema: 'payments', tableName: 'payment_checkout_sessions' })
export class PaymentCheckoutSessions {
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
   * Identificador asociado a payment debt.
   */
  @Property({ fieldName: 'payment_debt_id', type: 'uuid' }) // FK → payments.payment_debts
  paymentDebtId!: string;

  /**
   * Identificador asociado a payment intent.
   */
  @Property({ fieldName: 'payment_intent_id', type: 'uuid', nullable: true }) // FK → payments.payment_intents
  paymentIntentId?: string;

  /**
   * Valor de session token hash mantenido por la instancia.
   */
  @Property({ fieldName: 'session_token_hash', columnType: 'varchar' })
  sessionTokenHash!: string;

  /**
   * Identificador asociado a external transaction.
   */
  @Property({
    fieldName: 'external_transaction_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalTransactionId?: string;

  /**
   * Valor de redirect url mantenido por la instancia.
   */
  @Property({ fieldName: 'redirect_url', columnType: 'varchar' })
  redirectUrl!: string;

  /**
   * Valor de success return url mantenido por la instancia.
   */
  @Property({
    fieldName: 'success_return_url',
    columnType: 'varchar',
    nullable: true,
  })
  successReturnUrl?: string;

  /**
   * Valor de failure return url mantenido por la instancia.
   */
  @Property({
    fieldName: 'failure_return_url',
    columnType: 'varchar',
    nullable: true,
  })
  failureReturnUrl?: string;

  /**
   * Identificador asociado a callback endpoint.
   */
  @Property({ fieldName: 'callback_endpoint_id', type: 'uuid', nullable: true }) // FK → payments.provider_callback_endpoints
  callbackEndpointId?: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @Property({ fieldName: 'expires_at', columnType: 'timestamptz' })
  expiresAt!: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de opened at mantenido por la instancia.
   */
  @Property({
    fieldName: 'opened_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  openedAt?: Date;

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
