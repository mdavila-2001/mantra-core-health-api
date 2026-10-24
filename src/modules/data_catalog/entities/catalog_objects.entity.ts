import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

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

  @Property({ fieldName: 'object_kind', columnType: 'varchar' })
  objectKind!: string;

  @Property({ fieldName: 'observation_status', columnType: 'varchar' })
  observationStatus!: string;

  @Property({ fieldName: 'table_comment', columnType: 'text', nullable: true })
  tableComment?: string;

  @Property({ fieldName: 'estimated_rows', type: 'bigint', nullable: true })
  estimatedRows?: string;

  @Property({ fieldName: 'total_bytes', type: 'bigint', nullable: true })
  totalBytes?: string;

  @Property({
    fieldName: 'stats_observed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  statsObservedAt?: Date;

  @Property({ fieldName: 'column_count', columnType: 'int' })
  columnCount!: number;

  @Property({
    fieldName: 'primary_key_columns',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  primaryKeyColumns?: unknown;

  @Property({ fieldName: 'technical_hash', columnType: 'varchar' })
  technicalHash!: string;

  @Property({ fieldName: 'first_seen_scan_id', type: 'uuid' }) // FK (destino no resuelto)
  firstSeenScanId!: string;

  @Property({ fieldName: 'last_seen_scan_id', type: 'uuid' }) // FK (destino no resuelto)
  lastSeenScanId!: string;

  @Property({ fieldName: 'last_seen_at', columnType: 'timestamptz' })
  lastSeenAt!: Date;

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

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
