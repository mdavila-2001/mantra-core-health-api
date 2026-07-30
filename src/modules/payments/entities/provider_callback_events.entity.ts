import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `provider_callback_events`.
 */
@Entity({ schema: 'payments', tableName: 'provider_callback_events' })
export class ProviderCallbackEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a provider callback endpoint.
   */
  @Property({ fieldName: 'provider_callback_endpoint_id', type: 'uuid' }) // FK → payments.provider_callback_endpoints
  providerCallbackEndpointId!: string;

  /**
   * Identificador asociado a payment checkout session.
   */
  @Property({
    fieldName: 'payment_checkout_session_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.payment_checkout_sessions
  paymentCheckoutSessionId?: string;

  /**
   * Identificador asociado a payment transaction.
   */
  @Property({
    fieldName: 'payment_transaction_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.payment_transactions
  paymentTransactionId?: string;

  /**
   * Identificador asociado a external event.
   */
  @Property({
    fieldName: 'external_event_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalEventId?: string;

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
   * Valor de received at mantenido por la instancia.
   */
  @Property({ fieldName: 'received_at', columnType: 'timestamptz' })
  receivedAt!: Date;

  /**
   * Valor de payload hash mantenido por la instancia.
   */
  @Property({ fieldName: 'payload_hash', columnType: 'varchar' })
  payloadHash!: string;

  /**
   * Valor de headers redacted json mantenido por la instancia.
   */
  @Property({
    fieldName: 'headers_redacted_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  headersRedactedJson?: unknown;

  /**
   * Valor de payload redacted json mantenido por la instancia.
   */
  @Property({
    fieldName: 'payload_redacted_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  payloadRedactedJson?: unknown;

  /**
   * Identificador asociado a verification status concept.
   */
  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

  /**
   * Identificador asociado a processing status concept.
   */
  @Property({ fieldName: 'processing_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  processingStatusConceptId!: string;

  /**
   * Identificador asociado a duplicate of event.
   */
  @Property({
    fieldName: 'duplicate_of_event_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.provider_callback_events
  duplicateOfEventId?: string;

  /**
   * Valor de processed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'processed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  processedAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
