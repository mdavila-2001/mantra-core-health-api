import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `survey_invitation_reminders`.
 */
@Entity({ schema: 'surveys', tableName: 'survey_invitation_reminders' })
export class SurveyInvitationReminders {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a survey invitation.
   */
  @Property({ fieldName: 'survey_invitation_id', type: 'uuid' }) // FK → surveys.survey_invitations (inferida)
  surveyInvitationId!: string;

  /**
   * Valor de reminder number mantenido por la instancia.
   */
  @Property({ fieldName: 'reminder_number', columnType: 'int' })
  reminderNumber!: number;

  /**
   * Valor de sent at mantenido por la instancia.
   */
  @Property({ fieldName: 'sent_at', columnType: 'timestamptz' })
  sentAt!: Date;

  /**
   * Identificador asociado a channel concept.
   */
  @Property({ fieldName: 'channel_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  channelConceptId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;
}
