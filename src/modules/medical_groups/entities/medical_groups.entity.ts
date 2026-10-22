import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Estados del ciclo de vida de un grupo médico (FT-21).
 *
 * `PENDING_TEAM` → `SCHEDULED` cuando el último cargo invitado acepta.
 * `SCHEDULED` ⇄ `RESCHEDULE_PENDING` mientras hay una fecha propuesta sin
 * resolver por el creador. `CLOSED` es terminal: una semana después de
 * `scheduledAt` el expediente queda inmutable (AC-21-19/20).
 */
export const MEDICAL_GROUP_STATUS = Object.freeze({
  PENDING_TEAM: 'PENDING_TEAM',
  SCHEDULED: 'SCHEDULED',
  RESCHEDULE_PENDING: 'RESCHEDULE_PENDING',
  CLOSED: 'CLOSED',
} as const);

export type MedicalGroupStatus =
  (typeof MEDICAL_GROUP_STATUS)[keyof typeof MEDICAL_GROUP_STATUS];

/**
 * Mapea la entidad persistente asociada a `medical_groups.groups` (FT-21,
 * patch `2026-09-04_v426_medical_groups.sql` — ver ese archivo para el
 * desvío declarado del proceso `.puml → SQL → BD → ORM`).
 */
@Entity({ schema: 'medical_groups', tableName: 'groups' })
export class MedicalGroups {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  @Property({ fieldName: 'service_catalog_id', type: 'uuid' }) // FK → billing.service_catalog
  serviceCatalogId!: string;

  /** Doctor que crea la solicitud y arma el grupo. */
  @Property({ fieldName: 'requesting_practitioner_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  requestingPractitionerId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid', nullable: true }) // FK → profiles.patient_profiles
  patientProfileId?: string;

  /** Diagnóstico observado del paciente (`clinical.conditions`), opcional. */
  @Property({ fieldName: 'condition_id', type: 'uuid', nullable: true }) // FK → clinical.conditions
  conditionId?: string;

  @Property({ fieldName: 'scheduled_at', columnType: 'timestamptz' })
  scheduledAt!: Date;

  @Property({ fieldName: 'location_text', columnType: 'varchar' })
  locationText!: string;

  /** Notas adicionales cargadas por el creador al armar el grupo. */
  @Property({ fieldName: 'notes_text', columnType: 'text', nullable: true })
  notesText?: string;

  /**
   * Términos y condiciones vigentes del grupo: default del servicio +
   * adicionales del solicitante (AC-21-10/11/12/13). Se congela como texto al
   * crear — no es un puntero al servicio, que puede cambiar después.
   */
  @Property({ fieldName: 'terms_text', columnType: 'text' })
  termsText!: string;

  @Property({ columnType: 'varchar' })
  status!: MedicalGroupStatus;

  /** "NOTAS DEL EJERCICIO" — arriba a la izquierda en la consulta (AC-21-14). */
  @Property({
    fieldName: 'exercise_notes_text',
    columnType: 'text',
    nullable: true,
  })
  exerciseNotesText?: string;

  @Property({
    fieldName: 'exercise_notes_updated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  exerciseNotesUpdatedAt?: Date;

  @Property({
    fieldName: 'proposed_reschedule_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  proposedRescheduleAt?: Date;

  @Property({
    fieldName: 'proposed_by_practitioner_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  proposedByPractitionerId?: string;

  /** Se fija la primera vez que se observa el expediente vencido (AC-21-19). */
  @Property({
    fieldName: 'closed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  closedAt?: Date;

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
