import type { EntityManager } from '@mikro-orm/postgresql';

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

/** Lo mínimo de `HistoryRepository` que usa la estructura. */
interface HistoryAppender {
  append(
    em: EntityManager,
    entity: string,
    id: string,
    data: {
      operationConceptId: string;
      dataSnapshot: unknown;
      changedByUserId?: string;
      tenantId?: string;
    },
  ): Promise<void>;
}

/**
 * Sella una revisión de sede, unidad o espacio con su tenant (v4.2.67b: las
 * tres historias tienen `tenant_id` NOT NULL y RLS).
 *
 * @param history - `HistoryRepository`.
 * @param tx - Transacción del llamador.
 * @param kind - Clave de `STRUCTURE_HISTORY`.
 * @param row - Fila ya persistida (tiene `id` y `tenantId`).
 * @param operationConceptId - `AUD.OPERATION_INSERT` / `AUD.OPERATION_UPDATE`.
 * @param actorUserId - Quién cambió.
 */
export function appendStructureRevision(
  history: HistoryAppender,
  tx: EntityManager,
  kind: keyof typeof STRUCTURE_HISTORY,
  row: { id: string; tenantId?: string },
  operationConceptId: string,
  actorUserId: string | undefined,
): Promise<void> {
  return history.append(tx, STRUCTURE_HISTORY[kind], row.id, {
    operationConceptId,
    dataSnapshot: structureSnapshot(row),
    changedByUserId: actorUserId,
    tenantId: row.tenantId,
  });
}
