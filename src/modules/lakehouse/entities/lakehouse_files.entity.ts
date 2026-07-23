import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'lakehouse', tableName: 'lakehouse_files' })
export class LakehouseFiles {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'lakehouse_partition_id', type: 'uuid' })
  lakehousePartitionId!: string;

  @Property({ fieldName: 'object_manifest_id', type: 'uuid' })
  objectManifestId!: string;

  @Property({ fieldName: 'file_format', columnType: 'varchar' })
  fileFormat!: string;

  @Property({ fieldName: 'row_count', type: 'bigint' })
  rowCount!: string;

  @Property({ fieldName: 'size_bytes', type: 'bigint' })
  sizeBytes!: string;

  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  @Property({
    fieldName: 'min_max_statistics_json',
    type: 'json',
    columnType: 'jsonb',
  })
  minMaxStatisticsJson!: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
