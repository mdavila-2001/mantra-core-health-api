import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `delegated_access` (parte 2/2).
 * 28 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const delegatedAccessForeignKeys2: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['sod_exceptions', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['sod_exceptions', 'tenant_id', 'directory', 'tenants', 'id'],
  ['sod_exceptions', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['sod_rules', 'action_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['sod_rules', 'base_rule_id', 'delegated_access', 'sod_rules', 'id'],
  ['sod_rules', 'created_by_user_id', 'iam', 'users', 'id'],
  ['sod_rules', 'scope_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['sod_rules', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['sod_rules', 'tenant_id', 'directory', 'tenants', 'id'],
  ['sod_rules', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['support_grant_actions', 'permission_id', 'authz', 'permissions', 'id'],
  ['support_grant_actions', 'support_scope_grant_id', 'delegated_access', 'support_scope_grants', 'id'],
  ['support_grant_actions', 'tenant_id', 'directory', 'tenants', 'id'],
  ['support_grant_actions', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['support_scope_grants', 'approved_by_user_id', 'iam', 'users', 'id'],
  ['support_scope_grants', 'care_space_id', 'practice', 'care_spaces', 'id'],
  ['support_scope_grants', 'created_by_user_id', 'iam', 'users', 'id'],
  ['support_scope_grants', 'effect_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['support_scope_grants', 'expansion_mode_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['support_scope_grants', 'healthcare_service_id', 'practice', 'healthcare_services', 'id'],
  ['support_scope_grants', 'organization_user_assignment_id', 'delegated_access', 'organization_user_assignments', 'id'],
  ['support_scope_grants', 'practice_site_id', 'practice', 'practice_sites', 'id'],
  ['support_scope_grants', 'practitioner_role_assignment_id', 'practice', 'practitioner_role_assignments', 'id'],
  ['support_scope_grants', 'source_role_template_id', 'delegated_access', 'role_templates', 'id'],
  ['support_scope_grants', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['support_scope_grants', 'target_kind_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['support_scope_grants', 'tenant_id', 'directory', 'tenants', 'id'],
  ['support_scope_grants', 'updated_by_user_id', 'iam', 'users', 'id'],
];
