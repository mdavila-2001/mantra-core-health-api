import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `geofence_events`.
 */
@Entity({ schema: 'geo', tableName: 'geofence_events' })
export class GeofenceEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a geofence.
   */
  @Property({ fieldName: 'geofence_id', type: 'uuid' }) // FK → geo.geofences
  geofenceId!: string;

  /**
   * Identificador asociado a tracked subject.
   */
  @Property({ fieldName: 'tracked_subject_id', type: 'uuid' }) // FK → geo.tracked_subjects
  trackedSubjectId!: string;

  /**
   * Identificador asociado a event type concept.
   */
  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  /**
   * Identificador asociado a location ping.
   */
  @Property({ fieldName: 'location_ping_id', type: 'uuid', nullable: true }) // FK → geo.location_pings
  locationPingId?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

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
