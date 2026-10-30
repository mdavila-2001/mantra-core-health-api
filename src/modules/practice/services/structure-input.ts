import {
  FUNCTION_PROFILE_BY_CODE,
  PRACTICE_CONCEPT_BY_CODE,
  PRACTICE_CONCEPT_BY_ID,
  conceptIdOf,
  type FormCode,
} from '../domain/structure/structure-catalog';
import {
  lifecycleStateOf,
  type LifecycleState,
} from '../domain/structure/lifecycle';
import {
  IfMatchFailedException,
  PracticeErrorReason,
} from '../practice.error-reasons';
import type { CareSpaceAttributesDto } from '../dto/care-space-attributes.dto';

/** Error de un campo (importación, alta masiva). */
export interface FieldError {
  readonly field: string;
  readonly reason: string;
}

/** Columnas de atributos de `care_spaces` que el cliente puede escribir. */
export interface SpaceAttributeColumns {
  description?: string | null;
  capacity?: number | null;
  floorNumber?: number | null;
  areaM2?: string | null;
  asepsisConceptId?: string | null;
  pressureConceptId?: string | null;
  airChangesPerHour?: string | null;
  hvacValidatedOn?: Date | null;
  sexRestrictionConceptId?: string | null;
  ageGroupConceptId?: string | null;
  bedCategoryConceptId?: string | null;
  censable?: boolean | null;
  prepMinutes?: number | null;
  cleanupMinutes?: number | null;
  gln?: string | null;
}

/** Campo `*Code` → columna y prefijo del grupo de conceptos. */
const CODED: ReadonlyArray<
  [keyof CareSpaceAttributesDto, keyof SpaceAttributeColumns, string]
> = [
  ['asepsisCode', 'asepsisConceptId', 'ASEPSIS_'],
  ['pressureCode', 'pressureConceptId', 'PRESSURE_'],
  ['sexRestrictionCode', 'sexRestrictionConceptId', 'SEX_'],
  ['ageGroupCode', 'ageGroupConceptId', 'AGE_'],
  ['bedCategoryCode', 'bedCategoryConceptId', 'BED_CAT_'],
];

/** Campos que pasan tal cual. */
const PLAIN: ReadonlyArray<
  keyof CareSpaceAttributesDto & keyof SpaceAttributeColumns
> = [
  'description',
  'capacity',
  'floorNumber',
  'censable',
  'prepMinutes',
  'cleanupMinutes',
  'gln',
];

/**
 * Traduce los atributos del DTO a columnas.
 *
 * Ausente = no tocar; `null` = borrar (en un alta, `null` y ausente son lo
 * mismo). Un código que no es del grupo esperado es un error del campo.
 *
 * @param dto - Atributos recibidos.
 */
export function resolveAttributes(dto: CareSpaceAttributesDto): {
  values: SpaceAttributeColumns;
  errors: FieldError[];
} {
  const values: SpaceAttributeColumns = {};
  const errors: FieldError[] = [];
  const has = (k: string) =>
    Object.prototype.hasOwnProperty.call(dto, k) &&
    (dto as Record<string, unknown>)[k] !== undefined;
  for (const [field, column, prefix] of CODED) {
    if (!has(field)) continue;
    const code = dto[field] as string | null;
    if (code === null) {
      (values as Record<string, unknown>)[column] = null;
      continue;
    }
    const id = conceptIdOf(code, prefix);
    if (!id)
      errors.push({ field, reason: PracticeErrorReason.SPACE_UNKNOWN_CODE });
    else (values as Record<string, unknown>)[column] = id;
  }
  for (const field of PLAIN) {
    if (has(field)) (values as Record<string, unknown>)[field] = dto[field];
  }
  // `numeric` se guarda como string para no perder precisión.
  if (has('areaM2'))
    values.areaM2 = dto.areaM2 === null ? null : String(dto.areaM2);
  if (has('airChangesPerHour')) {
    values.airChangesPerHour =
      dto.airChangesPerHour === null ? null : String(dto.airChangesPerHour);
  }
  if (has('hvacValidatedOn')) {
    values.hvacValidatedOn =
      dto.hvacValidatedOn === null
        ? null
        : new Date(`${dto.hvacValidatedOn}T00:00:00Z`);
  }
  return { values, errors };
}

/** Forma por código, o `null`. */
export function formIdOf(code: string | undefined | null): string | undefined {
  return conceptIdOf(code, 'LOC_FORM_');
}

/** Id de una función conocida por su código (incluye `SPACE_TYPE_ROOM`). */
export function functionIdOf(
  code: string | undefined | null,
): string | undefined {
  if (!code || !FUNCTION_PROFILE_BY_CODE.has(code)) return undefined;
  return PRACTICE_CONCEPT_BY_CODE.get(code)?.id;
}

/** Código de un concepto de `practice` por id. */
export function codeOf(id: string | undefined | null): string | null {
  return id ? (PRACTICE_CONCEPT_BY_ID.get(id)?.code ?? null) : null;
}

/** Código de forma de una fila, o `null` si no tiene (filas anteriores al backfill). */
export function formOf(row: {
  formConceptId?: string | null;
}): FormCode | null {
  return (codeOf(row.formConceptId) as FormCode | null) ?? null;
}

/** Estado de ciclo de vida de una fila. */
export function stateOf(row: {
  statusConceptId: string;
}): LifecycleState | null {
  return lifecycleStateOf(codeOf(row.statusConceptId));
}

/**
 * Exige `If-Match` con la `row_version` actual (contrato §3): ausente o
 * distinto → 412.
 *
 * Acepta `3`, `"3"` y `W/"3"` (la forma de un ETag débil), porque los
 * clientes HTTP suelen repetir el ETag tal como lo recibieron.
 *
 * @param header - Valor de la cabecera.
 * @param rowVersion - Versión actual de la fila.
 */
export function assertIfMatch(
  header: string | undefined,
  rowVersion: number,
): void {
  const raw = header?.trim();
  if (!raw)
    throw new IfMatchFailedException(PracticeErrorReason.IF_MATCH_REQUIRED);
  const m = /^(?:W\/)?"?(\d+)"?$/.exec(raw);
  const expected = m ? Number(m[1]) : NaN;
  if (expected !== rowVersion) {
    throw new IfMatchFailedException(PracticeErrorReason.ROW_VERSION_MISMATCH, {
      expected: Number.isNaN(expected) ? raw : expected,
      actual: rowVersion,
    });
  }
}

/** Como `assertIfMatch`, pero sólo si vino la cabecera. */
export function checkIfMatchWhenPresent(
  header: string | undefined,
  rowVersion: number,
): void {
  if (header?.trim()) assertIfMatch(header, rowVersion);
}
