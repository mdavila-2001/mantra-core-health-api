import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `lakehouse`.
 * 42 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const lakehouseIndexes: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['cohort_definitions', 'uq_cohort_definition_version', ['research_project_id', 'code', 'version'], false, 'btree'],
  ['cohort_definitions', 'ix_cohort_definition_state', ['research_project_id', 'state'], false, 'btree'],
  ['dataset_release_manifests', 'uq_dataset_release_manifest_request', ['dataset_release_request_id'], false, 'btree'],
  ['dataset_release_manifests', 'uq_dataset_release_manifest_hash', ['content_hash'], false, 'btree'],
  ['dataset_release_manifests', 'ix_dataset_release_expiry', ['expires_at'], false, 'btree'],
  ['dataset_release_requests', 'ix_dataset_release_status', ['tenant_id', 'status', 'requested_at asc'], false, 'btree'],
  ['dataset_release_requests', 'ix_dataset_release_project', ['research_project_id', 'requested_at desc'], false, 'btree'],
  ['data_lake_zones', 'uq_data_lake_zone_code', ['code'], false, 'btree'],
  ['data_lake_zones', 'ix_data_lake_zone_type_state', ['zone_type', 'state'], false, 'btree'],
  ['data_products', 'uq_data_product_tenant_code', ['tenant_id', 'code'], false, 'btree'],
  ['data_products', 'ix_data_product_owner_state', ['owner_team_id', 'lifecycle_state'], false, 'btree'],
  ['data_product_versions', 'uq_data_product_version', ['data_product_id', 'version'], false, 'btree'],
  ['data_product_versions', 'ix_data_product_version_effective', ['data_product_id', 'effective_from desc'], false, 'btree'],
  ['data_product_versions', 'gin_data_product_quality_slo', ['quality_slo_json'], false, 'btree'],
  ['lakehouse_catalogs', 'uq_lakehouse_catalog_code', ['code'], false, 'btree'],
  ['lakehouse_catalogs', 'ix_lakehouse_catalog_state', ['state', 'catalog_type'], false, 'btree'],
  ['lakehouse_datasets', 'uq_lakehouse_dataset_table', ['lakehouse_catalog_id', 'database_name', 'table_name'], false, 'btree'],
  ['lakehouse_datasets', 'ix_lakehouse_dataset_product', ['data_product_version_id', 'lifecycle_state'], false, 'btree'],
  ['lakehouse_datasets', 'gin_lakehouse_partition_spec', ['partition_spec_json'], false, 'btree'],
  ['lakehouse_files', 'uq_lakehouse_file_object', ['lakehouse_partition_id', 'object_manifest_id'], false, 'btree'],
  ['lakehouse_files', 'uq_lakehouse_file_hash', ['lakehouse_partition_id', 'content_hash'], false, 'btree'],
  ['lakehouse_files', 'ix_lakehouse_file_created', ['lakehouse_partition_id', 'created_at desc'], false, 'btree'],
  ['lakehouse_lineage_edges', 'ix_lakehouse_lineage_source', ['source_dataset_id', 'source_partition_id', 'recorded_at desc'], false, 'btree'],
  ['lakehouse_lineage_edges', 'ix_lakehouse_lineage_target', ['target_dataset_id', 'target_partition_id', 'recorded_at desc'], false, 'btree'],
  ['lakehouse_partitions', 'uq_lakehouse_partition_hash', ['lakehouse_dataset_id', 'partition_spec_hash'], false, 'btree'],
  ['lakehouse_partitions', 'ix_lakehouse_partition_time', ['lakehouse_dataset_id', 'max_event_at desc'], false, 'btree'],
  ['lakehouse_partitions', 'gin_lakehouse_partition_values', ['partition_values_json'], false, 'btree'],
  ['lakehouse_quality_issues', 'ix_lakehouse_quality_issue_run', ['lakehouse_quality_run_id', 'status'], false, 'btree'],
  ['lakehouse_quality_issues', 'ix_lakehouse_quality_issue_rule', ['lakehouse_quality_rule_id', 'detected_at desc'], false, 'btree'],
  ['lakehouse_quality_rules', 'uq_lakehouse_quality_rule', ['data_product_version_id', 'rule_code'], false, 'btree'],
  ['lakehouse_quality_rules', 'ix_lakehouse_quality_rule_state', ['state', 'severity'], false, 'btree'],
  ['lakehouse_quality_runs', 'ix_lakehouse_quality_run_dataset', ['lakehouse_dataset_id', 'started_at desc'], false, 'btree'],
  ['lakehouse_quality_runs', 'ix_lakehouse_quality_run_status', ['tenant_id', 'status', 'started_at asc'], false, 'btree'],
  ['lakehouse_schema_versions', 'uq_lakehouse_schema_version', ['lakehouse_dataset_id', 'schema_version'], false, 'btree'],
  ['lakehouse_schema_versions', 'uq_lakehouse_schema_fingerprint', ['lakehouse_dataset_id', 'schema_fingerprint'], false, 'btree'],
  ['lakehouse_schema_versions', 'gin_lakehouse_schema_json', ['schema_json'], false, 'btree'],
  ['research_projects', 'uq_research_project_tenant_code', ['tenant_id', 'code'], false, 'btree'],
  ['research_projects', 'ix_research_project_state_period', ['state', 'approved_to'], false, 'btree'],
  ['transformation_definitions', 'uq_transformation_version', ['tenant_id', 'code', 'version'], false, 'btree'],
  ['transformation_definitions', 'ix_transformation_target_state', ['target_dataset_id', 'state'], false, 'btree'],
  ['transformation_runs', 'ix_transformation_run_status', ['tenant_id', 'status', 'started_at asc'], false, 'btree'],
  ['transformation_runs', 'ix_transformation_run_definition', ['transformation_definition_id', 'started_at desc'], false, 'btree'],
];
