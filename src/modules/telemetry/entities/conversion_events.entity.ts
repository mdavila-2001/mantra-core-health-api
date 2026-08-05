import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `conversion_events`.
 */
@Entity({ schema: 'telemetry', tableName: 'conversion_events' })
export class ConversionEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a funnel definition.
   */
  @Property({ fieldName: 'funnel_definition_id', type: 'uuid' }) // FK → telemetry.funnel_definitions
  funnelDefinitionId!: string;

  /**
   * Identificador asociado a analytics subject.
   */
  @Property({ fieldName: 'analytics_subject_id', type: 'uuid' }) // FK → telemetry.analytics_subjects
  analyticsSubjectId!: string;

  /**
   * Identificador asociado a session journey.
   */
  @Property({ fieldName: 'session_journey_id', type: 'uuid', nullable: true }) // FK → telemetry.session_journeys
  sessionJourneyId?: string;

  /**
   * Identificador asociado a completion event.
   */
  @Property({ fieldName: 'completion_event_id', type: 'uuid', nullable: true }) // FK → telemetry.user_activity_events
  completionEventId?: string;

  /**
   * Valor de converted at mantenido por la instancia.
   */
  @Property({
    fieldName: 'converted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  convertedAt?: Date;

  /**
   * Valor de attribution json mantenido por la instancia.
   */
  @Property({
    fieldName: 'attribution_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  attributionJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
