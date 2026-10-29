import { PRAC } from '../practice.concepts';
import { PracticeErrorReason } from '../practice.error-reasons';
import {
  ATTRIBUTES,
  FORMS,
  FUNCTIONS,
  FUNCTION_PROFILES,
  FORM_KEYS,
  ROOT_FORMS,
  type ConceptEntry,
  type FormKey,
  type FunctionCode,
} from '../infrastructure-catalog';

/** Máximo de espacios por alta masiva o por importación (CONTRATO-F0-F1 §3). */
export const MAX_BATCH_SIZE = 200;

/** Un error de validación con campo y motivo estable (formato de `import`). */
export interface FieldError {
  /** Campo del cuerpo (o `parentCode`, `codePattern`…). */
  readonly field: string;
  /** `reason` estable (`PracticeErrorReason`) o un texto de formato. */
  readonly reason: string;
  /** Texto para personas. */
  readonly message?: string;
}

/**
 * Reglas leídas de la base. Son **ids de concepto**, no códigos: la tabla
 * guarda ids y la validación compara ids.
 */
export interface RuleSet {
  /** Forma del padre → formas que pueden colgar de ella (`space_form_parent_rules`). */
  readonly parentChildren: ReadonlyMap<string, ReadonlySet<string>>;
  /** Tipología → funciones permitidas (`TYPO_ALLOWED`). */
  readonly typologyAllowed: ReadonlyMap<string, ReadonlySet<string>>;
  /** Tipología → funciones exigidas (`TYPO_REQUIRED`). */
  readonly typologyRequired: ReadonlyMap<string, ReadonlySet<string>>;
}

/** Atributos que se pueden fijar al crear o editar un espacio (nombres del contrato). */
export interface SpaceAttributesInput {
  readonly description?: string | null;
  readonly capacity?: number | null;
  readonly floorNumber?: number | null;
  readonly areaM2?: number | null;
  readonly asepsisCode?: string | null;
  readonly pressureCode?: string | null;
  readonly airChangesPerHour?: number | null;
  readonly hvacValidatedOn?: string | null;
  readonly sexRestrictionCode?: string | null;
  readonly ageGroupCode?: string | null;
  readonly bedCategoryCode?: string | null;
  readonly censable?: boolean | null;
  readonly prepMinutes?: number | null;
  readonly cleanupMinutes?: number | null;
  readonly gln?: string | null;
}

/** Forma, función y padre de un espacio, ya resueltos a conceptos. */
export interface SpaceShape {
  /** Forma resuelta. */
  readonly form: ConceptEntry;
  /** Función resuelta. */
  readonly fn: ConceptEntry;
  /** Forma del padre; `null` si el espacio es raíz. */
  readonly parentFormId: string | null;
}

/** Clave corta de una forma a partir de su entrada. */
export function formKeyOf(form: ConceptEntry): FormKey {
  const key = form.code.replace('LOC_FORM_', '') as FormKey;
  return FORM_KEYS.includes(key) ? key : 'ROOM';
}

/**
 * ¿Puede una forma ser raíz? Constante, no tabla (la PK de
 * `space_form_parent_rules` exige padre).
 */
export function canBeRoot(form: ConceptEntry): boolean {
  return ROOT_FORMS.includes(formKeyOf(form));
}

/**
 * INV-04: el par padre→hijo respeta las reglas; sin padre sólo se admiten las
 * formas raíz.
 *
 * @param rules - Reglas leídas de la base.
 * @param shape - Forma, función y forma del padre.
 * @returns El error, o `null` si cumple.
 */
export function checkParentRule(
  rules: RuleSet,
  shape: SpaceShape,
): FieldError | null {
  if (shape.parentFormId === null) {
    return canBeRoot(shape.form)
      ? null
      : {
          field: 'parentSpaceId',
          reason: PracticeErrorReason.SPACE_PARENT_RULE,
          message: `La forma ${shape.form.code} no puede ser raíz del árbol; elegí un padre`,
        };
  }
  const allowed = rules.parentChildren.get(shape.parentFormId);
  return allowed?.has(shape.form.id)
    ? null
    : {
        field: 'formCode',
        reason: PracticeErrorReason.SPACE_PARENT_RULE,
        message: `La forma ${shape.form.code} no puede colgar de esa forma de padre`,
      };
}

/**
 * INV-05: la forma está entre las que admite el perfil de la función.
 *
 * @param shape - Forma y función resueltas.
 * @returns El error, o `null` si cumple.
 */
