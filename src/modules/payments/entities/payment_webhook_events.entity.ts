import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `payment_webhook_events`.
 */
@Entity({ schema: 'payments', tableName: 'payment_webhook_events' })
export class PaymentWebhookEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a gateway.
   */
  @Property({ fieldName: 'gateway_id', type: 'uuid' }) // FK → payments.payment_gateways
  gatewayId!: string;

  /**
   * Identificador asociado a gateway connection.
   */
  @Property({
    fieldName: 'gateway_connection_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.gateway_connections
  gatewayConnectionId?: string;

  /**
   * Valor de event type mantenido por la instancia.
   */
  @Property({ fieldName: 'event_type', columnType: 'varchar' })
  eventType!: string;

  /**
   * Valor de gateway event ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'gateway_event_ref',
    columnType: 'varchar',
    nullable: true,
  })
  gatewayEventRef?: string;

  /**
   * Valor de payload json mantenido por la instancia.
   */
  @Property({ fieldName: 'payload_json', type: 'json', columnType: 'jsonb' })
  payloadJson!: unknown;

  /**
   * Valor de signature mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  signature?: string;

  /**
   * Valor de is verified mantenido por la instancia.
   */
  @Property({ fieldName: 'is_verified', type: 'boolean', nullable: true })
  isVerified?: boolean;

  /**
   * Valor de processed mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  processed?: boolean;

  /**
   * Identificador asociado a related intent.
   */
  @Property({ fieldName: 'related_intent_id', type: 'uuid', nullable: true }) // FK → payments.payment_intents
  relatedIntentId?: string;

  /**
   * Valor de received at mantenido por la instancia.
   */
  @Property({
    fieldName: 'received_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  receivedAt?: Date;

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
