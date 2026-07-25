import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'scheduling', tableName: 'booking_reschedules' })
export class BookingReschedules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'booking_id', type: 'uuid' }) // FK → scheduling.appointment_bookings
  bookingId!: string;

  @Property({ fieldName: 'from_slot_id', type: 'uuid' }) // FK → scheduling.bookable_slots
  fromSlotId!: string;

  @Property({ fieldName: 'to_slot_id', type: 'uuid' }) // FK → scheduling.bookable_slots
  toSlotId!: string;

  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

  @Property({
    fieldName: 'rescheduled_by_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users
  rescheduledByUserId?: string;

  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
