/**
 * Sub-códigos de negocio estables para los errores de dominio de `terminology`.
 * Van como `reason` de `DomainException` (y subclases), encima del `code`
 * genérico (NOT_FOUND, etc.) que ya fija el status HTTP.
 *
 * `TENANT_NOT_AVAILABLE` se lanza igual para un tenant inexistente que para uno
 * ajeno al contexto de la petición: distinguirlos confirmaría a un tercero que
 * ese tenant existe.
 */
export enum TerminologyErrorReason {
  TENANT_NOT_AVAILABLE = 'TERMINOLOGY_TENANT_NOT_AVAILABLE',
}
