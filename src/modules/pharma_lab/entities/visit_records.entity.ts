import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Registro de la visita efectivamente realizada (spec 5483-5504).
 *
 * Igual que `visit_requests`, no tiene ninguna columna capaz de referenciar a un
 * paciente: «evitar incluir información clínica identificable de pacientes»
 * (5501) se cumple porque no hay dónde ponerla, no porque una validación lo
 * revise.
 */
@Entity({ schema: 'pharma_lab', tableName: 'visit_records' })
export class VisitRecords {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Solicitud de la que nace el registro.
   */
  @Property({ fieldName: 'visit_request_id', type: 'uuid', unique: true }) // FK → pharma_lab.visit_requests
  visitRequestId!: string;

  /**
   * Doctor visitado.
   */
  @Property({ fieldName: 'doctor_user_id', type: 'uuid' }) // FK → iam.users
  doctorUserId!: string;

  /**
   * Visitador.
   */
  @Property({ fieldName: 'medical_visitor_id', type: 'uuid' }) // FK → pharma_lab.medical_visitors
  medicalVisitorId!: string;

  /**
   * Laboratorio representado.
   */
  @Property({ fieldName: 'pharma_lab_id', type: 'uuid' }) // FK → pharma_lab.pharma_labs
  pharmaLabId!: string;

  /**
   * Momento en que se realizó.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  /**
   * Lugar.
   */
  @Property({ columnType: 'varchar', nullable: true })
  location?: string;

  /**
   * Modalidad efectiva.
   */
  @Property({ fieldName: 'modality_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  modalityConceptId!: string;

  /**
   * Temas tratados.
   */
  @Property({
    fieldName: 'topics_discussed',
    columnType: 'text',
    nullable: true,
  })
  topicsDiscussed?: string;

  /**
   * Preguntas realizadas por el doctor.
   */
  @Property({ columnType: 'text', nullable: true })
  questions?: string;

  /**
   * Compromisos asumidos.
   */
  @Property({ columnType: 'text', nullable: true })
  commitments?: string;

  /**
   * Próxima acción acordada.
   */
  @Property({ fieldName: 'next_action', columnType: 'text', nullable: true })
  nextAction?: string;

  /**
   * Observaciones.
   */
  @Property({ columnType: 'text', nullable: true })
  observations?: string;

  /**
   * Asistencia del visitador.
   */
  @Property({ fieldName: 'visitor_attendance_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  visitorAttendanceConceptId!: string;

  /**
   * Asistencia del doctor.
   */
  @Property({ fieldName: 'doctor_attendance_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  doctorAttendanceConceptId!: string;

  /**
   * Estado de confirmación por parte del doctor (spec 5502).
   */
  @Property({ fieldName: 'confirmation_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  confirmationConceptId!: string;

  /**
   * Momento de la confirmación del doctor.
   */
  @Property({
    fieldName: 'confirmed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  confirmedAt?: Date;

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
