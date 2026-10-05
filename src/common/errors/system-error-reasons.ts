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
}
