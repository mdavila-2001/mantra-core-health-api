/**
 * Sub-códigos de negocio estables para los errores de dominio de
 * `document_store`.
 *
 * Van como tercer argumento de `DomainException` (y subclases): el `code`
 * dice la forma HTTP del error y `reason` cuál de las situaciones ocurrió.
 */
export enum DocumentStoreErrorReason {
  /**
   * El documento no existe, está borrado, tiene un id inválido o pertenece a
   * otro tenant. Se responde igual en todos los casos para no confirmar que un
   * documento existe en otra organización.
   */
  DOCUMENT_NOT_AVAILABLE = 'DOCUMENT_NOT_AVAILABLE',
}