export function checkFunctionProfile(shape: SpaceShape): FieldError | null {
  const profile = FUNCTION_PROFILES[shape.fn.code as FunctionCode];
  if (!profile) return null;
  return (profile.forms as readonly FormKey[]).includes(formKeyOf(shape.form))
    ? null
    : {
        field: 'functionCode',
        reason: PracticeErrorReason.SPACE_FUNCTION_FORM_MISMATCH,
        message: `La función ${shape.fn.code} no admite la forma ${shape.form.code}`,
      };
}

/**
 * Funciones que una tipología deja crear, o `null` si no restringe.
 *
 * Una tipología es *restrictiva* si tiene al menos una fila `TYPO_ALLOWED`;
 * las exigidas (`TYPO_REQUIRED`) también cuentan como permitidas.
 *
 * @param rules - Reglas leídas de la base.
 * @param typologyId - Tipología del establecimiento.
 * @returns El conjunto de ids de función permitidos, o `null` si no restringe.
 */
export function allowedFunctions(
  rules: RuleSet,
  typologyId: string | null | undefined,
): ReadonlySet<string> | null {
  if (!typologyId) return null;
  const allowed = rules.typologyAllowed.get(typologyId);
  if (!allowed || allowed.size === 0) return null;
  return new Set([
    ...allowed,
    ...(rules.typologyRequired.get(typologyId) ?? []),
  ]);
}

/**
 * INV-06: la función está permitida por la tipología del establecimiento.
 *
 * @param rules - Reglas leídas de la base.
 * @param typologyId - Tipología del establecimiento, si la tiene.
 * @param fn - Función del espacio.
 * @returns El error, o `null` si cumple.
 */
export function checkTypology(
  rules: RuleSet,
  typologyId: string | null | undefined,
  fn: ConceptEntry,
): FieldError | null {
  const allowed = allowedFunctions(rules, typologyId);
  if (!allowed || allowed.has(fn.id)) return null;
  return {
    field: 'functionCode',
    reason: PracticeErrorReason.TYPOLOGY_NOT_ALLOWED,
    message: `La tipología del establecimiento no admite la función ${fn.code}`,
  };
}

/** Resuelve un código de la familia o devuelve el error de catálogo. */
function resolve(
  family: {
    byInput(input: string | null | undefined): ConceptEntry | undefined;
  },
  field: string,
  value: string | null | undefined,
): { entry?: ConceptEntry; error?: FieldError } {
  if (value === undefined || value === null || value === '') return {};
  const entry = family.byInput(value);
  return entry
    ? { entry }
    : {
        error: {
          field,
          reason: PracticeErrorReason.CATALOG_CODE_INVALID,
          message: `Código inválido en ${field}: ${value}`,
        },
      };
}

/** Atributos ya resueltos a ids de concepto. */
export interface ResolvedAttributes {
  readonly asepsisConceptId?: string | null;
  readonly pressureConceptId?: string | null;
  readonly sexRestrictionConceptId?: string | null;
  readonly ageGroupConceptId?: string | null;
  readonly bedCategoryConceptId?: string | null;
}

const ATTRIBUTE_FIELDS = [
  ['asepsisCode', 'asepsis', 'asepsisConceptId'],
  ['pressureCode', 'pressure', 'pressureConceptId'],
  ['sexRestrictionCode', 'sex', 'sexRestrictionConceptId'],
  ['ageGroupCode', 'ageGroup', 'ageGroupConceptId'],
  ['bedCategoryCode', 'bedCategory', 'bedCategoryConceptId'],
] as const;

/**
 * Valida y resuelve los atributos técnicos: códigos de catálogo, rangos
 * numéricos y formato del GLN.
 *
 * @param input - Atributos del cuerpo (todos opcionales).
 * @returns Errores por campo y ids resueltos (sólo de los campos presentes; un
 * `null` explícito limpia el atributo).
 */
