import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `catalog_change_events`.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_change_events' })
export class CatalogChangeEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a scan run.
   */
  @Property({ fieldName: 'scan_run_id', type: 'uuid' }) // FK → data_catalog.catalog_scan_runs
  scanRunId!: string;

  /**
   * Identificador asociado a object.
   */
  @Property({ fieldName: 'object_id', type: 'uuid' }) // FK → data_catalog.catalog_objects
  objectId!: string;

  /**
   * Identificador asociado a column.
   */
  @Property({ fieldName: 'column_id', type: 'uuid', nullable: true }) // FK → data_catalog.catalog_columns
  columnId?: string;

  /**
   * Valor de change kind mantenido por la instancia.
   */
  @Property({ fieldName: 'change_kind', columnType: 'varchar' })
  changeKind!: string;

  /**
   * Valor de before json mantenido por la instancia.
   */
  @Property({
    fieldName: 'before_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  beforeJson?: unknown;

  /**
   * Valor de after json mantenido por la instancia.
   */
  @Property({
    fieldName: 'after_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  afterJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
