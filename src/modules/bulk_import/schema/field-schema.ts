import { BulkImportReason } from '../bulk-import.error-reasons';
import type {
  BulkImportGroup,
  BulkImportPermission,
} from '../bulk-import.constants';

/**
 * Esquema declarativo de una carga: la **única fuente** de lo que valida el
 * motor y de lo que dice la plantilla (regla T1). La plantilla CSV y la JSON se
 * generan de acá, y la validación de cada fila lee de acá; si alguien agrega una
 * columna, las dos cosas cambian juntas y no pueden divergir.
 */

/** Tipos de columna que el motor sabe validar. */
export type FieldType =
  | 'string'
  | 'text'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'phone'
  | 'uuid'
  | 'uuidList'
  | 'enum';

/** Una columna del esquema. */
export interface FieldSpec {
  /** Nombre de la columna: el mismo que la propiedad del DTO/entidad de origen. */
  readonly name: string;
  /** Tipo de dato. */
  readonly type: FieldType;
  /** Si la fila lo exige. */
  readonly required: boolean;
  /** Qué es y cómo se llena (sin datos reales). */
  readonly description: string;
  /**
   * Valor de ejemplo, **sintético**, que pasa la validación estructural. Vacío
   * si la columna es una alternativa excluyente y no debe ir en la fila de
   * ejemplo.
   */
  readonly example: string;
  /**
   * De dónde sale el campo: `ruta#Clase.propiedad` del código existente. Es la
   * trazabilidad que pide el plan («campos sacados del código, no inventados»).
   */
  readonly source: string;
  /** Largo máximo (texto) o cantidad máxima de elementos (`uuidList`). */
  readonly max?: number;
  /** Largo mínimo (texto). */
  readonly min?: number;
  /** Cota inferior numérica (`integer`/`decimal`). */
  readonly gte?: number;
  /** Cota superior numérica (`integer`/`decimal`). */
  readonly lte?: number;
  /** Valores admitidos (`enum`). */
  readonly values?: readonly string[];
  /** Formato del texto. */
  readonly pattern?: RegExp;
  /** Cómo explicar el formato sin repetir el valor recibido. */
  readonly patternHint?: string;
  /** Fecha mínima admitida (`date`), `AAAA-MM-DD`. */
  readonly minDate?: string;
  /** Si la fecha/hora no puede estar en el futuro. */
  readonly notFuture?: boolean;
  /** Dato personal o clínico: jamás se escribe en mensajes ni en logs. */
  readonly sensitive?: boolean;
}

/** Fila normalizada: sólo columnas de la plantilla, todo texto recortado. */
export type NormalizedRow = Record<string, string>;

/** Un hallazgo de la validación: ubica la columna y dice qué falla, sin el valor. */
export interface FieldIssue {
  /** Columna afectada; `*` para un hallazgo de la fila entera. */
  readonly field: string;
  /** Motivo estable. */
  readonly code: BulkImportReason;
  /** Mensaje para la persona: dice qué se espera, **nunca** el valor recibido. */
  readonly message: string;
}

/** Regla entre campos de una misma fila. */
export type CrossFieldRule = (row: NormalizedRow) => FieldIssue[];

