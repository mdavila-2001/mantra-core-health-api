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
  /** El alcance de la asignación (sede, unidad, espacio) exige el nodo al que se asigna. */
  DELEGATED_ASSIGNMENT_SCOPE_NODE_REQUIRED = 'DELEGATED_ASSIGNMENT_SCOPE_NODE_REQUIRED',
  /** La membresía de la asignación no existe. */
  DELEGATED_MEMBERSHIP_NOT_FOUND = 'DELEGATED_MEMBERSHIP_NOT_FOUND',
  /** El nodo del alcance (práctica, sede, unidad, espacio…) no existe o es de otro tenant que la membresía. */
  DELEGATED_SCOPE_NODE_NOT_FOUND = 'DELEGATED_SCOPE_NODE_NOT_FOUND',
}
