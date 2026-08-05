import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `capacity_measurements`.
 */
@Entity({ schema: 'platform_ops', tableName: 'capacity_measurements' })
export class CapacityMeasurements {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a capacity plan.
   */
  @Property({ fieldName: 'capacity_plan_id', type: 'uuid' }) // FK → platform_ops.capacity_plans
  capacityPlanId!: string;

  /**
   * Valor de measured at mantenido por la instancia.
   */
  @Property({ fieldName: 'measured_at', columnType: 'timestamptz' })
  measuredAt!: Date;

  /**
   * Identificador asociado a metric concept.
   */
  @Property({ fieldName: 'metric_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  metricConceptId!: string;

  /**
   * Valor de observed value mantenido por la instancia.
   */
  @Property({ fieldName: 'observed_value', columnType: 'numeric(20,6)' })
  observedValue!: string;

  /**
   * Valor de capacity value mantenido por la instancia.
   */
  @Property({ fieldName: 'capacity_value', columnType: 'numeric(20,6)' })
  capacityValue!: string;

  /**
   * Valor de utilization percent mantenido por la instancia.
   */
  @Property({ fieldName: 'utilization_percent', columnType: 'numeric(8,5)' })
  utilizationPercent!: string;

  /**
   * Valor de source reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_reference',
    columnType: 'varchar',
    nullable: true,
  })
  sourceReference?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
