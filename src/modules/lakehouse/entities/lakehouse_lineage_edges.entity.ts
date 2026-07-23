import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'lakehouse', tableName: 'lakehouse_lineage_edges' })
export class LakehouseLineageEdges {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'source_dataset_id', type: 'uuid' })
  sourceDatasetId!: string;

  @Property({ fieldName: 'target_dataset_id', type: 'uuid' })
  targetDatasetId!: string;

  @Property({ fieldName: 'transformation_run_id', type: 'uuid' })
  transformationRunId!: string;

  @Property({ fieldName: 'source_partition_id', type: 'uuid' })
  sourcePartitionId!: string;

  @Property({ fieldName: 'target_partition_id', type: 'uuid' })
  targetPartitionId!: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
