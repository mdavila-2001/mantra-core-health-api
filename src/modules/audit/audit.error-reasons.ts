/**
 * Catálogo de sub-códigos de negocio estables del módulo `audit`. Se usan como
 * 5.º argumento (`reason`) de `DomainException`, encima del `code` genérico que
 * ya fija el status HTTP.
 */
export enum AuditErrorReason {
  /** El rango pedido a la verificación de integridad no es un entero válido. */
  INTEGRITY_RANGE_INVALID = 'AUDIT_INTEGRITY_RANGE_INVALID',
  /** La cuenta no es la de un paciente: no hay historia propia cuyo registro de accesos consultar. */
  PATIENT_PROFILE_NOT_FOUND = 'AUDIT_PATIENT_PROFILE_NOT_FOUND',
}
