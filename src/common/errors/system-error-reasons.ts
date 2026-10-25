/**
 * Catálogo de sub-códigos (`reason`) para errores de sistema: los que no
 * dependen de ninguna regla de negocio sino del motor de datos, la red o la
 * petición HTTP en sí. Viven junto al `code` genérico en el cuerpo de error
 * (ej. `code: CONFLICT, reason: UNIQUE_CONSTRAINT_VIOLATION`) para que el
 * front pueda distinguir "ya existe" de "se pisó con otra cita" sin parsear
 * `message`.
 *
 * Complementa, a nivel de sistema, lo que cada `<modulo>.error-reasons.ts`
 * aporta a nivel de negocio.
 */
export enum SystemErrorReason {
  OPTIMISTIC_LOCK_CONFLICT = 'OPTIMISTIC_LOCK_CONFLICT',
  UNIQUE_CONSTRAINT_VIOLATION = 'UNIQUE_CONSTRAINT_VIOLATION',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',
  REQUIRED_FIELD_VIOLATION = 'REQUIRED_FIELD_VIOLATION',
  EXCLUSION_CONSTRAINT_VIOLATION = 'EXCLUSION_CONSTRAINT_VIOLATION',
  DEADLOCK_DETECTED = 'DEADLOCK_DETECTED',
  SERIALIZATION_FAILURE = 'SERIALIZATION_FAILURE',
  ROW_LOCKED = 'ROW_LOCKED',
  DATABASE_CONNECTION_UNAVAILABLE = 'DATABASE_CONNECTION_UNAVAILABLE',
  DATABASE_SATURATED = 'DATABASE_SATURATED',
  QUERY_TIMEOUT = 'QUERY_TIMEOUT',
  MALFORMED_VALUE = 'MALFORMED_VALUE',
  REQUEST_BODY_TOO_LARGE = 'REQUEST_BODY_TOO_LARGE',
  REQUEST_BODY_MALFORMED = 'REQUEST_BODY_MALFORMED',
  VALIDATION_PIPE_REJECTED = 'VALIDATION_PIPE_REJECTED',
  /** `?limit=` fuera de rango o no entero (`ParseOptionalLimitPipe`). */
  INVALID_LIMIT = 'INVALID_LIMIT',
  /** `?ids=` vacío, demasiado largo o con elementos que no son UUID. */
  INVALID_UUID_LIST = 'INVALID_UUID_LIST',
  /** Cursor de paginación keyset corrupto o con forma inválida. */
  INVALID_CURSOR = 'INVALID_CURSOR',
  /** `?from=`/`?to=` y similares: fecha que no es ISO 8601. */
  INVALID_DATE = 'INVALID_DATE',
  /** 401: el access token no trae identificador de sesión. */
  SESSION_REQUIRED = 'SESSION_REQUIRED',
  /** 401: la sesión del token fue revocada, venció o no está activa. */
  SESSION_INACTIVE = 'SESSION_INACTIVE',
  /** 401: el token firmado no es de tipo `access`. */
  TOKEN_TYPE_INVALID = 'TOKEN_TYPE_INVALID',
  /** 403: ningún rol del actor autoriza la operación en el tenant resuelto. */
  ROLE_INSUFFICIENT = 'ROLE_INSUFFICIENT',
  /** 403: `X-Tenant-Id` nombra un tenant del que el actor no es miembro. */
  TENANT_MEMBERSHIP_REQUIRED = 'TENANT_MEMBERSHIP_REQUIRED',
  /** 403: el actor no tiene tenant y no indicó cuál usar. */
  TENANT_REQUIRED = 'TENANT_REQUIRED',
  /** 403: el actor tiene varios tenants y no indicó cuál usar. */
  TENANT_AMBIGUOUS = 'TENANT_AMBIGUOUS',
  /** 403: ruta, cuerpo o query declaran un tenant distinto del resuelto. */
  TENANT_SCOPE_CONFLICT = 'TENANT_SCOPE_CONFLICT',
  /** 403: un actor privilegiado declara tenants propietarios contradictorios. */
  TENANT_DECLARATION_CONFLICT = 'TENANT_DECLARATION_CONFLICT',
  /**
   * 500: un secreto cifrado almacenado no se puede descifrar (formato roto,
   * dato corrupto o clave distinta). No expone el secreto ni la causa.
   */
  SECRET_CIPHER_INVALID = 'SECRET_CIPHER_INVALID',
  /** 503: `/readiness` — alguna dependencia obligatoria no responde. */
  SYSTEM_READINESS_DEPENDENCY_UNAVAILABLE = 'SYSTEM_READINESS_DEPENDENCY_UNAVAILABLE',
}
