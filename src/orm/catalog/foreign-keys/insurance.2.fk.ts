import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `insurance` (parte 2/2).
 * 44 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const insuranceForeignKeys2: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['patient_coverages', 'insurance_broker_id', 'insurance', 'insurance_brokers', 'id'],
  ['patient_coverages', 'insurance_plan_id', 'insurance', 'insurance_plans', 'id'],
  ['patient_coverages', 'patient_profile_id', 'profiles', 'patient_profiles', 'profile_id'],
  ['patient_coverages', 'relationship_to_subscriber_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['patient_coverages', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['patient_coverages', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['patient_coverages', 'verification_status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['patient_explanations_of_benefit', 'claim_adjudication_version_id', 'insurance', 'claim_adjudication_versions', 'id'],
  ['patient_explanations_of_benefit', 'created_by_user_id', 'iam', 'users', 'id'],
  ['patient_explanations_of_benefit', 'document_record_id', 'chart', 'document_records', 'id'],
  ['patient_explanations_of_benefit', 'insurance_claim_id', 'insurance', 'insurance_claims', 'id'],
  ['patient_explanations_of_benefit', 'patient_profile_id', 'profiles', 'patient_profiles', 'profile_id'],
  ['patient_explanations_of_benefit', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['practitioner_insurer_requests', 'created_by_user_id', 'iam', 'users', 'id'],
  ['practitioner_insurer_requests', 'decided_by_user_id', 'iam', 'users', 'id'],
  ['practitioner_insurer_requests', 'insurance_carrier_id', 'insurance', 'insurance_carriers', 'id'],
  ['practitioner_insurer_requests', 'practitioner_profile_id', 'profiles', 'health_practitioner_profiles', 'profile_id'],
  ['practitioner_insurer_requests', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['practitioner_insurer_requests', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['prior_authorization_determinations', 'decided_by_user_id', 'iam', 'users', 'id'],
  ['prior_authorization_determinations', 'decision_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['prior_authorization_determinations', 'denial_reason_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['prior_authorization_determinations', 'prior_authorization_item_id', 'insurance', 'prior_authorization_items', 'id'],
  ['prior_authorization_determinations', 'prior_authorization_request_id', 'insurance', 'prior_authorization_requests', 'id'],
  ['prior_authorization_determinations', 'supporting_file_id', 'common', 'files', 'id'],
  ['prior_authorization_items', 'currency_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['prior_authorization_items', 'diagnostic_study_offering_id', 'diagnostic_units', 'diagnostic_study_offerings', 'id'],
  ['prior_authorization_items', 'pharmacy_product_id', 'pharmacy', 'pharmacy_products', 'id'],
  ['prior_authorization_items', 'prior_authorization_request_id', 'insurance', 'prior_authorization_requests', 'id'],
  ['prior_authorization_items', 'service_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['prior_authorization_requests', 'created_by_user_id', 'iam', 'users', 'id'],
  ['prior_authorization_requests', 'inventory_reservation_id', 'pharmacy_inventory', 'inventory_reservations', 'id'],
  ['prior_authorization_requests', 'medication_request_id', 'clinical', 'medication_requests', 'id'],
  ['prior_authorization_requests', 'patient_coverage_id', 'insurance', 'patient_coverages', 'id'],
  ['prior_authorization_requests', 'priority_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['prior_authorization_requests', 'requesting_provider_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['prior_authorization_requests', 'service_request_id', 'clinical', 'service_requests', 'id'],
  ['prior_authorization_requests', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['prior_authorization_requests', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['provider_networks', 'created_by_user_id', 'iam', 'users', 'id'],
  ['provider_networks', 'insurance_carrier_id', 'insurance', 'insurance_carriers', 'id'],
  ['provider_networks', 'network_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['provider_networks', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['provider_networks', 'updated_by_user_id', 'iam', 'users', 'id'],
];
