import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `accrual_schedule_lines`.
 */
@Entity({ schema: 'accounting', tableName: 'accrual_schedule_lines' })
export class AccrualScheduleLines {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a accrual object.
   */
  @Property({ fieldName: 'accrual_object_id', type: 'uuid' }) // FK → accounting.accrual_objects
  accrualObjectId!: string;

  /**
   * Identificador asociado a fiscal period.
   */
  @Property({ fieldName: 'fiscal_period_id', type: 'uuid' }) // FK → accounting.fiscal_periods
  fiscalPeriodId!: string;

  /**
   * Valor de planned amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'planned_amount',
    columnType: 'numeric',
    nullable: true,
  })
  plannedAmount?: string;

  /**
   * Valor de posted amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'posted_amount',
    columnType: 'numeric',
    nullable: true,
  })
  postedAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

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
