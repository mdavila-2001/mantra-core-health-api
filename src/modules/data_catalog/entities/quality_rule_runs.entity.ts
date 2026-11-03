import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `quality_rule_runs`.
 */
@Entity({ schema: 'data_catalog', tableName: 'quality_rule_runs' })
export class QualityRuleRuns {
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
   * Valor de trigger mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  trigger!: string;

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
   * Valor de evaluated rows mantenido por la instancia.
   */
  @Property({ fieldName: 'evaluated_rows', type: 'bigint', nullable: true })
  evaluatedRows?: string;

  /**
   * Valor de failed rows mantenido por la instancia.
   */
  @Property({ fieldName: 'failed_rows', type: 'bigint', nullable: true })
  failedRows?: string;

  /**
   * Valor de failed pct mantenido por la instancia.
   */
  @Property({
    fieldName: 'failed_pct',
    columnType: 'numeric(7,4)',
    nullable: true,
  })
  failedPct?: string;

  /**
   * Valor de passed mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  passed?: boolean;

  /**
   * Valor de sample ids json mantenido por la instancia.
   */
  @Property({
    fieldName: 'sample_ids_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  sampleIdsJson?: unknown;

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
}
