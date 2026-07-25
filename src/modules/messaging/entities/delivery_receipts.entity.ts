import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'messaging', tableName: 'delivery_receipts' })
export class DeliveryReceipts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'delivery_id', type: 'uuid' }) // FK → messaging.notification_deliveries
  deliveryId!: string;

  @Property({ fieldName: 'receipt_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  receiptTypeConceptId!: string;

  @Property({
    fieldName: 'provider_status',
    columnType: 'varchar',
    nullable: true,
  })
  providerStatus?: string;

  @Property({
    fieldName: 'raw_payload_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  rawPayloadJson?: unknown;

  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
