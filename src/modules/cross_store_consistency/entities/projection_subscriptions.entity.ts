import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `projection_subscriptions`.
 */
@Entity({
  schema: 'cross_store_consistency',
  tableName: 'projection_subscriptions',
})
export class ProjectionSubscriptions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a projection definition.
   */
  @Property({ fieldName: 'projection_definition_id', type: 'uuid' })
  projectionDefinitionId!: string;

  /**
   * Valor de source event type mantenido por la instancia.
   */
  @Property({ fieldName: 'source_event_type', columnType: 'varchar' })
  sourceEventType!: string;

  /**
   * Valor de consumer code mantenido por la instancia.
   */
  @Property({ fieldName: 'consumer_code', columnType: 'varchar' })
  consumerCode!: string;

  /**
   * Valor de target backend code mantenido por la instancia.
   */
  @Property({ fieldName: 'target_backend_code', columnType: 'varchar' })
  targetBackendCode!: string;

  /**
   * Valor de concurrency limit mantenido por la instancia.
   */
  @Property({ fieldName: 'concurrency_limit', columnType: 'int' })
  concurrencyLimit!: number;

  /**
   * Valor de retry policy json mantenido por la instancia.
   */
  @Property({
    fieldName: 'retry_policy_json',
    type: 'json',
    columnType: 'jsonb',
  })
  retryPolicyJson!: unknown;

  /**
   * Valor de dead letter enabled mantenido por la instancia.
   */
  @Property({ fieldName: 'dead_letter_enabled', type: 'boolean' })
  deadLetterEnabled!: boolean;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
