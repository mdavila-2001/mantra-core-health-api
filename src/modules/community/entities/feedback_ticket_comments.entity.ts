import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `feedback_ticket_comments`.
 */
@Entity({ schema: 'community', tableName: 'feedback_ticket_comments' })
export class FeedbackTicketComments {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a feedback ticket.
   */
  @Property({ fieldName: 'feedback_ticket_id', type: 'uuid' }) // FK → community.feedback_tickets
  feedbackTicketId!: string;

  /**
   * Identificador asociado a author user.
   */
  @Property({ fieldName: 'author_user_id', type: 'uuid' }) // FK → iam.users
  authorUserId!: string;

  /**
   * Valor de body mantenido por la instancia.
   */
  @Property({ columnType: 'text' })
  body!: string;

  /**
   * Valor de is internal mantenido por la instancia.
   */
  @Property({ fieldName: 'is_internal', type: 'boolean', nullable: true })
  isInternal?: boolean;

  /**
   * Identificador asociado a visibility concept.
   */
  @Property({
    fieldName: 'visibility_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  visibilityConceptId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
