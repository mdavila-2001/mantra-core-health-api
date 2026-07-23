import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'cross_store_consistency',
  tableName: 'schema_migration_jobs',
})
export class SchemaMigrationJobs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'dataset_id', type: 'uuid' })
  datasetId!: string;

  @Property({ fieldName: 'collection_definition_id', type: 'uuid' })
  collectionDefinitionId!: string;

  @Property({ fieldName: 'from_schema_version', columnType: 'varchar' })
  fromSchemaVersion!: string;

  @Property({ fieldName: 'to_schema_version', columnType: 'varchar' })
  toSchemaVersion!: string;

  @Property({ fieldName: 'migration_strategy', columnType: 'varchar' })
  migrationStrategy!: string;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'migrated_count', type: 'bigint' })
  migratedCount!: string;

  @Property({ fieldName: 'failed_count', type: 'bigint' })
  failedCount!: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;
}
