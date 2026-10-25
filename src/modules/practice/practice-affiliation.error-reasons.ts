/**
 * Sub-códigos de negocio de la afiliación de profesionales a centros.
 *
 * Van en el 3er argumento (`reason`) de `DomainException` y sus subclases.
 */
export enum PracticeAffiliationErrorReason {
  /** La vinculación no está en el estado desde el que se puede hacer esa acción. */
  ASSIGNMENT_STATE_NOT_ALLOWED = 'ASSIGNMENT_STATE_NOT_ALLOWED',
  /** El procedimiento no lo publica y mantiene activo esa sede. */
  SERVICE_NOT_OFFERED_BY_SITE = 'SERVICE_NOT_OFFERED_BY_SITE',
  /** Ya hay una vinculación en curso del profesional con ese procedimiento en esa sede. */
  ASSIGNMENT_ALREADY_OPEN = 'ASSIGNMENT_ALREADY_OPEN',
}
