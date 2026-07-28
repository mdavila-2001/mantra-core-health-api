import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `projection_checkpoints`.
 */
@Entity({
  schema: 'cross_store_consistency',
  tableName: 'projection_checkpoints',
})
export class ProjectionCheckpoints {
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
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Valor de partition key mantenido por la instancia.
   */
  @Property({ fieldName: 'partition_key', columnType: 'varchar' })
  partitionKey!: string;

  /**
   * Valor de source position mantenido por la instancia.
   */
  @Property({ fieldName: 'source_position', columnType: 'varchar' })
  sourcePosition!: string;

  /**
   * Identificador asociado a source event.
   */
  @Property({ fieldName: 'source_event_id', type: 'uuid' })
  sourceEventId!: string;

  /**
   * Valor de target version mantenido por la instancia.
   */
  @Property({ fieldName: 'target_version', type: 'bigint' })
  targetVersion!: string;

  /**
   * Valor de checkpointed at mantenido por la instancia.
   */
  @Property({ fieldName: 'checkpointed_at', columnType: 'timestamptz' })
  checkpointedAt!: Date;
}
