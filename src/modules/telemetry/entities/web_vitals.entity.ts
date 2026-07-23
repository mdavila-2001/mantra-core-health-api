import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'telemetry', tableName: 'web_vitals' })
export class WebVitals {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({
    fieldName: 'user_activity_event_id',
    type: 'uuid',
    nullable: true,
  }) // FK → telemetry.user_activity_events
  userActivityEventId?: string;

  @Property({ fieldName: 'session_journey_id', type: 'uuid', nullable: true }) // FK → telemetry.session_journeys
  sessionJourneyId?: string;

  @Property({ fieldName: 'analytics_subject_id', type: 'uuid', nullable: true }) // FK → telemetry.analytics_subjects
  analyticsSubjectId?: string;

  @Property({ fieldName: 'client_context_id', type: 'uuid', nullable: true }) // FK → telemetry.client_contexts
  clientContextId?: string;

  @Property({ fieldName: 'portal_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  portalTypeConceptId!: string;

  @Property({
    fieldName: 'route_template',
    columnType: 'varchar',
    nullable: true,
  })
  routeTemplate?: string;

  @Property({ fieldName: 'metric_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  metricConceptId!: string;

  @Property({
    fieldName: 'metric_value',
    columnType: 'numeric',
    nullable: true,
  })
  metricValue?: string;

  @Property({ fieldName: 'rating_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  ratingConceptId?: string;

  @Property({
    fieldName: 'navigation_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  navigationTypeConceptId?: string;

  @Property({
    fieldName: 'measured_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  measuredAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
