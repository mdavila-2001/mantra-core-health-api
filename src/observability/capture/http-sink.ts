import {
  LATENCY_BUCKETS_MS,
  MAX_KEYS_PER_MINUTE,
  OVERFLOW_ROUTE,
  bucketIndex,
  normalizeMethod,
  sanitizeRoute,
} from '../http-sli/http-sli.aggregator';
import {
  operationResolver,
  type OperationResolver,
} from './operation-resolver';

/**
 * Sink de peticiones HTTP: minuto × método × plantilla × **código exacto**
 * (H2 del portal «Sistema»).
 *
 * Complementa —no reemplaza— a `HttpSliAggregator`, que sigue alimentando
 * `time_series.service_sli_series` (doble escritura, ADR-0027) y con ella
 * `/admin/ops/traffic*`. Acá el detalle es el código exacto (404 ≠ 422 ≠ 409) y
 * el módulo/operación; las filas llevan la clave de idempotencia completa.
 *
 * ## Idempotencia
 *
 * `drain()` asigna a cada minuto un `flushSeq` (1, 2, 3… dentro de esta
 * instancia). La clave primaria de la tabla es
 * `(time, instance_id, flush_seq, http_method, route_template, http_status)`:
 * reintentar el mismo lote —aunque el primer intento haya confirmado y la
 * respuesta se haya perdido— choca con la clave y `ON CONFLICT DO NOTHING` lo
 * descarta. Nada se suma dos veces.
 *
 * Es una clase pura (sin Express, sin base, sin reloj propio): `record` es O(1)
 * y no lanza.
 */

export interface HttpSinkSample {
  readonly method: string;
  /** Plantilla de ruta o `UNMATCHED`. Nunca la URL real. */
  readonly route: string;
  readonly status: number;
  readonly durationMs: number;
  readonly at: Date;
}

/** Una fila lista para `observability.http_request_minute_series`. */
export interface HttpMinuteRow {
  readonly time: Date;
  readonly flushSeq: number;
  readonly httpMethod: string;
  readonly routeTemplate: string;
  readonly httpStatus: number;
  readonly operationKey: string | null;
  readonly moduleCode: string;
  /** Todas las peticiones del grupo (el cubo `+Inf`). */
  readonly requests: number;
  readonly sumMs: number;
  readonly maxMs: number;
  /** Acumulados: `le5` = peticiones ≤ 5 ms … `le10000` = ≤ 10 s. */
  readonly buckets: readonly number[];
}

interface Cell {
  readonly minute: number;
  readonly method: string;
  readonly route: string;
  readonly status: number;
  requests: number;
  sumMs: number;
  maxMs: number;
  /** No acumulado mientras se cuenta; se acumula al drenar. */
  buckets: number[];
}

const MINUTE_MS = 60_000;
/** Cuántos minutos recuerda el contador de `flush_seq`. */
const SEQ_MEMORY_MINUTES = 180;

/** Código HTTP exacto; fuera de 100–599 (no debería ocurrir) cuenta como `0`. */
export function exactStatus(status: number): number {
  const truncated = Math.trunc(status);
  return truncated >= 100 && truncated <= 599 ? truncated : 0;
}

export class HttpSink {
  private enabled = false;
  private readonly cells = new Map<string, Cell>();
  private readonly keysByMinute = new Map<number, Set<string>>();
  private readonly seqByMinute = new Map<number, number>();

  constructor(
    private readonly resolver: OperationResolver = operationResolver,
  ) {}

  /** Enciende o apaga la captura. Apagado, `record` no hace nada. */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  /** Grupos pendientes de volcar. */
  get pendingGroups(): number {
    return this.cells.size;
  }

