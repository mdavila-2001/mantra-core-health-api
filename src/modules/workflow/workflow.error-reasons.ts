/**
 * Catálogo de sub-códigos de negocio estables del módulo `workflow`. Se usan
 * como `reason` de `DomainException`, encima del `code` genérico que ya fija el
 * status HTTP.
 */
export enum WorkflowErrorReason {
  /**
   * El comando no declara el propósito de uso que la transición exige, o declara
   * uno distinto. Responde igual en ambos casos y sin `details`: nombrar el
   * propósito requerido revelaría cómo está configurada la transición.
   */
  PURPOSE_NOT_ALLOWED = 'WORKFLOW_PURPOSE_NOT_ALLOWED',
}
