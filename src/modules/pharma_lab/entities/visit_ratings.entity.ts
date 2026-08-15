import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Calificación de la visita por parte del doctor (spec 5506-5524).
 *
 * `kind_concept_id` mantiene separadas la calificación interna, la encuesta
 * privada y la reclamación formal (5519-5522): son tres cosas con destinatarios
 * y consecuencias distintas, y fundirlas en una sola nota es exactamente lo que
 * la spec prohíbe.
 *
 * Nunca se publica automáticamente (5524): la organización solo ve agregados.
 */
@Entity({ schema: 'pharma_lab', tableName: 'visit_ratings' })
export class VisitRatings {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Registro de visita calificado.
   */
  @Property({ fieldName: 'visit_record_id', type: 'uuid' }) // FK → pharma_lab.visit_records
  visitRecordId!: string;

  /**
   * Doctor que califica.
   */
  @Property({ fieldName: 'doctor_user_id', type: 'uuid' }) // FK → iam.users
  doctorUserId!: string;

  /**
   * Naturaleza del registro: calificación interna, encuesta privada o
   * reclamación formal.
   */
  @Property({ fieldName: 'kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  kindConceptId!: string;

  /**
   * Puntualidad, 1 a 5.
   */
  @Property({ columnType: 'int', nullable: true })
  punctuality?: number;

  /**
   * Calidad de la información, 1 a 5.
   */
  @Property({
    fieldName: 'information_quality',
    columnType: 'int',
    nullable: true,
  })
  informationQuality?: number;

  /**
   * Claridad, 1 a 5.
   */
  @Property({ columnType: 'int', nullable: true })
  clarity?: number;

  /**
   * Relevancia, 1 a 5.
   */
  @Property({ columnType: 'int', nullable: true })
  relevance?: number;

  /**
   * Conducta profesional, 1 a 5.
   */
  @Property({
    fieldName: 'professional_conduct',
    columnType: 'int',
    nullable: true,
  })
  professionalConduct?: number;

  /**
   * Utilidad del material, 1 a 5.
   */
  @Property({
    fieldName: 'material_usefulness',
    columnType: 'int',
    nullable: true,
  })
  materialUsefulness?: number;

  /**
   * Satisfacción general, 1 a 5.
   */
  @Property({
    fieldName: 'overall_satisfaction',
    columnType: 'int',
    nullable: true,
  })
  overallSatisfaction?: number;

  /**
   * Comentario opcional.
   */
  @Property({ columnType: 'text', nullable: true })
  comment?: string;

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
