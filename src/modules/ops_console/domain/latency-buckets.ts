import {
  LATENCY_BUCKETS_MS,
  LATENCY_BUCKET_KEYS,
} from '../../../observability/http-sli/http-sli.aggregator';

/**
 * Latencia a partir del histograma acumulado que vuelca `http-sli` (H1.2.2 del
 * portal de superadministración).
 *
 * Funciones puras: reciben filas de `service_sli_series` ya leídas y devuelven
 * números. No tocan la base ni el reloj.
 *
 * ## Qué es y qué no es un percentil acá
 *
 * Se guarda un histograma, no cada duración: el percentil se **estima** por
 * interpolación lineal dentro del corte que lo contiene, igual que
 * `histogram_quantile` de Prometheus, así que lo medido acá y lo medido en el VPS
 * se leen igual. Es una aproximación: dentro de un corte se asume una
 * distribución uniforme. Si el percentil cae en el último corte (`inf`, más de
 * 10 s) no hay cota superior: se devuelve el último corte finito y se marca
 * `approximate`, que significa «por lo menos esto».
 */

/** Histograma acumulado: `le5` … `le10000` e `inf`. */
export type CumulativeBuckets = Readonly<Record<string, number>>;

/** Lo que `http-sli` guarda en `dimensions.latency` de cada fila. */
export interface LatencyDimension {
  readonly sumMs?: number;
  readonly maxMs?: number;
  readonly buckets?: CumulativeBuckets;
}

/** Latencia de un conjunto de filas, ya fusionada. */
export interface MergedLatency {
  readonly count: number;
  readonly sumMs: number;
  readonly maxMs: number;
  readonly buckets: CumulativeBuckets;
}

/** Resumen listo para la respuesta de la API. */
export interface LatencySummary {
  readonly avg: number | null;
  readonly p50: number | null;
  readonly p95: number | null;
  readonly max: number | null;
  /** `true` si algún percentil cayó en el último corte y es una cota inferior. */
  readonly approximate: boolean;
}

const EMPTY: Record<string, number> = Object.fromEntries(
  LATENCY_BUCKET_KEYS.map((key) => [key, 0]),
);

function finite(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

/**
 * Fusiona la latencia de varias filas: suma los histogramas acumulados clave a
 * clave, suma `sumMs` y toma el máximo de `maxMs`.
 *
 * Sumar acumulados es correcto: la suma de dos histogramas acumulados es el
 * acumulado de la unión. Una fila sin `latency` (o malformada) cuenta como
 * vacía en vez de romper la lectura.
 */
export function mergeLatency(
  rows: readonly (LatencyDimension | null | undefined)[],
): MergedLatency {
  const buckets: Record<string, number> = { ...EMPTY };
  let sumMs = 0;
  let maxMs = 0;

  for (const row of rows) {
    if (!row) continue;
    for (const key of LATENCY_BUCKET_KEYS) {
      buckets[key] += finite(row.buckets?.[key]);
    }
    sumMs += finite(row.sumMs);
    maxMs = Math.max(maxMs, finite(row.maxMs));
  }

  return { count: buckets.inf, sumMs, maxMs, buckets };
}

/**
 * Percentil `q` (0–1) estimado desde un histograma acumulado.
 *
 * @returns `value` en milisegundos —`null` si no hay observaciones— y
 * `approximate` si cayó en el corte `inf`.
 */
export function quantileFromBuckets(
  buckets: CumulativeBuckets,
  q: number,
): { value: number | null; approximate: boolean } {
  const total = finite(buckets.inf);
  if (total === 0 || !(q >= 0 && q <= 1)) {
    return { value: null, approximate: false };
  }

  const rank = q * total;
  let previousCount = 0;
  let previousBound = 0;

  for (let i = 0; i < LATENCY_BUCKETS_MS.length; i += 1) {
    const bound = LATENCY_BUCKETS_MS[i];
    const count = finite(buckets[LATENCY_BUCKET_KEYS[i]]);
    // `count > 0` sólo importa con q = 0 (rank 0): sin él coincidiría el primer
    // corte aunque estuviera vacío y daría 0 en vez del mínimo observado.
    if (count > 0 && count >= rank) {
      const inBucket = count - previousCount;
      // Corte vacío: el percentil es su cota inferior (no hay con qué interpolar).
      const fraction = inBucket === 0 ? 0 : (rank - previousCount) / inBucket;
      return {
        value: previousBound + (bound - previousBound) * fraction,
        approximate: false,
      };
    }
    previousCount = count;
    previousBound = bound;
  }

  // Cayó en `inf`: no hay cota superior; el último corte finito es "por lo menos".
  return {
    value: LATENCY_BUCKETS_MS[LATENCY_BUCKETS_MS.length - 1],
    approximate: true,
  };
}

/** Resume una latencia fusionada. Sin observaciones, todo es `null`. */
export function summarizeLatency(latency: MergedLatency): LatencySummary {
  if (latency.count === 0) {
    return { avg: null, p50: null, p95: null, max: null, approximate: false };
  }
  const p50 = quantileFromBuckets(latency.buckets, 0.5);
  const p95 = quantileFromBuckets(latency.buckets, 0.95);
  return {
    avg: latency.sumMs / latency.count,
    p50: p50.value,
    p95: p95.value,
    max: latency.maxMs,
    approximate: p50.approximate || p95.approximate,
  };
}

/** Lo que la medición no cubre, dicho en la respuesta para que nadie lo dé por medido. */
export interface NotMeasured {
  readonly metric: string;
  readonly reason: string;
}

/**
 * Las limitaciones de la medición, siempre las mismas.
 *
 * @param enabled - Si la medición está encendida. Apagada, la única razón que
 * importa es esa: todo lo demás sería ruido sobre una tabla vacía.
 */
export function describeNotMeasured(enabled: boolean): NotMeasured[] {
  if (!enabled) {
    return [
      {
        metric: 'disabled',
        reason:
          'La medición de peticiones HTTP está apagada (OBSERVABILITY_HTTP_SLI_ENABLED). No hay datos que mostrar.',
      },
    ];
  }
  return [
    {
      metric: 'rejectedBeforeApi',
      reason:
        'Lo que Traefik o nginx contestan antes de llegar a la API no pasa por esta medición.',
    },
    {
      metric: 'lastMinuteNotFlushed',
      reason:
        'Lo agregado y aún no volcado (hasta un ciclo de volcado) no aparece, y se pierde si el proceso cae.',
    },
    {
      metric: 'healthchecksExcluded',
      reason:
        'Las sondas de salud, la documentación y los preflight OPTIONS no se cuentan a propósito.',
    },
    {
      metric: 'workersNotHttp',
      reason:
        'Los workers y los jobs no son peticiones HTTP: sólo se mide la API.',
    },
    {
      metric: 'unmatchedAggregated',
      reason:
        'Las peticiones a rutas inexistentes se agrupan como UNMATCHED; nunca se guarda su dirección.',
    },
    {
      metric: 'percentilesEstimated',
      reason:
        'La latencia se guarda como histograma: los percentiles son una estimación por interpolación, no un valor exacto.',
    },
  ];
}
