import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Corrida de descubrimiento técnico (`data_catalog.catalog_scan_runs`).
 *
 * Es a la vez el job durable y su evidencia: se acepta en QUEUED, un worker la
 * reclama con lease y la cierra con contadores, huella del snapshot y
 * limitaciones del conector. No se reescribe una vez terminal.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_scan_runs' })
export class CatalogScanRuns {
  /** Identificador de la corrida. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Fuente escaneada; hoy sólo `primary` (la base de la propia API). */
  @Property({ fieldName: 'source_code', columnType: 'varchar' })
  sourceCode!: string;

  /** Alcance del escaneo; `FULL` es el único que puede inferir desapariciones. */
  @Property({ columnType: 'varchar' })
  mode!: string;

  /** QUEUED → RUNNING → SUCCEEDED | FAILED | CANCELLED. */
  @Property({ columnType: 'varchar' })
  status!: string;

  /** Clave de idempotencia enviada por el solicitante, única por usuario. */
  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  /** Quién pidió la corrida. */
  @Property({ fieldName: 'requested_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  requestedByUserId?: string;

  /** Momento de la aceptación durable. */
  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  /** Primer momento en que un worker la tomó. */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /** Cierre en un estado terminal. */
  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  /** Intención de cancelar; no es la cancelación, que la confirma el runner. */
  @Property({
    fieldName: 'cancel_requested_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  cancelRequestedAt?: Date;

  /** Token del worker que tiene la corrida; sirve de fencing al cerrarla. */
  @Property({ fieldName: 'lease_owner', columnType: 'varchar', nullable: true })
  leaseOwner?: string;

  /** Vencido el lease, otro worker puede recuperar la corrida. */
  @Property({
    fieldName: 'lease_expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  leaseExpiresAt?: Date;

  /** Intentos consumidos (cada reclamo suma uno). */
  @Property({ columnType: 'int' })
  attempt!: number;

  /** Versión del motor observado. */
  @Property({
    fieldName: 'engine_version',
    columnType: 'varchar',
    nullable: true,
  })
  engineVersion?: string;

  /** Versión del conector que produjo la evidencia. */
  @Property({ fieldName: 'connector_version', columnType: 'varchar' })
  connectorVersion!: string;

  /** Schemas excluidos por diseño (sistema, internos de extensiones). */
  @Property({
    fieldName: 'excluded_schemas',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  excludedSchemas?: unknown;

  /** Limitaciones del conector declaradas en la corrida. */
  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  limitations?: unknown;

  /** Contadores del resultado; null mientras la corrida no termina. */
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

  /** Huella SHA-256 de la estructura observada (sin estadísticas). */
  @Property({
    fieldName: 'snapshot_hash',
    columnType: 'varchar',
    nullable: true,
  })
  snapshotHash?: string;

  /** Código estable del fallo, si lo hubo. */
  @Property({ fieldName: 'error_code', columnType: 'varchar', nullable: true })
  errorCode?: string;

  /** Mensaje saneado del fallo. */
  @Property({ fieldName: 'error_message', columnType: 'text', nullable: true })
  errorMessage?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /** Concurrencia optimista. */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
