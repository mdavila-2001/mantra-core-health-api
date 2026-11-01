import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `data_catalog`.
 * 24 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const dataCatalogIndexes: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['catalog_annotation_revisions', 'ux_data_catalog_annotation_revisions_no', ['annotation_id', 'revision_no'], true, 'btree'],
  ['catalog_annotations', 'ux_data_catalog_annotations_object', ['object_id'], true, 'btree', 'target_kind = \'OBJECT\''],
  ['catalog_annotations', 'ux_data_catalog_annotations_column', ['column_id'], true, 'btree', 'column_id IS NOT NULL'],
  ['catalog_annotations', 'ix_data_catalog_annotations_review_status', ['review_status'], false, 'btree'],
  ['catalog_change_events', 'ix_data_catalog_change_events_scan_run_id', ['scan_run_id'], false, 'btree'],
  ['catalog_change_events', 'ix_data_catalog_change_events_object_created', ['object_id', 'created_at'], false, 'btree'],
  ['catalog_columns', 'ux_data_catalog_columns_identity', ['object_id', 'column_name'], true, 'btree'],
  ['catalog_evidence_items', 'ix_data_catalog_evidence_items_object_id', ['object_id'], false, 'btree'],
  ['catalog_evidence_items', 'ix_data_catalog_evidence_items_column_id', ['column_id'], false, 'btree'],
  ['catalog_objects', 'ux_data_catalog_objects_identity', ['source_code', 'schema_name', 'object_name'], true, 'btree'],
  ['catalog_objects', 'ix_data_catalog_objects_observation_status', ['observation_status'], false, 'btree'],
  ['catalog_operation_impacts', 'ix_data_catalog_operation_impacts_operation_id', ['operation_id'], false, 'btree'],
  ['catalog_operation_impacts', 'ix_data_catalog_operation_impacts_object_id', ['object_id'], false, 'btree'],
  ['catalog_operation_impacts', 'ix_data_catalog_operation_impacts_column_id', ['column_id'], false, 'btree'],
  ['catalog_operations', 'ux_data_catalog_operations_key', ['operation_key'], true, 'btree'],
  ['catalog_process_step_operations', 'ux_data_catalog_process_step_operations_pair', ['step_id', 'operation_id'], true, 'btree'],
  ['catalog_process_step_operations', 'ix_data_catalog_process_step_operations_step_id', ['step_id'], false, 'btree'],
  ['catalog_process_step_operations', 'ix_data_catalog_process_step_operations_operation_id', ['operation_id'], false, 'btree'],
  ['catalog_process_steps', 'ux_data_catalog_process_steps_ordinal', ['process_id', 'ordinal'], true, 'btree'],
  ['catalog_processes', 'ux_data_catalog_processes_code', ['process_code'], true, 'btree'],
  ['catalog_review_decisions', 'ix_data_catalog_review_decisions_annotation', ['annotation_id', 'revision_no'], false, 'btree'],
  ['catalog_scan_runs', 'ix_data_catalog_scan_runs_status_requested_at', ['status', 'requested_at'], false, 'btree'],
  ['catalog_scan_runs', 'ux_data_catalog_scan_runs_one_active', ['source_code'], true, 'btree', 'status IN (\'QUEUED\', \'RUNNING\')'],
  ['catalog_scan_runs', 'ux_data_catalog_scan_runs_idempotency', ['requested_by_user_id', 'idempotency_key'], true, 'btree', 'idempotency_key IS NOT NULL'],
];
