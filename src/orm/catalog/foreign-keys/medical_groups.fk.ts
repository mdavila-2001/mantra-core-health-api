import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `medical_groups`.
 * 14 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const medicalGroupsForeignKeys: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['groups', 'condition_id', 'clinical', 'conditions', 'id'],
  ['groups', 'created_by_user_id', 'iam', 'users', 'id'],
  ['groups', 'patient_profile_id', 'profiles', 'patient_profiles', 'profile_id'],
  ['groups', 'practice_id', 'practice', 'practices', 'id'],
  ['groups', 'proposed_by_practitioner_id', 'profiles', 'health_practitioner_profiles', 'profile_id'],
  ['groups', 'requesting_practitioner_id', 'profiles', 'health_practitioner_profiles', 'profile_id'],
  ['groups', 'service_catalog_id', 'billing', 'service_catalog', 'id'],
  ['groups', 'tenant_id', 'directory', 'tenants', 'id'],
  ['groups', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['group_members', 'agreed_payment_currency_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['group_members', 'created_by_user_id', 'iam', 'users', 'id'],
  ['group_members', 'group_id', 'medical_groups', 'groups', 'id'],
  ['group_members', 'practitioner_profile_id', 'profiles', 'health_practitioner_profiles', 'profile_id'],
  ['group_members', 'updated_by_user_id', 'iam', 'users', 'id'],
];
