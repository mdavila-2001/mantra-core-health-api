import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `observability`.
 * 13 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const observabilityForeignKeys: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['alert_evaluations', 'alert_rule_id', 'observability', 'alert_rules', 'id'],
  ['alert_evaluations', 'health_incident_id', 'platform_ops', 'health_incidents', 'id'],
  ['alert_rules', 'created_by_user_id', 'iam', 'users', 'id'],
  ['alert_rules', 'severity_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['alert_rules', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['dependency_probe_runs', 'service_component_id', 'platform_ops', 'service_components', 'id'],
  ['error_events', 'error_group_id', 'observability', 'error_groups', 'id'],
  ['error_events', 'instance_id', 'observability', 'instances', 'id'],
  ['error_groups', 'assigned_to_user_id', 'iam', 'users', 'id'],
  ['error_groups', 'created_by_user_id', 'iam', 'users', 'id'],
  ['error_groups', 'resolved_by_user_id', 'iam', 'users', 'id'],
  ['error_groups', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['error_groups', 'updated_by_user_id', 'iam', 'users', 'id'],
];
