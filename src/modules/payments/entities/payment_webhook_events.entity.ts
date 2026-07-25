import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'payment_webhook_events' })
export class PaymentWebhookEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'gateway_id', type: 'uuid' }) // FK → payments.payment_gateways
  gatewayId!: string;

  @Property({
    fieldName: 'gateway_connection_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.gateway_connections
  gatewayConnectionId?: string;

  @Property({ fieldName: 'event_type', columnType: 'varchar' })
  eventType!: string;

  @Property({
    fieldName: 'gateway_event_ref',
    columnType: 'varchar',
    nullable: true,
  })
  gatewayEventRef?: string;

  @Property({ fieldName: 'payload_json', type: 'json', columnType: 'jsonb' })
  payloadJson!: unknown;

  @Property({ columnType: 'varchar', nullable: true })
  signature?: string;

  @Property({ fieldName: 'is_verified', type: 'boolean', nullable: true })
  isVerified?: boolean;

  @Property({ type: 'boolean', nullable: true })
  processed?: boolean;

  @Property({ fieldName: 'related_intent_id', type: 'uuid', nullable: true }) // FK → payments.payment_intents
  relatedIntentId?: string;

  @Property({
    fieldName: 'received_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  receivedAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
