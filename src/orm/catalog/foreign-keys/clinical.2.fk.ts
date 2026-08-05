import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `clinical` (parte 2/2).
 * 23 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const clinicalForeignKeys2: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['procedures', 'status_reason_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['procedures', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['service_requests', 'category_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['service_requests', 'code_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['service_requests', 'created_by_user_id', 'iam', 'users', 'id'],
  ['service_requests', 'custodian_tenant_id', 'directory', 'tenants', 'id'],
  ['service_requests', 'encounter_id', 'clinical', 'encounters', 'id'],
  ['service_requests', 'intent_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['service_requests', 'patient_profile_id', 'profiles', 'patient_profiles', 'profile_id'],
  ['service_requests', 'performer_tenant_id', 'directory', 'tenants', 'id'],
  ['service_requests', 'priority_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['service_requests', 'requester_profile_id', 'profiles', 'health_practitioner_profiles', 'profile_id'],
  ['service_requests', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['service_requests', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['social_history', 'category_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['social_history', 'created_by_user_id', 'iam', 'users', 'id'],
  ['social_history', 'custodian_tenant_id', 'directory', 'tenants', 'id'],
  ['social_history', 'patient_profile_id', 'profiles', 'patient_profiles', 'profile_id'],
  ['social_history', 'recorded_by_user_id', 'iam', 'users', 'id'],
  ['social_history', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['social_history', 'unit_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['social_history', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['social_history', 'value_concept_id', 'terminology', 'catalog_concepts', 'id'],
];
