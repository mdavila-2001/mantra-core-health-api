/**
 * Campos de auditoría comunes a (casi) toda entidad del modelo: marcas de
 * creación/actualización y autor. Centralizarlos evita repetir el mismo bloque
 * en cada `em.create` y garantiza que `createdBy`/`updatedBy` se pueblen de forma
 * consistente para la trazabilidad de seguridad.
 *
 * `rowVersion` se omite a propósito: la columna tiene `DEFAULT 1` a nivel de base
 * (ver TerminologySeedService.ensureRowVersionDefaults) y MikroORM la gestiona.
 */
export interface AuditableCreate {
  /**
   * Fecha y hora en que se creó el registro.
   */
  createdAt: Date;
  /**
   * Fecha y hora de la última actualización.
   */
  updatedAt: Date;
  /**
   * Identificador asociado a created by user.
   */
  createdByUserId?: string;
  /**
   * Identificador asociado a updated by user.
   */
  updatedByUserId?: string;
}

/** Construye los campos de auditoría para una operación de alta. */
export function createdBy(
  userId?: string,
  now: Date = new Date(),
): AuditableCreate {
  return {
    createdAt: now,
    updatedAt: now,
    createdByUserId: userId,
    updatedByUserId: userId,
  };
}

/** Actualiza las marcas de modificación conservando las de creación. */
export function touch<
  T extends {
    /**
     * Fecha y hora de la última actualización.
     */
    updatedAt: Date; /**
     * Identificador asociado a updated by user.
     */
    updatedByUserId?: string;
  },
>(entity: T, userId?: string, now: Date = new Date()): T {
  entity.updatedAt = now;
  entity.updatedByUserId = userId;
  return entity;
}
