import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'feedback_ticket_events' })
export class FeedbackTicketEvents {
  @PrimaryKey({ type: 'uuid' })
  historyId: string = randomUUID();

  @Property({ fieldName: 'feedback_ticket_id', type: 'uuid' })
  feedbackTicketId!: string;

  @Property({ fieldName: 'revision_no', columnType: 'int' })
  revisionNo!: number;

  @Property({
    fieldName: 'from_status_concept_id',
    type: 'uuid',
    nullable: true,
  })
  fromStatusConceptId?: string;

  @Property({ fieldName: 'to_status_concept_id', type: 'uuid' })
  toStatusConceptId!: string;

  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' })
  eventTypeConceptId!: string;

  @Property({ columnType: 'varchar', nullable: true })
  note?: string;

  @Property({ fieldName: 'changed_by_user_id', type: 'uuid', nullable: true })
  changedByUserId?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
