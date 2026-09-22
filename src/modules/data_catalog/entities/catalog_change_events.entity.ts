import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Cambio técnico detectado por un escaneo (`data_catalog.catalog_change_events`).
 * Append-only: es el historial estructural de cada objeto y columna, y lo que
 * permite ver un diff entre corridas sin guardar un snapshot completo por
 * escaneo.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_change_events' })
export class CatalogChangeEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'scan_run_id', type: 'uuid' }) // FK → data_catalog.catalog_scan_runs
  scanRunId!: string;

  @Property({ fieldName: 'object_id', type: 'uuid' }) // FK → data_catalog.catalog_objects
  objectId!: string;

  /** Null cuando el cambio es del objeto. */
  @Property({ fieldName: 'column_id', type: 'uuid', nullable: true }) // FK → data_catalog.catalog_columns
  columnId?: string;

  /** ADDED | CHANGED | NOT_OBSERVED | REAPPEARED. */
  @Property({ fieldName: 'change_kind', columnType: 'varchar' })
  changeKind!: string;

  /** Sólo los hechos que difieren; null en un alta. */
  @Property({
    fieldName: 'before_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  beforeJson?: unknown;

  @Property({
    fieldName: 'after_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  afterJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
