import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `polyglot_storage`.
 * 29 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const polyglotStorageForeignKeys: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['collection_definitions', 'dataset_definition_id', 'polyglot_storage', 'dataset_definitions', 'id'],
  ['collection_definitions', 'storage_backend_id', 'polyglot_storage', 'storage_backends', 'id'],
  ['collection_schema_versions', 'collection_definition_id', 'polyglot_storage', 'collection_definitions', 'id'],
  ['collection_schema_versions', 'dataset_version_id', 'polyglot_storage', 'dataset_versions', 'id'],
  ['data_access_policies', 'dataset_definition_id', 'polyglot_storage', 'dataset_definitions', 'id'],
  ['data_classifications', 'default_encryption_profile_id', 'polyglot_storage', 'encryption_profiles', 'id'],
  ['data_classifications', 'default_retention_policy_id', 'polyglot_storage', 'retention_policies', 'id'],
  ['dataset_definitions', 'data_classification_id', 'polyglot_storage', 'data_classifications', 'id'],
  ['dataset_placements', 'collection_definition_id', 'polyglot_storage', 'collection_definitions', 'id'],
  ['dataset_placements', 'consistency_policy_id', 'polyglot_storage', 'consistency_policies', 'id'],
  ['dataset_placements', 'dataset_version_id', 'polyglot_storage', 'dataset_versions', 'id'],
  ['dataset_placements', 'encryption_profile_id', 'polyglot_storage', 'encryption_profiles', 'id'],
  ['dataset_placements', 'replication_policy_id', 'polyglot_storage', 'replication_policies', 'id'],
  ['dataset_placements', 'residency_policy_id', 'polyglot_storage', 'residency_policies', 'id'],
  ['dataset_placements', 'storage_backend_region_id', 'polyglot_storage', 'storage_backend_regions', 'id'],
  ['dataset_versions', 'dataset_definition_id', 'polyglot_storage', 'dataset_definitions', 'id'],
  ['dataset_versions', 'schema_document_file_id', 'common', 'files', 'id'],
  ['encryption_profiles', 'rotation_policy_id', 'polyglot_storage', 'key_rotation_policies', 'id'],
  ['storage_backend_regions', 'storage_backend_id', 'polyglot_storage', 'storage_backends', 'id'],
  ['storage_capabilities', 'storage_backend_id', 'polyglot_storage', 'storage_backends', 'id'],
  ['storage_cost_snapshots', 'dataset_definition_id', 'polyglot_storage', 'dataset_definitions', 'id'],
  ['storage_cost_snapshots', 'storage_backend_region_id', 'polyglot_storage', 'storage_backend_regions', 'id'],
  ['storage_cost_snapshots', 'tenant_id', 'directory', 'tenants', 'id'],
  ['storage_integrity_policies', 'dataset_definition_id', 'polyglot_storage', 'dataset_definitions', 'id'],
  ['store_health_checks', 'storage_backend_region_id', 'polyglot_storage', 'storage_backend_regions', 'id'],
  ['tenant_storage_bindings', 'dataset_definition_id', 'polyglot_storage', 'dataset_definitions', 'id'],
  ['tenant_storage_bindings', 'primary_placement_id', 'polyglot_storage', 'dataset_placements', 'id'],
  ['tenant_storage_bindings', 'secondary_placement_id', 'polyglot_storage', 'dataset_placements', 'id'],
  ['tenant_storage_bindings', 'tenant_id', 'directory', 'tenants', 'id'],
];
