/**
 * Catálogo de sub-códigos de negocio estables del módulo `integration_contracts`.
 *
 * `DomainException` ya lleva un `code` genérico (NOT_FOUND, CONFLICT…), común a
 * todo el API. `IntegrationContractsErrorReason` añade el **cuál** dentro de
 * ese tipo para que un cliente ramifique sobre un valor estable sin parsear
 * `message`.
 */
export enum IntegrationContractsErrorReason {
  /**
   * El recurso (contrato, versión, perfil, suscripción, intercambio o cursor)
   * no existe o su contrato pertenece a otro tenant. Ambos casos responden
   * igual: distinguirlos confirmaría que un UUID existe en otra organización.
   */
  INTEGRATION_RESOURCE_OUT_OF_SCOPE = 'INTEGRATION_RESOURCE_OUT_OF_SCOPE',

  /** Ya existe un contrato con ese código para el proveedor en el tenant. */
  INTEGRATION_CONTRACT_CODE_ALREADY_EXISTS = 'INTEGRATION_CONTRACT_CODE_ALREADY_EXISTS',
}
