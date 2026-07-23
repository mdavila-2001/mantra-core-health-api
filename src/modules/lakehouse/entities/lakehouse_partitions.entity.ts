import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'lakehouse', tableName: 'lakehouse_partitions' })
export class LakehousePartitions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'lakehouse_dataset_id', type: 'uuid' })
  lakehouseDatasetId!: string;

  @Property({ fieldName: 'partition_spec_hash', columnType: 'varchar' })
  partitionSpecHash!: string;

  @Property({
    fieldName: 'partition_values_json',
    type: 'json',
    columnType: 'jsonb',
  })
  partitionValuesJson!: unknown;

  @Property({ fieldName: 'record_count', type: 'bigint' })
  recordCount!: string;

  @Property({ fieldName: 'size_bytes', type: 'bigint' })
  sizeBytes!: string;

  @Property({ fieldName: 'min_event_at', columnType: 'timestamptz' })
  minEventAt!: Date;

  @Property({ fieldName: 'max_event_at', columnType: 'timestamptz' })
  maxEventAt!: Date;

  @Property({ columnType: 'varchar' })
  state!: string;
}
