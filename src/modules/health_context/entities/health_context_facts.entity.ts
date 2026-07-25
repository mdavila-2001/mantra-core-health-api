import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_context', tableName: 'health_context_facts' })
export class HealthContextFacts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'context_version_id', type: 'uuid' }) // FK → health_context.country_health_context_versions
  contextVersionId!: string;

  @Property({ fieldName: 'fact_key', columnType: 'varchar' })
  factKey!: string;

  @Property({ fieldName: 'metric_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  metricConceptId!: string;

  @Property({
    fieldName: 'value_type',
    columnType: 'terminology.technical_data_type',
  })
  valueType!: string;

  @Property({ fieldName: 'value_json', type: 'json', columnType: 'jsonb' })
  valueJson!: unknown;

  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  @Property({ fieldName: 'period_start', columnType: 'date', nullable: true })
  periodStart?: Date;

  @Property({ fieldName: 'period_end', columnType: 'date', nullable: true })
  periodEnd?: Date;

  @Property({
    fieldName: 'confidence_score',
    columnType: 'numeric',
    nullable: true,
  })
  confidenceScore?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
