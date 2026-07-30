import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `schema_migration_jobs`.
 */
@Entity({
  schema: 'cross_store_consistency',
  tableName: 'schema_migration_jobs',
})
export class SchemaMigrationJobs {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a dataset.
   */
  @Property({ fieldName: 'dataset_id', type: 'uuid' })
  datasetId!: string;

  /**
   * Identificador asociado a collection definition.
   */
  @Property({ fieldName: 'collection_definition_id', type: 'uuid' })
  collectionDefinitionId!: string;

  /**
   * Valor de from schema version mantenido por la instancia.
   */
  @Property({ fieldName: 'from_schema_version', columnType: 'varchar' })
  fromSchemaVersion!: string;

  /**
   * Valor de to schema version mantenido por la instancia.
   */
  @Property({ fieldName: 'to_schema_version', columnType: 'varchar' })
  toSchemaVersion!: string;

  /**
   * Valor de migration strategy mantenido por la instancia.
   */
  @Property({ fieldName: 'migration_strategy', columnType: 'varchar' })
  migrationStrategy!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de migrated count mantenido por la instancia.
   */
  @Property({ fieldName: 'migrated_count', type: 'bigint' })
  migratedCount!: string;

  /**
   * Valor de failed count mantenido por la instancia.
   */
  @Property({ fieldName: 'failed_count', type: 'bigint' })
  failedCount!: string;

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
}
