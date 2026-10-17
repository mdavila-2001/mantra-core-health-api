/**
 * Agregador en memoria de las peticiones HTTP de la API (H1.1 del portal de
 * superadministración).
 *
 * Cuenta, por minuto y por (método, **plantilla de ruta**), cuántas peticiones
 * hubo, cómo terminaron (2xx/3xx/4xx/5xx) y cuánto tardaron. Es una clase pura:
 * no conoce Express, ni la base, ni el reloj; recibe muestras y las entrega
 * agrupadas. El middleware las produce y el servicio de volcado las persiste en
 * `time_series.service_sli_series`.
 *
 * ## Qué NUNCA entra
 *
 * Ni la URL real, ni el query, ni el cuerpo, ni cabeceras, ni el usuario. Sólo
 * la plantilla que Express declaró (`/patients/:id`) y números. Es la diferencia
 * entre una métrica operativa y un registro de quién consultó a qué paciente
 * (regla 90.2 de la casa). Como defensa en profundidad, una "ruta" que parezca
 * una URL real —lleva un UUID o una secuencia larga de dígitos— se pliega a
 * {@link UNMATCHED_ROUTE} en vez de guardarse.
 *
 * ## Latencia
 *
 * Histograma **acumulado** (`le5` cuenta las peticiones de ≤ 5 ms; `inf` las
 * cuenta todas), con los mismos once cortes que
 * `infra/monitoring/otel-collector/config.yaml`, para que lo medido acá y lo
 * medido en el VPS se puedan comparar. Dos filas del mismo minuto se suman
 * campo a campo, que es lo que hace la lectura.
 */

/** Cortes del histograma en milisegundos; los mismos del collector del VPS. */
export const LATENCY_BUCKETS_MS: readonly number[] = [
  5, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000, 10000,
];

/** Claves del histograma, en el orden de {@link LATENCY_BUCKETS_MS}, más `inf`. */
export const LATENCY_BUCKET_KEYS: readonly string[] = [
  ...LATENCY_BUCKETS_MS.map((limit) => `le${limit}`),
  'inf',
];

/** Tope de claves distintas (método, ruta) por minuto: acota memoria y cardinalidad. */
export const MAX_KEYS_PER_MINUTE = 2000;

/** Ruta bajo la que se agrupa el desborde del tope de cardinalidad. */
export const OVERFLOW_ROUTE = '__overflow__';

/** Ruta bajo la que se agrupa lo que no coincidió con ninguna ruta declarada. */
export const UNMATCHED_ROUTE = 'UNMATCHED';

/** Prefijo de `series_id`: separa estas series de cualquier otra del dataset. */
export const SERIES_PREFIX = 'http';

/** `sli_code` de las filas de peticiones en `service_sli_series`. */
export const HTTP_SLI_CODE = 'http_requests';

const MINUTE_MS = 60_000;
const KNOWN_METHODS = new Set([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
]);
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const LONG_DIGITS = /\d{6,}/;

/** Una petición ya terminada, reducida a lo mínimo medible. */
export interface HttpSample {
  readonly method: string;
  /** Plantilla de ruta (`/patients/:id`) o {@link UNMATCHED_ROUTE}. Nunca la URL real. */
  readonly route: string;
  readonly status: number;
  readonly durationMs: number;
  readonly at: Date;
}

/** Cómo terminaron las peticiones de un grupo, por clase de estado. */
export interface HttpStatusClasses {
  readonly '2xx'?: number;
  readonly '3xx'?: number;
  readonly '4xx'?: number;
  readonly '5xx'?: number;
  readonly other?: number;
}

/** Una fila lista para persistir: un minuto de una (método, ruta). */
export interface HttpSliPoint {
  /** Minuto truncado, en UTC. */
  readonly time: Date;
  /** `http|<MÉTODO>|<plantilla>`. */
  readonly seriesId: string;
  /** Peticiones que terminaron en 2xx o 3xx. */
  readonly numerator: number;
  /** Peticiones totales. */
  readonly denominator: number;
  /** `numerator / denominator`. */
  readonly value: number;
  readonly dimensions: {
    readonly method: string;
    readonly route: string;
    readonly codes: HttpStatusClasses;
    readonly latency: {
      readonly sumMs: number;
      readonly maxMs: number;
      /** Acumulado: `le5` ≤ 5 ms … `inf` = todas. */
      readonly buckets: Readonly<Record<string, number>>;
    };
  };
}

interface Cell {
  readonly minute: number;
  readonly method: string;
  readonly route: string;
  total: number;
  ok: number;
  codes: {
    '2xx': number;
    '3xx': number;
    '4xx': number;
    '5xx': number;
    other: number;
  };
  sumMs: number;
  maxMs: number;
  /** No acumulado mientras se cuenta; se acumula al drenar. */
  buckets: number[];
}

/** Método normalizado: un verbo fuera de la lista no crea series nuevas. */
function normalizeMethod(method: string): string {
  const upper = (method ?? '').toUpperCase();
  return KNOWN_METHODS.has(upper) ? upper : 'OTHER';
}

