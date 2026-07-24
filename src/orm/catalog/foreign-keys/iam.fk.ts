import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `iam`.
 * 41 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const iamForeignKeys: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['authentication_credentials', 'created_by_user_id', 'iam', 'users', 'id'],
  ['authentication_credentials', 'hash_algorithm_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['authentication_credentials', 'method_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['authentication_credentials', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['authentication_credentials', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['authentication_credentials', 'user_id', 'iam', 'users', 'id'],
  ['devices', 'created_by_user_id', 'iam', 'users', 'id'],
  ['devices', 'platform_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['devices', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['devices', 'user_id', 'iam', 'users', 'id'],
  ['mfa_factors', 'created_by_user_id', 'iam', 'users', 'id'],
  ['mfa_factors', 'factor_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['mfa_factors', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['mfa_factors', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['mfa_factors', 'user_id', 'iam', 'users', 'id'],
  ['refresh_tokens', 'created_by_user_id', 'iam', 'users', 'id'],
  ['refresh_tokens', 'session_id', 'iam', 'sessions', 'id'],
  ['refresh_tokens', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['refresh_tokens', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['security_events', 'event_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['security_events', 'outcome_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['security_events', 'recorded_by_user_id', 'iam', 'users', 'id'],
  ['security_events', 'user_id', 'iam', 'users', 'id'],
  ['sessions', 'created_by_user_id', 'iam', 'users', 'id'],
  ['sessions', 'device_id', 'iam', 'devices', 'id'],
  ['sessions', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['sessions', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['sessions', 'user_id', 'iam', 'users', 'id'],
  ['user_global_roles', 'created_by_user_id', 'iam', 'users', 'id'],
  ['user_global_roles', 'role_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['user_global_roles', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['user_global_roles', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['user_global_roles', 'user_id', 'iam', 'users', 'id'],
  ['users', 'created_by_user_id', 'iam', 'users', 'id'],
  ['users', 'data_residency_region_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['users', 'legal_basis_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['users', 'mfa_status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['users', 'preferred_language_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['users', 'residence_country_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['users', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['users', 'updated_by_user_id', 'iam', 'users', 'id'],
];
