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
  /** El concepto del servicio no es un procedimiento del nomenclador. */
  SERVICE_CONCEPT_NOT_A_PROCEDURE = 'SERVICE_CONCEPT_NOT_A_PROCEDURE',
  /** El ítem de catálogo no es de la práctica, está inactivo o es de otro procedimiento. */
  CATALOG_ITEM_NOT_ELIGIBLE = 'CATALOG_ITEM_NOT_ELIGIBLE',
  /** La sede ya ofrece ese procedimiento. */
  SERVICE_ALREADY_OFFERED_AT_SITE = 'SERVICE_ALREADY_OFFERED_AT_SITE',
}
