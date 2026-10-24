/**
 * Catálogo de sub-códigos de negocio (`reason`) de las excepciones de dominio
 * que lanza el módulo `quotations`. `code` dice la forma HTTP del error;
 * `reason` dice cuál fue, para que un cliente ramifique sin parsear `message`.
 */
export enum QuotationsErrorReason {
  /**
   * El paciente (o la cita que se le atribuye) no está disponible para quien
   * cotiza o lista: no existe, no es de la organización de la práctica, o el
   * actor no tiene base clínica sobre él. Es el mismo 404 en todos los casos, a
   * propósito: probar uuids no confirma qué pacientes existen ni cuáles tiene
   * la práctica de al lado.
   */
  QUOTATION_PATIENT_NOT_AVAILABLE = 'QUOTATION_PATIENT_NOT_AVAILABLE',
}
