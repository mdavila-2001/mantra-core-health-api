import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'telemetry', tableName: 'session_journeys' })
export class SessionJourneys {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'session_id', type: 'uuid' }) // FK → iam.sessions
  sessionId!: string;

  @Property({ fieldName: 'analytics_subject_id', type: 'uuid', nullable: true }) // FK → telemetry.analytics_subjects
  analyticsSubjectId?: string;

  @Property({ fieldName: 'portal_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  portalTypeConceptId!: string;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'ended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  endedAt?: Date;

  @Property({ fieldName: 'entry_event_id', type: 'uuid', nullable: true }) // FK → telemetry.user_activity_events
  entryEventId?: string;

  @Property({ fieldName: 'exit_event_id', type: 'uuid', nullable: true }) // FK → telemetry.user_activity_events
  exitEventId?: string;

  @Property({ fieldName: 'event_count', columnType: 'int', nullable: true })
  eventCount?: number;

  @Property({ fieldName: 'journey_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  journeyStatusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
