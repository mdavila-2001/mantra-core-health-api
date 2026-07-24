import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `crm` (parte 2/2).
 * 38 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const crmForeignKeys2: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['opportunity_contact_roles', 'role_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['opportunity_contact_roles', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['opportunity_line_items', 'contract_line_item_id', 'erp', 'contract_line_items', 'id'],
  ['opportunity_line_items', 'created_by_user_id', 'iam', 'users', 'id'],
  ['opportunity_line_items', 'currency_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['opportunity_line_items', 'opportunity_id', 'crm', 'opportunities', 'id'],
  ['opportunity_line_items', 'product_or_service_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['opportunity_line_items', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['opportunity_line_items', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['opportunity_stage_history', 'changed_by_user_id', 'iam', 'users', 'id'],
  ['opportunity_stage_history', 'opportunity_id', 'crm', 'opportunities', 'id'],
  ['opportunity_stage_history', 'reason_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['partnership_agreements', 'agreement_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['partnership_agreements', 'contract_id', 'erp', 'contracts', 'id'],
  ['partnership_agreements', 'created_by_user_id', 'iam', 'users', 'id'],
  ['partnership_agreements', 'currency_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['partnership_agreements', 'document_file_id', 'common', 'files', 'id'],
  ['partnership_agreements', 'partnership_id', 'crm', 'partnerships', 'id'],
  ['partnership_agreements', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['partnership_agreements', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['partnerships', 'ad_partner_id', 'ads', 'ad_partners', 'id'],
  ['partnerships', 'contract_id', 'erp', 'contracts', 'id'],
  ['partnerships', 'created_by_user_id', 'iam', 'users', 'id'],
  ['partnerships', 'crm_account_id', 'crm', 'crm_accounts', 'id'],
  ['partnerships', 'owner_user_id', 'iam', 'users', 'id'],
  ['partnerships', 'partnership_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['partnerships', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['partnerships', 'tenant_id', 'directory', 'tenants', 'id'],
  ['partnerships', 'tier_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['partnerships', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['pipeline_stages', 'created_by_user_id', 'iam', 'users', 'id'],
  ['pipeline_stages', 'pipeline_id', 'crm', 'pipelines', 'id'],
  ['pipeline_stages', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['pipelines', 'created_by_user_id', 'iam', 'users', 'id'],
  ['pipelines', 'pipeline_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['pipelines', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['pipelines', 'tenant_id', 'directory', 'tenants', 'id'],
  ['pipelines', 'updated_by_user_id', 'iam', 'users', 'id'],
];
