import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `quality_rules`.
 */
@Entity({ schema: 'data_catalog', tableName: 'quality_rules' })
export class QualityRules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de rule code mantenido por la instancia.
   */
  @Property({ fieldName: 'rule_code', columnType: 'varchar' })
  ruleCode!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Identificador asociado a object.
   */
  @Property({ fieldName: 'object_id', type: 'uuid' }) // FK (destino no resuelto)
  objectId!: string;

  /**
   * Identificador asociado a column.
   */
  @Property({ fieldName: 'column_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  columnId?: string;

  /**
   * Valor de rule kind mantenido por la instancia.
   */
  @Property({ fieldName: 'rule_kind', columnType: 'varchar' })
  ruleKind!: string;

  /**
   * Valor de params json mantenido por la instancia.
   */
  @Property({ fieldName: 'params_json', type: 'json', columnType: 'jsonb' })
  paramsJson!: unknown;

  /**
   * Valor de severity mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  severity!: string;

  /**
   * Valor de threshold pct mantenido por la instancia.
   */
  @Property({ fieldName: 'threshold_pct', columnType: 'numeric(5,2)' })
  thresholdPct!: string;

  /**
   * Valor de schedule minutes mantenido por la instancia.
   */
  @Property({
    fieldName: 'schedule_minutes',
    columnType: 'int',
    nullable: true,
  })
  scheduleMinutes?: number;

  /**
   * Valor de sample limit mantenido por la instancia.
   */
  @Property({ fieldName: 'sample_limit', columnType: 'int', default: 20 })
  sampleLimit!: number;

  /**
   * Valor de enabled mantenido por la instancia.
   */
  @Property({ type: 'boolean', default: true })
  enabled!: boolean;

  /**
   * Identificador asociado a owner user.
   */
  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  ownerUserId?: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @Property({ columnType: 'int', default: 1 })
  version!: number;

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
