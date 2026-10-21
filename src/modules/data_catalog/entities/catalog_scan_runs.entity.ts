import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'data_catalog', tableName: 'catalog_scan_runs' })
export class CatalogScanRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'source_code', columnType: 'varchar' })
  sourceCode!: string;

  @Property({ columnType: 'varchar' })
  mode!: string;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  @Property({ fieldName: 'requested_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  requestedByUserId?: string;

  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  @Property({
    fieldName: 'cancel_requested_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  cancelRequestedAt?: Date;

  @Property({ fieldName: 'lease_owner', columnType: 'varchar', nullable: true })
  leaseOwner?: string;

  @Property({
    fieldName: 'lease_expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  leaseExpiresAt?: Date;

  @Property({ columnType: 'int' })
  attempt!: number;

  @Property({
    fieldName: 'engine_version',
    columnType: 'varchar',
    nullable: true,
  })
  engineVersion?: string;

  @Property({ fieldName: 'connector_version', columnType: 'varchar' })
  connectorVersion!: string;

  @Property({
    fieldName: 'excluded_schemas',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  excludedSchemas?: unknown;

  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  limitations?: unknown;

  @Property({
    fieldName: 'objects_observed',
    columnType: 'int',
    nullable: true,
  })
  objectsObserved?: number;

  @Property({
    fieldName: 'columns_observed',
    columnType: 'int',
    nullable: true,
  })
  columnsObserved?: number;

  @Property({ fieldName: 'objects_added', columnType: 'int', nullable: true })
  objectsAdded?: number;

  @Property({ fieldName: 'objects_changed', columnType: 'int', nullable: true })
  objectsChanged?: number;

  @Property({
    fieldName: 'objects_not_observed',
    columnType: 'int',
    nullable: true,
  })
  objectsNotObserved?: number;

  @Property({
    fieldName: 'objects_reappeared',
    columnType: 'int',
    nullable: true,
  })
  objectsReappeared?: number;

  @Property({ fieldName: 'columns_added', columnType: 'int', nullable: true })
  columnsAdded?: number;

  @Property({ fieldName: 'columns_changed', columnType: 'int', nullable: true })
  columnsChanged?: number;

  @Property({
    fieldName: 'columns_not_observed',
    columnType: 'int',
    nullable: true,
  })
  columnsNotObserved?: number;

  @Property({
    fieldName: 'snapshot_hash',
    columnType: 'varchar',
    nullable: true,
  })
  snapshotHash?: string;

  @Property({ fieldName: 'error_code', columnType: 'varchar', nullable: true })
  errorCode?: string;

  @Property({ fieldName: 'error_message', columnType: 'text', nullable: true })
  errorMessage?: string;

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
