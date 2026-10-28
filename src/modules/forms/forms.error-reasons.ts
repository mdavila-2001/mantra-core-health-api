/**
 * Catálogo de sub-códigos de negocio estables del módulo `forms`. Se usan como
 * `reason` de `DomainException` y sus subclases, encima del `code` genérico que
 * ya fija el status HTTP.
 */
export enum FormsErrorReason {
  /**
   * La instancia (o el encuentro que la ancla) no existe, es de otro tenant o el
   * actor no puede leer la historia del paciente. Las tres causas responden
   * igual: distinguirlas confirmaría que el UUID existe.
   */
  FORM_INSTANCE_OUT_OF_SCOPE = 'FORM_INSTANCE_OUT_OF_SCOPE',
}
