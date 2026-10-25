/**
 * Catálogo de sub-códigos de negocio estables para `organization_extensions`.
 *
 * `code` (en `DomainException`) dice el tipo HTTP del error; `reason` dice
 * cuál error concreto de ese tipo fue, dentro de este módulo. Un cliente
 * puede ramificar sobre `reason` sin parsear `message`.
 */
export enum OrganizationExtensionsErrorReason {
  /**
   * El hospital, la licencia, la afiliación o la frontera de datos no existe
   * o no pertenece al tenant activo. Ambos casos responden igual a propósito.
   */
  ORGEXT_RESOURCE_NOT_AVAILABLE = 'ORGEXT_RESOURCE_NOT_AVAILABLE',
}
