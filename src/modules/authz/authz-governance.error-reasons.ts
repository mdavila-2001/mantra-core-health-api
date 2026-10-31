/**
 * Motivos estables de los rechazos del gobierno de acceso: ciclo de vida del usuario interno,
 * revisión periódica de accesos y permisos por alcance de recurso. El cliente ramifica por estos
 * valores (`reason` en la raíz del cuerpo de error), nunca por el texto del mensaje.
 */
export enum AuthzGovernanceErrorReason {
  /** No existe el usuario sobre el que se pidió la acción. */
  USER_LIFECYCLE_USER_NOT_FOUND = 'USER_LIFECYCLE_USER_NOT_FOUND',
  /** Se pidió suspender una cuenta que ya no está activa. */
  USER_LIFECYCLE_NOT_ACTIVE = 'USER_LIFECYCLE_NOT_ACTIVE',
  /** Se pidió reactivar una cuenta que no está suspendida. */
  USER_LIFECYCLE_NOT_SUSPENDED = 'USER_LIFECYCLE_NOT_SUSPENDED',
  /** La cuenta está anonimizada (DSAR): ya no admite ninguna transición. */
  USER_LIFECYCLE_ANONYMIZED = 'USER_LIFECYCLE_ANONYMIZED',
  /** La baja ya se dio: no se repite. */
  USER_LIFECYCLE_ALREADY_OFFBOARDED = 'USER_LIFECYCLE_ALREADY_OFFBOARDED',
  /** Quien pide la acción es la propia persona: nadie se suspende ni se da de baja a sí mismo. */
  USER_LIFECYCLE_SELF_ACTION = 'USER_LIFECYCLE_SELF_ACTION',

  /** No existe el usuario cuya revisión de accesos se pidió. */
  ACCESS_REVIEW_USER_NOT_FOUND = 'ACCESS_REVIEW_USER_NOT_FOUND',
  /** Se pidió revisar los accesos de la propia cuenta. */
  ACCESS_REVIEW_SELF_REVIEW = 'ACCESS_REVIEW_SELF_REVIEW',
  /** Alguna asignación citada en la revisión no es de ese usuario o ya no está activa. */
  ACCESS_REVIEW_ASSIGNMENT_MISMATCH = 'ACCESS_REVIEW_ASSIGNMENT_MISMATCH',

  /** No existe el permiso por alcance de recurso. */
  RESOURCE_SCOPE_GRANT_NOT_FOUND = 'RESOURCE_SCOPE_GRANT_NOT_FOUND',
  /** El permiso por alcance de recurso ya terminó su vigencia. */
  RESOURCE_SCOPE_GRANT_ALREADY_ENDED = 'RESOURCE_SCOPE_GRANT_ALREADY_ENDED',
}
