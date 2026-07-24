import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `diagnostics` (parte 2/2).
 * 32 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const diagnosticsForeignKeys2: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['specimen_containers', 'created_by_user_id', 'iam', 'users', 'id'],
  ['specimen_containers', 'specimen_id', 'diagnostics', 'specimens', 'id'],
  ['specimen_containers', 'specimen_quantity_unit_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['specimen_containers', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['specimen_containers', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['specimen_identifiers', 'created_by_user_id', 'iam', 'users', 'id'],
  ['specimen_identifiers', 'identifier_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['specimen_identifiers', 'specimen_id', 'diagnostics', 'specimens', 'id'],
  ['specimen_identifiers', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['specimen_parent_links', 'child_specimen_id', 'diagnostics', 'specimens', 'id'],
  ['specimen_parent_links', 'parent_specimen_id', 'diagnostics', 'specimens', 'id'],
  ['specimen_parent_links', 'quantity_unit_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['specimen_parent_links', 'relationship_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['specimen_processing_steps', 'additive_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['specimen_processing_steps', 'created_by_user_id', 'iam', 'users', 'id'],
  ['specimen_processing_steps', 'procedure_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['specimen_processing_steps', 'specimen_id', 'diagnostics', 'specimens', 'id'],
  ['specimen_rejection_events', 'recollection_service_request_id', 'clinical', 'service_requests', 'id'],
  ['specimen_rejection_events', 'rejection_reason_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['specimen_rejection_events', 'specimen_id', 'diagnostics', 'specimens', 'id'],
  ['specimens', 'body_site_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['specimens', 'collection_method_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['specimens', 'container_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['specimens', 'created_by_user_id', 'iam', 'users', 'id'],
  ['specimens', 'custodian_tenant_id', 'directory', 'tenants', 'id'],
  ['specimens', 'encounter_id', 'clinical', 'encounters', 'id'],
  ['specimens', 'patient_profile_id', 'profiles', 'patient_profiles', 'profile_id'],
  ['specimens', 'quantity_unit_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['specimens', 'service_request_id', 'clinical', 'service_requests', 'id'],
  ['specimens', 'specimen_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['specimens', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['specimens', 'updated_by_user_id', 'iam', 'users', 'id'],
];
