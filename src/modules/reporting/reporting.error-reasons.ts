/**
 * Sub-códigos de negocio estables del módulo `reporting`.
 *
 * Van en el 3er argumento (`reason`) de `DomainException` y sus subclases.
 * Un cliente puede ramificar sobre `reason` sin parsear `message`.
 */
export enum ReportingErrorReason {
  /**
   * La fuente, definición, ejecución o programación pedida no existe o es de
   * otro tenant. Los dos casos responden igual: distinguirlos confirmaría que
   * el uuid existe en otra organización.
   */
  REPORTING_RESOURCE_OUT_OF_SCOPE = 'REPORTING_RESOURCE_OUT_OF_SCOPE',
}
