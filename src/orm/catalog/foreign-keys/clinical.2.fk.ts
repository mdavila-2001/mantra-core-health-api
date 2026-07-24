import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `clinical` (parte 2/2).
 * 9 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const clinicalForeignKeys2: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
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
