import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `performance_reviews`.
 */
@Entity({ schema: 'erp', tableName: 'performance_reviews' })
export class PerformanceReviews {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a employee.
   */
  @Property({ fieldName: 'employee_id', type: 'uuid' }) // FK → erp.employees
  employeeId!: string;

  /**
   * Identificador asociado a reviewer employee.
   */
  @Property({ fieldName: 'reviewer_employee_id', type: 'uuid', nullable: true }) // FK → erp.employees
  reviewerEmployeeId?: string;

  /**
   * Valor de period start mantenido por la instancia.
   */
  @Property({ fieldName: 'period_start', columnType: 'date' })
  periodStart!: Date;

  /**
   * Valor de period end mantenido por la instancia.
   */
  @Property({ fieldName: 'period_end', columnType: 'date' })
  periodEnd!: Date;

  /**
   * Identificador asociado a rating concept.
   */
  @Property({ fieldName: 'rating_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  ratingConceptId?: string;

  /**
   * Valor de score mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  score?: string;

  /**
   * Valor de summary text mantenido por la instancia.
   */
  @Property({ fieldName: 'summary_text', columnType: 'text', nullable: true })
  summaryText?: string;

  /**
   * Identificador asociado a status concept.
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
