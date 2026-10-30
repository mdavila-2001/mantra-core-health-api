import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_notification_preferences`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_notification_preferences' })
export class InsightsNotificationPreferences {
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
   * Valor de matrix json mantenido por la instancia.
   */
  @Property({ fieldName: 'matrix_json', type: 'json', columnType: 'jsonb' })
  matrixJson!: unknown;

  /**
   * Valor de frequency code mantenido por la instancia.
   */
  @Property({ fieldName: 'frequency_code', columnType: 'varchar' })
  frequencyCode!: string;

  /**
   * Valor de digest hour mantenido por la instancia.
   */
  @Property({
    fieldName: 'digest_hour',
    columnType: 'smallint',
    nullable: true,
  })
  digestHour?: number;

  /**
   * Valor de quiet from mantenido por la instancia.
   */
  @Property({ fieldName: 'quiet_from', columnType: 'time', nullable: true })
  quietFrom?: string;

  /**
   * Valor de quiet to mantenido por la instancia.
   */
  @Property({ fieldName: 'quiet_to', columnType: 'time', nullable: true })
  quietTo?: string;

  /**
   * Valor de quiet exempt critical mantenido por la instancia.
   */
  @Property({
    fieldName: 'quiet_exempt_critical',
    type: 'boolean',
    default: true,
  })
  quietExemptCritical!: boolean;

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
