import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'crm', tableName: 'crm_events' })
export class CrmEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'crm_activity_id', type: 'uuid' }) // FK → crm.crm_activities
  crmActivityId!: string;

  @Property({ fieldName: 'event_subtype_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventSubtypeConceptId!: string;

  @Property({
    fieldName: 'start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startAt?: Date;

  @Property({ fieldName: 'end_at', columnType: 'timestamptz', nullable: true })
  endAt?: Date;

  @Property({ fieldName: 'is_all_day', type: 'boolean', nullable: true })
  isAllDay?: boolean;

  @Property({ fieldName: 'time_zone', columnType: 'varchar', nullable: true })
  timeZone?: string;

  @Property({
    fieldName: 'location_text',
    columnType: 'varchar',
    nullable: true,
  })
  locationText?: string;

  @Property({ fieldName: 'meeting_url', columnType: 'varchar', nullable: true })
  meetingUrl?: string;

  @Property({ fieldName: 'organizer_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  organizerUserId?: string;

  @Property({ fieldName: 'recurrence_rule_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  recurrenceRuleId?: string;

  @Property({ fieldName: 'parent_event_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  parentEventId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
