/**
 * Sub-códigos de negocio estables del módulo `practice`.
 *
 * Van en el 3er argumento (`reason`) de `DomainException` y sus subclases.
 * Un cliente puede ramificar sobre `reason` sin parsear `message`.
 */
export enum PracticeErrorReason {
  /**
   * La práctica, sede, vinculación, acreditación o insumo pedido por uuid no
   * existe o es de otro tenant. Los dos casos responden igual: distinguirlos
   * confirmaría que el uuid existe en otra organización.
   */
  PRACTICE_RESOURCE_OUT_OF_SCOPE = 'PRACTICE_RESOURCE_OUT_OF_SCOPE',
}
