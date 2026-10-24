import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Plan de ejecución de una suite contra un destino: job durable y evidencia de qué se aprobó y qué se ejecutó.
 */
@Entity({ schema: 'qa_execution', tableName: 'execution_plans' })
export class ExecutionPlans {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** FK → qa_lab.test_runs creada para este plan. */
  @Property({ fieldName: 'run_id', type: 'uuid' })
  runId!: string;

  /** FK → qa_lab.test_suites */
  @Property({ fieldName: 'suite_id', type: 'uuid' })
  suiteId!: string;

  /** Versión publicada de la suite al planificar. */
  @Property({ fieldName: 'suite_version', columnType: 'int' })
  suiteVersion!: number;

  /** FK → qa_lab.test_environments */
  @Property({ fieldName: 'environment_id', type: 'uuid' })
  environmentId!: string;

  /** FK → qa_execution.execution_targets */
  @Property({ fieldName: 'target_id', type: 'uuid' })
  targetId!: string;

  /** Identidad de lo aprobado. */
  @Property({ fieldName: 'plan_hash', columnType: 'varchar' })
  planHash!: string;

  /** Pasos (caso, método, URL, hash del cuerpo). */
  @Property({ fieldName: 'plan_json', type: 'json', columnType: 'jsonb' })
  planJson!: unknown;

  /** Límites efectivos tras recorte. */
  @Property({ fieldName: 'limits_json', type: 'json', columnType: 'jsonb' })
  limitsJson!: unknown;

  @Property({ fieldName: 'requires_approval', type: 'boolean' })
  requiresApproval!: boolean;

  @Property({
    fieldName: 'approval_reasons',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  approvalReasons?: unknown;

  /** PENDING_APPROVAL | QUEUED | RUNNING | PASSED | FAILED | TIMED_OUT | CANCELLED | INFRA_ERROR | REJECTED */
  @Property({ fieldName: 'status', columnType: 'varchar' })
  status!: string;

  /** FK → iam.users */
  @Property({ fieldName: 'requested_by_user_id', type: 'uuid', nullable: true })
  requestedByUserId?: string;

  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  /** Fencing del worker. */
  @Property({ fieldName: 'lease_owner', columnType: 'varchar', nullable: true })
  leaseOwner?: string;

  @Property({
    fieldName: 'lease_expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  leaseExpiresAt?: Date;

  @Property({ fieldName: 'attempt', columnType: 'int' })
  attempt!: number;

  /** Intención; la confirma el runner. */
  @Property({
    fieldName: 'cancel_requested_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  cancelRequestedAt?: Date;

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

  @Property({ fieldName: 'requests_sent', columnType: 'int' })
  requestsSent!: number;

  @Property({ fieldName: 'cases_passed', columnType: 'int' })
  casesPassed!: number;

  @Property({ fieldName: 'cases_failed', columnType: 'int' })
  casesFailed!: number;

  /** Omitidos o bloqueados: no cuentan como pasados. */
  @Property({ fieldName: 'cases_not_run', columnType: 'int' })
  casesNotRun!: number;

  @Property({ fieldName: 'error_code', columnType: 'varchar', nullable: true })
  errorCode?: string;

  @Property({ fieldName: 'error_message', columnType: 'text', nullable: true })
  errorMessage?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /** FK → iam.users */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  /** FK → iam.users */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
