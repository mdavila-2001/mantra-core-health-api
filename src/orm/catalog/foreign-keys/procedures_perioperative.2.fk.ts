import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `procedures_perioperative` (parte 2/2).
 * 41 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const proceduresPerioperativeForeignKeys2: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['procedure_implants', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['procedure_medication_uses', 'medication_administration_id', 'clinical', 'medication_records', 'id'],
  ['procedure_medication_uses', 'operative_step_id', 'procedures_perioperative', 'operative_steps', 'id'],
  ['procedure_medication_uses', 'procedure_case_id', 'procedures_perioperative', 'procedure_cases', 'id'],
  ['procedure_medication_uses', 'procedure_id', 'clinical', 'procedures', 'id'],
  ['procedure_medication_uses', 'use_role_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['procedure_outcomes', 'observation_id', 'clinical', 'observations', 'id'],
  ['procedure_outcomes', 'outcome_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['procedure_outcomes', 'outcome_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['procedure_outcomes', 'procedure_case_id', 'procedures_perioperative', 'procedure_cases', 'id'],
  ['procedure_outcomes', 'unit_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['procedure_performers', 'performer_role_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['procedure_performers', 'practitioner_profile_id', 'profiles', 'health_practitioner_profiles', 'profile_id'],
  ['procedure_performers', 'procedure_id', 'clinical', 'procedures', 'id'],
  ['procedure_specimens', 'body_site_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['procedure_specimens', 'operative_step_id', 'procedures_perioperative', 'operative_steps', 'id'],
  ['procedure_specimens', 'procedure_case_id', 'procedures_perioperative', 'procedure_cases', 'id'],
  ['procedure_specimens', 'procedure_id', 'clinical', 'procedures', 'id'],
  ['procedure_specimens', 'specimen_id', 'diagnostics', 'specimens', 'id'],
  ['procedure_specimens', 'specimen_role_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['sterility_verification_checks', 'check_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['sterility_verification_checks', 'checked_by_profile_id', 'profiles', 'health_practitioner_profiles', 'profile_id'],
  ['sterility_verification_checks', 'instrument_set_id', 'procedures_perioperative', 'instrument_sets', 'id'],
  ['sterility_verification_checks', 'procedure_case_id', 'procedures_perioperative', 'procedure_cases', 'id'],
  ['sterility_verification_checks', 'result_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['sterility_verification_checks', 'sterilization_load_id', 'procedures_perioperative', 'sterilization_loads', 'id'],
  ['surgical_safety_checklists', 'checklist_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['surgical_safety_checklists', 'coordinator_profile_id', 'profiles', 'health_practitioner_profiles', 'profile_id'],
  ['surgical_safety_checklists', 'procedure_case_id', 'procedures_perioperative', 'procedure_cases', 'id'],
  ['surgical_safety_checklists', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['surgical_safety_items', 'checklist_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['surgical_safety_items', 'created_by_user_id', 'iam', 'users', 'id'],
  ['surgical_safety_items', 'phase_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['surgical_safety_items', 'response_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['surgical_safety_items', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['surgical_safety_items', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['surgical_safety_responses', 'responded_by_profile_id', 'profiles', 'health_practitioner_profiles', 'profile_id'],
  ['surgical_safety_responses', 'response_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['surgical_safety_responses', 'response_status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['surgical_safety_responses', 'surgical_safety_checklist_id', 'procedures_perioperative', 'surgical_safety_checklists', 'id'],
  ['surgical_safety_responses', 'surgical_safety_item_id', 'procedures_perioperative', 'surgical_safety_items', 'id'],
];
