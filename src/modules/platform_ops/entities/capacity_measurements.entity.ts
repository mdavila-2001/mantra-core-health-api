import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'capacity_measurements' })
export class CapacityMeasurements {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'capacity_plan_id', type: 'uuid' }) // FK → platform_ops.capacity_plans
  capacityPlanId!: string;

  @Property({ fieldName: 'measured_at', columnType: 'timestamptz' })
  measuredAt!: Date;

  @Property({ fieldName: 'metric_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  metricConceptId!: string;

  @Property({ fieldName: 'observed_value', columnType: 'numeric(20,6)' })
  observedValue!: string;

  @Property({ fieldName: 'capacity_value', columnType: 'numeric(20,6)' })
  capacityValue!: string;

  @Property({ fieldName: 'utilization_percent', columnType: 'numeric(8,5)' })
  utilizationPercent!: string;

  @Property({
    fieldName: 'source_reference',
    columnType: 'varchar',
    nullable: true,
  })
  sourceReference?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
