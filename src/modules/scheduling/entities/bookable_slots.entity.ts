import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `bookable_slots`.
 */
@Entity({ schema: 'scheduling', tableName: 'bookable_slots' })
export class BookableSlots {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a resource.
   */
  @Property({ fieldName: 'resource_id', type: 'uuid' }) // FK → scheduling.schedulable_resources
  resourceId!: string;

  /**
   * Identificador asociado a schedule template.
   */
  @Property({ fieldName: 'schedule_template_id', type: 'uuid', nullable: true }) // FK → scheduling.schedule_templates
  scheduleTemplateId?: string;

  /**
   * Identificador asociado a service concept.
   */
  @Property({ fieldName: 'service_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  serviceConceptId?: string;

  /**
   * Valor de start at mantenido por la instancia.
   */
  @Property({ fieldName: 'start_at', columnType: 'timestamptz' })
  startAt!: Date;

  /**
   * Valor de end at mantenido por la instancia.
   */
  @Property({ fieldName: 'end_at', columnType: 'timestamptz' })
  endAt!: Date;

  /**
   * Valor de capacity mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  capacity!: number;

  /**
   * Valor de remaining capacity mantenido por la instancia.
   */
  @Property({ fieldName: 'remaining_capacity', columnType: 'int' })
  remainingCapacity!: number;

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
