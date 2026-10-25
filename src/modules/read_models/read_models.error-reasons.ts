/**
 * Sub-códigos de negocio estables del módulo `read_models`.
 *
 * Van en el 3er argumento (`reason`) de `DomainException` y sus subclases.
 * Un cliente puede ramificar sobre `reason` sin parsear `message`.
 */
export enum ReadModelsErrorReason {
  /**
   * El portal, la ruta o la vista pedida no existe o el actor no cumple su
   * contrato de acceso (audiencia, permiso, propósito, feature flag o contexto
   * exigido). Todos los casos responden igual: distinguirlos confirmaría que el
   * contrato existe y qué le falta al actor.
   */
  READ_MODEL_VIEW_OUT_OF_SCOPE = 'READ_MODEL_VIEW_OUT_OF_SCOPE',
  /**
   * La proyección no se puede servir: la definición no está activa, no está
   * materializada, su nombre físico o sus columnas no son válidos, o no declara
   * una política de aislamiento. Nunca se responde una lista vacía en su lugar.
   */
  READ_MODEL_PROJECTION_UNAVAILABLE = 'READ_MODEL_PROJECTION_UNAVAILABLE',
  /** El cursor de paginación está alterado, vencido o es de otra consulta. */
  READ_MODEL_CURSOR_INVALID = 'READ_MODEL_CURSOR_INVALID',
  /** El filtro, el orden o la columna pedidos no están en el contrato de la vista. */
  READ_MODEL_QUERY_NOT_ALLOWED = 'READ_MODEL_QUERY_NOT_ALLOWED',
}
