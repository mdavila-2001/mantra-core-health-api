import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `platform_ops` (parte 2/2).
 * 34 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const platformOpsForeignKeys2: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['service_components', 'tenant_id', 'directory', 'tenants', 'id'],
  ['service_components', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['service_dependencies', 'created_by_user_id', 'iam', 'users', 'id'],
  ['service_dependencies', 'criticality_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['service_dependencies', 'dependency_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['service_dependencies', 'downstream_service_component_id', 'platform_ops', 'service_components', 'id'],
  ['service_dependencies', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['service_dependencies', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['service_dependencies', 'upstream_service_component_id', 'platform_ops', 'service_components', 'id'],
  ['service_level_indicators', 'created_by_user_id', 'iam', 'users', 'id'],
  ['service_level_indicators', 'indicator_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['service_level_indicators', 'service_component_id', 'platform_ops', 'service_components', 'id'],
  ['service_level_indicators', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['service_level_indicators', 'unit_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['service_level_indicators', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['service_level_objectives', 'created_by_user_id', 'iam', 'users', 'id'],
  ['service_level_objectives', 'service_level_indicator_id', 'platform_ops', 'service_level_indicators', 'id'],
  ['service_level_objectives', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['service_level_objectives', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['service_ownerships', 'created_by_user_id', 'iam', 'users', 'id'],
  ['service_ownerships', 'escalation_policy_id', 'platform_ops', 'escalation_policies', 'id'],
  ['service_ownerships', 'operational_team_id', 'platform_ops', 'operational_teams', 'id'],
  ['service_ownerships', 'ownership_role_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['service_ownerships', 'service_component_id', 'platform_ops', 'service_components', 'id'],
  ['service_ownerships', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['service_ownerships', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['slo_measurements', 'service_level_objective_id', 'platform_ops', 'service_level_objectives', 'id'],
  ['slo_measurements', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['tool_registry', 'approved_by_user_id', 'iam', 'users', 'id'],
  ['tool_registry', 'created_by_user_id', 'iam', 'users', 'id'],
  ['tool_registry', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['tool_registry', 'tenant_id', 'directory', 'tenants', 'id'],
  ['tool_registry', 'tool_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['tool_registry', 'updated_by_user_id', 'iam', 'users', 'id'],
];
