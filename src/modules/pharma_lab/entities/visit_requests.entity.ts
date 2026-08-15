import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Solicitud de visita médica (spec 5343-5394).
 *
 * Reproduce las reglas de la solicitud de cita del paciente —pendiente de
 * confirmación, acciones del doctor, plazos de reprogramación y cancelación— con
 * una diferencia irrenunciable: **no hay paciente ni información clínica**. La
 * tabla no tiene ninguna columna que pueda apuntar a un paciente, un episodio o
 * un diagnóstico, y esa ausencia es la garantía estructural de la regla del
 * carril («no dar acceso clínico de pacientes»).
 */
@Entity({ schema: 'pharma_lab', tableName: 'visit_requests' })
export class VisitRequests {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Visitador solicitante.
   */
  @Property({ fieldName: 'medical_visitor_id', type: 'uuid' }) // FK → pharma_lab.medical_visitors
  medicalVisitorId!: string;

  /**
   * Laboratorio al que representa en esta visita.
   */
  @Property({ fieldName: 'pharma_lab_id', type: 'uuid' }) // FK → pharma_lab.pharma_labs
  pharmaLabId!: string;

  /**
   * Doctor visitado.
   */
  @Property({ fieldName: 'doctor_user_id', type: 'uuid' }) // FK → iam.users
  doctorUserId!: string;

  /**
   * Organización del doctor bajo la que se atiende la visita.
   */
  @Property({ fieldName: 'doctor_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  doctorTenantId?: string;

  /**
   * Motivo de la visita.
   */
  @Property({ columnType: 'text' })
  reason!: string;

  /**
   * Inicio solicitado, en UTC. La zona horaria aplicada se guarda aparte para
   * poder reconstruir lo que vio quien solicitó.
   */
  @Property({ fieldName: 'requested_start_at', columnType: 'timestamptz' })
  requestedStartAt!: Date;

  /**
   * Duración solicitada, en minutos.
   */
  @Property({ fieldName: 'duration_minutes', columnType: 'int' })
  durationMinutes!: number;

  /**
   * Zona horaria aplicada (la del doctor o la de su organización, spec 5379).
   */
  @Property({ fieldName: 'time_zone', columnType: 'varchar' })
  timeZone!: string;

  /**
   * Modalidad solicitada.
   */
  @Property({ fieldName: 'modality_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  modalityConceptId!: string;

  /**
   * Ubicación o enlace acordado.
   */
  @Property({ columnType: 'varchar', nullable: true })
  location?: string;

  /**
   * Documentación adjunta a la solicitud (referencias del almacén documental).
   */
  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  attachments?: unknown;

  /**
   * Observaciones del visitador.
   */
  @Property({ columnType: 'text', nullable: true })
  observations?: string;

  /**
   * Estado de la visita, dentro de la lista cerrada de spec 5382-5394.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Horario propuesto por el doctor como alternativa (spec 5373).
   */
  @Property({
    fieldName: 'proposed_start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  proposedStartAt?: Date;

  /**
   * Momento de la confirmación.
   */
  @Property({
    fieldName: 'confirmed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  confirmedAt?: Date;

  /**
   * Momento de la cancelación o el rechazo.
   */
  @Property({
    fieldName: 'closed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  closedAt?: Date;

  /**
   * Solicitud de la que ésta es reprogramación, si la hay.
   */
  @Property({
    fieldName: 'rescheduled_from_id',
    type: 'uuid',
    nullable: true,
  }) // FK → pharma_lab.visit_requests
  rescheduledFromId?: string;

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
