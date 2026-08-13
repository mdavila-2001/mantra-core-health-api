import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `collection_definitions`.
 */
@Entity({ schema: 'polyglot_storage', tableName: 'collection_definitions' })
export class CollectionDefinitions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a storage backend.
   */
  @Property({ fieldName: 'storage_backend_id', type: 'uuid' }) // FK → polyglot_storage.storage_backends
  storageBackendId!: string;

  /**
   * Identificador asociado a dataset definition.
   */
  @Property({ fieldName: 'dataset_definition_id', type: 'uuid' }) // FK → polyglot_storage.dataset_definitions
  datasetDefinitionId!: string;

  /**
   * Valor de logical name mantenido por la instancia.
   */
  @Property({ fieldName: 'logical_name', columnType: 'varchar' })
  logicalName!: string;

  /**
   * Valor de physical name pattern mantenido por la instancia.
   */
  @Property({ fieldName: 'physical_name_pattern', columnType: 'varchar' })
  physicalNamePattern!: string;

  /**
   * Valor de partitioning strategy mantenido por la instancia.
   */
  @Property({ fieldName: 'partitioning_strategy', columnType: 'varchar' })
  partitioningStrategy!: string;

  /**
   * Valor de tenant isolation mode mantenido por la instancia.
   */
  @Property({ fieldName: 'tenant_isolation_mode', columnType: 'varchar' })
  tenantIsolationMode!: string;

  /**
   * Valor de routing key expression mantenido por la instancia.
   */
  @Property({
    fieldName: 'routing_key_expression',
    columnType: 'varchar',
    nullable: true,
  })
  routingKeyExpression?: string;

  /**
   * Valor de shard key expression mantenido por la instancia.
   */
  @Property({
    fieldName: 'shard_key_expression',
    columnType: 'varchar',
    nullable: true,
  })
  shardKeyExpression?: string;

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;
}
