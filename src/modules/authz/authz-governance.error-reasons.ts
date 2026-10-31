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
  /**
   * El usuario objetivo ejerce `SUPERADMIN` y quien actúa no: sólo otro `SUPERADMIN` puede
   * suspenderlo, reactivarlo, darlo de baja o revisar sus accesos.
   */
  GOVERNANCE_TARGET_REQUIRES_SUPERADMIN = 'GOVERNANCE_TARGET_REQUIRES_SUPERADMIN',
  /**
   * El usuario objetivo es administrador de seguridad de plataforma (rol global, sin ámbito de
   * tenant) y quien actúa tiene alcance de una organización: sólo la plataforma actúa sobre él.
   */
  GOVERNANCE_TARGET_REQUIRES_PLATFORM = 'GOVERNANCE_TARGET_REQUIRES_PLATFORM',
  /**
   * Un administrador con alcance quiso suspender, reactivar o dar de baja una cuenta que también
   * pertenece a otros tenants: la cuenta es una sola, así que el efecto cruzaría organizaciones.
   * Lo hace un administrador de plataforma.
   */
  USER_LIFECYCLE_MULTI_TENANT = 'USER_LIFECYCLE_MULTI_TENANT',

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
  /** Terminar un permiso de efecto DENY exige un motivo (levantar una denegación abre un acceso). */
  RESOURCE_SCOPE_GRANT_DENY_REASON_REQUIRED = 'RESOURCE_SCOPE_GRANT_DENY_REASON_REQUIRED',
}
