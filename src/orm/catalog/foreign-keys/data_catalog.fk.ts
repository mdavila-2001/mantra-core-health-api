import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `data_catalog`.
 * 43 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const dataCatalogForeignKeys: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['catalog_annotation_revisions', 'annotation_id', 'data_catalog', 'catalog_annotations', 'id'],
  ['catalog_annotation_revisions', 'author_user_id', 'iam', 'users', 'id'],
  ['catalog_annotations', 'approved_by_user_id', 'iam', 'users', 'id'],
  ['catalog_annotations', 'column_id', 'data_catalog', 'catalog_columns', 'id'],
  ['catalog_annotations', 'created_by_user_id', 'iam', 'users', 'id'],
  ['catalog_annotations', 'object_id', 'data_catalog', 'catalog_objects', 'id'],
  ['catalog_annotations', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['catalog_change_events', 'column_id', 'data_catalog', 'catalog_columns', 'id'],
  ['catalog_change_events', 'object_id', 'data_catalog', 'catalog_objects', 'id'],
  ['catalog_change_events', 'scan_run_id', 'data_catalog', 'catalog_scan_runs', 'id'],
  ['catalog_columns', 'created_by_user_id', 'iam', 'users', 'id'],
  ['catalog_columns', 'first_seen_scan_id', 'data_catalog', 'catalog_scan_runs', 'id'],
  ['catalog_columns', 'last_seen_scan_id', 'data_catalog', 'catalog_scan_runs', 'id'],
  ['catalog_columns', 'object_id', 'data_catalog', 'catalog_objects', 'id'],
  ['catalog_columns', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['catalog_evidence_items', 'added_by_user_id', 'iam', 'users', 'id'],
  ['catalog_evidence_items', 'column_id', 'data_catalog', 'catalog_columns', 'id'],
  ['catalog_evidence_items', 'object_id', 'data_catalog', 'catalog_objects', 'id'],
  ['catalog_objects', 'created_by_user_id', 'iam', 'users', 'id'],
  ['catalog_objects', 'first_seen_scan_id', 'data_catalog', 'catalog_scan_runs', 'id'],
  ['catalog_objects', 'last_seen_scan_id', 'data_catalog', 'catalog_scan_runs', 'id'],
  ['catalog_objects', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['catalog_operation_impacts', 'column_id', 'data_catalog', 'catalog_columns', 'id'],
  ['catalog_operation_impacts', 'created_by_user_id', 'iam', 'users', 'id'],
  ['catalog_operation_impacts', 'object_id', 'data_catalog', 'catalog_objects', 'id'],
  ['catalog_operation_impacts', 'operation_id', 'data_catalog', 'catalog_operations', 'id'],
  ['catalog_operation_impacts', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['catalog_operations', 'created_by_user_id', 'iam', 'users', 'id'],
  ['catalog_operations', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['catalog_process_step_operations', 'created_by_user_id', 'iam', 'users', 'id'],
  ['catalog_process_step_operations', 'operation_id', 'data_catalog', 'catalog_operations', 'id'],
  ['catalog_process_step_operations', 'step_id', 'data_catalog', 'catalog_process_steps', 'id'],
  ['catalog_process_step_operations', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['catalog_process_steps', 'created_by_user_id', 'iam', 'users', 'id'],
  ['catalog_process_steps', 'process_id', 'data_catalog', 'catalog_processes', 'id'],
  ['catalog_process_steps', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['catalog_processes', 'created_by_user_id', 'iam', 'users', 'id'],
  ['catalog_processes', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['catalog_review_decisions', 'annotation_id', 'data_catalog', 'catalog_annotations', 'id'],
  ['catalog_review_decisions', 'reviewer_user_id', 'iam', 'users', 'id'],
  ['catalog_scan_runs', 'created_by_user_id', 'iam', 'users', 'id'],
  ['catalog_scan_runs', 'requested_by_user_id', 'iam', 'users', 'id'],
  ['catalog_scan_runs', 'updated_by_user_id', 'iam', 'users', 'id'],
];