/** Un tipo de carga. */
export interface KindSchema {
  /** Identificador estable (`usuario-paciente`, `hc-diagnostico`…). */
  readonly kind: string;
  /** Versión del contrato de la plantilla. */
  readonly version: string;
  /** Familia (decide el permiso y qué colaboradores intervienen). */
  readonly group: BulkImportGroup;
  /** Nombre para mostrar. */
  readonly title: string;
  /** Qué carga y a quién va dirigida. */
  readonly description: string;
  /** Permiso fino que exige. */
  readonly permission: BulkImportPermission;
  /** Columnas. */
  readonly fields: readonly FieldSpec[];
  /** Reglas en lenguaje natural que viajan en la plantilla JSON. */
  readonly rules: readonly string[];
  /**
   * Conjuntos de columnas que no pueden repetirse entre filas del archivo. Cada
   * conjunto es un grupo; una fila repetida se rechaza con `DUPLICATE_IN_FILE`.
   */
  readonly uniqueKeys: readonly (readonly string[])[];
  /** Reglas entre campos. */
  readonly crossFieldRules?: readonly CrossFieldRule[];
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INTEGER_RE = /^-?\d+$/;
const DECIMAL_RE = /^-?\d+(\.\d+)?$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const PHONE_RE = /^[+]?[0-9 ()-]{6,}$/;
/** Separador de las listas en una celda CSV. */
export const LIST_SEPARATOR = '|';

/** Texto de la plantilla para un formato esperado, sin el valor recibido. */
const TYPE_HINT: Record<FieldType, string> = {
  string: 'texto',
  text: 'texto',
  integer: 'un número entero',
  decimal: 'un número con punto decimal (por ejemplo 12.5)',
  boolean: '`true` o `false`',
  date: 'una fecha real con formato AAAA-MM-DD',
  datetime:
    'fecha y hora ISO 8601 con zona (por ejemplo 2024-03-15T10:30:00-04:00)',
  email: 'un correo electrónico válido',
  phone: 'un teléfono (dígitos, espacios, paréntesis, + y guion; 6 o más)',
  uuid: 'un identificador UUID',
  uuidList: `una lista de UUID separados por «${LIST_SEPARATOR}»`,
  enum: 'uno de los valores admitidos',
};

function issue(
  field: string,
  code: BulkImportReason,
  message: string,
): FieldIssue {
  return { field, code, message };
}

/** `true` si la fecha `AAAA-MM-DD` existe en el calendario. */
export function isRealDate(value: string): boolean {
  const match = DATE_RE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return (
    date.getUTCFullYear() === Number(y) &&
    date.getUTCMonth() === Number(m) - 1 &&
    date.getUTCDate() === Number(d)
  );
}

/**
 * Convierte el valor crudo de una celda a texto recortado. Devuelve `undefined`
 * si está vacía y `null` si el tipo de valor no es admisible (objeto, etc.).
 */
export function normalizeCell(raw: unknown): string | null | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed === '' ? undefined : trimmed;
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  if (typeof raw === 'boolean') return String(raw);
  if (Array.isArray(raw) && raw.every((item) => typeof item === 'string')) {
    const joined = raw
      .map((item) => item.trim())
      .filter((item) => item !== '')
      .join(LIST_SEPARATOR);
    return joined === '' ? undefined : joined;
  }
  return null;
}

/** Valida un valor ya normalizado contra su columna. Sin el valor en el mensaje. */
function validateValue(spec: FieldSpec, value: string): FieldIssue | null {
  const hint = TYPE_HINT[spec.type];
  switch (spec.type) {
    case 'string':
    case 'text':
    case 'phone':
    case 'email': {
      if (spec.max !== undefined && value.length > spec.max) {
        return issue(
          spec.name,
          BulkImportReason.TOO_LONG,
          `Admite como máximo ${spec.max} caracteres`,
        );
      }
      if (spec.min !== undefined && value.length < spec.min) {
        return issue(
          spec.name,
          BulkImportReason.TOO_SHORT,
          `Requiere al menos ${spec.min} caracteres`,
        );
      }
      if (spec.type === 'email' && !EMAIL_RE.test(value)) {
        return issue(
          spec.name,
          BulkImportReason.INVALID_FORMAT,
          `Debe ser ${hint}`,
        );
      }
      if (spec.type === 'phone' && !PHONE_RE.test(value)) {
        return issue(
          spec.name,
          BulkImportReason.INVALID_FORMAT,
          `Debe ser ${hint}`,
        );
      }
      if (spec.pattern && !spec.pattern.test(value)) {
        return issue(
          spec.name,
          BulkImportReason.INVALID_FORMAT,
          spec.patternHint ?? 'No tiene el formato esperado',
        );
      }
      return null;
    }
    case 'integer':
    case 'decimal': {
      const re = spec.type === 'integer' ? INTEGER_RE : DECIMAL_RE;
      if (!re.test(value)) {
        return issue(
          spec.name,
          BulkImportReason.INVALID_FORMAT,
          `Debe ser ${hint}`,
        );
      }
      const numeric = Number(value);
      if (
        (spec.gte !== undefined && numeric < spec.gte) ||
        (spec.lte !== undefined && numeric > spec.lte)
      ) {
        return issue(
          spec.name,
          BulkImportReason.OUT_OF_RANGE,
          `Debe estar entre ${spec.gte ?? '-∞'} y ${spec.lte ?? '∞'}`,
        );
      }
      return null;
    }
    case 'boolean':
      return value === 'true' || value === 'false'
        ? null
        : issue(spec.name, BulkImportReason.INVALID_FORMAT, `Debe ser ${hint}`);
    case 'date': {
      if (!isRealDate(value)) {
        return issue(
          spec.name,
          BulkImportReason.INVALID_FORMAT,
          `Debe ser ${hint}`,
        );
      }
      if (spec.minDate && value < spec.minDate) {
        return issue(
          spec.name,
          BulkImportReason.OUT_OF_RANGE,
          `No puede ser anterior a ${spec.minDate}`,
        );
      }
      if (spec.notFuture && value > new Date().toISOString().slice(0, 10)) {
        return issue(
          spec.name,
          BulkImportReason.OUT_OF_RANGE,
          'No puede estar en el futuro',
        );
      }
      return null;
    }
    case 'datetime': {
      if (!DATETIME_RE.test(value) || Number.isNaN(Date.parse(value))) {
        return issue(
          spec.name,
          BulkImportReason.INVALID_FORMAT,
          `Debe ser ${hint}`,
        );
      }
      if (spec.notFuture && Date.parse(value) > Date.now()) {
        return issue(
          spec.name,
          BulkImportReason.OUT_OF_RANGE,
          'No puede estar en el futuro',
        );
      }
      return null;
    }
    case 'uuid':
      return UUID_RE.test(value)
        ? null
        : issue(spec.name, BulkImportReason.INVALID_FORMAT, `Debe ser ${hint}`);
    case 'uuidList': {
      const items = value.split(LIST_SEPARATOR).map((item) => item.trim());
      if (spec.max !== undefined && items.length > spec.max) {
        return issue(
          spec.name,
          BulkImportReason.TOO_LONG,
          `Admite como máximo ${spec.max} elementos`,
        );
      }
      return items.every((item) => UUID_RE.test(item))
        ? null
        : issue(spec.name, BulkImportReason.INVALID_FORMAT, `Debe ser ${hint}`);
    }
    case 'enum':
      return (spec.values ?? []).includes(value)
        ? null
        : issue(
            spec.name,
            BulkImportReason.NOT_ALLOWED_VALUE,
            `Debe ser uno de: ${(spec.values ?? []).join(', ')}`,
          );
  }
}

