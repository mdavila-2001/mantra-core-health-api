import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_saved_views`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_saved_views' })
export class InsightsSavedViews {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users (inferida)
  userId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de module code mantenido por la instancia.
   */
  @Property({ fieldName: 'module_code', columnType: 'varchar' })
  moduleCode!: string;

  /**
   * Valor de filters json mantenido por la instancia.
   */
  @Property({
    fieldName: 'filters_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  filtersJson?: unknown;

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
