/**
 * Sub-códigos de negocio estables para los errores de dominio de `surveys`.
 * Van como `reason` de `DomainException` (y subclases), encima del `code`
 * genérico (NOT_FOUND, CONFLICT, ...) que ya fija el status HTTP.
 *
 * `INVITATION_OUT_OF_SCOPE` se lanza igual para una invitación inexistente, de
 * otra persona o de otro tenant: distinguirlas confirmaría a un tercero que el
 * UUID existe.
 */
export enum SurveysErrorReason {
  // --- Recursos fuera de alcance (404 uniforme) ---
  INVITATION_OUT_OF_SCOPE = 'SURVEY_INVITATION_OUT_OF_SCOPE',

  // --- La encuesta base no la toca el profesional (403) ---
  SYSTEM_TEMPLATE_IMMUTABLE = 'SURVEY_SYSTEM_TEMPLATE_IMMUTABLE',

  // --- Destino de una asignación (404 / 412) ---
  ASSIGNMENT_TARGET_NOT_FOUND = 'SURVEY_ASSIGNMENT_TARGET_NOT_FOUND',
  ASSIGNMENT_SERVICE_NOT_OFFERED = 'SURVEY_ASSIGNMENT_SERVICE_NOT_OFFERED',
  ASSIGNMENT_CARE_TYPE_UNSUPPORTED = 'SURVEY_ASSIGNMENT_CARE_TYPE_UNSUPPORTED',

  // --- Unicidad que el modelo debe respaldar (409) ---
  ANSWER_DUPLICATE = 'SURVEY_ANSWER_DUPLICATE',
  ASSIGNMENT_ALREADY_ACTIVE = 'SURVEY_ASSIGNMENT_ALREADY_ACTIVE',
  VERSION_NUMBER_TAKEN = 'SURVEY_VERSION_NUMBER_TAKEN',
  RESPONSE_ALREADY_SUBMITTED = 'SURVEY_RESPONSE_ALREADY_SUBMITTED',
}
