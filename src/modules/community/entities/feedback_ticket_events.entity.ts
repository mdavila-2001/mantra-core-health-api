import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `feedback_ticket_events`.
 */
@Entity({ schema: 'community', tableName: 'feedback_ticket_events' })
export class FeedbackTicketEvents {
  /**
   * Identificador asociado a history.
   */
  @PrimaryKey({ fieldName: 'history_id', type: 'uuid' })
  historyId: string = randomUUID();

  /**
   * Identificador asociado a feedback ticket.
   */
  @Property({ fieldName: 'feedback_ticket_id', type: 'uuid' }) // FK → community.feedback_tickets
  feedbackTicketId!: string;

  /**
   * Valor de revision no mantenido por la instancia.
   */
  @Property({ fieldName: 'revision_no', columnType: 'int' })
  revisionNo!: number;

  /**
   * Identificador asociado a from status concept.
   */
  @Property({
    fieldName: 'from_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  fromStatusConceptId?: string;

  /**
   * Identificador asociado a to status concept.
   */
  @Property({ fieldName: 'to_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  toStatusConceptId!: string;

  /**
   * Identificador asociado a event type concept.
   */
  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  /**
   * Valor de note mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  note?: string;

  /**
   * Identificador asociado a changed by user.
   */
  @Property({ fieldName: 'changed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  changedByUserId?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
