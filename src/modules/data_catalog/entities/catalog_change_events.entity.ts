import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'data_catalog', tableName: 'catalog_change_events' })
export class CatalogChangeEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'scan_run_id', type: 'uuid' }) // FK (destino no resuelto)
  scanRunId!: string;

  @Property({ fieldName: 'object_id', type: 'uuid' }) // FK (destino no resuelto)
  objectId!: string;

  @Property({ fieldName: 'column_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  columnId?: string;

  @Property({ fieldName: 'change_kind', columnType: 'varchar' })
  changeKind!: string;

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