/** Resultado de validar una fila contra un esquema. */
export interface RowValidation {
  /** Fila normalizada (sólo columnas conocidas; nada de lo desconocido). */
  readonly row: NormalizedRow;
  /** Hallazgos; vacío si la fila pasa. */
  readonly issues: FieldIssue[];
}

/**
 * Valida una fila cruda contra el esquema: lista blanca de columnas, obligatorias,
 * tipo/formato de cada una y reglas entre campos.
 *
 * @param schema - Esquema del tipo de carga.
 * @param raw - Fila tal como vino del archivo (CSV ya parseado o JSON).
 * @returns La fila normalizada y los hallazgos.
 */
export function validateRowAgainstSchema(
  schema: KindSchema,
  raw: Record<string, unknown>,
): RowValidation {
  const issues: FieldIssue[] = [];
  const row: NormalizedRow = {};
  const known = new Map(schema.fields.map((f) => [f.name, f]));

  // Una sola observación por fila, sin nombrar la columna ajena: si el CSV vino
  // sin encabezado, «la columna» es en realidad un dato de una persona.
  const unknown = Object.keys(raw).filter((key) => !known.has(key)).length;
  if (unknown > 0) {
    issues.push(
      issue(
        '*',
        BulkImportReason.UNKNOWN_FIELD,
        unknown === 1
          ? 'Hay un campo que no figura en la plantilla'
          : `Hay ${unknown} campos que no figuran en la plantilla`,
      ),
    );
  }

  for (const spec of schema.fields) {
    const cell = normalizeCell(raw[spec.name]);
    if (cell === null) {
      issues.push(
        issue(
          spec.name,
          BulkImportReason.INVALID_FORMAT,
          `Debe ser ${TYPE_HINT[spec.type]}`,
        ),
      );
      continue;
    }
    if (cell === undefined) {
      if (spec.required) {
        issues.push(
          issue(spec.name, BulkImportReason.REQUIRED, 'Es obligatorio'),
        );
      }
      continue;
    }
    row[spec.name] = cell;
    const found = validateValue(spec, cell);
    if (found) issues.push(found);
  }

  if (issues.length === 0) {
    for (const rule of schema.crossFieldRules ?? []) {
      issues.push(...rule(row));
    }
  }
  return { row, issues };
}

/**
 * La fila de ejemplo de un esquema (la que baja en la plantilla). Una columna
 * con `example: ''` no entra: sirve para las alternativas excluyentes (un
 * resultado numérico **o** de texto), donde llenar las dos haría que la fila de
 * la plantilla no pasara su propia validación.
 */
export function exampleRow(schema: KindSchema): NormalizedRow {
  const row: NormalizedRow = {};
  for (const spec of schema.fields) {
    if (spec.example !== '') row[spec.name] = spec.example;
  }
  return row;
}

/** Valores de las columnas de una clave única, o `null` si falta alguna. */
export function uniqueKeyValue(
  row: NormalizedRow,
  columns: readonly string[],
): string | null {
  const parts = columns.map((c) => row[c]);
  if (parts.some((p) => p === undefined)) return null;
  return parts.map((p) => p.toLowerCase()).join('\u0001');
}
