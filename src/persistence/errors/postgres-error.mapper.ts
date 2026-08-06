import {
  ConcurrencyConflictError,
  ConnectionUnavailableError,
  DeadlockDetectedError,
  DuplicateEntityError,
  ForeignKeyConflictError,
  InsufficientPrivilegeError,
  PersistenceError,
  QueryTimeoutError,
  RequiredFieldError,
  type PersistenceErrorContext,
} from './persistence.errors';

/**
 * Traducción de SQLSTATE de PostgreSQL a los errores normalizados del §45.
 *
 * El mapa vive aquí y no dentro del adaptador porque es conocimiento del motor,
 * no de un repositorio concreto: los adaptadores de lectura y de escritura lo
 * comparten, y una prueba puede ejercerlo sin levantar una conexión.
 */

/** Forma mínima de un error del driver `pg` o de MikroORM que lo envuelve. */
interface DriverErrorShape {
  /** SQLSTATE de cinco caracteres. */
  code?: unknown;
  /** Restricción implicada, cuando el motor la identifica. */
  constraint?: unknown;
  /** Mensaje del motor. */
  message?: unknown;
  /** MikroORM envuelve el error del driver aquí. */
  cause?: unknown;
  /** Algunas versiones lo exponen como `previous`. */
  previous?: unknown;
}

/**
 * SQLSTATE exactos con traducción directa.
 *
 * Los códigos de clase completa (`08`, `53`, `57`) se resuelven aparte por
 * prefijo, porque enumerar sus decenas de variantes sería una lista que
 * envejece mal cada vez que PostgreSQL añade una.
 */
const EXACT: Readonly<
  Record<
    string,
    new (
      m: string,
      c: PersistenceErrorContext,
      o?: { cause?: unknown },
    ) => PersistenceError
  >
> = {
  '23505': DuplicateEntityError,
  '23503': ForeignKeyConflictError,
  '23502': RequiredFieldError,
  '40001': ConcurrencyConflictError,
  '40P01': DeadlockDetectedError,
  '42501': InsufficientPrivilegeError,
  '57014': QueryTimeoutError,
};

/**
 * Mensajes por tipo. Se redactan aquí, y no se reutiliza el del motor, porque
 * el de PostgreSQL incluye el `DETAIL` con los valores en conflicto: en
 * `users_email_key` ese detalle es un correo, es decir, un dato personal que no
 * debe viajar en un mensaje de error que puede acabar en un log o en una
 * respuesta HTTP.
 */
const MESSAGES = new Map<unknown, string>([
  [DuplicateEntityError, 'Ya existe un registro con esos valores únicos.'],
  [
    ForeignKeyConflictError,
    'La operación referencia un registro que no existe o que aún tiene dependientes.',
  ],
  [RequiredFieldError, 'Falta un campo obligatorio.'],
  [
    DeadlockDetectedError,
    'Interbloqueo detectado; la transacción fue abortada.',
  ],
  [
    ConcurrencyConflictError,
    'Conflicto de concurrencia; la transacción debe reintentarse.',
  ],
  [
    InsufficientPrivilegeError,
    'El rol de base de datos no tiene privilegios para esta operación.',
  ],
  [QueryTimeoutError, 'La consulta excedió el tiempo máximo permitido.'],
  [
    ConnectionUnavailableError,
    'La conexión con la base de datos no está disponible.',
  ],
]);

/** Extrae el SQLSTATE, descendiendo por la cadena de envoltorios de MikroORM. */
function extractSqlState(error: unknown, depth = 0): string | undefined {
  // El límite de profundidad evita un bucle infinito si un envoltorio se
  // referencia a sí mismo como causa, que es barato de provocar y caro de
  // depurar si ocurre en producción.
  if (depth > 5 || typeof error !== 'object' || error === null)
    return undefined;
  const shape = error as DriverErrorShape;
  if (typeof shape.code === 'string' && /^[0-9A-Z]{5}$/.test(shape.code)) {
    return shape.code;
  }
  return (
    extractSqlState(shape.cause, depth + 1) ??
    extractSqlState(shape.previous, depth + 1)
  );
}

/** Extrae el nombre de la restricción implicada, si el motor lo aporta. */
function extractConstraint(error: unknown, depth = 0): string | undefined {
  if (depth > 5 || typeof error !== 'object' || error === null)
    return undefined;
  const shape = error as DriverErrorShape;
  if (typeof shape.constraint === 'string') return shape.constraint;
  return (
    extractConstraint(shape.cause, depth + 1) ??
    extractConstraint(shape.previous, depth + 1)
  );
}

/**
 * Traduce un error de PostgreSQL al vocabulario normalizado.
 *
 * Un error que ya es `PersistenceError` se devuelve tal cual: la traducción es
 * idempotente, de modo que un adaptador puede envolver a otro sin degradar el
 * tipo a algo más genérico en cada salto.
 *
 * @param error error crudo del driver o de MikroORM.
 * @param context contexto sanitizado que se adjunta al error resultante.
 */
export function mapPostgresError(
  error: unknown,
  context: PersistenceErrorContext = {},
): PersistenceError {
  if (error instanceof PersistenceError) return error;

  const code = extractSqlState(error);
  const constraint = extractConstraint(error);
  const fullContext: PersistenceErrorContext = {
    ...context,
    engine: context.engine ?? 'postgresql',
    ...(code ? { code } : {}),
    ...(constraint ? { constraint } : {}),
  };

  if (code) {
    const Exact = EXACT[code];
    if (Exact) {
      return new Exact(
        MESSAGES.get(Exact) ?? 'Error de persistencia.',
        fullContext,
        {
          cause: error,
        },
      );
    }
    // Clases completas por prefijo: `08` conexión, `53` recursos agotados
    // (incluye `53300 too_many_connections`, el síntoma clásico de un pool mal
    // dimensionado), `57P01/57P02/57P03` apagado o reinicio del servidor.
    if (
      code.startsWith('08') ||
      code.startsWith('53') ||
      code.startsWith('57P')
    ) {
      return new ConnectionUnavailableError(
        MESSAGES.get(ConnectionUnavailableError) ?? 'Error de persistencia.',
        fullContext,
        { cause: error },
      );
    }
  }

  // Sin SQLSTATE no hay diagnóstico del motor: los fallos de red del socket
  // (`ECONNREFUSED`, `ETIMEDOUT`) llegan por aquí y son de conexión.
  const errno = (error as { code?: unknown } | null)?.code;
  if (
    typeof errno === 'string' &&
    [
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'EHOSTUNREACH',
      'ENOTFOUND',
    ].includes(errno)
  ) {
    return new ConnectionUnavailableError(
      MESSAGES.get(ConnectionUnavailableError) ?? 'Error de persistencia.',
      { ...fullContext, code: errno },
      { cause: error },
    );
  }

  return new PersistenceError(
    'Error de persistencia no clasificado.',
    fullContext,
    {
      cause: error,
    },
  );
}
