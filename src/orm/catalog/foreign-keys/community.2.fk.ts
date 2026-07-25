import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `community` (parte 2/2).
 * 18 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const communityForeignKeys2: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['topics', 'created_by_user_id', 'iam', 'users', 'id'],
  ['topics', 'parent_topic_id', 'community', 'topics', 'id'],
  ['topics', 'specialty_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['topics', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['topics', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['user_blocks', 'blocked_profile_id', 'community', 'public_profiles', 'id'],
  ['user_blocks', 'blocker_profile_id', 'community', 'public_profiles', 'id'],
  ['user_blocks', 'created_by_user_id', 'iam', 'users', 'id'],
  ['user_blocks', 'reason_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['user_blocks', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['user_blocks', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['verified_badges', 'badge_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['verified_badges', 'created_by_user_id', 'iam', 'users', 'id'],
  ['verified_badges', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['verified_badges', 'subject_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['verified_badges', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['verified_badges', 'verification_method_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['verified_badges', 'verified_by_user_id', 'iam', 'users', 'id'],
];
