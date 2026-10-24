/**
 * Catálogo de sub-códigos de negocio (`reason`) de las excepciones de dominio
 * que lanza el módulo `medical_groups`. `code` dice la forma HTTP del error;
 * `reason` dice cuál fue, para que un cliente ramifique sin parsear `message`.
 */
export enum MedicalGroupsErrorReason {
  /**
   * El paciente asociado al grupo no está disponible para quien lo crea: no
   * existe, o el actor no tiene base clínica sobre él (política de lectura de la
   * historia). Es el mismo 404 en ambos casos, a propósito: probar uuids no
   * confirma qué pacientes existen ni cuáles atiende otra organización.
   */
  MEDICAL_GROUP_PATIENT_NOT_AVAILABLE = 'MEDICAL_GROUP_PATIENT_NOT_AVAILABLE',
}
