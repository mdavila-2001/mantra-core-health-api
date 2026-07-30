import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `crm_activity_reminders`.
 */
@Entity({ schema: 'crm', tableName: 'crm_activity_reminders' })
export class CrmActivityReminders {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a crm activity.
   */
  @Property({ fieldName: 'crm_activity_id', type: 'uuid' }) // FK → crm.crm_activities
  crmActivityId!: string;

  /**
   * Identificador asociado a recipient user.
   */
  @Property({ fieldName: 'recipient_user_id', type: 'uuid' }) // FK → iam.users
  recipientUserId!: string;

  /**
   * Identificador asociado a channel concept.
   */
  @Property({ fieldName: 'channel_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  channelConceptId!: string;

  /**
   * Valor de remind at mantenido por la instancia.
   */
  @Property({
    fieldName: 'remind_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  remindAt?: Date;

  /**
   * Valor de sent at mantenido por la instancia.
   */
  @Property({ fieldName: 'sent_at', columnType: 'timestamptz', nullable: true })
  sentAt?: Date;

  /**
   * Identificador asociado a delivery status concept.
   */
  @Property({
    fieldName: 'delivery_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  deliveryStatusConceptId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
