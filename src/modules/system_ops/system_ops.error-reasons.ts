/**
 * Catálogo de sub-códigos de negocio estables del módulo `system_ops`.
 *
 * `DomainException` lleva un `code` genérico HTTP-level (NOT_FOUND,
 * PRECONDITION_FAILED…), común a todo el API; `reason` dice **cuál** error de
 * ese tipo fue. Un cliente puede ramificar sobre `reason` sin parsear `message`.
 */
export enum SystemOpsErrorReason {
  /**
   * La entidad del registro no tiene un ejecutor de retención registrado: el
   * barrido no puede seleccionar ni disponer sus filas, así que se rechaza en
   * lugar de informar un éxito sin efecto.
   */
  SYSOPS_RETENTION_EXECUTOR_UNSUPPORTED = 'SYSOPS_RETENTION_EXECUTOR_UNSUPPORTED',
  /** La política de retención no declara plazo o disposición ejecutables. */
  SYSOPS_RETENTION_POLICY_INCOMPLETE = 'SYSOPS_RETENTION_POLICY_INCOMPLETE',

  /** El tenant, la política o un concepto/región del binding no existen (o no son los de la FK). */
  SYSOPS_RESIDENCY_REFERENCE_NOT_FOUND = 'SYSOPS_RESIDENCY_REFERENCE_NOT_FOUND',
  /** La política de residencia no está activa o está fuera de su vigencia. */
  SYSOPS_RESIDENCY_POLICY_NOT_EFFECTIVE = 'SYSOPS_RESIDENCY_POLICY_NOT_EFFECTIVE',
  /** La región primaria o de recuperación queda fuera del conjunto que la política permite. */
  SYSOPS_RESIDENCY_REGION_NOT_ALLOWED = 'SYSOPS_RESIDENCY_REGION_NOT_ALLOWED',
}
