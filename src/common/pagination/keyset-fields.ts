import { badRequestWithReason } from '../errors/reasoned-http-exceptions';
import { SystemErrorReason } from '../errors/system-error-reasons';
import type { KeysetCursorKey } from './keyset-cursor';

/**
 * Validación de los CAMPOS de un cursor keyset ya decodificado.
 *
 * `decodeKeysetCursor` sólo garantiza que el cursor sea un objeto plano de escalares. Pero el cursor
 * viaja por la URL y el cliente puede forjarlo: si sus valores terminan en `?::timestamptz` o
 * `?::uuid`, un `"abc"` hace que PostgreSQL falle (22007/22008/22P02) y la petición sale como 500.
 * Cada servicio valida aquí lo que va a castear y responde **400 `INVALID_CURSOR`**.
 */

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?Z$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 400 `INVALID_CURSOR`; no repite el valor recibido. */
export function invalidCursor() {
  return badRequestWithReason(
    'El cursor de paginación no es válido',
    SystemErrorReason.INVALID_CURSOR,
    { parameter: 'cursor' },
  );
}

/** Instante ISO 8601 UTC que existe en el calendario (rechaza `abc`, `2026-02-31T…`). */
export function isValidIsoInstant(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !ISO_UTC.test(valor)) return false;
  const fecha = new Date(valor);
  return (
    !Number.isNaN(fecha.getTime()) &&
    fecha.toISOString().slice(0, 10) === valor.slice(0, 10)
  );
}

export function isUuid(valor: unknown): valor is string {
  return typeof valor === 'string' && UUID.test(valor);
}

export type CursorFieldKind = 'text' | 'timestamp' | 'uuid';

/**
 * Exige que cada campo de `spec` exista en el cursor con el tipo pedido.
 * Un `text` es cualquier cadena de hasta 300 caracteres (sólo se compara, no se castea).
 */
export function readCursorFields<K extends string>(
  cursor: KeysetCursorKey,
  spec: Readonly<Record<K, CursorFieldKind>>,
): Record<K, string> {
  const salida = {} as Record<K, string>;
  for (const campo of Object.keys(spec) as K[]) {
    const valor = cursor[campo];
    const tipo = spec[campo];
    const ok =
      tipo === 'timestamp'
        ? isValidIsoInstant(valor)
        : tipo === 'uuid'
          ? isUuid(valor)
          : typeof valor === 'string' && valor.length <= 300;
    if (!ok) throw invalidCursor();
    salida[campo] = valor as string;
  }
  return salida;
}

/** El valor debe ser uno de la lista (p. ej. el tipo de trabajo de un cursor de desempate). */
export function assertOneOf(
  valor: string,
  permitidos: readonly string[],
): void {
  if (!permitidos.includes(valor)) throw invalidCursor();
}
