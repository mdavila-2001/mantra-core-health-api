import { createHash } from 'node:crypto';

/**
 * JSON canónico: mismo valor, mismo texto, sin importar el orden en que se
 * armaron las claves. Es la base de los hashes que firman lo que vio una
 * persona (cuerpo de una aprobación de cuatro ojos, evidencia de una campaña).
 *
 * Reglas: claves de objeto en orden alfabético y en todos los niveles; las
 * listas conservan su orden; una propiedad `undefined` no existe; un
 * `undefined` dentro de una lista es `null`; las fechas van en ISO 8601 UTC.
 * Lo que no es JSON (`NaN`, `Infinity`, funciones, símbolos, `bigint`) y las
 * referencias circulares se rechazan con `TypeError`: un hash no se calcula
 * sobre un dato ambiguo.
 *
 * @param value - Valor a serializar.
 * @returns El texto JSON canónico.
 */
export function canonicalJson(value: unknown): string {
  return write(value, new Set<object>());
}

function write(value: unknown, seen: Set<object>): string {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'string':
      return JSON.stringify(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
      if (!Number.isFinite(value)) {
        throw new TypeError('canonicalJson: número no finito');
      }
      return JSON.stringify(value);
    case 'object':
      return writeObject(value, seen);
    default:
      throw new TypeError(`canonicalJson: tipo no admitido (${typeof value})`);
  }
}

function writeObject(value: object, seen: Set<object>): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new TypeError('canonicalJson: fecha inválida');
    }
    return JSON.stringify(value.toISOString());
  }
  if (seen.has(value)) {
    throw new TypeError('canonicalJson: referencia circular');
  }
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      const items = (value as unknown[]).map((v) =>
        v === undefined ? 'null' : write(v, seen),
      );
      return `[${items.join(',')}]`;
    }
    const record = value as Record<string, unknown>;
    const parts = Object.keys(record)
      .filter((k) => record[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${write(record[k], seen)}`);
    return `{${parts.join(',')}}`;
  } finally {
    seen.delete(value);
  }
}

/**
 * SHA-256 de un texto, en 64 hexadecimales en minúscula (el formato que exigen
 * los CHECK `payload_hash` y `evidence_hash`).
 *
 * @param text - Texto UTF-8.
 */
export function sha256Hex(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}
