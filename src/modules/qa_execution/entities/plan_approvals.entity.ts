import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Decisión sobre un plan concreto (su hash), con vencimiento. Append-only.
 */
@Entity({ schema: 'qa_execution', tableName: 'plan_approvals' })
export class PlanApprovals {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** FK → qa_execution.execution_plans */
  @Property({ fieldName: 'plan_id', type: 'uuid' })
  planId!: string;

  /** Hash aprobado; si el plan cambia, deja de valer. */
  @Property({ fieldName: 'plan_hash', columnType: 'varchar' })
  planHash!: string;

  /** APPROVED | REJECTED */
  @Property({ fieldName: 'decision', columnType: 'varchar' })
  decision!: string;

  @Property({ fieldName: 'reason', columnType: 'text' })
  reason!: string;

  /** FK → iam.users */
  @Property({ fieldName: 'approver_user_id', type: 'uuid' })
  approverUserId!: string;

  @Property({ fieldName: 'expires_at', columnType: 'timestamptz' })
  expiresAt!: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
