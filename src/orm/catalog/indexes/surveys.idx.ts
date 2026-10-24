import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `surveys`.
 * 17 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const surveysIndexes: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['survey_answers', 'ix_survey_answers_response', ['survey_response_id'], false, 'btree'],
  ['survey_answers', 'ix_survey_answers_question', ['survey_question_id'], false, 'btree'],
  ['survey_assignments', 'ix_survey_assignments_tenant_target', ['tenant_id', 'target_id', 'active'], false, 'btree'],
  ['survey_assignments', 'ix_survey_assignments_version', ['survey_version_id'], false, 'btree'],
  ['survey_invitations', 'ix_survey_invitations_patient_issued', ['patient_profile_id', 'issued_at desc'], false, 'btree'],
  ['survey_invitations', 'ix_survey_invitations_booking', ['appointment_booking_id'], false, 'btree'],
  ['survey_invitations', 'ix_survey_invitations_version', ['survey_version_id'], false, 'btree'],
  ['survey_invitations', 'ix_survey_invitations_assignment', ['survey_assignment_id'], false, 'btree'],
  ['survey_invitations', 'ix_survey_invitations_tenant_id', ['tenant_id'], false, 'btree'],
  ['survey_questions', 'ix_survey_questions_version_position', ['survey_version_id', 'position'], false, 'btree'],
  ['survey_responses', 'ix_survey_responses_invitation', ['survey_invitation_id'], false, 'btree'],
  ['survey_responses', 'ix_survey_responses_patient_submitted', ['patient_profile_id', 'submitted_at desc'], false, 'btree'],
  ['survey_responses', 'ix_survey_responses_version', ['survey_version_id'], false, 'btree'],
  ['survey_responses', 'ix_survey_responses_tenant_id', ['tenant_id'], false, 'btree'],
  ['survey_templates', 'ix_survey_templates_owner', ['owner_practitioner_id', 'created_at desc'], false, 'btree'],
  ['survey_templates', 'ix_survey_templates_tenant_id', ['tenant_id'], false, 'btree'],
  ['survey_versions', 'ix_survey_versions_template_number', ['survey_template_id', 'version_number'], false, 'btree'],
];
