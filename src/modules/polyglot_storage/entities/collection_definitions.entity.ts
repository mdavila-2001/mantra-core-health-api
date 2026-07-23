import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'polyglot_storage', tableName: 'collection_definitions' })
export class CollectionDefinitions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'storage_backend_id', type: 'uuid' }) // FK → polyglot_storage.storage_backends
  storageBackendId!: string;

  @Property({ fieldName: 'dataset_definition_id', type: 'uuid' }) // FK → polyglot_storage.dataset_definitions
  datasetDefinitionId!: string;

  @Property({ fieldName: 'logical_name', columnType: 'varchar' })
  logicalName!: string;

  @Property({ fieldName: 'physical_name_pattern', columnType: 'varchar' })
  physicalNamePattern!: string;

  @Property({ fieldName: 'partitioning_strategy', columnType: 'varchar' })
  partitioningStrategy!: string;

  @Property({ fieldName: 'tenant_isolation_mode', columnType: 'varchar' })
  tenantIsolationMode!: string;

  @Property({ fieldName: 'routing_key_expression', columnType: 'varchar' })
  routingKeyExpression!: string;

  @Property({ fieldName: 'shard_key_expression', columnType: 'varchar' })
  shardKeyExpression!: string;

  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;
}
