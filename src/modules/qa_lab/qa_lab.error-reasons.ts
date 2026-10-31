/**
 * Sub-códigos de negocio estables del módulo `qa_lab`.
 *
 * Van en el 3er argumento (`reason`) de `DomainException` y sus subclases.
 * Un cliente puede ramificar sobre `reason` sin parsear `message`.
 */
export enum QaLabErrorReason {
  /**
   * La suite, el entorno, la corrida, el caso, el resultado o el defecto pedido
   * no existe o es de otro tenant. Los dos casos responden igual: distinguirlos
   * confirmaría que el uuid existe en otra organización.
   */
  QA_LAB_RESOURCE_OUT_OF_SCOPE = 'QA_LAB_RESOURCE_OUT_OF_SCOPE',
}
