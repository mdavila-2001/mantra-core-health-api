import { createHash } from 'node:crypto';

/**
 * Redacción de SQL y de mensajes del driver antes de que lleguen a un log.
 *
 * MikroORM entrega las consultas con los parámetros ya interpolados, y los
 * errores de PostgreSQL traen `DETAIL: Key (col)=(valor)` con el valor de la
 * fila. En esta plataforma esos valores son identidad, clínica o importes (ORMN-02),
 * y la redacción HTTP de pino no toca las cadenas que el ORM arma por su cuenta.
 *
 * Regla: del SQL sólo sale la **clase de sentencia**, un **hash de la forma**
 * (la consulta con los literales borrados, de modo que dos ejecuciones de la misma
 * operación comparten hash) y la duración. Ningún literal, parámetro ni `DETAIL`.
 */

export type StatementClass =
  'select' | 'insert' | 'update' | 'delete' | 'ddl' | 'other';

/** Longitud máxima de un mensaje del driver tras la redacción. */
const MAX_MESSAGE_LENGTH = 300;

/** Clase de sentencia por su verbo inicial. */
export function statementClass(sql: string): StatementClass {
  const head = sql.trimStart().slice(0, 16).toLowerCase();
  if (head.startsWith('select') || head.startsWith('with')) return 'select';
  if (head.startsWith('insert')) return 'insert';
  if (head.startsWith('update')) return 'update';
  if (head.startsWith('delete')) return 'delete';
  if (
    head.startsWith('create') ||
    head.startsWith('alter') ||
    head.startsWith('drop')
  ) {
    return 'ddl';
  }
  return 'other';
}

/**
 * Forma de la consulta: literales de texto, números y listas de parámetros
 * reemplazados por `?`. No es un parser: sobre-redacta antes que filtrar.
 */
export function normalizeSql(sql: string): string {
  return sql
    .replace(LEXEME, (match: string) =>
      match.startsWith('--') || match.startsWith('/*') ? ' ' : '?',
    )
    .replace(/\$\d+/g, '?')
    .replace(/\b\d+(?:\.\d+)?\b/g, '?')
    .replace(/\(\s*\?(?:\s*,\s*\?)*\s*\)/g, '(?)')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Lo que puede esconder un valor dentro del SQL, leído de izquierda a derecha
 * en UNA pasada (un `--` dentro de una cadena no es un comentario, ni una
 * comilla dentro de un comentario abre una cadena):
 *  - comentarios de línea (`--`) y de bloque (el sin cerrar llega al final);
 *  - cadenas con escapes `E'…\'…'`;
 *  - cadenas `'…'` con `''`;
 *  - cadenas con dólar `$tag$…$tag$`.
 * Una cadena SIN cerrar se come hasta el final: sobre-redacta antes que filtrar.
 */
const LEXEME =
  /--[^\n]*|\/\*[\s\S]*?(?:\*\/|$)|(?<![\w$])[eE]'(?:[^'\\]|\\[\s\S]|'')*(?:'|$)|'(?:[^']|'')*(?:'|$)|\$([A-Za-z_]\w*)?\$[\s\S]*?(?:\$\1\$|$)/g;

/** Tope de entrada que se normaliza; más allá no se intenta leerla. */
export const MAX_SQL_INPUT_CHARS = 200_000;
export const TRUNCATED_SQL = '[truncated]';

/**
 * Forma normalizada apta para GUARDAR: se normaliza la sentencia COMPLETA
 * (nunca se corta antes: un corte puede dejar una cadena sin cerrar) y recién
 * después se acota. Si queda cualquier comilla, marca de comentario o cadena
 * con dólar, o la entrada es desmedida, se devuelve `[truncated]`.
 */
export function storableNormalizedSql(sql: string, maxChars: number): string {
  if (typeof sql !== 'string' || sql.length > MAX_SQL_INPUT_CHARS) {
    return TRUNCATED_SQL;
  }
  const normalized = normalizeSql(sql);
  if (/['"]?\$[A-Za-z_]*\$|'|--|\/\*|\*\//.test(normalized)) {
    return TRUNCATED_SQL;
  }
  return normalized.length > maxChars
    ? `${normalized.slice(0, maxChars)}…`
    : normalized;
}

/** Huella de una forma YA normalizada. */
export function shapeHashOfNormalized(normalized: string): string {
  return createHash('sha256').update(normalized).digest('hex').slice(0, 12);
}

/** Huella corta y estable de la forma de la consulta (no del contenido). */
export function sqlShapeHash(sql: string): string {
  return createHash('sha256')
    .update(normalizeSql(sql))
    .digest('hex')
    .slice(0, 12);
}

/**
 * Mensaje de error/advertencia del ORM o del driver apto para un log.
 *
 * Borra `DETAIL`, los pares `Key (col)=(valor)`, los literales entre comillas
 * simples y, si el mensaje arrastra una sentencia SQL, todo desde su verbo.
 */
export function redactDriverMessage(message: unknown): string {
  const text = typeof message === 'string' ? message : String(message);
  const redacted = text
    .replace(/\bDETAIL:[\s\S]*$/i, 'DETAIL: [redactado]')
    .replace(/Key \([^)]*\)=\([^)]*\)/gi, 'Key ([redactado])=([redactado])')
    .replace(
      /\b(select|insert\s+into|update|delete\s+from|with)\b[\s\S]*$/i,
      (_match, verb: string) =>
        `[sql ${verb.toLowerCase().split(/\s+/)[0]} redactado]`,
    )
    .replace(/'(?:[^']|'')*'/g, "'?'");
  return redacted.length > MAX_MESSAGE_LENGTH
    ? `${redacted.slice(0, MAX_MESSAGE_LENGTH)}…`
    : redacted;
}
