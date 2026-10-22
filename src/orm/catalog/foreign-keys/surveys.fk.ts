import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `surveys`.
 * 36 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const surveysForeignKeys: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['survey_answers', 'created_by_user_id', 'iam', 'users', 'id'],
  ['survey_answers', 'survey_question_id', 'surveys', 'survey_questions', 'id'],
  ['survey_answers', 'survey_response_id', 'surveys', 'survey_responses', 'id'],
  ['survey_answers', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['survey_assignments', 'created_by_user_id', 'iam', 'users', 'id'],
  ['survey_assignments', 'survey_version_id', 'surveys', 'survey_versions', 'id'],
  ['survey_assignments', 'target_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['survey_assignments', 'tenant_id', 'directory', 'tenants', 'id'],
  ['survey_assignments', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['survey_invitations', 'appointment_booking_id', 'scheduling', 'appointment_bookings', 'id'],
  ['survey_invitations', 'created_by_user_id', 'iam', 'users', 'id'],
  ['survey_invitations', 'patient_profile_id', 'profiles', 'patient_profiles', 'profile_id'],
  ['survey_invitations', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['survey_invitations', 'survey_assignment_id', 'surveys', 'survey_assignments', 'id'],
  ['survey_invitations', 'survey_version_id', 'surveys', 'survey_versions', 'id'],
  ['survey_invitations', 'tenant_id', 'directory', 'tenants', 'id'],
  ['survey_invitations', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['survey_questions', 'answer_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['survey_questions', 'created_by_user_id', 'iam', 'users', 'id'],
  ['survey_questions', 'survey_version_id', 'surveys', 'survey_versions', 'id'],
  ['survey_questions', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['survey_responses', 'created_by_user_id', 'iam', 'users', 'id'],
  ['survey_responses', 'patient_profile_id', 'profiles', 'patient_profiles', 'profile_id'],
  ['survey_responses', 'survey_invitation_id', 'surveys', 'survey_invitations', 'id'],
  ['survey_responses', 'survey_version_id', 'surveys', 'survey_versions', 'id'],
  ['survey_responses', 'tenant_id', 'directory', 'tenants', 'id'],
  ['survey_responses', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['survey_templates', 'created_by_user_id', 'iam', 'users', 'id'],
  ['survey_templates', 'owner_practitioner_id', 'profiles', 'health_practitioner_profiles', 'profile_id'],
  ['survey_templates', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['survey_templates', 'tenant_id', 'directory', 'tenants', 'id'],
  ['survey_templates', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['survey_versions', 'created_by_user_id', 'iam', 'users', 'id'],
  ['survey_versions', 'publication_status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['survey_versions', 'survey_template_id', 'surveys', 'survey_templates', 'id'],
  ['survey_versions', 'updated_by_user_id', 'iam', 'users', 'id'],
];
