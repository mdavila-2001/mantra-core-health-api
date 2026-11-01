import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `quality_issues`.
 */
@Entity({ schema: 'data_catalog', tableName: 'quality_issues' })
export class QualityIssues {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a rule.
   */
  @Property({ fieldName: 'rule_id', type: 'uuid' }) // FK (destino no resuelto)
  ruleId!: string;

  /**
   * Identificador asociado a object.
   */
  @Property({ fieldName: 'object_id', type: 'uuid' }) // FK (destino no resuelto)
  objectId!: string;

  /**
   * Identificador asociado a column.
   */
  @Property({ fieldName: 'column_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  columnId?: string;

  /**
   * Valor de fingerprint mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  fingerprint!: string;

  /**
   * Valor de severity mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  severity!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Identificador asociado a first seen run.
   */
  @Property({ fieldName: 'first_seen_run_id', type: 'uuid' }) // FK (destino no resuelto)
  firstSeenRunId!: string;

  /**
   * Identificador asociado a last seen run.
   */
  @Property({ fieldName: 'last_seen_run_id', type: 'uuid' }) // FK (destino no resuelto)
  lastSeenRunId!: string;

  /**
   * Valor de occurrences mantenido por la instancia.
   */
  @Property({ columnType: 'int', default: 1 })
  occurrences!: number;

  /**
   * Valor de failed rows last mantenido por la instancia.
   */
  @Property({ fieldName: 'failed_rows_last', type: 'bigint', nullable: true })
  failedRowsLast?: string;

  /**
   * Valor de failed pct last mantenido por la instancia.
   */
  @Property({
    fieldName: 'failed_pct_last',
    columnType: 'numeric(7,4)',
    nullable: true,
  })
  failedPctLast?: string;

  /**
   * Identificador asociado a acknowledged by user.
   */
  @Property({
    fieldName: 'acknowledged_by_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users (inferida)
  acknowledgedByUserId?: string;

  /**
   * Valor de acknowledged at mantenido por la instancia.
   */
  @Property({
    fieldName: 'acknowledged_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  acknowledgedAt?: Date;

  /**
   * Identificador asociado a resolved by user.
   */
  @Property({ fieldName: 'resolved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  resolvedByUserId?: string;

  /**
   * Valor de resolved at mantenido por la instancia.
   */
  @Property({
    fieldName: 'resolved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  resolvedAt?: Date;

  /**
   * Valor de resolution kind mantenido por la instancia.
   */
  @Property({
    fieldName: 'resolution_kind',
    columnType: 'varchar',
    nullable: true,
  })
  resolutionKind?: string;

  /**
   * Valor de ignored until mantenido por la instancia.
   */
  @Property({
    fieldName: 'ignored_until',
    columnType: 'timestamptz',
    nullable: true,
  })
  ignoredUntil?: Date;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  reason?: string;

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
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
