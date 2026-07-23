import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'lakehouse', tableName: 'lakehouse_quality_runs' })
export class LakehouseQualityRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'lakehouse_dataset_id', type: 'uuid' })
  lakehouseDatasetId!: string;

  @Property({ fieldName: 'transformation_run_id', type: 'uuid' })
  transformationRunId!: string;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'evaluated_record_count', type: 'bigint' })
  evaluatedRecordCount!: string;

  @Property({ fieldName: 'failed_record_count', type: 'bigint' })
  failedRecordCount!: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;
}
