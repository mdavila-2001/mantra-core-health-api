import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Decisión sobre un plan concreto (su hash), con vencimiento. Append-only.
 */
@Entity({ schema: 'qa_execution', tableName: 'plan_approvals' })
export class PlanApprovals {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** FK → qa_execution.execution_plans */
  @Property({ fieldName: 'plan_id', type: 'uuid' }) // FK → qa_execution.execution_plans
  planId!: string;

  /** Hash aprobado; si el plan cambia, deja de valer. */
  @Property({ fieldName: 'plan_hash', columnType: 'varchar' })
  planHash!: string;

  /** APPROVED | REJECTED */
  @Property({ columnType: 'varchar' })
  decision!: string;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @Property({ columnType: 'text' })
  reason!: string;

  /** FK → iam.users */
  @Property({ fieldName: 'approver_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  approverUserId!: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @Property({ fieldName: 'expires_at', columnType: 'timestamptz' })
  expiresAt!: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
