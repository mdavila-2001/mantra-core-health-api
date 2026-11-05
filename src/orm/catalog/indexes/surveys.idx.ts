import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `surveys`.
 * 26 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const surveysIndexes: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['survey_answers', 'ix_survey_answers_response', ['survey_response_id'], false, 'btree'],
  ['survey_answers', 'ix_survey_answers_question', ['survey_question_id'], false, 'btree'],
  ['survey_answers', 'uq_survey_answers_response_question', ['survey_response_id', 'survey_question_id'], true, 'btree'],
  ['survey_assignments', 'ix_survey_assignments_tenant_target', ['tenant_id', 'target_id', 'active'], false, 'btree'],
  ['survey_assignments', 'ix_survey_assignments_version', ['survey_version_id'], false, 'btree'],
  ['survey_assignments', 'uq_survey_assignments_active_target', ['survey_version_id', 'target_type_concept_id', 'target_id'], true, 'btree', 'active = true'],
  ['survey_invitation_reminders', 'uq_survey_invitation_reminders_number', ['survey_invitation_id', 'reminder_number'], true, 'btree'],
  ['survey_invitation_reminders', 'ix_survey_invitation_reminders_channel_concept_id', ['channel_concept_id'], false, 'btree'],
  ['survey_invitation_reminders', 'ix_survey_invitation_reminders_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['survey_invitations', 'ix_survey_invitations_patient_issued', ['patient_profile_id', 'issued_at desc'], false, 'btree'],
  ['survey_invitations', 'ix_survey_invitations_booking', ['appointment_booking_id'], false, 'btree'],
  ['survey_invitations', 'ix_survey_invitations_version', ['survey_version_id'], false, 'btree'],
  ['survey_invitations', 'ix_survey_invitations_assignment', ['survey_assignment_id'], false, 'btree'],
  ['survey_invitations', 'ix_survey_invitations_tenant_id', ['tenant_id'], false, 'btree'],
  ['survey_invitations', 'ix_survey_invitations_subject', ['subject_type_concept_id', 'subject_id'], false, 'btree'],
  ['survey_invitations', 'ix_survey_invitations_extension_version', ['extension_survey_version_id'], false, 'btree'],
  ['survey_invitations', 'uq_survey_invitations_booking_version', ['appointment_booking_id', 'survey_version_id'], true, 'btree'],
  ['survey_questions', 'ix_survey_questions_version_position', ['survey_version_id', 'position'], false, 'btree'],
  ['survey_responses', 'uq_survey_responses_invitation', ['survey_invitation_id'], true, 'btree'],
  ['survey_responses', 'ix_survey_responses_patient_submitted', ['patient_profile_id', 'submitted_at desc'], false, 'btree'],
  ['survey_responses', 'ix_survey_responses_version', ['survey_version_id'], false, 'btree'],
  ['survey_responses', 'ix_survey_responses_tenant_id', ['tenant_id'], false, 'btree'],
  ['survey_templates', 'ix_survey_templates_owner', ['owner_practitioner_id', 'created_at desc'], false, 'btree'],
  ['survey_templates', 'ix_survey_templates_tenant_id', ['tenant_id'], false, 'btree'],
  ['survey_templates', 'ix_survey_templates_owner_party', ['owner_type_concept_id', 'owner_id', 'created_at desc'], false, 'btree'],
  ['survey_versions', 'uq_survey_versions_template_number', ['survey_template_id', 'version_number'], true, 'btree'],
];
