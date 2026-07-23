import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'provider_callback_events' })
export class ProviderCallbackEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'provider_callback_endpoint_id', type: 'uuid' }) // FK → payments.provider_callback_endpoints
  providerCallbackEndpointId!: string;

  @Property({
    fieldName: 'payment_checkout_session_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.payment_checkout_sessions
  paymentCheckoutSessionId?: string;

  @Property({
    fieldName: 'payment_transaction_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.payment_transactions
  paymentTransactionId?: string;

  @Property({
    fieldName: 'external_event_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalEventId?: string;

  @Property({
    fieldName: 'external_transaction_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalTransactionId?: string;

  @Property({ fieldName: 'received_at', columnType: 'timestamptz' })
  receivedAt!: Date;

  @Property({ fieldName: 'payload_hash', columnType: 'varchar' })
  payloadHash!: string;

  @Property({
    fieldName: 'headers_redacted_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  headersRedactedJson?: unknown;

  @Property({
    fieldName: 'payload_redacted_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  payloadRedactedJson?: unknown;

  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

  @Property({ fieldName: 'processing_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  processingStatusConceptId!: string;

  @Property({
    fieldName: 'duplicate_of_event_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  duplicateOfEventId?: string;

  @Property({
    fieldName: 'processed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  processedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
