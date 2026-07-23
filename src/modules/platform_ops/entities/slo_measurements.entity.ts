import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'slo_measurements' })
export class SloMeasurements {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'service_level_objective_id', type: 'uuid' }) // FK → platform_ops.service_level_objectives
  serviceLevelObjectiveId!: string;

  @Property({ fieldName: 'measured_at', columnType: 'timestamptz' })
  measuredAt!: Date;

  @Property({ fieldName: 'window_start', columnType: 'timestamptz' })
  windowStart!: Date;

  @Property({ fieldName: 'window_end', columnType: 'timestamptz' })
  windowEnd!: Date;

  @Property({ fieldName: 'good_events', type: 'bigint' })
  goodEvents!: string;

  @Property({ fieldName: 'total_events', type: 'bigint' })
  totalEvents!: string;

  @Property({ fieldName: 'attained_value', columnType: 'numeric(12,8)' })
  attainedValue!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'source_reference',
    columnType: 'varchar',
    nullable: true,
  })
  sourceReference?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
