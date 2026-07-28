import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Snapshot congelado de la política de cancelación vigente al confirmar la reserva
 * (CAN-APT-001). Se guarda para que un cambio posterior de `booking_policies` NO
 * altere las condiciones que el paciente ya aceptó: la cancelación/cargo se evalúan
 * con estos valores, nunca con la política actual.
 */
export interface CancellationPolicySnapshot {
  /** Política de origen; ausente si se aplicó el default del sistema. */
  policyId?: string;
  /** `row_version` de la política congelada: traza qué versión aceptó el paciente. */
  policyRowVersion?: number;
  /** Ventana de cancelación congelada, en minutos. Default 24h (1440) si no había política. */
  cancellationWindowMinutes: number;
  /** Cargo por inasistencia/cancelación tardía congelado. */
  noShowFeeAmount?: string;
  currencyConceptId?: string;
  /**
   * Zona horaria del recurso congelada (CAN-TIME-001). Es informativa: el plazo se
   * evalúa sobre instantes absolutos UTC (`timestamptz`), así que no altera el cálculo.
   */
  timeZone?: string;
  /** Instante de captura del snapshot (ISO-8601). */
  capturedAt: string;
}

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
  cancellationPolicySnapshot?: CancellationPolicySnapshot;

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
