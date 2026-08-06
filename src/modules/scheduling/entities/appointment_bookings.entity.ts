import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `appointment_bookings`.
 */
@Entity({ schema: 'scheduling', tableName: 'appointment_bookings' })
export class AppointmentBookings {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Identificador asociado a bookable slot.
   */
  @Property({ fieldName: 'bookable_slot_id', type: 'uuid' }) // FK → scheduling.bookable_slots
  bookableSlotId!: string;

  /**
   * Identificador asociado a resource.
   */
  @Property({ fieldName: 'resource_id', type: 'uuid', nullable: true }) // FK → scheduling.schedulable_resources
  resourceId?: string;

  /**
   * Identificador asociado a appointment.
   */
  @Property({ fieldName: 'appointment_id', type: 'uuid', nullable: true }) // FK → clinical.appointments
  appointmentId?: string;

  /**
   * Identificador asociado a service concept.
   */
  @Property({ fieldName: 'service_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  serviceConceptId?: string;

  /**
   * Identificador asociado a booking channel concept.
   */
  @Property({ fieldName: 'booking_channel_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  bookingChannelConceptId!: string;

  /**
   * Identificador asociado a booked by user.
   */
  @Property({ fieldName: 'booked_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  bookedByUserId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de confirmed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'confirmed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  confirmedAt?: Date;

  /**
   * Valor de checked in at mantenido por la instancia.
   */
  @Property({
    fieldName: 'checked_in_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  checkedInAt?: Date;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

  /**
   * Identificador asociado a booking policy.
   */
  @Property({ fieldName: 'booking_policy_id', type: 'uuid', nullable: true }) // FK → scheduling.booking_policies
  bookingPolicyId?: string;

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

  /**
   * Snapshot de la política de cancelación aceptada al confirmar (CAN-APT-001).
   * Columna aditiva: la referencia `booking_policy_id` puede seguir mutando de
   * versión, pero este JSON preserva las condiciones exactas que rigen la cita.
   */
  @Property({
    fieldName: 'cancellation_policy_snapshot',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  cancellationPolicySnapshot?: unknown;
}
