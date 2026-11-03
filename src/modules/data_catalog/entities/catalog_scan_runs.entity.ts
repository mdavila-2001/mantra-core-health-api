import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `catalog_scan_runs`.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_scan_runs' })
export class CatalogScanRuns {
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
   * Valor de mode mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  mode!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  /**
   * Identificador asociado a requested by user.
   */
  @Property({ fieldName: 'requested_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  requestedByUserId?: string;

  /**
   * Valor de requested at mantenido por la instancia.
   */
  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Valor de finished at mantenido por la instancia.
   */
  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  /**
   * Valor de cancel requested at mantenido por la instancia.
   */
  @Property({
    fieldName: 'cancel_requested_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  cancelRequestedAt?: Date;

  /**
   * Valor de lease owner mantenido por la instancia.
   */
  @Property({ fieldName: 'lease_owner', columnType: 'varchar', nullable: true })
  leaseOwner?: string;

  /**
   * Valor de lease expires at mantenido por la instancia.
   */
  @Property({
    fieldName: 'lease_expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  leaseExpiresAt?: Date;

  /**
   * Valor de attempt mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  attempt!: number;

  /**
   * Valor de engine version mantenido por la instancia.
   */
  @Property({
    fieldName: 'engine_version',
    columnType: 'varchar',
    nullable: true,
  })
  engineVersion?: string;

  /**
   * Valor de connector version mantenido por la instancia.
   */
  @Property({ fieldName: 'connector_version', columnType: 'varchar' })
  connectorVersion!: string;

  /**
   * Valor de excluded schemas mantenido por la instancia.
   */
  @Property({
    fieldName: 'excluded_schemas',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  excludedSchemas?: unknown;

  /**
   * Valor de limitations mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  limitations?: unknown;

  /**
   * Valor de objects observed mantenido por la instancia.
   */
  @Property({
    fieldName: 'objects_observed',
    columnType: 'int',
    nullable: true,
  })
  objectsObserved?: number;

  /**
   * Valor de columns observed mantenido por la instancia.
   */
  @Property({
    fieldName: 'columns_observed',
    columnType: 'int',
    nullable: true,
  })
  columnsObserved?: number;

  /**
   * Valor de objects added mantenido por la instancia.
   */
  @Property({ fieldName: 'objects_added', columnType: 'int', nullable: true })
  objectsAdded?: number;

  /**
   * Valor de objects changed mantenido por la instancia.
   */
  @Property({ fieldName: 'objects_changed', columnType: 'int', nullable: true })
  objectsChanged?: number;

  /**
   * Valor de objects not observed mantenido por la instancia.
   */
  @Property({
    fieldName: 'objects_not_observed',
    columnType: 'int',
    nullable: true,
  })
  objectsNotObserved?: number;

  /**
   * Valor de objects reappeared mantenido por la instancia.
   */
  @Property({
    fieldName: 'objects_reappeared',
    columnType: 'int',
    nullable: true,
  })
  objectsReappeared?: number;

  /**
   * Valor de columns added mantenido por la instancia.
   */
  @Property({ fieldName: 'columns_added', columnType: 'int', nullable: true })
  columnsAdded?: number;

  /**
   * Valor de columns changed mantenido por la instancia.
   */
  @Property({ fieldName: 'columns_changed', columnType: 'int', nullable: true })
  columnsChanged?: number;

  /**
   * Valor de columns not observed mantenido por la instancia.
   */
  @Property({
    fieldName: 'columns_not_observed',
    columnType: 'int',
    nullable: true,
  })
  columnsNotObserved?: number;

  /**
   * Valor de snapshot hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'snapshot_hash',
    columnType: 'varchar',
    nullable: true,
  })
  snapshotHash?: string;

  /**
   * Valor de error code mantenido por la instancia.
   */
  @Property({ fieldName: 'error_code', columnType: 'varchar', nullable: true })
  errorCode?: string;

  /**
   * Valor de error message mantenido por la instancia.
   */
  @Property({ fieldName: 'error_message', columnType: 'text', nullable: true })
  errorMessage?: string;

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
