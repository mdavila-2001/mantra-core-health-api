import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Política de visitas de un doctor (spec 5396-5421): si acepta visitadores, con
 * qué reglas y con qué confirmación.
 *
 * Va aparte de `scheduling.booking_policies` a propósito: la spec exige
 * «separar las visitas médicas de las consultas de pacientes» (5399), y mezclar
 * las dos en la misma política obligaría a que cada regla de consulta cargara
 * una rama «…salvo que sea visita».
 */
@Entity({ schema: 'pharma_lab', tableName: 'doctor_visit_policies' })
export class DoctorVisitPolicies {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Doctor dueño de la agenda.
   */
  @Property({ fieldName: 'doctor_user_id', type: 'uuid', unique: true }) // FK → iam.users
  doctorUserId!: string;

  /**
   * Organización del doctor bajo la que se atienden las visitas.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Zona horaria que rige los horarios. Si falta, se usa la de la organización
   * y, en último término, la del doctor (spec 5379).
   */
  @Property({ fieldName: 'time_zone', columnType: 'varchar', nullable: true })
  timeZone?: string;

  /**
   * Si la confirmación es automática cuando la solicitud cumple todas las reglas
   * (spec 5413).
   */
  @Property({ fieldName: 'auto_confirm', type: 'boolean' })
  autoConfirm: boolean = false;

  /**
   * Máximo de visitas aceptadas por día.
   */
  @Property({
    fieldName: 'max_visits_per_day',
    columnType: 'int',
    nullable: true,
  })
  maxVisitsPerDay?: number;

  /**
   * Antelación mínima, en horas, con la que se puede solicitar una visita.
   */
  @Property({ fieldName: 'min_notice_hours', columnType: 'int' })
  minNoticeHours: number = 24;

  /**
   * Plazo, en horas antes del inicio, dentro del cual el visitador todavía puede
   * reprogramar o cancelar (spec 5377-5378).
   */
  @Property({ fieldName: 'reschedule_cutoff_hours', columnType: 'int' })
  rescheduleCutoffHours: number = 12;

  /**
   * Especialidades o categorías de producto admitidas (spec 5407, 5417).
   * Vacío o nulo significa «sin restricción por especialidad».
   */
  @Property({
    fieldName: 'allowed_specialty_concept_ids',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  allowedSpecialtyConceptIds?: string[];

  /**
   * Modalidades admitidas. Nulo significa «cualquiera de las configuradas en las
   * ventanas».
   */
  @Property({
    fieldName: 'allowed_modality_concept_ids',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  allowedModalityConceptIds?: string[];

  /**
   * Duración máxima admitida, en minutos.
   */
  @Property({
    fieldName: 'max_duration_minutes',
    columnType: 'int',
    nullable: true,
  })
  maxDurationMinutes?: number;

  /**
   * Estado de la política.
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
