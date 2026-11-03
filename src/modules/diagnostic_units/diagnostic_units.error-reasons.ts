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
}
