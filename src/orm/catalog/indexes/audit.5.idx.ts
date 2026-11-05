import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `audit` (parte 5/5).
 * 32 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const auditIndexes5: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['topics_history', 'ix_topics_history_change_reason_concept_id', ['change_reason_concept_id'], false, 'btree'],
  ['topics_history', 'brin_topics_history_recorded_at', ['recorded_at'], false, 'brin'],
  ['trackable_subjects_history', 'ix_trackable_subjects_history_trackable_subject_id', ['trackable_subject_id'], false, 'btree'],
  ['trackable_subjects_history', 'ix_trackable_subjects_history_operation_concept_id', ['operation_concept_id'], false, 'btree'],
  ['trackable_subjects_history', 'ix_trackable_subjects_history_changed_by_user_id', ['changed_by_user_id'], false, 'btree'],
  ['trackable_subjects_history', 'ix_trackable_subjects_history_change_reason_concept_id', ['change_reason_concept_id'], false, 'btree'],
  ['trackable_subjects_history', 'brin_trackable_subjects_history_recorded_at', ['recorded_at'], false, 'brin'],
  ['users_history', 'ix_users_history_user_id', ['user_id'], false, 'btree'],
  ['users_history', 'ix_users_history_operation_concept_id', ['operation_concept_id'], false, 'btree'],
  ['users_history', 'ix_users_history_changed_by_user_id', ['changed_by_user_id'], false, 'btree'],
  ['users_history', 'ix_users_history_change_reason_concept_id', ['change_reason_concept_id'], false, 'btree'],
  ['users_history', 'brin_users_history_recorded_at', ['recorded_at'], false, 'brin'],
  ['verified_badges_history', 'ix_verified_badges_history_verified_badges_id', ['verified_badges_id'], false, 'btree'],
  ['verified_badges_history', 'ix_verified_badges_history_operation_concept_id', ['operation_concept_id'], false, 'btree'],
  ['verified_badges_history', 'ix_verified_badges_history_changed_by_user_id', ['changed_by_user_id'], false, 'btree'],
  ['verified_badges_history', 'ix_verified_badges_history_change_reason_concept_id', ['change_reason_concept_id'], false, 'btree'],
  ['verified_badges_history', 'brin_verified_badges_history_recorded_at', ['recorded_at'], false, 'brin'],
  ['visit_requests_history', 'ix_visit_requests_history_visit_request_id', ['visit_request_id'], false, 'btree'],
  ['visit_requests_history', 'ix_visit_requests_history_operation_concept_id', ['operation_concept_id'], false, 'btree'],
  ['visit_requests_history', 'ix_visit_requests_history_changed_by_user_id', ['changed_by_user_id'], false, 'btree'],
  ['visit_requests_history', 'ix_visit_requests_history_change_reason_concept_id', ['change_reason_concept_id'], false, 'btree'],
  ['visit_requests_history', 'brin_visit_requests_history_recorded_at', ['recorded_at'], false, 'brin'],
  ['wallets_history', 'ix_wallets_history_wallets_id', ['wallets_id'], false, 'btree'],
  ['wallets_history', 'ix_wallets_history_operation_concept_id', ['operation_concept_id'], false, 'btree'],
  ['wallets_history', 'ix_wallets_history_changed_by_user_id', ['changed_by_user_id'], false, 'btree'],
  ['wallets_history', 'ix_wallets_history_change_reason_concept_id', ['change_reason_concept_id'], false, 'btree'],
  ['wallets_history', 'brin_wallets_history_recorded_at', ['recorded_at'], false, 'brin'],
  ['workflows_history', 'ix_workflows_history_workflows_id', ['workflows_id'], false, 'btree'],
  ['workflows_history', 'ix_workflows_history_operation_concept_id', ['operation_concept_id'], false, 'btree'],
  ['workflows_history', 'ix_workflows_history_changed_by_user_id', ['changed_by_user_id'], false, 'btree'],
  ['workflows_history', 'ix_workflows_history_change_reason_concept_id', ['change_reason_concept_id'], false, 'btree'],
  ['workflows_history', 'brin_workflows_history_recorded_at', ['recorded_at'], false, 'brin'],
];
