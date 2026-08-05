import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `appointment_reminders`.
 */
@Entity({ schema: 'scheduling', tableName: 'appointment_reminders' })
export class AppointmentReminders {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a booking.
   */
  @Property({ fieldName: 'booking_id', type: 'uuid' }) // FK → scheduling.appointment_bookings
  bookingId!: string;

  /**
   * Identificador asociado a channel concept.
   */
  @Property({ fieldName: 'channel_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  channelConceptId!: string;

  /**
   * Valor de offset minutes mantenido por la instancia.
   */
  @Property({ fieldName: 'offset_minutes', columnType: 'int' })
  offsetMinutes!: number;

  /**
   * Valor de scheduled at mantenido por la instancia.
   */
  @Property({ fieldName: 'scheduled_at', columnType: 'timestamptz' })
  scheduledAt!: Date;

  /**
   * Valor de sent at mantenido por la instancia.
   */
  @Property({ fieldName: 'sent_at', columnType: 'timestamptz', nullable: true })
  sentAt?: Date;

  /**
   * Identificador asociado a notification request.
   */
  @Property({
    fieldName: 'notification_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → messaging.notification_requests
  notificationRequestId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
