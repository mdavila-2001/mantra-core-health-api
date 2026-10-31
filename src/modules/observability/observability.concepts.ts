import { deterministicId } from '../../common/constants/concepts';

/**
 * Conceptos del módulo 70 que la API necesita por id.
 *
 * Los siembra el parche del modelo (`v4280_observabilidad_sistema.sql`), no el
 * seed de la API; acá sólo se **derivan** con la misma función determinista
 * (`deterministicId`, UUIDv5 de la clave) para no consultar la base en cada
 * escritura. Una prueba fija los valores contra los del parche.
 */
export const ERROR_GROUP_STATE = {
  NEW: deterministicId('observability:ERROR_GROUP_STATE_NEW'),
  SEEN: deterministicId('observability:ERROR_GROUP_STATE_SEEN'),
  RESOLVED: deterministicId('observability:ERROR_GROUP_STATE_RESOLVED'),
  IGNORED: deterministicId('observability:ERROR_GROUP_STATE_IGNORED'),
} as const;

export type ErrorGroupStateCode = keyof typeof ERROR_GROUP_STATE;

export const ERROR_GROUP_STATE_CODES = Object.keys(
  ERROR_GROUP_STATE,
) as ErrorGroupStateCode[];

/** Código de estado a partir del concepto, o `null` si no es uno de los cuatro. */
export function errorGroupStateOf(
  conceptId: string,
): ErrorGroupStateCode | null {
  return (
    ERROR_GROUP_STATE_CODES.find(
      (code) => ERROR_GROUP_STATE[code] === conceptId,
    ) ?? null
  );
}
