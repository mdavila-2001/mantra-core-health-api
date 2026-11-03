/**
 * Catálogo de sub-códigos de negocio estables para `object_storage`.
 *
 * `code` (en `DomainException`) dice el tipo HTTP del error; `reason` dice
 * cuál error concreto de ese tipo fue, dentro de este módulo. Un cliente
 * puede ramificar sobre `reason` sin parsear `message`.
 */
export enum ObjectStorageErrorReason {
  /**
   * La versión no existe o el actor no puede llegar a ella (finalidad no
   * permitida, objeto de otro tenant, historia que no puede leer). Todos los
   * casos responden igual a propósito.
   */
  OBJECT_VERSION_NOT_FOUND = 'OBJECT_VERSION_NOT_FOUND',
  /**
   * Motivo único con el que DICOMweb deniega una instancia fuera de alcance:
   * finalidad omitida o no permitida, estudio ausente o de otro tenant, o
   * historia clínica que el actor no puede leer.
   */
  DICOM_ACCESS_DENIED = 'DICOM_ACCESS_DENIED',
  /**
   * El estudio que se cataloga, o el objeto que una instancia referencia, no
   * existe o no pertenece al tenant del gateway.
   */
  DICOM_CATALOG_OUT_OF_SCOPE = 'DICOM_CATALOG_OUT_OF_SCOPE',
}
