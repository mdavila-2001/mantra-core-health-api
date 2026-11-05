/**
 * Catálogo de sub-códigos de negocio estables del módulo `medical_groups`.
 *
 * `DomainException` ya lleva un `code` genérico (NOT_FOUND, CONFLICT…), común a
 * todo el API. `MedicalGroupsErrorReason` añade el **cuál** dentro de ese tipo
 * para que un cliente ramifique sobre un valor estable sin parsear `message`.
 */
export enum MedicalGroupsErrorReason {
  /**
   * El paciente no existe o el solicitante no tiene base clínica para leer su
   * historia. Ambos casos responden igual: un profesional sin relación con el
   * paciente no puede distinguir «no existe» de «es de otra organización».
   */
  MEDICAL_GROUP_PATIENT_NOT_AVAILABLE = 'MEDICAL_GROUP_PATIENT_NOT_AVAILABLE',

  /**
   * El profesional invitado no existe o no tiene vinculación activa en una
   * práctica de la organización del grupo.
   */
  MEDICAL_GROUP_PRACTITIONER_NOT_AVAILABLE = 'MEDICAL_GROUP_PRACTITIONER_NOT_AVAILABLE',
}
