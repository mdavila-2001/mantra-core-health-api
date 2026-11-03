/**
 * Sub-códigos de negocio estables para los errores de dominio de `erp`.
 *
 * Van como tercer argumento de `DomainException` (y subclases): el `code`
 * dice la forma HTTP del error y `reason` cuál de las situaciones ocurrió.
 */
export enum ErpErrorReason {
  /**
   * El recurso (socio, cuenta bancaria, contrato, orden de compra, requisición,
   * factura, arrendamiento, empleado o práctica) no existe o pertenece a otro
   * tenant. Se responde igual en los dos casos para no confirmar que un UUID
   * existe en otra organización.
   */
  ERP_RESOURCE_NOT_FOUND = 'ERP_RESOURCE_NOT_FOUND',
  /**
   * La solicitud de ausencia no existe, no es del empleado de la ruta o el
   * empleado es de otra práctica. Mismo cuerpo en todos los casos.
   */
  ERP_TIME_OFF_NOT_FOUND = 'ERP_TIME_OFF_NOT_FOUND',
  /**
   * Un `EMPLOYEE` sin rol de RR. HH. o administración intentó operar sobre un
   * empleado que no es él mismo.
   */
  ERP_EMPLOYEE_SELF_ONLY = 'ERP_EMPLOYEE_SELF_ONLY',
  /**
   * Una línea de la recepción no existe, está repetida o no pertenece a la
   * orden de compra indicada.
   */
  ERP_PO_ITEM_NOT_IN_ORDER = 'ERP_PO_ITEM_NOT_IN_ORDER',
}
