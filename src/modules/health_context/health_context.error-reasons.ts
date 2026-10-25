/**
 * Catálogo de sub-códigos de negocio estables del módulo `health_context`. Se
 * usan como `reason` de `DomainException` y sus subclases, encima del `code`
 * genérico que ya fija el status HTTP.
 */
export enum HealthContextErrorReason {
  /**
   * La fuente no puede alimentar esa observación: es de otro país que la
   * corrida, o carece de nivel de confianza para que se acepte. No revela cuál.
   */
  SOURCE_NOT_ELIGIBLE = 'HEALTH_CONTEXT_SOURCE_NOT_ELIGIBLE',

  /** Agente o país enviados contradicen los de la programación de la corrida. */
  SCHEDULE_BINDING_MISMATCH = 'HEALTH_CONTEXT_SCHEDULE_BINDING_MISMATCH',

  /** Perdida la carrera por la clave de idempotencia, no se pudo releer la ganadora. */
  IDEMPOTENCY_RESOLUTION_FAILED = 'HEALTH_CONTEXT_IDEMPOTENCY_RESOLUTION_FAILED',
}
