import type { SpaceInput } from './care-space-creation.service';

/** Una fila de importación con el número de línea que el cliente le dio. */
export type ImportRow = SpaceInput & { line: number };

const STRING_FIELDS = [
  'code',
  'name',
  'formCode',
  'functionCode',
  'parentCode',
  'parentSpaceId',
  'clinicalUnitId',
  'description',
  'asepsisCode',
  'pressureCode',
  'hvacValidatedOn',
  'sexRestrictionCode',
  'ageGroupCode',
  'bedCategoryCode',
  'gln',
] as const;

const NUMBER_FIELDS = [
  'capacity',
  'floorNumber',
  'areaM2',
  'airChangesPerHour',
  'prepMinutes',
  'cleanupMinutes',
] as const;

/** Texto sin espacios de los bordes; vacío es «sin dato». */
function text(value: unknown): string | undefined {
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

/**
 * Convierte una fila cruda del cliente (un CSV parseado trae texto) en la
 * entrada del servicio, sin lanzar: lo que no se puede leer queda como `NaN` o
 * `undefined` y la validación del servicio lo reporta **en su línea**, en vez de
 * rechazar el archivo entero con un 400.
 *
 * @param raw - Fila tal como llegó en `rows`.
 * @param position - Posición de la fila en el arreglo, desde 1.
 * @returns La entrada, con la línea que declaró el cliente o la posición.
 */
export function coerceImportRow(raw: unknown, position: number): ImportRow {
  const source = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;
  const row: Record<string, unknown> = {};
  for (const field of STRING_FIELDS) {
    const value = text(source[field]);
    if (value !== undefined) row[field] = value;
  }
  for (const field of NUMBER_FIELDS) {
    const value = text(source[field]);
    if (value !== undefined) row[field] = Number(value);
  }
  const censable = text(source.censable)?.toLowerCase();
  if (censable !== undefined) {
    row.censable =
      censable === 'true' || censable === '1'
        ? true
        : censable === 'false' || censable === '0'
          ? false
          : Number.NaN;
  }
  const declared = Number(source.line);
  return {
    code: '',
    name: '',
    ...row,
    line: Number.isInteger(declared) && declared > 0 ? declared : position,
  };
}
