/**
 * Catálogo de sub-códigos de negocio estables del módulo `delegated_access`. Se
 * usan como tercer argumento (`reason`) de las excepciones de dominio, para que
 * un cliente pueda ramificar sobre el caso exacto sin parsear el `message`.
 */
export enum DelegatedAccessErrorReason {
  /** El tenant del cuerpo no coincide con el tenant activo del actor. */
  DELEGATED_TENANT_SCOPE_REQUIRED = 'DELEGATED_TENANT_SCOPE_REQUIRED',
  /** El set de permisos no existe o no pertenece al tenant activo. */
  DELEGATED_PERMISSION_SET_NOT_FOUND = 'DELEGATED_PERMISSION_SET_NOT_FOUND',
  /** La delegación no existe o no pertenece al tenant activo. */
  DELEGATED_DELEGATION_NOT_FOUND = 'DELEGATED_DELEGATION_NOT_FOUND',
  /** La asignación de usuario de organización no existe o es de otro tenant. */
  DELEGATED_ORG_ASSIGNMENT_NOT_FOUND = 'DELEGATED_ORG_ASSIGNMENT_NOT_FOUND',
  /** La asignación de rol del profesional no existe o es de otro tenant. */
  DELEGATED_ROLE_ASSIGNMENT_NOT_FOUND = 'DELEGATED_ROLE_ASSIGNMENT_NOT_FOUND',
  /** El encuentro no existe, es de otro tenant o no es del paciente indicado. */
  DELEGATED_ENCOUNTER_NOT_FOUND = 'DELEGATED_ENCOUNTER_NOT_FOUND',
  /** El paciente indicado no existe. */
  DELEGATED_PATIENT_NOT_FOUND = 'DELEGATED_PATIENT_NOT_FOUND',
  /** El usuario evaluado no es el titular de la asignación del delegado (resultado de evaluación). */
  DELEGATED_SUBJECT_MISMATCH = 'DELEGATED_SUBJECT_MISMATCH',
  /** El cuerpo no trae exactamente uno de `encounterId` o `medicationRequestId`. */
  PRESCRIPTION_SHARE_TARGET_INVALID = 'PRESCRIPTION_SHARE_TARGET_INVALID',
  /** La receta no tiene ningún ítem emitido y vigente que compartir. */
  PRESCRIPTION_SHARE_NO_ACTIVE_ITEMS = 'PRESCRIPTION_SHARE_NO_ACTIVE_ITEMS',
  /** El enlace venció, o la receta que comparte dejó de estar vigente. */
  PRESCRIPTION_SHARE_EXPIRED = 'PRESCRIPTION_SHARE_EXPIRED',
  /** El paciente o quien lo creó revocó el enlace. */
  PRESCRIPTION_SHARE_REVOKED = 'PRESCRIPTION_SHARE_REVOKED',
}
