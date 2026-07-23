import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'integration_contracts',
  tableName: 'webhook_delivery_evidence',
})
export class WebhookDeliveryEvidence {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'webhook_subscription_id', type: 'uuid' }) // FK → integrations.webhook_subscriptions
  webhookSubscriptionId!: string;

  @Property({ fieldName: 'integration_exchange_record_id', type: 'uuid' }) // FK → integration_contracts.integration_exchange_records
  integrationExchangeRecordId!: string;

  @Property({
    fieldName: 'signature_algorithm',
    columnType: 'varchar',
    nullable: true,
  })
  signatureAlgorithm?: string;

  @Property({
    fieldName: 'signature_verification_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  signatureVerificationConceptId?: string;

  @Property({
    fieldName: 'delivered_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  deliveredAt?: Date;

  @Property({
    fieldName: 'acknowledged_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  acknowledgedAt?: Date;

  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
