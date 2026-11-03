import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `billing` (parte 2/2).
 * 24 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const billingIndexes2: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['space_tariffs', 'ix_space_tariffs_bed_category_concept_id', ['bed_category_concept_id'], false, 'btree'],
  ['space_tariffs', 'ix_space_tariffs_care_space_id', ['care_space_id'], false, 'btree'],
  ['space_tariffs', 'ix_space_tariffs_service_catalog_id', ['service_catalog_id'], false, 'btree'],
  ['space_tariffs', 'ix_space_tariffs_currency_concept_id', ['currency_concept_id'], false, 'btree'],
  ['space_tariffs', 'ix_space_tariffs_status_concept_id', ['status_concept_id'], false, 'btree'],
  ['space_tariffs', 'ix_space_tariffs_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['space_tariffs', 'ix_space_tariffs_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['space_tariffs', 'ux_space_tariffs_tenant_id_id', ['tenant_id', 'id'], true, 'btree'],
  ['tax_codes', 'ix_tax_codes_practice_id', ['practice_id'], false, 'btree'],
  ['tax_codes', 'ix_tax_codes_tax_type_concept_id', ['tax_type_concept_id'], false, 'btree'],
  ['tax_codes', 'ix_tax_codes_jurisdiction_concept_id', ['jurisdiction_concept_id'], false, 'btree'],
  ['tax_codes', 'ix_tax_codes_account_id', ['account_id'], false, 'btree'],
  ['tax_codes', 'ix_tax_codes_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['tax_codes', 'ix_tax_codes_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['tax_periods', 'ix_tax_periods_practice_id', ['practice_id'], false, 'btree'],
  ['tax_periods', 'ix_tax_periods_status_concept_id', ['status_concept_id'], false, 'btree'],
  ['tax_periods', 'ix_tax_periods_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['tax_periods', 'ix_tax_periods_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['vendors', 'ix_vendors_practice_id', ['practice_id'], false, 'btree'],
  ['vendors', 'ix_vendors_status_concept_id', ['status_concept_id'], false, 'btree'],
  ['vendors', 'ix_vendors_business_partner_id', ['business_partner_id'], false, 'btree'],
  ['vendors', 'ix_vendors_supplier_subledger_account_id', ['supplier_subledger_account_id'], false, 'btree'],
  ['vendors', 'ix_vendors_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['vendors', 'ix_vendors_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
];
