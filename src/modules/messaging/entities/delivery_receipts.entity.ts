import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `delivery_receipts`.
 */
@Entity({ schema: 'messaging', tableName: 'delivery_receipts' })
export class DeliveryReceipts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a delivery.
   */
  @Property({ fieldName: 'delivery_id', type: 'uuid' }) // FK → messaging.notification_deliveries
  deliveryId!: string;

  /**
   * Identificador asociado a receipt type concept.
   */
  @Property({ fieldName: 'receipt_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  receiptTypeConceptId!: string;

  /**
   * Valor de provider status mantenido por la instancia.
   */
  @Property({
    fieldName: 'provider_status',
    columnType: 'varchar',
    nullable: true,
  })
  providerStatus?: string;

  /**
   * Valor de raw payload json mantenido por la instancia.
   */
  @Property({
    fieldName: 'raw_payload_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  rawPayloadJson?: unknown;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
