/**
 * Sub-códigos de negocio estables para los errores de dominio de
 * `diagnostic_units`.
 *
 * Van como tercer argumento de `DomainException` (y subclases) además del
 * `code` genérico de la clase: el `code` dice la forma HTTP del error y
 * `reason` cuál de las situaciones de negocio ocurrió.
 */
export enum DiagnosticUnitsErrorReason {
  /**
   * El recurso (unidad, sitio, acreditación, equipo, oferta, cronograma o
   * precio) no existe o pertenece a otro tenant. Se responde igual en los dos
   * casos para no confirmar que un UUID existe en otra organización.
   */
  DIAGNOSTIC_UNIT_RESOURCE_OUT_OF_SCOPE = 'DIAGNOSTIC_UNIT_RESOURCE_OUT_OF_SCOPE',

  // --- Equipo en una sala (F5a) ---------------------------------------------
  /** La sala no es de la misma sede (`practice_site_id`) que el sitio del equipo. */
  EQUIPMENT_SPACE_SITE_MISMATCH = 'EQUIPMENT_SPACE_SITE_MISMATCH',
  /** La función de la sala no aloja equipos (o una modalidad exige sala de imagen). */
  SPACE_CANNOT_HOST_EQUIPMENT = 'SPACE_CANNOT_HOST_EQUIPMENT',
  /** La sala no está activa: un equipo no se ubica en un espacio planificado, suspendido o clausurado. */
  EQUIPMENT_SPACE_NOT_ACTIVE = 'EQUIPMENT_SPACE_NOT_ACTIVE',
  /** Otro equipo del mismo sitio ya usa ese AE Title. */
  AE_TITLE_TAKEN = 'AE_TITLE_TAKEN',
  /** El AE Title no cumple DICOM: 1 a 16 caracteres imprimibles, sin barra invertida, no solo espacios. */
  AE_TITLE_INVALID = 'AE_TITLE_INVALID',
  /** El nombre de la estación (0040,0010) no cumple DICOM: 1 a 16 caracteres imprimibles, sin barra invertida. */
  STATION_NAME_INVALID = 'STATION_NAME_INVALID',
  /** El estado operativo no es uno de los del equipo (operativo, mantenimiento, fuera de servicio). */
  EQUIPMENT_STATUS_INVALID = 'EQUIPMENT_STATUS_INVALID',
  /** El equipo tiene reservas futuras: reprogramarlas, o reconocerlas para sacarlo de servicio. */
  FUTURE_COMMITMENTS_CONFLICT = 'FUTURE_COMMITMENTS_CONFLICT',
  /** La agenda del equipo no está disponible en este despliegue. */
  EQUIPMENT_AGENDA_UNAVAILABLE = 'EQUIPMENT_AGENDA_UNAVAILABLE',
}
