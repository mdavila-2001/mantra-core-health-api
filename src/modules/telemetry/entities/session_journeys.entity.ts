import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `session_journeys`.
 */
@Entity({ schema: 'telemetry', tableName: 'session_journeys' })
export class SessionJourneys {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a session.
   */
  @Property({ fieldName: 'session_id', type: 'uuid' }) // FK → iam.sessions
  sessionId!: string;

  /**
   * Identificador asociado a analytics subject.
   */
  @Property({ fieldName: 'analytics_subject_id', type: 'uuid', nullable: true }) // FK → telemetry.analytics_subjects
  analyticsSubjectId?: string;

  /**
   * Identificador asociado a portal type concept.
   */
  @Property({ fieldName: 'portal_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  portalTypeConceptId!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Valor de ended at mantenido por la instancia.
   */
  @Property({
    fieldName: 'ended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  endedAt?: Date;

  /**
   * Identificador asociado a entry event.
   */
  @Property({ fieldName: 'entry_event_id', type: 'uuid', nullable: true }) // FK → telemetry.user_activity_events
  entryEventId?: string;

  /**
   * Identificador asociado a exit event.
   */
  @Property({ fieldName: 'exit_event_id', type: 'uuid', nullable: true }) // FK → telemetry.user_activity_events
  exitEventId?: string;

  /**
   * Valor de event count mantenido por la instancia.
   */
  @Property({ fieldName: 'event_count', columnType: 'int', nullable: true })
  eventCount?: number;

  /**
   * Identificador asociado a journey status concept.
   */
  @Property({ fieldName: 'journey_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  journeyStatusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
