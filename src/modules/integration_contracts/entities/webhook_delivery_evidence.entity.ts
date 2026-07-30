import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `webhook_delivery_evidence`.
 */
@Entity({
  schema: 'integration_contracts',
  tableName: 'webhook_delivery_evidence',
})
export class WebhookDeliveryEvidence {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a webhook subscription.
   */
  @Property({ fieldName: 'webhook_subscription_id', type: 'uuid' }) // FK → integrations.webhook_subscriptions
  webhookSubscriptionId!: string;

  /**
   * Identificador asociado a integration exchange record.
   */
  @Property({ fieldName: 'integration_exchange_record_id', type: 'uuid' }) // FK → integration_contracts.integration_exchange_records
  integrationExchangeRecordId!: string;

  /**
   * Valor de signature algorithm mantenido por la instancia.
   */
  @Property({
    fieldName: 'signature_algorithm',
    columnType: 'varchar',
    nullable: true,
  })
  signatureAlgorithm?: string;

  /**
   * Identificador asociado a signature verification concept.
   */
  @Property({
    fieldName: 'signature_verification_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  signatureVerificationConceptId?: string;

  /**
   * Valor de delivered at mantenido por la instancia.
   */
  @Property({
    fieldName: 'delivered_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  deliveredAt?: Date;

  /**
   * Valor de acknowledged at mantenido por la instancia.
   */
  @Property({
    fieldName: 'acknowledged_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  acknowledgedAt?: Date;

  /**
   * Identificador asociado a outcome concept.
   */
  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
