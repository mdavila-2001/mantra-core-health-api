/**
 * Sub-códigos de negocio estables del módulo `quotations`.
 *
 * Van en el 3er argumento (`reason`) de `DomainException` y sus subclases.
 * Un cliente puede ramificar sobre `reason` sin parsear `message`.
 */
export enum QuotationsErrorReason {
  /**
   * El paciente (o la cita) de la cotización no existe, no es del tenant activo
   * o el actor no tiene una base clínica para tratarlo. Los tres casos responden
   * igual: distinguirlos confirmaría que el uuid existe.
   */
  QUOTATION_PATIENT_NOT_AVAILABLE = 'QUOTATION_PATIENT_NOT_AVAILABLE',
}
