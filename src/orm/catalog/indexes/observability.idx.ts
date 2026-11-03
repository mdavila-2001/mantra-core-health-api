import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `observability`.
 * 39 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const observabilityIndexes: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['alert_evaluations', 'ix_alert_evaluations_rule_time', ['alert_rule_id', 'time desc'], false, 'btree'],
  ['alert_evaluations', 'ix_alert_evaluations_health_incident_id', ['health_incident_id'], false, 'btree'],
  ['alert_evaluations', 'brin_alert_evaluations_time', ['time'], false, 'brin'],
  ['alert_rules', 'uq_alert_rules_code', ['code'], true, 'btree'],
  ['alert_rules', 'ix_alert_rules_severity_concept_id', ['severity_concept_id'], false, 'btree'],
  ['alert_rules', 'ix_alert_rules_enabled_module', ['enabled', 'module_code'], false, 'btree'],
  ['alert_rules', 'ix_alert_rules_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['alert_rules', 'ix_alert_rules_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['dependency_probe_runs', 'ix_dependency_probe_code_time', ['dependency_code', 'time desc'], false, 'btree'],
  ['dependency_probe_runs', 'ix_dependency_probe_service_component_id', ['service_component_id'], false, 'btree'],
  ['dependency_probe_runs', 'brin_dependency_probe_time', ['time'], false, 'brin'],
  ['error_events', 'ix_error_events_group_time', ['error_group_id', 'occurred_at desc'], false, 'btree'],
  ['error_events', 'ix_error_events_module_time', ['module_code', 'occurred_at desc'], false, 'btree'],
  ['error_events', 'ix_error_events_request_id', ['request_id', 'occurred_at desc'], false, 'btree'],
  ['error_events', 'ix_error_events_instance_time', ['instance_id', 'occurred_at desc'], false, 'btree'],
  ['error_events', 'brin_error_events_time', ['occurred_at'], false, 'brin'],
  ['error_groups', 'uq_error_groups_fingerprint', ['fingerprint'], true, 'btree'],
  ['error_groups', 'ix_error_groups_state_last_seen', ['state_concept_id', 'last_seen_at desc'], false, 'btree'],
  ['error_groups', 'ix_error_groups_module_last_seen', ['module_code', 'last_seen_at desc'], false, 'btree'],
  ['error_groups', 'ix_error_groups_code', ['error_code', 'error_reason'], false, 'btree'],
  ['error_groups', 'ix_error_groups_assigned_to_user_id', ['assigned_to_user_id'], false, 'btree'],
  ['error_groups', 'ix_error_groups_resolved_by_user_id', ['resolved_by_user_id'], false, 'btree'],
  ['error_groups', 'ix_error_groups_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['error_groups', 'ix_error_groups_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['http_request_minute_series', 'ix_http_minute_module_time', ['module_code', 'time desc'], false, 'btree'],
  ['http_request_minute_series', 'ix_http_minute_route_time', ['route_template', 'http_method', 'time desc'], false, 'btree'],
  ['http_request_minute_series', 'brin_http_minute_time', ['time'], false, 'brin'],
  ['instances', 'ix_instances_kind_last_seen', ['kind', 'last_seen_at desc'], false, 'btree'],
  ['instances', 'ix_instances_name', ['name'], false, 'btree'],
  ['slow_request_samples', 'ix_slow_request_request_id', ['request_id'], false, 'btree'],
  ['slow_request_samples', 'ix_slow_request_module_time', ['module_code', 'time desc'], false, 'btree'],
  ['slow_request_samples', 'brin_slow_request_time', ['time'], false, 'brin'],
  ['sql_statement_minute_series', 'ix_sql_minute_hash_time', ['query_hash', 'time desc'], false, 'btree'],
  ['sql_statement_minute_series', 'ix_sql_minute_module_time', ['module_code', 'time desc'], false, 'btree'],
  ['sql_statement_minute_series', 'brin_sql_minute_time', ['time'], false, 'brin'],
  ['sql_statements', 'ix_sql_statements_primary_table', ['primary_table'], false, 'btree'],
  ['sql_statements', 'ix_sql_statements_last_seen', ['last_seen_at desc'], false, 'btree'],
  ['worker_tick_minute_series', 'ix_worker_tick_worker_time', ['worker_name', 'time desc'], false, 'btree'],
  ['worker_tick_minute_series', 'brin_worker_tick_time', ['time'], false, 'brin'],
];
