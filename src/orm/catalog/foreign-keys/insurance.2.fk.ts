import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `insurance` (parte 2/2).
 * 23 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const insuranceForeignKeys2: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
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
