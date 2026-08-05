import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `booking_reschedules`.
 */
@Entity({ schema: 'scheduling', tableName: 'booking_reschedules' })
export class BookingReschedules {
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
   * Identificador asociado a from slot.
   */
  @Property({ fieldName: 'from_slot_id', type: 'uuid' }) // FK → scheduling.bookable_slots
  fromSlotId!: string;

  /**
   * Identificador asociado a to slot.
   */
  @Property({ fieldName: 'to_slot_id', type: 'uuid' }) // FK → scheduling.bookable_slots
  toSlotId!: string;

  /**
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

  /**
   * Identificador asociado a rescheduled by user.
   */
  @Property({
    fieldName: 'rescheduled_by_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users
  rescheduledByUserId?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
