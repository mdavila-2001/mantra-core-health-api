import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `auth_providers`.
 * 42 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const authProvidersForeignKeys: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['account_link_requests', 'created_by_user_id', 'iam', 'users', 'id'],
  ['account_link_requests', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['account_link_requests', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['account_link_requests', 'user_id', 'iam', 'users', 'id'],
  ['federated_identities', 'created_by_user_id', 'iam', 'users', 'id'],
  ['federated_identities', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['federated_identities', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['federated_identities', 'user_id', 'iam', 'users', 'id'],
  ['federated_login_attempts', 'failure_reason_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['federated_login_attempts', 'outcome_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['federated_login_attempts', 'recorded_by_user_id', 'iam', 'users', 'id'],
  ['federated_login_attempts', 'tenant_id', 'directory', 'tenants', 'id'],
  ['federated_login_attempts', 'user_id', 'iam', 'users', 'id'],
  ['identity_providers', 'created_by_user_id', 'iam', 'users', 'id'],
  ['identity_providers', 'logo_file_id', 'common', 'files', 'id'],
  ['identity_providers', 'protocol_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['identity_providers', 'provider_category_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['identity_providers', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['identity_providers', 'tenant_id', 'directory', 'tenants', 'id'],
  ['identity_providers', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['provider_attribute_mappings', 'created_by_user_id', 'iam', 'users', 'id'],
  ['provider_attribute_mappings', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['provider_protocol_configs', 'created_by_user_id', 'iam', 'users', 'id'],
  ['provider_protocol_configs', 'environment_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['provider_protocol_configs', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['provider_protocol_configs', 'token_endpoint_auth_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['provider_protocol_configs', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['provider_signing_keys', 'created_by_user_id', 'iam', 'users', 'id'],
  ['provider_signing_keys', 'key_use_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['provider_signing_keys', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['provider_signing_keys', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['provider_tenant_bindings', 'created_by_user_id', 'iam', 'users', 'id'],
  ['provider_tenant_bindings', 'default_role_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['provider_tenant_bindings', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['provider_tenant_bindings', 'tenant_id', 'directory', 'tenants', 'id'],
  ['provider_tenant_bindings', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['provisioning_rules', 'assign_role_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['provisioning_rules', 'assign_tenant_id', 'directory', 'tenants', 'id'],
  ['provisioning_rules', 'created_by_user_id', 'iam', 'users', 'id'],
  ['provisioning_rules', 'effect_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['provisioning_rules', 'tenant_id', 'directory', 'tenants', 'id'],
  ['provisioning_rules', 'updated_by_user_id', 'iam', 'users', 'id'],
];
