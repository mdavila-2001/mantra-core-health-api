import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Franja semanal en la que un doctor recibe visitadores (spec 5398-5406).
 *
 * Una solicitud solo puede caer dentro de una de estas ventanas; fuera de ellas
 * el servicio la rechaza en vez de dejarla pendiente, porque una solicitud que
 * nunca podrá confirmarse es ruido en la bandeja del doctor.
 */
@Entity({ schema: 'pharma_lab', tableName: 'doctor_visit_windows' })
export class DoctorVisitWindows {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Política a la que pertenece la ventana.
   */
  @Property({ fieldName: 'doctor_visit_policy_id', type: 'uuid' }) // FK → pharma_lab.doctor_visit_policies
  doctorVisitPolicyId!: string;

  /**
   * Día de la semana, 0 = domingo … 6 = sábado (`Date#getUTCDay`).
   */
  @Property({ fieldName: 'weekday', columnType: 'int' })
  weekday!: number;

  /**
   * Hora de inicio, `HH:MM` en la zona horaria de la política.
   */
  @Property({ fieldName: 'start_time', columnType: 'time' })
  startTime!: string;

  /**
   * Hora de fin, `HH:MM`.
   */
  @Property({ fieldName: 'end_time', columnType: 'time' })
  endTime!: string;

  /**
   * Duración estándar de cada visita en la ventana, en minutos.
   */
  @Property({ fieldName: 'slot_duration_minutes', columnType: 'int' })
  slotDurationMinutes!: number;

  /**
   * Modalidad de la ventana.
   */
  @Property({ fieldName: 'modality_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  modalityConceptId!: string;

  /**
   * Ubicación física o enlace de la reunión.
   */
  @Property({ columnType: 'varchar', nullable: true })
  location?: string;

  /**
   * Máximo de visitas admitidas dentro de esta ventana.
   */
  @Property({ fieldName: 'max_visits', columnType: 'int', nullable: true })
  maxVisits?: number;

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
