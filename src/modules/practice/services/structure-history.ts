/**
 * Claves de `HistoryRepository` para la estructura física de `practice`.
 *
 * Son los nombres de tabla sin el sufijo `_history`: `audit.practice_sites_history`,
 * `audit.clinical_units_history` y `audit.care_spaces_history`.
 */
export const STRUCTURE_HISTORY = {
  site: 'practice_sites',
  unit: 'clinical_units',
  space: 'care_spaces',
} as const;

/**
 * Foto de una fila de estructura para `data_snapshot`.
 *
 * Copia las propiedades propias de datos de la entidad, sin funciones ni las
 * internas de MikroORM (`__*`). Es genérica a propósito: las entidades se
 * regeneran desde el modelo (ADR-0022) y una lista de campos escrita a mano
 * dejaría fuera, sin avisar, cada columna que el modelo agregue.
 *
 * @param entity - Sede, unidad o espacio ya persistido.
 * @returns Objeto plano serializable a `jsonb`.
 */
export function structureSnapshot(entity: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(entity).filter(
      ([key, value]) => !key.startsWith('__') && typeof value !== 'function',
    ),
  );
}
