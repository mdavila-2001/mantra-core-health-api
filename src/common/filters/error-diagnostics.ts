/**
 * Diagnóstico de errores para quien está depurando, no para quien usa la app.
 *
 * ## El problema que resuelve
 *
 * El filtro global oculta a propósito todo lo interno de un fallo: el 500 sale
 * como «Error interno del servidor» y la clave foránea rota como «la petición
 * referencia un recurso que no existe». Es lo correcto frente a un paciente,
 * pero deja a quien prueba un formulario con un único dato —el
 * `correlationId`— que sólo sirve si además tiene acceso a los logs del
 * servidor. En la práctica no lo tiene, y el fallo se queda sin explicar.
 *
 * ## La regla
 *
 * Con `API_ERROR_DIAGNOSTICS=true` la respuesta lleva además un bloque
 * `diagnostics` con la clase de la excepción, su mensaje interno, la
 * restricción/tabla/columna del driver y los marcos del stack que pertenecen
 * al código de la API (`src/...:línea`). **Apagado por defecto.** Se enciende
 * sólo en entornos locales o de prueba con datos sintéticos: el mensaje interno
 * de PostgreSQL puede citar el valor que falló.
 *
 * Nunca viaja el `detail` del driver, que es donde PostgreSQL escribe el valor
 * de la clave que violó la restricción.
 */

/** Variable de entorno que enciende el diagnóstico en la respuesta. */
export const ERROR_DIAGNOSTICS_ENV = 'API_ERROR_DIAGNOSTICS';

/** Techo del mensaje interno: basta para entenderlo, no para volcar un SQL. */
const MAX_MESSAGE_LENGTH = 500;

/** Cuántos marcos del stack propio se devuelven. */
const MAX_FRAMES = 5;

/** Bloque `diagnostics` del cuerpo de error. */
export interface ErrorDiagnostics {
  /** Clase de la excepción original: `TypeError`, `NotFoundError`… */
  readonly exception: string;
  /** Mensaje interno, recortado. */
  readonly message?: string;
  /** Restricción, tabla y columna que reporta el driver, si las hay. */
  readonly constraint?: unknown;
  readonly table?: unknown;
  readonly column?: unknown;
  /** Marcos del stack dentro del código de la API, del más reciente al más viejo. */
  readonly where?: readonly string[];
}

/** Lee el interruptor en cada error: las pruebas lo cambian entre casos. */
export function errorDiagnosticsEnabled(): boolean {
  return process.env[ERROR_DIAGNOSTICS_ENV] === 'true';
}

/**
 * Arma el diagnóstico de una excepción.
 *
 * @param exception - Lo que capturó el filtro.
 * @param internals - Restricción/tabla/columna ya extraídas por el filtro.
 */
export function describeForDiagnostics(
  exception: unknown,
  internals?: unknown,
): ErrorDiagnostics {
  const integrity = isRecord(internals) ? internals : {};
  const error = exception instanceof Error ? exception : undefined;

  return {
    exception: error?.constructor?.name ?? typeof exception,
    ...(error?.message
      ? { message: error.message.slice(0, MAX_MESSAGE_LENGTH) }
      : {}),
    ...(integrity.constraint ? { constraint: integrity.constraint } : {}),
    ...(integrity.table ? { table: integrity.table } : {}),
    ...(integrity.column ? { column: integrity.column } : {}),
    ...whereOf(error?.stack),
  };
}

/**
 * Los marcos del stack que caen dentro de `src/` —en desarrollo— o de
 * `dist/src/` —el build—, sin la ruta absoluta del disco.
 *
 * Los de `node_modules` se descartan: que el error pasó por Express o por
 * MikroORM no le dice a nadie qué línea propia hay que mirar.
 */
function whereOf(stack: string | undefined): { where?: string[] } {
  if (!stack) return {};
  const frames = stack
    .split('\n')
    .slice(1)
    .filter((line) => !line.includes('node_modules'))
    .map((line) => /(?:^|[\\/])((?:dist[\\/])?src[\\/][^\s)]+)/.exec(line)?.[1])
    .filter((frame): frame is string => frame !== undefined)
    .slice(0, MAX_FRAMES);
  return frames.length > 0 ? { where: frames } : {};
}

/**
 * Qué campos fallaron, en la forma que se puede escribir en el log: la ruta y
 * el nombre de la restricción. Los mensajes no, porque un mensaje propio de un
 * DTO puede interpolar el valor recibido (`$value`).
 *
 * @param details - El `details` del cuerpo de error.
 */
export function violationsForLog(details: unknown): {
  violations?: { field: string; constraints: unknown }[];
} {
  if (!isRecord(details) || !Array.isArray(details.fields)) return {};
  const violations = (details.fields as unknown[])
    .filter(isRecord)
    .filter(
      (item): item is Record<string, unknown> & { field: string } =>
        typeof item.field === 'string',
    )
    .map((item) => ({ field: item.field, constraints: item.constraints }));
  return violations.length > 0 ? { violations } : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
