import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'cross_store_consistency', tableName: 'reindex_jobs' })
export class ReindexJobs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'dataset_id', type: 'uuid' })
  datasetId!: string;

  @Property({ fieldName: 'source_alias', columnType: 'varchar' })
  sourceAlias!: string;

  @Property({ fieldName: 'target_index', columnType: 'varchar' })
  targetIndex!: string;

  @Property({ fieldName: 'target_schema_version', columnType: 'varchar' })
  targetSchemaVersion!: string;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'processed_count', type: 'bigint' })
  processedCount!: string;

  @Property({ fieldName: 'failed_count', type: 'bigint' })
  failedCount!: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;
}
