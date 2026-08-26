import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `diagnostic_units`.
 * 72 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 *
 * Excepción documentada (2026-08-23): la fila
 * `uq_diagnostic_units_tenant_id_code` se editó a mano, y no con
 * `yarn orm:catalog`, porque regenerar el catálogo entero hoy es destructivo por
 * **B-10** —la bóveda no tiene las notas del módulo 65, y `surveys` volvería a
 * módulo `null` con 1 de sus 36 FKs—. Es exactamente la fila que el generador
 * emitiría, en la posición en que la emitiría: el orden sigue el `<<INDEX_SET>>`
 * de la nota de bóveda, que ya declara la clave compuesta. Mismo criterio que el
 * commit `8ba2ebf9` para el índice de la ocupación.
 */
export const diagnosticUnitsIndexes: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['diagnostic_equipment', 'ix_diagnostic_equipment_diagnostic_unit_site_id', ['diagnostic_unit_site_id'], false, 'btree'],
  ['diagnostic_equipment', 'ix_diagnostic_equipment_equipment_type_concept_id', ['equipment_type_concept_id'], false, 'btree'],
  ['diagnostic_equipment', 'ix_diagnostic_equipment_modality_concept_id', ['modality_concept_id'], false, 'btree'],
  ['diagnostic_equipment', 'ix_diagnostic_equipment_operational_status_concept_id', ['operational_status_concept_id'], false, 'btree'],
  ['diagnostic_equipment', 'ix_diagnostic_equipment_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['diagnostic_equipment', 'ix_diagnostic_equipment_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['diagnostic_price_schedules', 'ix_diagnostic_price_schedules_diagnostic_unit_id', ['diagnostic_unit_id'], false, 'btree'],
  ['diagnostic_price_schedules', 'ix_diagnostic_price_schedules_diagnostic_unit_site_id', ['diagnostic_unit_site_id'], false, 'btree'],
  ['diagnostic_price_schedules', 'ix_diagnostic_price_schedules_price_schedule_type_concept_id', ['price_schedule_type_concept_id'], false, 'btree'],
  ['diagnostic_price_schedules', 'ix_diagnostic_price_schedules_insurer_tenant_id', ['insurer_tenant_id'], false, 'btree'],
  ['diagnostic_price_schedules', 'ix_diagnostic_price_schedules_broker_tenant_id', ['broker_tenant_id'], false, 'btree'],
  ['diagnostic_price_schedules', 'ix_diagnostic_price_schedules_currency_concept_id', ['currency_concept_id'], false, 'btree'],
  ['diagnostic_price_schedules', 'ix_diagnostic_price_schedules_status_concept_id', ['status_concept_id'], false, 'btree'],
  ['diagnostic_price_schedules', 'ix_diagnostic_price_schedules_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['diagnostic_price_schedules', 'ix_diagnostic_price_schedules_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['diagnostic_study_components', 'ix_diagnostic_study_components_parent_offering_id', ['parent_offering_id'], false, 'btree'],
  ['diagnostic_study_components', 'ix_diagnostic_study_components_component_offering_id', ['component_offering_id'], false, 'btree'],
  ['diagnostic_study_components', 'ix_diagnostic_study_components_component_role_concept_id', ['component_role_concept_id'], false, 'btree'],
  ['diagnostic_study_components', 'ix_diagnostic_study_components_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['diagnostic_study_offerings', 'ix_diagnostic_study_offerings_diagnostic_unit_id', ['diagnostic_unit_id'], false, 'btree'],
  ['diagnostic_study_offerings', 'ix_diagnostic_study_offerings_diagnostic_unit_site_id', ['diagnostic_unit_site_id'], false, 'btree'],
  ['diagnostic_study_offerings', 'ix_diagnostic_study_offerings_study_concept_id', ['study_concept_id'], false, 'btree'],
  ['diagnostic_study_offerings', 'ix_diagnostic_study_offerings_modality_concept_id', ['modality_concept_id'], false, 'btree'],
  ['diagnostic_study_offerings', 'ix_diagnostic_study_offerings_body_site_concept_id', ['body_site_concept_id'], false, 'btree'],
  ['diagnostic_study_offerings', 'ix_diagnostic_study_offerings_specimen_type_concept_id', ['specimen_type_concept_id'], false, 'btree'],
  ['diagnostic_study_offerings', 'ix_diagnostic_study_offerings_status_concept_id', ['status_concept_id'], false, 'btree'],
  ['diagnostic_study_offerings', 'ix_diagnostic_study_offerings_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['diagnostic_study_offerings', 'ix_diagnostic_study_offerings_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['diagnostic_study_prices', 'ix_diagnostic_study_prices_price_schedule_id', ['price_schedule_id'], false, 'btree'],
  ['diagnostic_study_prices', 'ix_diagnostic_study_prices_diagnostic_study_offering_id', ['diagnostic_study_offering_id'], false, 'btree'],
  ['diagnostic_study_prices', 'ix_diagnostic_study_prices_status_concept_id', ['status_concept_id'], false, 'btree'],
  ['diagnostic_study_prices', 'ix_diagnostic_study_prices_recorded_by_user_id', ['recorded_by_user_id'], false, 'btree'],
  ['diagnostic_study_prices', 'uq_diagnostic_study_prices_price_schedule_id_version_number', ['price_schedule_id', 'version_number'], true, 'btree'],
  ['diagnostic_units', 'uq_diagnostic_units_tenant_id_code', ['tenant_id', 'code'], true, 'btree'],
  ['diagnostic_units', 'ix_diagnostic_units_tenant_id', ['tenant_id'], false, 'btree'],
  ['diagnostic_units', 'ix_diagnostic_units_practice_id', ['practice_id'], false, 'btree'],
  ['diagnostic_units', 'ix_diagnostic_units_primary_practice_site_id', ['primary_practice_site_id'], false, 'btree'],
  ['diagnostic_units', 'ix_diagnostic_units_diagnostic_unit_type_concept_id', ['diagnostic_unit_type_concept_id'], false, 'btree'],
  ['diagnostic_units', 'ix_diagnostic_units_ownership_type_concept_id', ['ownership_type_concept_id'], false, 'btree'],
  ['diagnostic_units', 'ix_diagnostic_units_public_profile_id', ['public_profile_id'], false, 'btree'],
  ['diagnostic_units', 'ix_diagnostic_units_verification_status_concept_id', ['verification_status_concept_id'], false, 'btree'],
  ['diagnostic_units', 'ix_diagnostic_units_status_concept_id', ['status_concept_id'], false, 'btree'],
  ['diagnostic_units', 'ix_diagnostic_units_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['diagnostic_units', 'ix_diagnostic_units_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['diagnostic_units', 'ix_diagnostic_units_tenant_id_status_concept_id', ['tenant_id', 'status_concept_id', 'updated_at desc'], false, 'btree'],
  ['diagnostic_unit_accreditations', 'ix_diagnostic_unit_accreditations_diagnostic_unit_id', ['diagnostic_unit_id'], false, 'btree'],
  ['diagnostic_unit_accreditations', 'ix_diagnostic_unit_accreditations_diagnostic_unit_site_id', ['diagnostic_unit_site_id'], false, 'btree'],
  ['diagnostic_unit_accreditations', 'ix_diagnostic_unit_accreditations_accreditation_concept_id', ['accreditation_concept_id'], false, 'btree'],
  ['diagnostic_unit_accreditations', 'ix_diagnostic_unit_accreditations_issuer_tenant_id', ['issuer_tenant_id'], false, 'btree'],
  ['diagnostic_unit_accreditations', 'ix_diagnostic_unit_accreditations_evidence_file_id', ['evidence_file_id'], false, 'btree'],
  ['diagnostic_unit_accreditations', 'ix_diagnostic_unit_accreditations_verification_status__7e3d4f65', ['verification_status_concept_id'], false, 'btree'],
  ['diagnostic_unit_accreditations', 'ix_diagnostic_unit_accreditations_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['diagnostic_unit_accreditations', 'ix_diagnostic_unit_accreditations_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['diagnostic_unit_practitioner_assignments', 'ix_diagnostic_unit_practitioner_assignments_diagnostic_unit_id', ['diagnostic_unit_id'], false, 'btree'],
  ['diagnostic_unit_practitioner_assignments', 'ix_diagnostic_unit_practitioner_assignments_practition_04f3585e', ['practitioner_role_assignment_id'], false, 'btree'],
  ['diagnostic_unit_practitioner_assignments', 'ix_diagnostic_unit_practitioner_assignments_diagnostic_cf1d7558', ['diagnostic_unit_site_id'], false, 'btree'],
  ['diagnostic_unit_practitioner_assignments', 'ix_diagnostic_unit_practitioner_assignments_specialty__966d7ef4', ['specialty_concept_id'], false, 'btree'],
  ['diagnostic_unit_practitioner_assignments', 'ix_diagnostic_unit_practitioner_assignments_assignment_7bb2e764', ['assignment_role_concept_id'], false, 'btree'],
  ['diagnostic_unit_practitioner_assignments', 'ix_diagnostic_unit_practitioner_assignments_status_concept_id', ['status_concept_id'], false, 'btree'],
  ['diagnostic_unit_practitioner_assignments', 'ix_diagnostic_unit_practitioner_assignments_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['diagnostic_unit_practitioner_assignments', 'ix_diagnostic_unit_practitioner_assignments_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['diagnostic_unit_sites', 'ix_diagnostic_unit_sites_diagnostic_unit_id', ['diagnostic_unit_id'], false, 'btree'],
  ['diagnostic_unit_sites', 'ix_diagnostic_unit_sites_practice_site_id', ['practice_site_id'], false, 'btree'],
  ['diagnostic_unit_sites', 'ix_diagnostic_unit_sites_site_role_concept_id', ['site_role_concept_id'], false, 'btree'],
  ['diagnostic_unit_sites', 'ix_diagnostic_unit_sites_status_concept_id', ['status_concept_id'], false, 'btree'],
  ['diagnostic_unit_sites', 'ix_diagnostic_unit_sites_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['diagnostic_unit_sites', 'ix_diagnostic_unit_sites_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['diagnostic_unit_specialties', 'ix_diagnostic_unit_specialties_diagnostic_unit_id', ['diagnostic_unit_id'], false, 'btree'],
  ['diagnostic_unit_specialties', 'ix_diagnostic_unit_specialties_specialty_concept_id', ['specialty_concept_id'], false, 'btree'],
  ['diagnostic_unit_specialties', 'ix_diagnostic_unit_specialties_verification_status_concept_id', ['verification_status_concept_id'], false, 'btree'],
  ['diagnostic_unit_specialties', 'ix_diagnostic_unit_specialties_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['diagnostic_unit_specialties', 'ix_diagnostic_unit_specialties_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
];
