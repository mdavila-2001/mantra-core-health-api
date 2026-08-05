import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `polyglot_storage`.
 * 34 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const polyglotStorageIndexes: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['collection_definitions', 'uk_collection_definitions_backend_name', ['storage_backend_id', 'logical_name'], true, 'btree'],
  ['collection_definitions', 'ix_collection_definitions_dataset', ['dataset_definition_id', 'lifecycle_state'], false, 'btree'],
  ['collection_schema_versions', 'uk_collection_schema_versions_collection_version', ['collection_definition_id', 'schema_version'], true, 'btree'],
  ['collection_schema_versions', 'gin_collection_schema_versions_schema', ['schema_document_json'], false, 'gin'],
  ['consistency_policies', 'uk_consistency_policies_code', ['code'], true, 'btree'],
  ['data_access_policies', 'uk_data_access_policies_dataset_purpose_principal', ['dataset_definition_id', 'purpose_of_use_code', 'principal_type'], true, 'btree'],
  ['data_access_policies', 'gin_data_access_policies_fields', ['field_policy_json'], false, 'gin'],
  ['data_classifications', 'uk_data_classifications_code', ['code'], true, 'btree'],
  ['data_classifications', 'ix_data_classifications_sensitivity', ['sensitivity_level', 'contains_phi'], false, 'btree'],
  ['dataset_definitions', 'uk_dataset_definitions_code', ['code'], true, 'btree'],
  ['dataset_definitions', 'ix_dataset_definitions_owner_state', ['owning_module_code', 'lifecycle_state'], false, 'btree'],
  ['dataset_placements', 'uk_dataset_placements_version_region_role', ['dataset_version_id', 'storage_backend_region_id', 'placement_role'], true, 'btree'],
  ['dataset_placements', 'ix_dataset_placements_state', ['state', 'activated_at desc'], false, 'btree'],
  ['dataset_versions', 'uk_dataset_versions_dataset_version', ['dataset_definition_id', 'version'], true, 'btree'],
  ['dataset_versions', 'ix_dataset_versions_effective', ['dataset_definition_id', 'effective_from desc'], false, 'btree'],
  ['encryption_profiles', 'uk_encryption_profiles_code', ['code'], true, 'btree'],
  ['encryption_profiles', 'ix_encryption_profiles_provider_state', ['key_management_provider', 'state'], false, 'btree'],
  ['key_rotation_policies', 'uk_key_rotation_policies_code', ['code'], true, 'btree'],
  ['replication_policies', 'uk_replication_policies_code', ['code'], true, 'btree'],
  ['residency_policies', 'uk_residency_policies_code', ['code'], true, 'btree'],
  ['residency_policies', 'gin_residency_policies_allowed_countries', ['allowed_country_codes'], false, 'gin'],
  ['retention_policies', 'uk_retention_policies_code', ['code'], true, 'btree'],
  ['retention_policies', 'ix_retention_policies_jurisdiction', ['jurisdiction_code', 'state'], false, 'btree'],
  ['storage_backend_regions', 'uk_storage_backend_regions_backend_region', ['storage_backend_id', 'region_code'], true, 'btree'],
  ['storage_backend_regions', 'ix_storage_backend_regions_country', ['country_code', 'state'], false, 'btree'],
  ['storage_backends', 'uk_storage_backends_code', ['code'], true, 'btree'],
  ['storage_backends', 'ix_storage_backends_type_state', ['backend_type', 'state'], false, 'btree'],
  ['storage_capabilities', 'uk_storage_capabilities_backend_code', ['storage_backend_id', 'capability_code', 'capability_version'], true, 'btree'],
  ['storage_cost_snapshots', 'uk_storage_cost_snapshots_scope_period', ['storage_backend_region_id', 'tenant_id', 'dataset_definition_id', 'period_start', 'period_end'], true, 'btree'],
  ['storage_cost_snapshots', 'ix_storage_cost_snapshots_tenant_period', ['tenant_id', 'period_end desc'], false, 'btree'],
  ['storage_integrity_policies', 'uk_storage_integrity_policies_dataset', ['dataset_definition_id'], true, 'btree'],
  ['store_health_checks', 'ix_store_health_checks_region_time', ['storage_backend_region_id', 'checked_at desc'], false, 'btree'],
  ['tenant_storage_bindings', 'uk_tenant_storage_bindings_tenant_dataset', ['tenant_id', 'dataset_definition_id'], true, 'btree'],
  ['tenant_storage_bindings', 'ix_tenant_storage_bindings_state', ['tenant_id', 'state'], false, 'btree'],
];
