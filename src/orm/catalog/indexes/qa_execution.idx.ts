import type { IndexTuple } from '../catalog.types';

/**
 * Índices del schema `qa_execution` (módulo 68). Escrito a mano por el desvío
 * declarado en ADR-0025; espejo de `database/SQL/patches/2026-09-18_v4220_qa_execution.sql`.
 */
export const qaExecutionIndexes: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método, predicado]
  ['execution_targets', 'ux_qa_execution_targets_environment', ['environment_id'], true, 'btree'],
  ['execution_plans', 'ix_qa_execution_plans_status_created', ['status', 'created_at'], false, 'btree'],
  ['execution_plans', 'ix_qa_execution_plans_run_id', ['run_id'], false, 'btree'],
  ['execution_plans', 'ux_qa_execution_plans_idempotency', ['requested_by_user_id', 'idempotency_key'], true, 'btree', 'idempotency_key IS NOT NULL'],
  ['plan_approvals', 'ix_qa_execution_plan_approvals_plan', ['plan_id', 'created_at'], false, 'btree'],
  ['plan_events', 'ux_qa_execution_plan_events_seq', ['plan_id', 'seq'], true, 'btree'],
];
