import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'lakehouse', tableName: 'transformation_runs' })
export class TransformationRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'transformation_definition_id', type: 'uuid' })
  transformationDefinitionId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'source_checkpoint', columnType: 'varchar' })
  sourceCheckpoint!: string;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'input_record_count', type: 'bigint' })
  inputRecordCount!: string;

  @Property({ fieldName: 'output_record_count', type: 'bigint' })
  outputRecordCount!: string;

  @Property({ fieldName: 'rejected_record_count', type: 'bigint' })
  rejectedRecordCount!: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;
}
