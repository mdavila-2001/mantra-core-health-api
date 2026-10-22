import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas del schema `qa_execution` (módulo 68), sin CASCADE: la
 * evidencia de ejecución no desaparece al borrar lo que describe. Escrito a mano
 * (ADR-0025).
 */
export const qaExecutionForeignKeys: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['execution_targets', 'environment_id', 'qa_lab', 'test_environments', 'id'],
  ['execution_targets', 'created_by_user_id', 'iam', 'users', 'id'],
  ['execution_targets', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['execution_plans', 'run_id', 'qa_lab', 'test_runs', 'id'],
  ['execution_plans', 'suite_id', 'qa_lab', 'test_suites', 'id'],
  ['execution_plans', 'environment_id', 'qa_lab', 'test_environments', 'id'],
  ['execution_plans', 'target_id', 'qa_execution', 'execution_targets', 'id'],
  ['execution_plans', 'requested_by_user_id', 'iam', 'users', 'id'],
  ['execution_plans', 'created_by_user_id', 'iam', 'users', 'id'],
  ['execution_plans', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['plan_approvals', 'plan_id', 'qa_execution', 'execution_plans', 'id'],
  ['plan_approvals', 'approver_user_id', 'iam', 'users', 'id'],
  ['plan_events', 'plan_id', 'qa_execution', 'execution_plans', 'id'],
  ['plan_events', 'case_id', 'qa_lab', 'test_cases', 'id'],
];
