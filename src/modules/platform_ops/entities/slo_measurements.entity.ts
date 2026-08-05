import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `slo_measurements`.
 */
@Entity({ schema: 'platform_ops', tableName: 'slo_measurements' })
export class SloMeasurements {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a service level objective.
   */
  @Property({ fieldName: 'service_level_objective_id', type: 'uuid' }) // FK → platform_ops.service_level_objectives
  serviceLevelObjectiveId!: string;

  /**
   * Valor de measured at mantenido por la instancia.
   */
  @Property({ fieldName: 'measured_at', columnType: 'timestamptz' })
  measuredAt!: Date;

  /**
   * Valor de window start mantenido por la instancia.
   */
  @Property({ fieldName: 'window_start', columnType: 'timestamptz' })
  windowStart!: Date;

  /**
   * Valor de window end mantenido por la instancia.
   */
  @Property({ fieldName: 'window_end', columnType: 'timestamptz' })
  windowEnd!: Date;

  /**
   * Valor de good events mantenido por la instancia.
   */
  @Property({ fieldName: 'good_events', type: 'bigint' })
  goodEvents!: string;

  /**
   * Valor de total events mantenido por la instancia.
   */
  @Property({ fieldName: 'total_events', type: 'bigint' })
  totalEvents!: string;

  /**
   * Valor de attained value mantenido por la instancia.
   */
  @Property({ fieldName: 'attained_value', columnType: 'numeric(12,8)' })
  attainedValue!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
