import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `adset_learning_snapshots`.
 */
@Entity({ schema: 'ads', tableName: 'adset_learning_snapshots' })
export class AdsetLearningSnapshots {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a ad set.
   */
  @Property({ fieldName: 'ad_set_id', type: 'uuid' }) // FK → ads.ad_sets
  adSetId!: string;

  /**
   * Valor de measured at mantenido por la instancia.
   */
  @Property({ fieldName: 'measured_at', columnType: 'timestamptz' })
  measuredAt!: Date;

  /**
   * Identificador asociado a learning status concept.
   */
  @Property({ fieldName: 'learning_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  learningStatusConceptId!: string;

  /**
   * Valor de optimization events count mantenido por la instancia.
   */
  @Property({
    fieldName: 'optimization_events_count',
    type: 'bigint',
    nullable: true,
  })
  optimizationEventsCount?: string;

  /**
   * Valor de estimated learning exit at mantenido por la instancia.
   */
  @Property({
    fieldName: 'estimated_learning_exit_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  estimatedLearningExitAt?: Date;

  /**
   * Identificador asociado a limited reason concept.
   */
  @Property({
    fieldName: 'limited_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  limitedReasonConceptId?: string;

  /**
   * Valor de recommendations json mantenido por la instancia.
   */
  @Property({
    fieldName: 'recommendations_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  recommendationsJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