  record(sample: HttpSinkSample): void {
    if (!this.enabled) return;
    try {
      const minute = Math.floor(sample.at.getTime() / MINUTE_MS) * MINUTE_MS;
      const method = normalizeMethod(sample.method);
      let route = sanitizeRoute(sample.route);
      const status = exactStatus(sample.status);

      // Tope de cardinalidad por minuto: la clave 2001 cae en el desborde.
      const known = this.keysByMinute.get(minute) ?? new Set<string>();
      const probe = `${method}|${route}|${status}`;
      if (!known.has(probe)) {
        if (known.size >= MAX_KEYS_PER_MINUTE && route !== OVERFLOW_ROUTE) {
          route = OVERFLOW_ROUTE;
        }
        known.add(`${method}|${route}|${status}`);
        this.keysByMinute.set(minute, known);
      }

      const cellKey = `${minute}|${method}|${route}|${status}`;
      let cell = this.cells.get(cellKey);
      if (!cell) {
        cell = {
          minute,
          method,
          route,
          status,
          requests: 0,
          sumMs: 0,
          maxMs: 0,
          buckets: new Array<number>(LATENCY_BUCKETS_MS.length).fill(0),
        };
        this.cells.set(cellKey, cell);
      }
      cell.requests += 1;
      const duration =
        Number.isFinite(sample.durationMs) && sample.durationMs > 0
          ? sample.durationMs
          : 0;
      cell.sumMs += duration;
      cell.maxMs = Math.max(cell.maxMs, duration);
      const index = bucketIndex(duration);
      // El último índice es `inf`: se cuenta en `requests`, no en un cubo.
      if (index < LATENCY_BUCKETS_MS.length) cell.buckets[index] += 1;
    } catch {
      // Medir no puede romper una respuesta que ya salió.
    }
  }

  /**
   * Entrega lo acumulado con su `flushSeq` y lo olvida. Cada llamada produce
   * filas **disjuntas** de las anteriores (otro `flushSeq` para el mismo minuto).
   */
  drain(): HttpMinuteRow[] {
    const seqForMinute = new Map<number, number>();
    const rows = [...this.cells.values()]
      .sort(
        (a, b) =>
          a.minute - b.minute ||
          a.method.localeCompare(b.method) ||
          a.route.localeCompare(b.route) ||
          a.status - b.status,
      )
      .map((cell): HttpMinuteRow => {
        let seq = seqForMinute.get(cell.minute);
        if (seq === undefined) {
          seq = (this.seqByMinute.get(cell.minute) ?? 0) + 1;
          seqForMinute.set(cell.minute, seq);
          this.seqByMinute.set(cell.minute, seq);
        }
        let running = 0;
        const buckets = cell.buckets.map((n) => (running += n));
        const resolved = this.resolver.resolve(cell.method, cell.route);
        return {
          time: new Date(cell.minute),
          flushSeq: seq,
          httpMethod: cell.method,
          routeTemplate: cell.route,
          httpStatus: cell.status,
          operationKey: resolved.operationKey,
          moduleCode: resolved.moduleCode,
          requests: cell.requests,
          sumMs: cell.sumMs,
          maxMs: cell.maxMs,
          buckets,
        };
      });

    this.cells.clear();
    this.keysByMinute.clear();
    // El horizonte se mide contra el minuto más nuevo de los datos, no contra
    // el reloj: con `Date.now()` un minuto de muestras viejas (o de un reloj
    // atrasado) se olvidaba en el mismo drenaje que le daba su `flushSeq`, el
    // siguiente volcado de ese minuto volvía a 1 y `ON CONFLICT DO NOTHING`
    // descartaba en silencio filas nuevas como si fueran un reintento.
    let newest = Number.NEGATIVE_INFINITY;
    for (const minute of this.seqByMinute.keys()) {
      if (minute > newest) newest = minute;
    }
    const horizon = newest - SEQ_MEMORY_MINUTES * MINUTE_MS;
    for (const minute of this.seqByMinute.keys()) {
      if (minute < horizon) this.seqByMinute.delete(minute);
    }
    return rows;
  }
}

/** Sink del proceso: lo comparten el middleware y el servicio de volcado. */
export const httpSink = new HttpSink();
