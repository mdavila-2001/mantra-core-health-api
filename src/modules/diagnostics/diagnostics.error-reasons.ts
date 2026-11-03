/**
 * Sub-códigos de negocio estables para los errores de dominio de `diagnostics`.
 *
 * Van como tercer argumento de `DomainException` (y subclases) además del
 * `code` genérico de la clase: el `code` dice la forma HTTP del error y
 * `reason` cuál de las situaciones de negocio ocurrió.
 */
export enum DiagnosticsErrorReason {
  /**
   * El recurso (endpoint, estudio, espécimen, contenedor, informe, notificación
   * crítica, encuentro, orden, observación o archivo) no existe o no pertenece
   * al tenant activo. Se responde igual en los dos casos para no confirmar que
   * un UUID existe en otra organización.
   */
  DIAGNOSTICS_RESOURCE_NOT_AVAILABLE = 'DIAGNOSTICS_RESOURCE_NOT_AVAILABLE',
  /**
   * El paciente no está disponible para el actor: no existe en la organización
   * activa o el profesional no tiene un vínculo asistencial vigente con él.
   */
  DIAGNOSTICS_PATIENT_NOT_AVAILABLE = 'DIAGNOSTICS_PATIENT_NOT_AVAILABLE',
  /**
   * El cuerpo declara como autor a un perfil distinto del profesional que
   * firma la petición.
   */
  DIAGNOSTICS_AUTHOR_NOT_ACTOR = 'DIAGNOSTICS_AUTHOR_NOT_ACTOR',
}
