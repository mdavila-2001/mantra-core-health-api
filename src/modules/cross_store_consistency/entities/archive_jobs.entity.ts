import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'cross_store_consistency', tableName: 'archive_jobs' })
export class ArchiveJobs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'dataset_id', type: 'uuid' })
  datasetId!: string;

  @Property({ fieldName: 'retention_cutoff', columnType: 'timestamptz' })
  retentionCutoff!: Date;

  @Property({ fieldName: 'archive_manifest_object_id', type: 'uuid' })
  archiveManifestObjectId!: string;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'archived_count', type: 'bigint' })
  archivedCount!: string;

  @Property({ fieldName: 'deleted_hot_count', type: 'bigint' })
  deletedHotCount!: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;
}
