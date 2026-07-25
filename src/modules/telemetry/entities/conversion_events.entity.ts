import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'telemetry', tableName: 'conversion_events' })
export class ConversionEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'funnel_definition_id', type: 'uuid' }) // FK → telemetry.funnel_definitions
  funnelDefinitionId!: string;

  @Property({ fieldName: 'analytics_subject_id', type: 'uuid' }) // FK → telemetry.analytics_subjects
  analyticsSubjectId!: string;

  @Property({ fieldName: 'session_journey_id', type: 'uuid', nullable: true }) // FK → telemetry.session_journeys
  sessionJourneyId?: string;

  @Property({ fieldName: 'completion_event_id', type: 'uuid', nullable: true }) // FK → telemetry.user_activity_events
  completionEventId?: string;

  @Property({
    fieldName: 'converted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  convertedAt?: Date;

  @Property({
    fieldName: 'attribution_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  attributionJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
