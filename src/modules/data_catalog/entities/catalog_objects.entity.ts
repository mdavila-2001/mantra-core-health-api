import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Objeto físico observado (`data_catalog.catalog_objects`): tabla, vista,
 * vista materializada o tabla foránea, con identidad estable por
 * (fuente, schema, nombre).
 *
 * Guarda sólo hechos técnicos. La semántica curada vive en
 * `catalog_annotations`, que un escaneo nunca toca.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_objects' })
export class CatalogObjects {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'source_code', columnType: 'varchar' })
  sourceCode!: string;

  @Property({ fieldName: 'schema_name', columnType: 'varchar' })
  schemaName!: string;

  @Property({ fieldName: 'object_name', columnType: 'varchar' })
  objectName!: string;

  /** TABLE | PARTITIONED_TABLE | VIEW | MATERIALIZED_VIEW | FOREIGN_TABLE. */
  @Property({ fieldName: 'object_kind', columnType: 'varchar' })
  objectKind!: string;

  /** OBSERVED | NOT_OBSERVED | RETIRED. Nunca se borra la fila. */
  @Property({ fieldName: 'observation_status', columnType: 'varchar' })
  observationStatus!: string;

  /** `COMMENT ON TABLE` tal como lo declara la base. */
  @Property({ fieldName: 'table_comment', columnType: 'text', nullable: true })
  tableComment?: string;

  /** Estimación de `pg_class.reltuples`; null si nunca se analizó. */
  @Property({
    fieldName: 'estimated_rows',
    columnType: 'bigint',
    nullable: true,
  })
  estimatedRows?: string;

  /** `pg_total_relation_size`; null en vistas. */
  @Property({ fieldName: 'total_bytes', columnType: 'bigint', nullable: true })
  totalBytes?: string;

  /** Cuándo se tomaron las estadísticas (son una foto, no un conteo). */
  @Property({
    fieldName: 'stats_observed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  statsObservedAt?: Date;

  @Property({ fieldName: 'column_count', columnType: 'int' })
  columnCount!: number;

  /** Columnas de la PK en orden. */
  @Property({
    fieldName: 'primary_key_columns',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  primaryKeyColumns?: unknown;

  /** Huella de la estructura (objeto + columnas), sin estadísticas. */
  @Property({ fieldName: 'technical_hash', columnType: 'varchar' })
  technicalHash!: string;

  @Property({ fieldName: 'first_seen_scan_id', type: 'uuid' }) // FK → data_catalog.catalog_scan_runs
  firstSeenScanId!: string;

  @Property({ fieldName: 'last_seen_scan_id', type: 'uuid' }) // FK → data_catalog.catalog_scan_runs
  lastSeenScanId!: string;

  @Property({ fieldName: 'last_seen_at', columnType: 'timestamptz' })
  lastSeenAt!: Date;

  /** Desde cuándo un escaneo completo dejó de verlo. */
  @Property({
    fieldName: 'not_observed_since',
    columnType: 'timestamptz',
    nullable: true,
  })
  notObservedSince?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
