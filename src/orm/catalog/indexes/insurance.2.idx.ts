import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `insurance` (parte 2/2).
 * 22 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const insuranceIndexes2: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['prior_authorization_determinations', 'ix_prior_authorization_determinations_denial_reason_concept_id', ['denial_reason_concept_id'], false, 'btree'],
  ['prior_authorization_determinations', 'ix_prior_authorization_determinations_supporting_file_id', ['supporting_file_id'], false, 'btree'],
  ['prior_authorization_determinations', 'ix_prior_authorization_determinations_decided_by_user_id', ['decided_by_user_id'], false, 'btree'],
  ['prior_authorization_items', 'ix_prior_authorization_items_prior_authorization_request_id', ['prior_authorization_request_id'], false, 'btree'],
  ['prior_authorization_items', 'ix_prior_authorization_items_service_concept_id', ['service_concept_id'], false, 'btree'],
  ['prior_authorization_items', 'ix_prior_authorization_items_diagnostic_study_offering_id', ['diagnostic_study_offering_id'], false, 'btree'],
  ['prior_authorization_items', 'ix_prior_authorization_items_pharmacy_product_id', ['pharmacy_product_id'], false, 'btree'],
  ['prior_authorization_items', 'ix_prior_authorization_items_currency_concept_id', ['currency_concept_id'], false, 'btree'],
  ['prior_authorization_requests', 'ix_prior_authorization_requests_patient_coverage_id', ['patient_coverage_id'], false, 'btree'],
  ['prior_authorization_requests', 'ix_prior_authorization_requests_service_request_id', ['service_request_id'], false, 'btree'],
  ['prior_authorization_requests', 'ix_prior_authorization_requests_medication_request_id', ['medication_request_id'], false, 'btree'],
  ['prior_authorization_requests', 'ix_prior_authorization_requests_requesting_provider_ty_ace534e5', ['requesting_provider_type_concept_id'], false, 'btree'],
  ['prior_authorization_requests', 'ix_prior_authorization_requests_status_concept_id', ['status_concept_id'], false, 'btree'],
  ['prior_authorization_requests', 'ix_prior_authorization_requests_priority_concept_id', ['priority_concept_id'], false, 'btree'],
  ['prior_authorization_requests', 'ix_prior_authorization_requests_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['prior_authorization_requests', 'ix_prior_authorization_requests_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['prior_authorization_requests', 'uq_prior_authorization_requests_idempotency', ['idempotency_key'], true, 'btree'],
  ['provider_networks', 'ix_provider_networks_insurance_carrier_id', ['insurance_carrier_id'], false, 'btree'],
  ['provider_networks', 'ix_provider_networks_network_type_concept_id', ['network_type_concept_id'], false, 'btree'],
  ['provider_networks', 'ix_provider_networks_status_concept_id', ['status_concept_id'], false, 'btree'],
  ['provider_networks', 'ix_provider_networks_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['provider_networks', 'ix_provider_networks_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
];
