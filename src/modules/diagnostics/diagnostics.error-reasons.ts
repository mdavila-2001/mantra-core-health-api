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
  /** El equipo del paso no está ubicado en una sala: sin sala no hay SPS Location. */
  IMAGING_EQUIPMENT_NOT_LOCATED = 'IMAGING_EQUIPMENT_NOT_LOCATED',
  /** El equipo está en mantenimiento o fuera de servicio: no se programan estudios en él. */
  IMAGING_EQUIPMENT_UNAVAILABLE = 'IMAGING_EQUIPMENT_UNAVAILABLE',
  /** La worklist se pide por estación: falta el equipo o el AE Title. */
  IMAGING_WORKLIST_STATION_REQUIRED = 'IMAGING_WORKLIST_STATION_REQUIRED',
}
