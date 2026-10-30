import type { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException } from '../../../common';
import { PracticeErrorReason, conflict } from '../practice.error-reasons';

/** SQLSTATE y restricción de un error del driver (recorre `cause`). */
function sqlStateOf(
  error: unknown,
): { code: string; constraint?: string } | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    const c = current as { code?: unknown; constraint?: unknown; cause?: unknown };
    if (typeof c.code === 'string' && /^[0-9A-Z]{5}$/.test(c.code)) {
      return {
        code: c.code,
        constraint: typeof c.constraint === 'string' ? c.constraint : undefined,
      };
    }
    current = c.cause;
  }
  return undefined;
}

/**
 * Traduce a errores de contrato lo que la base rechaza en una escritura de
 * estructura (patch v4.2.67b, contrato «Desvíos»).
 *
 * - `23503` (FK, incluidas las compuestas `(tenant_id, x_id)` y el trigger de
 *   servicio de otro tenant): **404** genérico. Nunca se dice qué restricción
 *   falló ni que el padre existe en otro tenant. Los servicios ya comprueban la
 *   pertenencia antes de escribir; esto es la segunda barrera.
 * - `23505` sobre el código SNIS verificado: 409 `SNIS_CODE_UNAVAILABLE`, sin
 *   decir de quién es.
 * - `23505` sobre `(practice_site_id, code)`: 409 `SPACE_CODE_TAKEN` (carrera
 *   entre dos altas con el mismo código).
 *
 * Todo lo demás se relanza tal cual para `AllExceptionsFilter`.
 *
 * @param error - Lo que lanzó el `flush`.
 */
export function translateStructureWriteError(error: unknown): unknown {
  const state = sqlStateOf(error);
  if (!state) return error;
  if (state.code === '23503') {
    return new ResourceNotFoundException('Recurso no encontrado');
  }
  if (state.code === '23505' && state.constraint === 'ux_practice_sites_snis_code') {
    return conflict(
      PracticeErrorReason.SNIS_CODE_UNAVAILABLE,
      'El código SNIS no está disponible',
      {},
    );
  }
  if (state.code === '23505' && state.constraint === 'ux_care_spaces_site_code') {
    return conflict(
      PracticeErrorReason.SPACE_CODE_TAKEN,
      'Ya existe un espacio con ese código en la sede',
      {},
    );
  }
  return error;
}

/**
 * `flush` con la traducción de `translateStructureWriteError`.
 *
 * @param tx - Transacción en curso.
 */
export async function flushStructure(tx: EntityManager): Promise<void> {
  try {
    await tx.flush();
  } catch (error) {
    throw translateStructureWriteError(error);
  }
}
