/**
 * Catálogo de sub-códigos de negocio estables para el módulo `insurance`
 * (aseguradoras, coberturas, reclamos y conciliación). Se usan como 3er
 * argumento (`reason`) de `DomainException` y sus subclases, encima del `code`
 * genérico (NOT_FOUND, etc.) que ya fija el status HTTP.
 *
 * Los `*_NOT_AVAILABLE` se lanzan igual para un UUID inexistente que para uno
 * fuera del alcance del tenant activo: distinguirlos le confirmaría a un tercero
 * que el recurso existe en otra organización.
 */
export enum InsuranceErrorReason {
  /**
   * Lote de conciliación, aseguradora, prestador, reclamo o versión de
   * adjudicación que no existen o no pertenecen a la relación
   * aseguradora–prestador del tenant activo.
   */
  RECONCILIATION_RESOURCE_NOT_AVAILABLE = 'INSURANCE_RECONCILIATION_RESOURCE_NOT_AVAILABLE',
}
