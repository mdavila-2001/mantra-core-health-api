import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `availability_exceptions`.
 */
@Entity({ schema: 'scheduling', tableName: 'availability_exceptions' })
export class AvailabilityExceptions {
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
   * Identificador asociado a exception type concept.
   */
  @Property({ fieldName: 'exception_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  exceptionTypeConceptId!: string;

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
   * Valor de reason mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  reason?: string;

  /**
   * Valor de is available mantenido por la instancia.
   */
  @Property({ fieldName: 'is_available', type: 'boolean', nullable: true })
  isAvailable?: boolean;

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
