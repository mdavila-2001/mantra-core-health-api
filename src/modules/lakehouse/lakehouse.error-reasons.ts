/**
 * Catálogo de sub-códigos de negocio estables del módulo `lakehouse`.
 *
 * `DomainException` ya lleva un `code` genérico (NOT_FOUND, VALIDATION_FAILED…),
 * común a todo el API. `LakehouseErrorReason` añade el **cuál** dentro de ese
 * tipo para que un cliente ramifique sobre un valor estable sin parsear
 * `message`.
 */
export enum LakehouseErrorReason {
  /**
   * El recurso (producto, versión, dataset, definición, corrida, proyecto,
   * cohorte, perfil, solicitud o manifiesto) no existe o pertenece a otro
   * tenant. Ambos casos responden igual: distinguirlos confirmaría que un UUID
   * existe en otra organización.
   */
  LAKEHOUSE_RESOURCE_OUTSIDE_TENANT = 'LAKEHOUSE_RESOURCE_OUTSIDE_TENANT',

  /** El `tenantId` del cuerpo no coincide con el tenant activo del actor. */
  LAKEHOUSE_TENANT_MISMATCH = 'LAKEHOUSE_TENANT_MISMATCH',

  /**
   * Falta un valor que la tabla exige (`NOT NULL`) y que no tiene un default
   * de negocio. Se rechaza antes de persistir.
   */
  LAKEHOUSE_REQUIRED_FIELD_MISSING = 'LAKEHOUSE_REQUIRED_FIELD_MISSING',
}
