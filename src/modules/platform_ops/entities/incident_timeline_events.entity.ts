import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'incident_timeline_events' })
export class IncidentTimelineEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'health_incident_id', type: 'uuid' }) // FK → platform_ops.health_incidents
  healthIncidentId!: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  @Property({ fieldName: 'actor_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  actorUserId?: string;

  @Property({ columnType: 'text' })
  summary!: string;

  @Property({
    fieldName: 'details_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  detailsJson?: unknown;

  @Property({
    fieldName: 'source_reference',
    columnType: 'varchar',
    nullable: true,
  })
  sourceReference?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
