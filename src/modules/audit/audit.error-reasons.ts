/**
 * Catálogo de sub-códigos de negocio estables del módulo `audit`. Se usan como
 * 5.º argumento (`reason`) de `DomainException`, encima del `code` genérico que
 * ya fija el status HTTP.
 */
export enum AuditErrorReason {
  /** El rango pedido a la verificación de integridad no es un entero válido. */
  INTEGRITY_RANGE_INVALID = 'AUDIT_INTEGRITY_RANGE_INVALID',
}
