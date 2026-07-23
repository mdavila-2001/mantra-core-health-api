import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'cross_store_consistency',
  tableName: 'projection_subscriptions',
})
export class ProjectionSubscriptions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'projection_definition_id', type: 'uuid' })
  projectionDefinitionId!: string;

  @Property({ fieldName: 'source_event_type', columnType: 'varchar' })
  sourceEventType!: string;

  @Property({ fieldName: 'consumer_code', columnType: 'varchar' })
  consumerCode!: string;

  @Property({ fieldName: 'target_backend_code', columnType: 'varchar' })
  targetBackendCode!: string;

  @Property({ fieldName: 'concurrency_limit', columnType: 'int' })
  concurrencyLimit!: number;

  @Property({
    fieldName: 'retry_policy_json',
    type: 'json',
    columnType: 'jsonb',
  })
  retryPolicyJson!: unknown;

  @Property({ fieldName: 'dead_letter_enabled', type: 'boolean' })
  deadLetterEnabled!: boolean;

  @Property({ columnType: 'varchar' })
  state!: string;
}
