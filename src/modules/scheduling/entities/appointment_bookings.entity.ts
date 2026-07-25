import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'scheduling', tableName: 'appointment_bookings' })
export class AppointmentBookings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'bookable_slot_id', type: 'uuid' }) // FK → scheduling.bookable_slots
  bookableSlotId!: string;

  @Property({ fieldName: 'resource_id', type: 'uuid', nullable: true }) // FK → scheduling.schedulable_resources
  resourceId?: string;

  @Property({ fieldName: 'appointment_id', type: 'uuid', nullable: true }) // FK → clinical.appointments
  appointmentId?: string;

  @Property({ fieldName: 'service_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  serviceConceptId?: string;

  @Property({ fieldName: 'booking_channel_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  bookingChannelConceptId!: string;

  @Property({ fieldName: 'booked_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  bookedByUserId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'confirmed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  confirmedAt?: Date;

  @Property({
    fieldName: 'checked_in_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  checkedInAt?: Date;

  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

  @Property({ fieldName: 'booking_policy_id', type: 'uuid', nullable: true }) // FK → scheduling.booking_policies
  bookingPolicyId?: string;

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