export function resolveAttributes(input: SpaceAttributesInput): {
  errors: FieldError[];
  resolved: Record<string, string | null>;
} {
  const errors: FieldError[] = [];
  const resolved: Record<string, string | null> = {};
  for (const [field, family, target] of ATTRIBUTE_FIELDS) {
    const value = input[field];
    if (value === undefined) continue;
    if (value === null) {
      resolved[target] = null;
      continue;
    }
    const { entry, error } = resolve(ATTRIBUTES[family], field, value);
    if (error) errors.push(error);
    else if (entry) resolved[target] = entry.id;
  }
  const range = (
    field: keyof SpaceAttributesInput,
    value: number | null | undefined,
    min: number,
    max: number,
    integer: boolean,
  ): void => {
    if (value === undefined || value === null) return;
    const ok =
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value >= min &&
      value <= max &&
      (!integer || Number.isInteger(value));
    if (!ok) {
      errors.push({
        field,
        reason: 'VALUE_OUT_OF_RANGE',
        message: `${field} debe ${integer ? 'ser un entero ' : 'estar '}entre ${min} y ${max}`,
      });
    }
  };
  if (
    input.censable !== undefined &&
    input.censable !== null &&
    typeof input.censable !== 'boolean'
  ) {
    errors.push({
      field: 'censable',
      reason: 'VALUE_OUT_OF_RANGE',
      message: 'censable es verdadero o falso',
    });
  }
  range('capacity', input.capacity, 0, 100000, true);
  range('floorNumber', input.floorNumber, -20, 200, true);
  range('areaM2', input.areaM2, 0.01, 99999999, false);
  range('airChangesPerHour', input.airChangesPerHour, 0, 9999, false);
  range('prepMinutes', input.prepMinutes, 0, 1440, true);
  range('cleanupMinutes', input.cleanupMinutes, 0, 1440, true);
  if (
    input.gln !== undefined &&
    input.gln !== null &&
    !/^\d{13}$/.test(input.gln)
  ) {
    errors.push({
      field: 'gln',
      reason: 'GLN_FORMAT',
      message: 'El GLN tiene 13 dígitos',
    });
  }
  if (
    input.hvacValidatedOn !== undefined &&
    input.hvacValidatedOn !== null &&
    !/^\d{4}-\d{2}-\d{2}$/.test(input.hvacValidatedOn)
  ) {
    errors.push({
      field: 'hvacValidatedOn',
      reason: 'DATE_FORMAT',
      message: 'hvacValidatedOn es una fecha AAAA-MM-DD',
    });
  }
  return { errors, resolved };
}

/** Campos de un espacio que miran las exigencias del perfil para activar. */
export interface ActivationFacts {
  /** Función del espacio. */
  readonly fn: ConceptEntry;
  /** Forma del espacio. */
  readonly form: ConceptEntry;
  readonly areaM2?: string | number | null;
  readonly pressureConceptId?: string | null;
  readonly airChangesPerHour?: string | number | null;
  readonly hvacValidatedOn?: Date | string | null;
  readonly bedCategoryConceptId?: string | null;
  readonly censable?: boolean | null;
}

/**
 * Datos que el perfil de la función exige para activar (`procesos/02`,
 * precondición 4): `requiresArea` → `areaM2`; `requiresHvac` → presión, ACH y
 * fecha de validación; una cama → categoría y `censable` (de ahí sale la
 * capacidad derivada y el cargo día-cama).
 *
 * @param facts - Estado actual del espacio.
 * @returns Los campos que faltan (vacío si está completo).
 */
export function missingForActivation(facts: ActivationFacts): FieldError[] {
  const profile = FUNCTION_PROFILES[facts.fn.code as FunctionCode];
  const missing: string[] = [];
  const blank = (value: unknown): boolean =>
    value === undefined || value === null || value === '';
  if (profile?.requiresArea && blank(facts.areaM2)) missing.push('areaM2');
  if (profile?.requiresHvac) {
    if (blank(facts.pressureConceptId)) missing.push('pressureCode');
    if (blank(facts.airChangesPerHour)) missing.push('airChangesPerHour');
    if (blank(facts.hvacValidatedOn)) missing.push('hvacValidatedOn');
  }
  if (formKeyOf(facts.form) === 'BED') {
    if (blank(facts.bedCategoryConceptId)) missing.push('bedCategoryCode');
    if (blank(facts.censable)) missing.push('censable');
  }
  return missing.map((field) => ({
    field,
    reason: PracticeErrorReason.SPACE_PROFILE_INCOMPLETE,
    message: `Para activar ${facts.fn.code} hace falta ${field}`,
  }));
}

/** Resultado de resolver forma y función desde códigos del cuerpo. */
export function resolveShape(
  formCode: string | undefined,
  functionCode: string | undefined,
): { form?: ConceptEntry; fn?: ConceptEntry; errors: FieldError[] } {
  const errors: FieldError[] = [];
  const formInput = formCode ?? 'LOC_FORM_ROOM';
  const form = FORMS.byInput(formInput);
  if (!form) {
    errors.push({
      field: 'formCode',
      reason: PracticeErrorReason.CATALOG_CODE_INVALID,
      message: `Forma desconocida: ${formInput}`,
    });
  }
  const fnInput = functionCode ?? 'SPACE_TYPE_ROOM';
  const fn = FUNCTIONS.byInput(fnInput);
  if (!fn) {
    errors.push({
      field: 'functionCode',
      reason: PracticeErrorReason.CATALOG_CODE_INVALID,
      message: `Función desconocida: ${fnInput}`,
    });
  }
  return { form, fn, errors };
}

