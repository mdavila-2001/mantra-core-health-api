import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `tracking_events`.
 */
@Entity({ schema: 'tracking', tableName: 'tracking_events' })
export class TrackingEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a trackable subject.
   */
  @Property({ fieldName: 'trackable_subject_id', type: 'uuid' }) // FK → tracking.trackable_subjects
  trackableSubjectId!: string;

  /**
   * Identificador asociado a milestone definition.
   */
  @Property({
    fieldName: 'milestone_definition_id',
    type: 'uuid',
    nullable: true,
  }) // FK → tracking.milestone_definitions
  milestoneDefinitionId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Valor de location text mantenido por la instancia.
   */
  @Property({
    fieldName: 'location_text',
    columnType: 'varchar',
    nullable: true,
  })
  locationText?: string;

  /**
   * Valor de latitude mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  latitude?: string;

  /**
   * Valor de longitude mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  longitude?: string;

  /**
   * Identificador asociado a location ping.
   */
  @Property({ fieldName: 'location_ping_id', type: 'uuid', nullable: true }) // FK → geo.location_pings
  locationPingId?: string;

  /**
   * Identificador asociado a actor user.
   */
  @Property({ fieldName: 'actor_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  actorUserId?: string;

  /**
   * Identificador asociado a source concept.
   */
  @Property({ fieldName: 'source_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  sourceConceptId?: string;

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
