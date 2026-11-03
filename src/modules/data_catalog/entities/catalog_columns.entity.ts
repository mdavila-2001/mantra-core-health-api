import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `catalog_columns`.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_columns' })
export class CatalogColumns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a object.
   */
  @Property({ fieldName: 'object_id', type: 'uuid' }) // FK → data_catalog.catalog_objects
  objectId!: string;

  /**
   * Valor de column name mantenido por la instancia.
   */
  @Property({ fieldName: 'column_name', columnType: 'varchar' })
  columnName!: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  ordinal!: number;

  /**
   * Valor de native type mantenido por la instancia.
   */
  @Property({ fieldName: 'native_type', columnType: 'varchar' })
  nativeType!: string;

  /**
   * Valor de is nullable mantenido por la instancia.
   */
  @Property({ fieldName: 'is_nullable', type: 'boolean' })
  isNullable!: boolean;

  /**
   * Valor de default expression mantenido por la instancia.
   */
  @Property({
    fieldName: 'default_expression',
    columnType: 'text',
    nullable: true,
  })
  defaultExpression?: string;

  /**
   * Valor de is identity mantenido por la instancia.
   */
  @Property({ fieldName: 'is_identity', type: 'boolean' })
  isIdentity!: boolean;

  /**
   * Valor de is generated mantenido por la instancia.
   */
  @Property({ fieldName: 'is_generated', type: 'boolean' })
  isGenerated!: boolean;

  /**
   * Valor de is primary key mantenido por la instancia.
   */
  @Property({ fieldName: 'is_primary_key', type: 'boolean' })
  isPrimaryKey!: boolean;

  /**
   * Valor de is unique mantenido por la instancia.
   */
  @Property({ fieldName: 'is_unique', type: 'boolean' })
  isUnique!: boolean;

  /**
   * Valor de foreign key mantenido por la instancia.
   */
  @Property({
    fieldName: 'foreign_key',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  foreignKey?: unknown;

  /**
   * Valor de column comment mantenido por la instancia.
   */
  @Property({ fieldName: 'column_comment', columnType: 'text', nullable: true })
  columnComment?: string;

  /**
   * Valor de observation status mantenido por la instancia.
   */
  @Property({ fieldName: 'observation_status', columnType: 'varchar' })
  observationStatus!: string;

  /**
   * Valor de technical hash mantenido por la instancia.
   */
  @Property({ fieldName: 'technical_hash', columnType: 'varchar' })
  technicalHash!: string;

  /**
   * Identificador asociado a first seen scan.
   */
  @Property({ fieldName: 'first_seen_scan_id', type: 'uuid' }) // FK → data_catalog.catalog_scan_runs
  firstSeenScanId!: string;

  /**
   * Identificador asociado a last seen scan.
   */
  @Property({ fieldName: 'last_seen_scan_id', type: 'uuid' }) // FK → data_catalog.catalog_scan_runs
  lastSeenScanId!: string;

  /**
   * Valor de last seen at mantenido por la instancia.
   */
  @Property({ fieldName: 'last_seen_at', columnType: 'timestamptz' })
  lastSeenAt!: Date;

  /**
   * Valor de not observed since mantenido por la instancia.
   */
  @Property({
    fieldName: 'not_observed_since',
    columnType: 'timestamptz',
    nullable: true,
  })
  notObservedSince?: Date;

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
