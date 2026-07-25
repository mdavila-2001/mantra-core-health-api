import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'vector_rag', tableName: 'retrieval_feedback_events' })
export class RetrievalFeedbackEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'retrieval_session_id', type: 'uuid' })
  retrievalSessionId!: string;

  @Property({ fieldName: 'principal_id', type: 'uuid' })
  principalId!: string;

  @Property({ fieldName: 'feedback_type', columnType: 'varchar' })
  feedbackType!: string;

  @Property({ fieldName: 'relevance_score', columnType: 'smallint' })
  relevanceScore!: number;

  @Property({ fieldName: 'safety_issue_code', columnType: 'varchar' })
  safetyIssueCode!: string;

  @Property({
    fieldName: 'comment_redacted',
    columnType: 'text',
    nullable: true,
  })
  commentRedacted?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
