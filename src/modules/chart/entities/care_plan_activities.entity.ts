import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `care_plan_activities`.
 */
@Entity({ schema: 'chart', tableName: 'care_plan_activities' })
export class CarePlanActivities {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a care plan.
   */
  @Property({ fieldName: 'care_plan_id', type: 'uuid' }) // FK → chart.care_plans
  carePlanId!: string;

  /**
   * Identificador asociado a activity concept.
   */
  @Property({ fieldName: 'activity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  activityConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de scheduled at mantenido por la instancia.
   */
  @Property({
    fieldName: 'scheduled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  scheduledAt?: Date;

  /**
   * Valor de detail text mantenido por la instancia.
   */
  @Property({ fieldName: 'detail_text', columnType: 'text', nullable: true })
  detailText?: string;

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