/** Error de un patrón de alta masiva. */
export class PatternError extends Error {
  /**
   * @param field - `codePattern` o `namePattern`.
   * @param message - Qué está mal.
   */
  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message);
  }
}

const RANGE_TOKEN = /\{([A-Za-z0-9]+)\.\.([A-Za-z0-9]+)\}/g;

/**
 * Expande los rangos de un patrón: `301-{A..H}` → `301-A … 301-H`;
 * `CAMA-{1..12}` → `CAMA-1 … CAMA-12`. Un cero a la izquierda en el inicio
 * (`{01..12}`) conserva el ancho. Exactamente un rango por patrón.
 *
 * @param pattern - Patrón del cuerpo.
 * @param field - Nombre del campo, para el error.
 * @returns Los valores del rango y una función que arma cada texto.
 * @throws PatternError si no hay un único rango válido.
 */
export function parsePattern(
  pattern: string,
  field: string,
): { values: string[]; render: (value: string, index: number) => string } {
  const tokens = [...pattern.matchAll(RANGE_TOKEN)];
  if (tokens.length === 0) {
    return { values: [], render: (_value, _index) => pattern };
  }
  if (tokens.length > 1) {
    throw new PatternError(
      field,
      'El patrón admite un solo rango {inicio..fin}',
    );
  }
  const [token, from, to] = tokens[0];
  const numeric = /^\d+$/.test(from) && /^\d+$/.test(to);
  const alpha = /^[A-Za-z]$/.test(from) && /^[A-Za-z]$/.test(to);
  if (!numeric && !alpha) {
    throw new PatternError(
      field,
      'El rango es numérico ({1..12}) o de una letra ({A..H})',
    );
  }
  const values: string[] = [];
  if (numeric) {
    const start = Number(from);
    const end = Number(to);
    if (end < start)
      throw new PatternError(field, 'El rango termina antes de empezar');
    if (end - start + 1 > MAX_BATCH_SIZE) {
      throw new PatternError(
        field,
        `El rango supera ${MAX_BATCH_SIZE} elementos`,
      );
    }
    const width = from.length > 1 && from.startsWith('0') ? from.length : 0;
    for (let n = start; n <= end; n += 1) {
      values.push(width ? String(n).padStart(width, '0') : String(n));
    }
  } else {
    const start = from.charCodeAt(0);
    const end = to.charCodeAt(0);
    if (end < start)
      throw new PatternError(field, 'El rango termina antes de empezar');
    for (let c = start; c <= end; c += 1) values.push(String.fromCharCode(c));
  }
  return {
    values,
    render: (value) => pattern.replace(token, value),
  };
}

/** Un espacio del lote ya expandido. */
export interface ExpandedName {
  /** Código. */
  readonly code: string;
  /** Nombre. */
  readonly name: string;
}

/**
 * Expande `codePattern` y `namePattern` en lockstep.
 *
 * `namePattern` puede repetir el rango (`Cama 301-{A..H}`) o usar los
 * marcadores `{code}` (el código completo), `{n}` (el valor del rango) y `{i}`
 * (el índice desde 1).
 *
 * @param codePattern - Patrón del código.
 * @param namePattern - Patrón del nombre.
 * @returns Los pares código/nombre.
 * @throws PatternError si el patrón no es válido o supera el máximo.
 */
export function expandBulkPattern(
  codePattern: string,
  namePattern: string,
): ExpandedName[] {
  const codes = parsePattern(codePattern, 'codePattern');
  if (codes.values.length === 0) {
    throw new PatternError(
      'codePattern',
      'El patrón del código necesita un rango {inicio..fin}',
    );
  }
  if (codes.values.length > MAX_BATCH_SIZE) {
    throw new PatternError(
      'codePattern',
      `El alta masiva admite hasta ${MAX_BATCH_SIZE}`,
    );
  }
  const names = parsePattern(namePattern, 'namePattern');
  if (names.values.length > 0 && names.values.length !== codes.values.length) {
    throw new PatternError(
      'namePattern',
      'El rango del nombre debe tener los mismos elementos que el del código',
    );
  }
  return codes.values.map((value, index) => {
    const code = codes.render(value, index);
    const base =
      names.values.length > 0
        ? names.render(names.values[index], index)
        : namePattern;
    const name = base
      .replaceAll('{code}', code)
      .replaceAll('{n}', value)
      .replaceAll('{i}', String(index + 1));
    return { code, name };
  });
}

/** Estados en los que un padre admite hijos nuevos (planificado o activo). */
export const PARENT_OPEN_STATUSES: ReadonlySet<string> = new Set([
  PRAC.SPACE_PLANNED,
  PRAC.SPACE_ACTIVE,
]);
