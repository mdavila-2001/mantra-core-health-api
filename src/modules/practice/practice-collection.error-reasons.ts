/**
 * Sub-códigos de los puntos de toma de muestras (F5b de infraestructura
 * hospitalaria, CONTRATO-F2-F5). Van en el 3er argumento (`reason`) de
 * `DomainException`; un cliente ramifica sobre ellos sin parsear `message`.
 */
export enum CollectionPointErrorReason {
  /**
   * El espacio no es un punto de toma válido de la sede: otra sede, otra función,
   * fuera de ciclo, bloqueado o en limpieza. Una sola respuesta para todos los
   * casos: no confirma si el espacio existe en otra organización.
   */
  COLLECTION_POINT_INVALID = 'COLLECTION_POINT_INVALID',
  /** Un punto de toma sin la sede a la que pertenece (el modelo exige el par). */
  COLLECTION_POINT_REQUIRES_SITE = 'COLLECTION_POINT_REQUIRES_SITE',
}
