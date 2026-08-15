import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Envío de una encuesta a un doctor por una visita concreta (spec 5543:
 * «permitir que responda únicamente el doctor visitado»).
 *
 * La pareja (encuesta, visita) es única: una visita no genera dos veces la misma
 * encuesta, y el doctor destinatario queda fijado al emitirse, de modo que la
 * comprobación de «solo el doctor visitado» es una comparación de columna, no una
 * consulta que pueda olvidarse.
 */
@Entity({ schema: 'pharma_lab', tableName: 'visit_survey_responses' })
export class VisitSurveyResponses {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Encuesta emitida.
   */
  @Property({ fieldName: 'visit_survey_id', type: 'uuid' }) // FK → pharma_lab.visit_surveys
  visitSurveyId!: string;

  /**
   * Visita que la origina.
   */
  @Property({ fieldName: 'visit_record_id', type: 'uuid' }) // FK → pharma_lab.visit_records
  visitRecordId!: string;

  /**
   * Único destinatario autorizado a responder.
   */
  @Property({ fieldName: 'doctor_user_id', type: 'uuid' }) // FK → iam.users
  doctorUserId!: string;

  /**
   * Estado: pendiente o enviada.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Momento del envío al doctor.
   */
  @Property({ fieldName: 'issued_at', columnType: 'timestamptz' })
  issuedAt!: Date;

  /**
   * Momento en que el doctor respondió.
   */
  @Property({
    fieldName: 'submitted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  submittedAt?: Date;

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
