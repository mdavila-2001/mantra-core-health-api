import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'tracking', tableName: 'tracking_events' })
export class TrackingEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'trackable_subject_id', type: 'uuid' }) // FK → tracking.trackable_subjects
  trackableSubjectId!: string;

  @Property({
    fieldName: 'milestone_definition_id',
    type: 'uuid',
    nullable: true,
  }) // FK → tracking.milestone_definitions
  milestoneDefinitionId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({
    fieldName: 'location_text',
    columnType: 'varchar',
    nullable: true,
  })
  locationText?: string;

  @Property({ columnType: 'numeric', nullable: true })
  latitude?: string;

  @Property({ columnType: 'numeric', nullable: true })
  longitude?: string;

  @Property({ fieldName: 'location_ping_id', type: 'uuid', nullable: true }) // FK → geo.location_pings
  locationPingId?: string;

  @Property({ fieldName: 'actor_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  actorUserId?: string;

  @Property({ fieldName: 'source_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  sourceConceptId?: string;

  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
