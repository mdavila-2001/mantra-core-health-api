import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `health_context_facts`.
 */
@Entity({ schema: 'health_context', tableName: 'health_context_facts' })
export class HealthContextFacts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a context version.
   */
  @Property({ fieldName: 'context_version_id', type: 'uuid' }) // FK → health_context.country_health_context_versions
  contextVersionId!: string;

  /**
   * Valor de fact key mantenido por la instancia.
   */
  @Property({ fieldName: 'fact_key', columnType: 'varchar' })
  factKey!: string;

  /**
   * Identificador asociado a metric concept.
   */
  @Property({ fieldName: 'metric_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  metricConceptId!: string;

  /**
   * Valor de value type mantenido por la instancia.
   */
  @Property({
    fieldName: 'value_type',
    columnType: 'terminology.technical_data_type',
  })
  valueType!: string;

  /**
   * Valor de value json mantenido por la instancia.
   */
  @Property({ fieldName: 'value_json', type: 'json', columnType: 'jsonb' })
  valueJson!: unknown;

  /**
   * Identificador asociado a unit concept.
   */
  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  /**
   * Valor de period start mantenido por la instancia.
   */
  @Property({ fieldName: 'period_start', columnType: 'date', nullable: true })
  periodStart?: Date;

  /**
   * Valor de period end mantenido por la instancia.
   */
  @Property({ fieldName: 'period_end', columnType: 'date', nullable: true })
  periodEnd?: Date;

  /**
   * Valor de confidence score mantenido por la instancia.
   */
  @Property({
    fieldName: 'confidence_score',
    columnType: 'numeric',
    nullable: true,
  })
  confidenceScore?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
