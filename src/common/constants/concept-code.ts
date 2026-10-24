import { CONCEPT_DEFS, CONCEPTS } from './concepts';

/** Índice inverso id → código, construido una vez desde el registro de conceptos. */
const CODE_BY_ID: ReadonlyMap<string, string> = new Map(
  Object.entries(CONCEPTS).map(([name, id]) => [id, CONCEPT_DEFS[name].code]),
);

/**
 * Código legible de un concepto interno (p. ej. `RUN_PASSED`) a partir de su
 * uuid determinista. Las lecturas del portal devuelven códigos, no uuids que
 * el frontend tendría que resolver. Un id desconocido se devuelve como
 * `UNKNOWN`, nunca se inventa.
 */
export function conceptCode(id: string | null | undefined): string | null {
  if (!id) return null;
  return CODE_BY_ID.get(id) ?? 'UNKNOWN';
}
