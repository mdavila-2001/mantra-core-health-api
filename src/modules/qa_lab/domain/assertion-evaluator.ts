/**
 * Evaluador declarativo de aserciones contra una respuesta observada por el
 * servidor. Sin `eval`, sin JavaScript ni SQL del usuario, sin regex: sólo
 * operadores cerrados y un JSONPath restringido (`$.a.b[0].c`).
 *
 * El oráculo es el valor esperado que definió quien escribió el caso; el
 * evaluador sólo compara. Nunca usa la lógica del producto para "probarla".
 */

export type AssertionType = 'STATUS' | 'JSON_PATH' | 'HEADER' | 'LATENCY';
export type Operator = 'EQ' | 'NEQ' | 'CONTAINS' | 'EXISTS' | 'LT' | 'GT';

export interface AssertionDefinition {
  type: AssertionType;
  operator: Operator;
  /** Ruta JSON para JSON_PATH; nombre de cabecera para HEADER. */
  path?: string | null;
  expected?: string | null;
  /** Tolerancia numérica para EQ/NEQ (p. ej. latencias). */
  tolerance?: string | null;
}

export interface ObservedResponse {
  status: number;
  headers: Record<string, unknown>;
  body: unknown;
  latencyMs: number;
}

export interface AssertionVerdict {
  passed: boolean;
  /** Valor observado, recortado: evidencia, no volcado. */
  actualValue: string | null;
  message: string;
}

const MAX_PATH_SEGMENTS = 20;
const MAX_ACTUAL_LENGTH = 500;

/** Parte `$.a.b[0]["c d"]` en segmentos. Rechaza comodines, filtros y recursión. */
export function parseJsonPath(path: string): Array<string | number> | null {
  if (!path.startsWith('$')) return null;
  const segments: Array<string | number> = [];
  const pattern = /\.([A-Za-z_$][\w$-]*)|\[(\d+)\]|\["([^"\\]{1,200})"\]/y;
  let index = 1;
  while (index < path.length) {
    pattern.lastIndex = index;
    const match = pattern.exec(path);
    if (!match) return null;
    if (match[1] !== undefined) segments.push(match[1]);
    else if (match[2] !== undefined) segments.push(Number(match[2]));
    else segments.push(match[3]);
    index = pattern.lastIndex;
    if (segments.length > MAX_PATH_SEGMENTS) return null;
  }
  return segments;
}

function resolvePath(
  body: unknown,
  segments: Array<string | number>,
): { found: boolean; value: unknown } {
  let current: unknown = body;
  for (const segment of segments) {
    if (typeof segment === 'number') {
      if (!Array.isArray(current) || segment >= current.length)
        return { found: false, value: undefined };
      current = current[segment];
    } else {
      if (!current || typeof current !== 'object' || Array.isArray(current)) {
        return { found: false, value: undefined };
      }
      if (!Object.prototype.hasOwnProperty.call(current, segment))
        return { found: false, value: undefined };
      current = (current as Record<string, unknown>)[segment];
    }
  }
  return { found: true, value: current };
}

function render(value: unknown): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return (text ?? 'undefined').slice(0, MAX_ACTUAL_LENGTH);
}

const numeric = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (
    typeof value === 'string' &&
    value.trim() !== '' &&
    Number.isFinite(Number(value))
  ) {
    return Number(value);
  }
  return null;
};

/** Igualdad: numérica con tolerancia si ambos son números; si no, por texto canónico. */
function equals(actual: unknown, expected: string, tolerance: number): boolean {
  const a = numeric(actual);
  const e = numeric(expected);
  if (a !== null && e !== null) return Math.abs(a - e) <= tolerance;
  if (typeof actual === 'string') return actual === expected;
  if (typeof actual === 'boolean' || actual === null)
    return String(actual) === expected;
  try {
    return JSON.stringify(actual) === JSON.stringify(JSON.parse(expected));
  } catch {
    return false;
  }
}

function compare(
  operator: Operator,
  found: boolean,
  actual: unknown,
  expected: string | null | undefined,
  tolerance: number,
): { passed: boolean; message: string } {
  if (operator === 'EXISTS') {
    return {
      passed: found,
      message: found ? 'Presente' : 'No existe en la respuesta',
    };
  }
  if (!found) return { passed: false, message: 'No existe en la respuesta' };
  if (expected === null || expected === undefined) {
    return { passed: false, message: 'La aserción no declara valor esperado' };
  }
  switch (operator) {
    case 'EQ': {
      const passed = equals(actual, expected, tolerance);
      return {
        passed,
        message: passed ? 'Igual al esperado' : `Se esperaba ${expected}`,
      };
    }
    case 'NEQ': {
      const passed = !equals(actual, expected, tolerance);
      return {
        passed,
        message: passed
          ? 'Distinto, como se esperaba'
          : `No debía ser ${expected}`,
      };
    }
    case 'CONTAINS': {
      const passed = Array.isArray(actual)
        ? actual.some((item) => equals(item, expected, 0))
        : typeof actual === 'string' && actual.includes(expected);
      return {
        passed,
        message: passed ? 'Contiene el esperado' : `No contiene ${expected}`,
      };
    }
    case 'LT':
    case 'GT': {
      const a = numeric(actual);
      const e = numeric(expected);
      if (a === null || e === null)
        return {
          passed: false,
          message: 'Comparación numérica sobre un valor no numérico',
        };
      const passed = operator === 'LT' ? a < e : a > e;
      return {
        passed,
        message: passed
          ? 'Dentro del límite'
          : `Se esperaba ${operator === 'LT' ? '<' : '>'} ${expected}`,
      };
    }
  }
}

/** Evalúa una aserción. Nunca lanza: una aserción mal definida es un fallo explicado. */
export function evaluateAssertion(
  definition: AssertionDefinition,
  observed: ObservedResponse,
): AssertionVerdict {
  const tolerance = numeric(definition.tolerance ?? null) ?? 0;
  let found = true;
  let actual: unknown;
  switch (definition.type) {
    case 'STATUS':
      actual = observed.status;
      break;
    case 'LATENCY':
      actual = observed.latencyMs;
      break;
    case 'HEADER': {
      const name = definition.path?.toLowerCase();
      if (!name)
        return {
          passed: false,
          actualValue: null,
          message: 'La aserción de cabecera no indica cuál',
        };
      const entry = Object.entries(observed.headers).find(
        ([key]) => key.toLowerCase() === name,
      );
      found = entry !== undefined;
      actual = entry?.[1];
      break;
    }
    case 'JSON_PATH': {
      const segments = definition.path ? parseJsonPath(definition.path) : null;
      if (!segments) {
        return {
          passed: false,
          actualValue: null,
          message:
            'Ruta JSON no soportada (sólo $.campo, [índice] y ["clave"])',
        };
      }
      const resolved = resolvePath(observed.body, segments);
      found = resolved.found;
      actual = resolved.value;
      break;
    }
  }
  const { passed, message } = compare(
    definition.operator,
    found,
    actual,
    definition.expected,
    tolerance,
  );
  return { passed, actualValue: found ? render(actual) : null, message };
}
