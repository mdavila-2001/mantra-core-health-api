import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Contexto de la petición en curso, para unir SQL ↔ petición ↔ error sin pasar
 * parámetros (02 §5.1).
 *
 * Guarda una referencia al `Request` de Express **sólo para leer** el verbo, la
 * plantilla de la ruta (que Express resuelve después de abrirse el contexto) y
 * el identificador de la petición. Nunca se copia la URL, el cuerpo ni
 * cabeceras. Todo acceso es tolerante: medir no puede lanzar.
 */
export interface RequestLike {
  readonly method?: string;
  readonly baseUrl?: string;
  readonly route?: unknown;
  readonly id?: unknown;
}

export interface RequestContext {
  readonly req: RequestLike;
  readonly startedAtNs: bigint;
  sqlCount: number;
  sqlMs: number;
  /** Consultas de esta petición que superaron `ORM_SLOW_QUERY_MS`. */
  slowSqlCount: number;
  /** Por huella: ejecuciones y milisegundos acumulados. */
  readonly sql: Map<string, { executions: number; sumMs: number }>;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Tope de huellas distintas que se recuerdan por petición. */
export const MAX_SQL_HASHES_PER_REQUEST = 200;

export function createRequestContext(
  req: RequestLike,
  startedAtNs: bigint,
): RequestContext {
  return {
    req,
    startedAtNs,
    sqlCount: 0,
    sqlMs: 0,
    slowSqlCount: 0,
    sql: new Map(),
  };
}

export function runWithRequestContext<T>(
  context: RequestContext,
  fn: () => T,
): T {
  return storage.run(context, fn);
}

export function currentRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

/** Anota una consulta en el contexto vigente, si lo hay. Nunca lanza. */
export function noteSqlInRequest(hash: string, ms: number): void {
  try {
    const ctx = storage.getStore();
    if (!ctx) return;
    ctx.sqlCount += 1;
    ctx.sqlMs += ms;
    const known = ctx.sql.get(hash);
    if (known) {
      known.executions += 1;
      known.sumMs += ms;
    } else if (ctx.sql.size < MAX_SQL_HASHES_PER_REQUEST) {
      ctx.sql.set(hash, { executions: 1, sumMs: ms });
    }
  } catch {
    // Medir no puede romper la consulta.
  }
}

/** Plantilla de la ruta que Express resolvió, o `undefined` si aún no hay. */
export function routeTemplateOfRequest(req: RequestLike): string | undefined {
  const route = req.route as { path?: unknown } | undefined;
  const path = route?.path;
  if (typeof path !== 'string') return undefined;
  return `${req.baseUrl ?? ''}${path}`;
}

/** `req.id` (pino-http) como texto, o `undefined`. */
export function requestIdOf(req: RequestLike): string | undefined {
  const id = req.id;
  if (typeof id === 'string' && id !== '') return id;
  if (typeof id === 'number') return String(id);
  return undefined;
}
