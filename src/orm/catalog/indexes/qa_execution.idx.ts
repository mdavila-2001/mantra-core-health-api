import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `qa_execution`.
 * 6 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const qaExecutionIndexes: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['execution_plans', 'ix_qa_execution_plans_status_created', ['status', 'created_at'], false, 'btree'],
  ['execution_plans', 'ix_qa_execution_plans_run_id', ['run_id'], false, 'btree'],
  ['execution_plans', 'ux_qa_execution_plans_idempotency', ['requested_by_user_id', 'idempotency_key'], true, 'btree', 'idempotency_key IS NOT NULL'],
  ['execution_targets', 'ux_qa_execution_targets_environment', ['environment_id'], true, 'btree'],
  ['plan_approvals', 'ix_qa_execution_plan_approvals_plan', ['plan_id', 'created_at'], false, 'btree'],
  ['plan_events', 'ux_qa_execution_plan_events_seq', ['plan_id', 'seq'], true, 'btree'],
];
