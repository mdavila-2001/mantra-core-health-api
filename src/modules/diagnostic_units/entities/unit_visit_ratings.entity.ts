import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `unit_visit_ratings`.
 */
@Entity({ schema: 'diagnostic_units', tableName: 'unit_visit_ratings' })
export class UnitVisitRatings {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a unit visit record.
   */
  @Property({ fieldName: 'unit_visit_record_id', type: 'uuid' }) // FK → diagnostic_units.unit_visit_records (inferida)
  unitVisitRecordId!: string;

  /**
   * Identificador asociado a doctor user.
   */
  @Property({ fieldName: 'doctor_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  doctorUserId!: string;

  /**
   * Identificador asociado a kind concept.
   */
  @Property({ fieldName: 'kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  kindConceptId!: string;

  /**
   * Valor de punctuality mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  punctuality?: number;

  /**
   * Valor de information quality mantenido por la instancia.
   */
  @Property({
    fieldName: 'information_quality',
    columnType: 'int',
    nullable: true,
  })
  informationQuality?: number;

  /**
   * Valor de clarity mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  clarity?: number;

  /**
   * Valor de relevance mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  relevance?: number;

  /**
   * Valor de professional conduct mantenido por la instancia.
   */
  @Property({
    fieldName: 'professional_conduct',
    columnType: 'int',
    nullable: true,
  })
  professionalConduct?: number;

  /**
   * Valor de overall satisfaction mantenido por la instancia.
   */
  @Property({
    fieldName: 'overall_satisfaction',
    columnType: 'int',
    nullable: true,
  })
  overallSatisfaction?: number;

  /**
   * Valor de comment mantenido por la instancia.
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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
