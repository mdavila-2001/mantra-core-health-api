import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `ads` (parte 3/3).
 * 28 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const adsForeignKeys3: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['product_sets', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['product_set_members', 'catalog_product_id', 'ads', 'catalog_products', 'id'],
  ['product_set_members', 'created_by_user_id', 'iam', 'users', 'id'],
  ['product_set_members', 'product_set_id', 'ads', 'product_sets', 'id'],
  ['product_set_members', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['rule_executions', 'automated_rule_id', 'ads', 'automated_rules', 'id'],
  ['rule_executions', 'recorded_by_user_id', 'iam', 'users', 'id'],
  ['rule_executions', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['saved_audiences', 'ad_account_id', 'ads', 'ad_accounts', 'id'],
  ['saved_audiences', 'created_by_user_id', 'iam', 'users', 'id'],
  ['saved_audiences', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['saved_audiences', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['server_conversion_events', 'action_source_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['server_conversion_events', 'blocked_reason_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['server_conversion_events', 'conversion_dataset_id', 'ads', 'conversion_datasets', 'id'],
  ['server_conversion_events', 'crm_lead_id', 'crm', 'leads', 'id'],
  ['server_conversion_events', 'crm_opportunity_id', 'crm', 'opportunities', 'id'],
  ['server_conversion_events', 'payment_transaction_id', 'payments', 'payment_transactions', 'id'],
  ['server_conversion_events', 'processing_status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['server_conversion_events', 'tenant_id', 'directory', 'tenants', 'id'],
  ['targeting_specs', 'ad_account_id', 'ads', 'ad_accounts', 'id'],
  ['targeting_specs', 'created_by_user_id', 'iam', 'users', 'id'],
  ['targeting_specs', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['tracking_pixels', 'ad_account_id', 'ads', 'ad_accounts', 'id'],
  ['tracking_pixels', 'business_manager_id', 'ads', 'business_managers', 'id'],
  ['tracking_pixels', 'created_by_user_id', 'iam', 'users', 'id'],
  ['tracking_pixels', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['tracking_pixels', 'updated_by_user_id', 'iam', 'users', 'id'],
];
