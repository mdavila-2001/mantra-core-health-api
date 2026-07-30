import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `projection_delivery_attempts`.
 */
@Entity({
  schema: 'cross_store_consistency',
  tableName: 'projection_delivery_attempts',
})
export class ProjectionDeliveryAttempts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a projection subscription.
   */
  @Property({ fieldName: 'projection_subscription_id', type: 'uuid' })
  projectionSubscriptionId!: string;

  /**
   * Identificador asociado a outbox event.
   */
  @Property({ fieldName: 'outbox_event_id', type: 'uuid' })
  outboxEventId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Valor de attempt number mantenido por la instancia.
   */
  @Property({ fieldName: 'attempt_number', columnType: 'int' })
  attemptNumber!: number;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

  /**
   * Valor de payload hash mantenido por la instancia.
   */
  @Property({ fieldName: 'payload_hash', columnType: 'varchar' })
  payloadHash!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;

  /**
   * Valor de error code mantenido por la instancia.
   */
  @Property({ fieldName: 'error_code', columnType: 'varchar', nullable: true })
  errorCode?: string;
}
