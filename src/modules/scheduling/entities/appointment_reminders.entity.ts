import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'scheduling', tableName: 'appointment_reminders' })
export class AppointmentReminders {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'booking_id', type: 'uuid' }) // FK (destino no resuelto)
  bookingId!: string;

  @Property({ fieldName: 'channel_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  channelConceptId!: string;

  @Property({ fieldName: 'offset_minutes', columnType: 'int' })
  offsetMinutes!: number;

  @Property({ fieldName: 'scheduled_at', columnType: 'timestamptz' })
  scheduledAt!: Date;

  @Property({ fieldName: 'sent_at', columnType: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Property({
    fieldName: 'notification_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → messaging.notification_requests
  notificationRequestId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
