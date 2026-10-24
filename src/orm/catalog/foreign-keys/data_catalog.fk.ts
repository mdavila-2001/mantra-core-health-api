import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas del schema `data_catalog` (módulo 67). Escrito a mano por el
 * mismo desvío declarado en `indexes/data_catalog.idx.ts`.
 *
 * Ninguna tiene ON DELETE CASCADE: revisiones, decisiones, eventos y evidencia
 * son historial, y no deben desaparecer porque alguien borre la fila que
 * describen. Los objetos del catálogo tampoco se borran nunca (se retiran).
 */
export const dataCatalogForeignKeys: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['catalog_scan_runs', 'requested_by_user_id', 'iam', 'users', 'id'],
  ['catalog_scan_runs', 'created_by_user_id', 'iam', 'users', 'id'],
  ['catalog_scan_runs', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['catalog_objects', 'first_seen_scan_id', 'data_catalog', 'catalog_scan_runs', 'id'],
  ['catalog_objects', 'last_seen_scan_id', 'data_catalog', 'catalog_scan_runs', 'id'],
  ['catalog_objects', 'created_by_user_id', 'iam', 'users', 'id'],
  ['catalog_objects', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['catalog_columns', 'object_id', 'data_catalog', 'catalog_objects', 'id'],
  ['catalog_columns', 'first_seen_scan_id', 'data_catalog', 'catalog_scan_runs', 'id'],
  ['catalog_columns', 'last_seen_scan_id', 'data_catalog', 'catalog_scan_runs', 'id'],
  ['catalog_columns', 'created_by_user_id', 'iam', 'users', 'id'],
  ['catalog_columns', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['catalog_change_events', 'scan_run_id', 'data_catalog', 'catalog_scan_runs', 'id'],
  ['catalog_change_events', 'object_id', 'data_catalog', 'catalog_objects', 'id'],
  ['catalog_change_events', 'column_id', 'data_catalog', 'catalog_columns', 'id'],
  ['catalog_annotations', 'object_id', 'data_catalog', 'catalog_objects', 'id'],
  ['catalog_annotations', 'column_id', 'data_catalog', 'catalog_columns', 'id'],
  ['catalog_annotations', 'approved_by_user_id', 'iam', 'users', 'id'],
  ['catalog_annotations', 'created_by_user_id', 'iam', 'users', 'id'],
  ['catalog_annotations', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['catalog_annotation_revisions', 'annotation_id', 'data_catalog', 'catalog_annotations', 'id'],
  ['catalog_annotation_revisions', 'author_user_id', 'iam', 'users', 'id'],
  ['catalog_review_decisions', 'annotation_id', 'data_catalog', 'catalog_annotations', 'id'],
  ['catalog_review_decisions', 'reviewer_user_id', 'iam', 'users', 'id'],
  ['catalog_evidence_items', 'object_id', 'data_catalog', 'catalog_objects', 'id'],
  ['catalog_evidence_items', 'column_id', 'data_catalog', 'catalog_columns', 'id'],
  ['catalog_evidence_items', 'added_by_user_id', 'iam', 'users', 'id'],
];
