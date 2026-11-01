import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `bulk_import_batches`.
 */
@Entity({ schema: 'system_ops', tableName: 'bulk_import_batches' })
export class BulkImportBatches {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Valor de kind mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  kind!: string;

  /**
   * Valor de kind version mantenido por la instancia.
   */
  @Property({ fieldName: 'kind_version', columnType: 'varchar' })
  kindVersion!: string;

  /**
   * Valor de kind group mantenido por la instancia.
   */
  @Property({ fieldName: 'kind_group', columnType: 'varchar' })
  kindGroup!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de source format mantenido por la instancia.
   */
  @Property({ fieldName: 'source_format', columnType: 'varchar' })
  sourceFormat!: string;

  /**
   * Valor de source byte size mantenido por la instancia.
   */
  @Property({ fieldName: 'source_byte_size', columnType: 'int' })
  sourceByteSize!: number;

  /**
   * Valor de file sha256 mantenido por la instancia.
   */
  @Property({
    fieldName: 'file_sha256',
    columnType: 'varchar(64)',
    nullable: true,
  })
  fileSha256?: string;

  /**
   * Valor de declared reason mantenido por la instancia.
   */
  @Property({
    fieldName: 'declared_reason',
    columnType: 'text',
    nullable: true,
  })
  declaredReason?: string;

  /**
   * Valor de declared source organization mantenido por la instancia.
   */
  @Property({
    fieldName: 'declared_source_organization',
    columnType: 'varchar',
    nullable: true,
  })
  declaredSourceOrganization?: string;

  /**
   * Valor de declared legal basis mantenido por la instancia.
   */
  @Property({
    fieldName: 'declared_legal_basis',
    columnType: 'varchar',
    nullable: true,
  })
  declaredLegalBasis?: string;

  /**
   * Valor de declared loaded on mantenido por la instancia.
   */
  @Property({
    fieldName: 'declared_loaded_on',
    columnType: 'date',
    nullable: true,
  })
  declaredLoadedOn?: Date;

  /**
   * Valor de rows total mantenido por la instancia.
   */
  @Property({ fieldName: 'rows_total', columnType: 'int' })
  rowsTotal!: number;

  /**
   * Valor de rows valid mantenido por la instancia.
   */
  @Property({ fieldName: 'rows_valid', columnType: 'int' })
  rowsValid!: number;

  /**
   * Valor de rows rejected mantenido por la instancia.
   */
  @Property({ fieldName: 'rows_rejected', columnType: 'int' })
  rowsRejected!: number;

  /**
   * Valor de issues total mantenido por la instancia.
   */
  @Property({ fieldName: 'issues_total', columnType: 'int', default: 0 })
  issuesTotal!: number;

  /**
   * Valor de processed rows mantenido por la instancia.
   */
  @Property({ fieldName: 'processed_rows', columnType: 'int', default: 0 })
  processedRows!: number;

  /**
   * Valor de file issues json mantenido por la instancia.
   */
  @Property({
    fieldName: 'file_issues_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  fileIssuesJson?: unknown;

  /**
   * Valor de preview issues json mantenido por la instancia.
   */
  @Property({
    fieldName: 'preview_issues_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  previewIssuesJson?: unknown;

  /**
   * Valor de confirm key mantenido por la instancia.
   */
  @Property({
    fieldName: 'confirm_key',
    columnType: 'varchar(128)',
    nullable: true,
  })
  confirmKey?: string;

  /**
   * Valor de confirmed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'confirmed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  confirmedAt?: Date;

  /**
   * Identificador asociado a confirmed by user.
   */
  @Property({ fieldName: 'confirmed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  confirmedByUserId?: string;

  /**
   * Identificador asociado a approval request.
   */
  @Property({ fieldName: 'approval_request_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  approvalRequestId?: string;

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
   * Valor de failure reason mantenido por la instancia.
   */
  @Property({
    fieldName: 'failure_reason',
    columnType: 'varchar',
    nullable: true,
  })
  failureReason?: string;

  /**
   * Valor de report json mantenido por la instancia.
   */
  @Property({
    fieldName: 'report_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  reportJson?: unknown;

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
