import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Plan de ejecución de una suite contra un destino: job durable y evidencia de qué se aprobó y qué se ejecutó.
 */
@Entity({ schema: 'qa_execution', tableName: 'execution_plans' })
export class ExecutionPlans {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** FK → qa_lab.test_runs creada para este plan. */
  @Property({ fieldName: 'run_id', type: 'uuid' }) // FK → qa_lab.test_runs
  runId!: string;

  /** FK → qa_lab.test_suites */
  @Property({ fieldName: 'suite_id', type: 'uuid' }) // FK → qa_lab.test_suites
  suiteId!: string;

  /** Versión publicada de la suite al planificar. */
  @Property({ fieldName: 'suite_version', columnType: 'int' })
  suiteVersion!: number;

  /** FK → qa_lab.test_environments */
  @Property({ fieldName: 'environment_id', type: 'uuid' }) // FK → qa_lab.test_environments
  environmentId!: string;

  /** FK → qa_execution.execution_targets */
  @Property({ fieldName: 'target_id', type: 'uuid' }) // FK → qa_execution.execution_targets
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

  /**
   * Valor de requires approval mantenido por la instancia.
   */
  @Property({ fieldName: 'requires_approval', type: 'boolean' })
  requiresApproval!: boolean;

  /**
   * Valor de approval reasons mantenido por la instancia.
   */
  @Property({
    fieldName: 'approval_reasons',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  approvalReasons?: unknown;

  /** PENDING_APPROVAL | QUEUED | RUNNING | PASSED | FAILED | TIMED_OUT | CANCELLED | INFRA_ERROR | REJECTED */
  @Property({ columnType: 'varchar' })
  status!: string;

  /** FK → iam.users */
  @Property({ fieldName: 'requested_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  requestedByUserId?: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  /** Fencing del worker. */
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

  /** Intención; la confirma el runner. */
  @Property({
    fieldName: 'cancel_requested_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  cancelRequestedAt?: Date;

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
   * Valor de requests sent mantenido por la instancia.
   */
  @Property({ fieldName: 'requests_sent', columnType: 'int' })
  requestsSent!: number;

  /**
   * Valor de cases passed mantenido por la instancia.
   */
  @Property({ fieldName: 'cases_passed', columnType: 'int' })
  casesPassed!: number;

  /**
   * Valor de cases failed mantenido por la instancia.
   */
  @Property({ fieldName: 'cases_failed', columnType: 'int' })
  casesFailed!: number;

  /** Omitidos o bloqueados: no cuentan como pasados. */
  @Property({ fieldName: 'cases_not_run', columnType: 'int' })
  casesNotRun!: number;

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

  /** FK → iam.users */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /** FK → iam.users */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
