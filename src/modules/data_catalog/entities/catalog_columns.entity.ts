import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'data_catalog', tableName: 'catalog_columns' })
export class CatalogColumns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'object_id', type: 'uuid' }) // FK (destino no resuelto)
  objectId!: string;

  @Property({ fieldName: 'column_name', columnType: 'varchar' })
  columnName!: string;

  @Property({ columnType: 'int' })
  ordinal!: number;

  @Property({ fieldName: 'native_type', columnType: 'varchar' })
  nativeType!: string;

  @Property({ fieldName: 'is_nullable', type: 'boolean' })
  isNullable!: boolean;

  @Property({
    fieldName: 'default_expression',
    columnType: 'text',
    nullable: true,
  })
  defaultExpression?: string;

  @Property({ fieldName: 'is_identity', type: 'boolean' })
  isIdentity!: boolean;

  @Property({ fieldName: 'is_generated', type: 'boolean' })
  isGenerated!: boolean;

  @Property({ fieldName: 'is_primary_key', type: 'boolean' })
  isPrimaryKey!: boolean;

  @Property({ fieldName: 'is_unique', type: 'boolean' })
  isUnique!: boolean;

  @Property({
    fieldName: 'foreign_key',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  foreignKey?: unknown;

  @Property({ fieldName: 'column_comment', columnType: 'text', nullable: true })
  columnComment?: string;

  @Property({ fieldName: 'observation_status', columnType: 'varchar' })
  observationStatus!: string;

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
