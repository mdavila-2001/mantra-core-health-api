import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'adset_learning_snapshots' })
export class AdsetLearningSnapshots {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_set_id', type: 'uuid' }) // FK → ads.ad_sets
  adSetId!: string;

  @Property({ fieldName: 'measured_at', columnType: 'timestamptz' })
  measuredAt!: Date;

  @Property({ fieldName: 'learning_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  learningStatusConceptId!: string;

  @Property({
    fieldName: 'optimization_events_count',
    type: 'bigint',
    nullable: true,
  })
  optimizationEventsCount?: string;

  @Property({
    fieldName: 'estimated_learning_exit_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  estimatedLearningExitAt?: Date;

  @Property({
    fieldName: 'limited_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  limitedReasonConceptId?: string;

  @Property({
    fieldName: 'recommendations_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  recommendationsJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
