import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'cross_store_consistency', tableName: 'data_movement_jobs' })
export class DataMovementJobs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'dataset_id', type: 'uuid' })
  datasetId!: string;

  @Property({ fieldName: 'source_placement_id', type: 'uuid' })
  sourcePlacementId!: string;

  @Property({ fieldName: 'target_placement_id', type: 'uuid' })
  targetPlacementId!: string;

  @Property({ fieldName: 'movement_mode', columnType: 'varchar' })
  movementMode!: string;

  @Property({ fieldName: 'manifest_hash', columnType: 'varchar' })
  manifestHash!: string;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;
}
