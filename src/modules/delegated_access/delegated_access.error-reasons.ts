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
  /** Sede, unidad, espacio, práctica, farmacia, unidad diagnóstica, membresía o supervisor inexistente o de otro tenant (o fuera de la sucursal del actor). */
  DELEGATED_SCOPE_TARGET_NOT_FOUND = 'DELEGATED_SCOPE_TARGET_NOT_FOUND',
  /** El alcance pedido exige su objetivo (sede, unidad, espacio o práctica) y no viene. */
  ASSIGNMENT_SCOPE_TARGET_REQUIRED = 'ASSIGNMENT_SCOPE_TARGET_REQUIRED',
  /** Los objetivos no son coherentes con el alcance (sobra uno, o no son de la misma sede). */
  ASSIGNMENT_SCOPE_TARGET_MISMATCH = 'ASSIGNMENT_SCOPE_TARGET_MISMATCH',
  /** La unidad ya tiene un jefe de servicio vigente en ese período. */
  UNIT_HEAD_ALREADY_ASSIGNED = 'UNIT_HEAD_ALREADY_ASSIGNED',
  /** El actor ve la asignación pero su rol no alcanza para hacer el cambio (`details.requiredRoles`). */
  ASSIGNMENT_ACTION_NOT_ALLOWED = 'ASSIGNMENT_ACTION_NOT_ALLOWED',
  /** Un administrador de sucursal no se asigna roles operativos a sí mismo (separación de funciones). */
  ASSIGNMENT_SELF_NOT_ALLOWED = 'ASSIGNMENT_SELF_NOT_ALLOWED',
  /** La vigencia de la asignación termina antes de empezar. */
  ASSIGNMENT_VALIDITY_INVALID = 'ASSIGNMENT_VALIDITY_INVALID',
}
