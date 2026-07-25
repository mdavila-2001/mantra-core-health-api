import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `directory`.
 * 31 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const directoryForeignKeys: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['branch_memberships', 'branch_id', 'directory', 'branches', 'id'],
  ['branch_memberships', 'created_by_user_id', 'iam', 'users', 'id'],
  ['branch_memberships', 'local_role_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['branch_memberships', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['branch_memberships', 'tenant_membership_id', 'directory', 'tenant_memberships', 'id'],
  ['branch_memberships', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['branches', 'branch_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['branches', 'created_by_user_id', 'iam', 'users', 'id'],
  ['branches', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['branches', 'tenant_id', 'directory', 'tenants', 'id'],
  ['branches', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['tenant_memberships', 'access_scope_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['tenant_memberships', 'created_by_user_id', 'iam', 'users', 'id'],
  ['tenant_memberships', 'invited_by_user_id', 'iam', 'users', 'id'],
  ['tenant_memberships', 'primary_branch_id', 'directory', 'branches', 'id'],
  ['tenant_memberships', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['tenant_memberships', 'tenant_id', 'directory', 'tenants', 'id'],
  ['tenant_memberships', 'tenant_role_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['tenant_memberships', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['tenant_memberships', 'user_id', 'iam', 'users', 'id'],
  ['tenants', 'country_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['tenants', 'created_by_user_id', 'iam', 'users', 'id'],
  ['tenants', 'currency_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['tenants', 'data_residency_region_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['tenants', 'jurisdiction_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['tenants', 'legal_entity_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['tenants', 'parent_tenant_id', 'directory', 'tenants', 'id'],
  ['tenants', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['tenants', 'tenant_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['tenants', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['tenants', 'verification_status_concept_id', 'terminology', 'catalog_concepts', 'id'],
];
