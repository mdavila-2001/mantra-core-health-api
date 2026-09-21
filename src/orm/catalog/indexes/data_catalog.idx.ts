import type { IndexTuple } from '../catalog.types';

/**
 * Índices del schema `data_catalog` (módulo 67, catálogo de datos del portal
 * administrativo).
 *
 * DESVÍO DECLARADO: este archivo está escrito a mano, no generado desde la
 * bóveda, porque el módulo 67 todavía no tiene su `.puml`. Su espejo SQL es
 * `database/SQL/patches/2026-09-18_v4219_data_catalog.sql`; cuando el modelo
 * lo declare, `yarn orm:catalog` debe reproducir exactamente estas tuplas.
 *
 * Los índices únicos parciales son reglas, no afinado: `ux_..._one_active`
 * impide dos escaneos vivos de la misma fuente aunque dos réplicas acepten la
 * petición a la vez.
 */
export const dataCatalogIndexes: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método, predicado]
  ['catalog_scan_runs', 'ix_data_catalog_scan_runs_status_requested_at', ['status', 'requested_at'], false, 'btree'],
  ['catalog_scan_runs', 'ux_data_catalog_scan_runs_one_active', ['source_code'], true, 'btree', "status IN ('QUEUED', 'RUNNING')"],
  ['catalog_scan_runs', 'ux_data_catalog_scan_runs_idempotency', ['requested_by_user_id', 'idempotency_key'], true, 'btree', 'idempotency_key IS NOT NULL'],
  ['catalog_objects', 'ux_data_catalog_objects_identity', ['source_code', 'schema_name', 'object_name'], true, 'btree'],
  ['catalog_objects', 'ix_data_catalog_objects_observation_status', ['observation_status'], false, 'btree'],
  ['catalog_columns', 'ux_data_catalog_columns_identity', ['object_id', 'column_name'], true, 'btree'],
  ['catalog_change_events', 'ix_data_catalog_change_events_scan_run_id', ['scan_run_id'], false, 'btree'],
  ['catalog_change_events', 'ix_data_catalog_change_events_object_created', ['object_id', 'created_at'], false, 'btree'],
  ['catalog_annotations', 'ux_data_catalog_annotations_object', ['object_id'], true, 'btree', "target_kind = 'OBJECT'"],
  ['catalog_annotations', 'ux_data_catalog_annotations_column', ['column_id'], true, 'btree', 'column_id IS NOT NULL'],
  ['catalog_annotations', 'ix_data_catalog_annotations_review_status', ['review_status'], false, 'btree'],
  ['catalog_annotation_revisions', 'ux_data_catalog_annotation_revisions_no', ['annotation_id', 'revision_no'], true, 'btree'],
  ['catalog_review_decisions', 'ix_data_catalog_review_decisions_annotation', ['annotation_id', 'revision_no'], false, 'btree'],
  ['catalog_evidence_items', 'ix_data_catalog_evidence_items_object_id', ['object_id'], false, 'btree'],
  ['catalog_evidence_items', 'ix_data_catalog_evidence_items_column_id', ['column_id'], false, 'btree'],
];
