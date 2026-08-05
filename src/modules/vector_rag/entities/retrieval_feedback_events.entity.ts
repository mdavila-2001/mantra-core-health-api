import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `retrieval_feedback_events`.
 */
@Entity({ schema: 'vector_rag', tableName: 'retrieval_feedback_events' })
export class RetrievalFeedbackEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a retrieval session.
   */
  @Property({ fieldName: 'retrieval_session_id', type: 'uuid' })
  retrievalSessionId!: string;

  /**
   * Identificador asociado a principal.
   */
  @Property({ fieldName: 'principal_id', type: 'uuid' })
  principalId!: string;

  /**
   * Valor de feedback type mantenido por la instancia.
   */
  @Property({ fieldName: 'feedback_type', columnType: 'varchar' })
  feedbackType!: string;

  /**
   * Valor de relevance score mantenido por la instancia.
   */
  @Property({ fieldName: 'relevance_score', columnType: 'smallint' })
  relevanceScore!: number;

  /**
   * Valor de safety issue code mantenido por la instancia.
   */
  @Property({ fieldName: 'safety_issue_code', columnType: 'varchar' })
  safetyIssueCode!: string;

  /**
   * Valor de comment redacted mantenido por la instancia.
   */
  @Property({
    fieldName: 'comment_redacted',
    columnType: 'text',
    nullable: true,
  })
  commentRedacted?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
