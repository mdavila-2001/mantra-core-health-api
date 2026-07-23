import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'crm', tableName: 'crm_activity_reminders' })
export class CrmActivityReminders {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'crm_activity_id', type: 'uuid' }) // FK → crm.crm_activities
  crmActivityId!: string;

  @Property({ fieldName: 'recipient_user_id', type: 'uuid' }) // FK → iam.users
  recipientUserId!: string;

  @Property({ fieldName: 'channel_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  channelConceptId!: string;

  @Property({
    fieldName: 'remind_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  remindAt?: Date;

  @Property({ fieldName: 'sent_at', columnType: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Property({
    fieldName: 'delivery_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  deliveryStatusConceptId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
