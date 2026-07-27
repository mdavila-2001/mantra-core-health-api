import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'feedback_ticket_events' })
export class FeedbackTicketEvents {
  @PrimaryKey({ fieldName: 'history_id', type: 'uuid' })
  historyId: string = randomUUID();

  @Property({ fieldName: 'feedback_ticket_id', type: 'uuid' }) // FK → community.feedback_tickets
  feedbackTicketId!: string;

  @Property({ fieldName: 'revision_no', columnType: 'int' })
  revisionNo!: number;

  @Property({
    fieldName: 'from_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  fromStatusConceptId?: string;

  @Property({ fieldName: 'to_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  toStatusConceptId!: string;

  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  @Property({ columnType: 'varchar', nullable: true })
  note?: string;

  @Property({ fieldName: 'changed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  changedByUserId?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
