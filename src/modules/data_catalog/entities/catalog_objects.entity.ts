import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `catalog_objects`.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_objects' })
export class CatalogObjects {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de source code mantenido por la instancia.
   */
  @Property({ fieldName: 'source_code', columnType: 'varchar' })
  sourceCode!: string;

  /**
   * Valor de schema name mantenido por la instancia.
   */
  @Property({ fieldName: 'schema_name', columnType: 'varchar' })
  schemaName!: string;

  /**
   * Valor de object name mantenido por la instancia.
   */
  @Property({ fieldName: 'object_name', columnType: 'varchar' })
  objectName!: string;

  /**
   * Valor de object kind mantenido por la instancia.
   */
  @Property({ fieldName: 'object_kind', columnType: 'varchar' })
  objectKind!: string;

  /**
   * Valor de observation status mantenido por la instancia.
   */
  @Property({ fieldName: 'observation_status', columnType: 'varchar' })
  observationStatus!: string;

  /**
   * Valor de table comment mantenido por la instancia.
   */
  @Property({ fieldName: 'table_comment', columnType: 'text', nullable: true })
  tableComment?: string;

  /**
   * Valor de estimated rows mantenido por la instancia.
   */
  @Property({ fieldName: 'estimated_rows', type: 'bigint', nullable: true })
  estimatedRows?: string;

  /**
   * Valor de total bytes mantenido por la instancia.
   */
  @Property({ fieldName: 'total_bytes', type: 'bigint', nullable: true })
  totalBytes?: string;

  /**
   * Valor de stats observed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'stats_observed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  statsObservedAt?: Date;

  /**
   * Valor de column count mantenido por la instancia.
   */
  @Property({ fieldName: 'column_count', columnType: 'int' })
  columnCount!: number;

  /**
   * Valor de primary key columns mantenido por la instancia.
   */
  @Property({
    fieldName: 'primary_key_columns',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  primaryKeyColumns?: unknown;

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
   * Identificador asociado a domain.
   */
  @Property({ fieldName: 'domain_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  domainId?: string;

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
