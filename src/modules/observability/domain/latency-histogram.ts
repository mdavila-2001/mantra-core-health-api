/**
 * Percentiles estimados desde un histograma **acumulado** (`le5 … le10000` y el
 * total). Es una estimación —interpolación lineal dentro del corte—, no un
 * percentil exacto: el resultado siempre se publica con `approximate: true`.
 */

/** Cortes del histograma HTTP en ms; los mismos de `LATENCY_BUCKETS_MS`. */
export const HTTP_BOUNDS_MS: readonly number[] = [
  5, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000, 10000,
];

/** Cortes del histograma SQL en ms (`le1 … le5000`). */
export const SQL_BOUNDS_MS: readonly number[] = [
  1, 5, 10, 25, 50, 100, 250, 500, 1000, 5000,
];

export interface PercentileEstimate {
  readonly ms: number;
  /** `true` si el percentil cae por encima del último corte (el valor es una cota inferior). */
  readonly lowerBound: boolean;
}

/**
 * @param bounds - Cortes ascendentes en ms.
 * @param cumulative - Cuántas muestras ≤ cada corte (misma longitud que `bounds`).
 * @param total - Todas las muestras (incluye las que superan el último corte).
 * @param p - Percentil en (0, 1].
 * @param maxMs - Máximo observado: la estimación nunca lo supera.
 * @returns `null` si no hay muestras.
 */
export function estimatePercentile(
  bounds: readonly number[],
  cumulative: readonly number[],
  total: number,
  p: number,
  maxMs?: number,
): PercentileEstimate | null {
  if (!(total > 0)) return null;
  const target = p * total;
  let previousCount = 0;
  let previousBound = 0;
  for (let i = 0; i < bounds.length; i += 1) {
    const count = cumulative[i] ?? 0;
    if (count >= target) {
      const inBucket = count - previousCount;
      const fraction = inBucket > 0 ? (target - previousCount) / inBucket : 1;
      const raw = previousBound + fraction * (bounds[i] - previousBound);
      const ms = maxMs !== undefined && maxMs > 0 ? Math.min(raw, maxMs) : raw;
      return { ms: Math.round(ms * 100) / 100, lowerBound: false };
    }
    previousCount = count;
    previousBound = bounds[i];
  }
  const last = bounds[bounds.length - 1];
  return {
    ms: maxMs !== undefined && maxMs > last ? Math.round(last) : last,
    lowerBound: true,
  };
}

/** Un percentil como valor de API: `null` + `reason` si no hay muestras. */
export function percentileValue(
  bounds: readonly number[],
  cumulative: readonly number[],
  total: number,
  p: number,
  maxMs?: number,
) {
  const estimate = estimatePercentile(bounds, cumulative, total, p, maxMs);
  return estimate
    ? { value: estimate.ms, ...(estimate.lowerBound ? { atLeast: true } : {}) }
    : { value: null, reason: 'SIN_MUESTRAS' };
}