/** Defensa en profundidad: una plantilla no lleva identificadores. */
function sanitizeRoute(route: string): string {
  if (!route) return UNMATCHED_ROUTE;
  if (route === UNMATCHED_ROUTE || route === OVERFLOW_ROUTE) return route;
  if (UUID.test(route) || LONG_DIGITS.test(route) || route.length > 200) {
    return UNMATCHED_ROUTE;
  }
  // Un comodín (`/{*all}`, `*`) es el middleware que atrapa lo que ninguna ruta
  // quiso —Express lo entrega como si fuera la ruta—: no es un endpoint.
  if (route.includes('*')) return UNMATCHED_ROUTE;
  return route;
}

/** Índice del primer corte que contiene la duración; el último es `inf`. */
function bucketIndex(durationMs: number): number {
  const index = LATENCY_BUCKETS_MS.findIndex((limit) => durationMs <= limit);
  return index === -1 ? LATENCY_BUCKETS_MS.length : index;
}

/**
 * Acumula peticiones y las entrega agrupadas por minuto, método y plantilla.
 *
 * `record` es O(1) y no lanza: medir no puede tumbar una petición.
 */
export class HttpSliAggregator {
  private readonly cells = new Map<string, Cell>();
  private readonly keysByMinute = new Map<number, Set<string>>();

  /** Cuántos grupos hay pendientes de volcar. */
  get pendingGroups(): number {
    return this.cells.size;
  }

  /** Anota una petición terminada. */
  record(sample: HttpSample): void {
    const minute = Math.floor(sample.at.getTime() / MINUTE_MS) * MINUTE_MS;
    const method = normalizeMethod(sample.method);
    let route = sanitizeRoute(sample.route);

    // Tope de cardinalidad: la clave 2001 de un minuto cae en el desborde.
    const knownKeys = this.keysByMinute.get(minute) ?? new Set<string>();
    const key = `${method}|${route}`;
    if (!knownKeys.has(key)) {
      if (knownKeys.size >= MAX_KEYS_PER_MINUTE && route !== OVERFLOW_ROUTE) {
        route = OVERFLOW_ROUTE;
      }
      knownKeys.add(`${method}|${route}`);
      this.keysByMinute.set(minute, knownKeys);
    }

    const cellKey = `${minute}|${method}|${route}`;
    let cell = this.cells.get(cellKey);
    if (!cell) {
      cell = {
        minute,
        method,
        route,
        total: 0,
        ok: 0,
        codes: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, other: 0 },
        sumMs: 0,
        maxMs: 0,
        buckets: new Array<number>(LATENCY_BUCKET_KEYS.length).fill(0),
      };
      this.cells.set(cellKey, cell);
    }

    cell.total += 1;
    const status = Math.trunc(sample.status);
    if (status >= 200 && status < 300) {
      cell.codes['2xx'] += 1;
      cell.ok += 1;
    } else if (status >= 300 && status < 400) {
      cell.codes['3xx'] += 1;
      cell.ok += 1;
    } else if (status >= 400 && status < 500) {
      cell.codes['4xx'] += 1;
    } else if (status >= 500 && status < 600) {
      cell.codes['5xx'] += 1;
    } else {
      cell.codes.other += 1;
    }

    const duration =
      Number.isFinite(sample.durationMs) && sample.durationMs > 0
        ? sample.durationMs
        : 0;
    cell.sumMs += duration;
    cell.maxMs = Math.max(cell.maxMs, duration);
    cell.buckets[bucketIndex(duration)] += 1;
  }

  /**
   * Entrega todo lo acumulado y lo olvida.
   *
   * Vaciar es lo que permite que dos volcados consecutivos del mismo minuto
   * produzcan filas **disjuntas** que la lectura suma sin contar dos veces.
   */
  drain(): HttpSliPoint[] {
    const points = [...this.cells.values()]
      .map((cell): HttpSliPoint => {
        let running = 0;
        const buckets: Record<string, number> = {};
        LATENCY_BUCKET_KEYS.forEach((bucketKey, index) => {
          running += cell.buckets[index] ?? 0;
          buckets[bucketKey] = running;
        });
        const codes: Record<string, number> = {};
        for (const [name, count] of Object.entries(cell.codes)) {
          if (count > 0) codes[name] = count;
        }
        return {
          time: new Date(cell.minute),
          seriesId: `${SERIES_PREFIX}|${cell.method}|${cell.route}`,
          numerator: cell.ok,
          denominator: cell.total,
          value: cell.total === 0 ? 0 : cell.ok / cell.total,
          dimensions: {
            method: cell.method,
            route: cell.route,
            codes,
            latency: { sumMs: cell.sumMs, maxMs: cell.maxMs, buckets },
          },
        };
      })
      .sort(
        (a, b) =>
          a.time.getTime() - b.time.getTime() ||
          a.seriesId.localeCompare(b.seriesId),
      );

    this.cells.clear();
    this.keysByMinute.clear();
    return points;
  }
}
