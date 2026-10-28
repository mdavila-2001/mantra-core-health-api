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

  // --- Unicidad que el modelo debe respaldar (409) ---
  ANSWER_DUPLICATE = 'SURVEY_ANSWER_DUPLICATE',
  ASSIGNMENT_ALREADY_ACTIVE = 'SURVEY_ASSIGNMENT_ALREADY_ACTIVE',
  VERSION_NUMBER_TAKEN = 'SURVEY_VERSION_NUMBER_TAKEN',
  RESPONSE_ALREADY_SUBMITTED = 'SURVEY_RESPONSE_ALREADY_SUBMITTED',
}
