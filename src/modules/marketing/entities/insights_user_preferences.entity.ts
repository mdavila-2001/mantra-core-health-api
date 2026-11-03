import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_user_preferences`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_user_preferences' })
export class InsightsUserPreferences {
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
   * Valor de density code mantenido por la instancia.
   */
  @Property({ fieldName: 'density_code', columnType: 'varchar' })
  densityCode!: string;

  /**
   * Valor de theme code mantenido por la instancia.
   */
  @Property({ fieldName: 'theme_code', columnType: 'varchar' })
  themeCode!: string;

  /**
   * Valor de nav collapsed mantenido por la instancia.
   */
  @Property({ fieldName: 'nav_collapsed', type: 'boolean', default: false })
  navCollapsed!: boolean;

  /**
   * Valor de timezone mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  timezone?: string;

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
