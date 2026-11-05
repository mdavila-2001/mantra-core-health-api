import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_reports`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_reports' })
export class InsightsReports {
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
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Valor de type code mantenido por la instancia.
   */
  @Property({ fieldName: 'type_code', columnType: 'varchar' })
  typeCode!: string;

  /**
   * Valor de audience code mantenido por la instancia.
   */
  @Property({ fieldName: 'audience_code', columnType: 'varchar' })
  audienceCode!: string;

  /**
   * Valor de period from mantenido por la instancia.
   */
  @Property({ fieldName: 'period_from', columnType: 'date' })
  periodFrom!: Date;

  /**
   * Valor de period to mantenido por la instancia.
   */
  @Property({ fieldName: 'period_to', columnType: 'date' })
  periodTo!: Date;

  /**
   * Valor de campaign ids json mantenido por la instancia.
   */
  @Property({
    fieldName: 'campaign_ids_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  campaignIdsJson?: unknown;

  /**
   * Valor de channels json mantenido por la instancia.
   */
  @Property({
    fieldName: 'channels_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  channelsJson?: unknown;

  /**
   * Valor de sections json mantenido por la instancia.
   */
  @Property({
    fieldName: 'sections_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  sectionsJson?: unknown;

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
