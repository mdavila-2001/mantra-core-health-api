/**
 * Catálogo de sub-códigos de negocio estables del módulo `system_context`.
 *
 * `DomainException` lleva un `code` genérico HTTP-level (CONFLICT,
 * VALIDATION_FAILED…), común a todo el API; `reason` dice **cuál** error de ese
 * tipo fue. Un cliente puede ramificar sobre `reason` sin parsear `message`.
 */
export enum SystemContextErrorReason {
  /** Una entrada no ausente no trae su procedencia completa (esquema, entidad, registro y hash). */
  SYSTEM_CONTEXT_INPUT_PROVENANCE_REQUIRED = 'SYSTEM_CONTEXT_INPUT_PROVENANCE_REQUIRED',
  /** El contenido del contexto supera el tamaño admitido. */
  SYSTEM_CONTEXT_PAYLOAD_TOO_LARGE = 'SYSTEM_CONTEXT_PAYLOAD_TOO_LARGE',
  /**
   * El binding choca con otro vivo: mismo campo destino de una enumeración, o
   * ventana de consumidor solapada para un contexto.
   */
  SYSTEM_CONTEXT_BINDING_CONFLICT = 'SYSTEM_CONTEXT_BINDING_CONFLICT',
}
