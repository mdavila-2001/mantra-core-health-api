import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'feedback_ticket_comments' })
export class FeedbackTicketComments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'feedback_ticket_id', type: 'uuid' })
  feedbackTicketId!: string;

  @Property({ fieldName: 'author_user_id', type: 'uuid' })
  authorUserId!: string;

  @Property({ columnType: 'text' })
  body!: string;

  @Property({ fieldName: 'is_internal', type: 'boolean', nullable: true })
  isInternal?: boolean;

  @Property({
    fieldName: 'visibility_concept_id',
    type: 'uuid',
    nullable: true,
  })
  visibilityConceptId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
