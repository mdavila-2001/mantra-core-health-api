import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `web_vitals`.
 */
@Entity({ schema: 'telemetry', tableName: 'web_vitals' })
export class WebVitals {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a user activity event.
   */
  @Property({
    fieldName: 'user_activity_event_id',
    type: 'uuid',
    nullable: true,
  }) // FK → telemetry.user_activity_events
  userActivityEventId?: string;

  /**
   * Identificador asociado a session journey.
   */
  @Property({ fieldName: 'session_journey_id', type: 'uuid', nullable: true }) // FK → telemetry.session_journeys
  sessionJourneyId?: string;

  /**
   * Identificador asociado a analytics subject.
   */
  @Property({ fieldName: 'analytics_subject_id', type: 'uuid', nullable: true }) // FK → telemetry.analytics_subjects
  analyticsSubjectId?: string;

  /**
   * Identificador asociado a client context.
   */
  @Property({ fieldName: 'client_context_id', type: 'uuid', nullable: true }) // FK → telemetry.client_contexts
  clientContextId?: string;

  /**
   * Identificador asociado a portal type concept.
   */
  @Property({ fieldName: 'portal_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  portalTypeConceptId!: string;

  /**
   * Valor de route template mantenido por la instancia.
   */
  @Property({
    fieldName: 'route_template',
    columnType: 'varchar',
    nullable: true,
  })
  routeTemplate?: string;

  /**
   * Identificador asociado a metric concept.
   */
  @Property({ fieldName: 'metric_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  metricConceptId!: string;

  /**
   * Valor de metric value mantenido por la instancia.
   */
  @Property({
    fieldName: 'metric_value',
    columnType: 'numeric',
    nullable: true,
  })
  metricValue?: string;

  /**
   * Identificador asociado a rating concept.
   */
  @Property({ fieldName: 'rating_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  ratingConceptId?: string;

  /**
   * Identificador asociado a navigation type concept.
   */
  @Property({
    fieldName: 'navigation_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  navigationTypeConceptId?: string;

  /**
   * Valor de measured at mantenido por la instancia.
   */
  @Property({
    fieldName: 'measured_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  measuredAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
