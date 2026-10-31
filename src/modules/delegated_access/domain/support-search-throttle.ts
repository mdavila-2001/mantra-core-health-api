/** Topes de búsquedas de pacientes por persona de apoyo. */
export interface SearchLimits {
  /** Búsquedas permitidas por minuto. */
  readonly perMinute: number;
  /** Búsquedas permitidas por día. */
  readonly perDay: number;
}

/** Topes por defecto: recorrer la base a golpes de prueba y error queda inviable. */
export const DEFAULT_SEARCH_LIMITS: SearchLimits = {
  perMinute: 20,
  perDay: 200,
};

/**
 * Topes por IP de origen, más holgados que los de una persona: tras un mismo
 * NAT cabe todo un mostrador, pero repartir los intentos entre varias cuentas
 * desde un solo origen no multiplica el cupo.
 */
export const DEFAULT_IP_SEARCH_LIMITS: SearchLimits = {
  perMinute: 60,
  perDay: 600,
};

/** Fracción del tope a partir de la cual el volumen se registra como anomalía. */
export const SEARCH_ANOMALY_RATIO = 0.8;

/** Veredicto de un intento de búsqueda según el volumen reciente. */
export interface SearchRateVerdict {
  /** ¿Se admite la búsqueda? */
  readonly allowed: boolean;
  /** Tope superado, si se negó. */
  readonly exceeded?: 'MINUTE' | 'DAY';
  /** ¿El volumen es llamativo aunque todavía no supere el tope? */
  readonly anomalous: boolean;
}

/**
 * Lee los topes del entorno (`SUPPORT_PATIENT_SEARCH_PER_MINUTE` y
 * `SUPPORT_PATIENT_SEARCH_PER_DAY`); un valor ausente o inválido deja el de
 * por defecto, nunca abre el tope.
 *
 * @param env - Variables de entorno.
 * @returns Los topes vigentes.
 */
export function searchLimitsFromEnv(
  env: Readonly<Record<string, string | undefined>>,
): SearchLimits {
  const read = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  };
  return {
    perMinute: read(
      env.SUPPORT_PATIENT_SEARCH_PER_MINUTE,
      DEFAULT_SEARCH_LIMITS.perMinute,
    ),
    perDay: read(
      env.SUPPORT_PATIENT_SEARCH_PER_DAY,
      DEFAULT_SEARCH_LIMITS.perDay,
    ),
  };
}

/**
 * Lee los topes por IP del entorno (`SUPPORT_PATIENT_SEARCH_IP_PER_MINUTE` y
 * `SUPPORT_PATIENT_SEARCH_IP_PER_DAY`); un valor ausente o inválido deja el de
 * por defecto, nunca abre el tope.
 *
 * @param env - Variables de entorno.
 * @returns Los topes por IP vigentes.
 */
export function ipSearchLimitsFromEnv(
  env: Readonly<Record<string, string | undefined>>,
): SearchLimits {
  const read = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  };
  return {
    perMinute: read(
      env.SUPPORT_PATIENT_SEARCH_IP_PER_MINUTE,
      DEFAULT_IP_SEARCH_LIMITS.perMinute,
    ),
    perDay: read(
      env.SUPPORT_PATIENT_SEARCH_IP_PER_DAY,
      DEFAULT_IP_SEARCH_LIMITS.perDay,
    ),
  };
}

/**
 * Intentos dentro de una ventana deslizante, estimados con dos contadores de
 * ventana fija: los de la ventana actual más la parte de la anterior que aún
 * cae dentro de la ventana. Evita el doble cupo de quien concentra sus
 * intentos a ambos lados del cambio de ventana.
 *
 * @param current - Intentos contados en la ventana actual (incluido este).
 * @param previous - Intentos contados en la ventana anterior.
 * @param elapsed - Fracción (0 a 1) de la ventana actual ya transcurrida.
 * @returns Intentos estimados de la última ventana completa.
 */
export function slidingEstimate(
  current: number,
  previous: number,
  elapsed: number,
): number {
  const remaining = 1 - Math.min(Math.max(elapsed, 0), 1);
  return current + Math.floor(previous * remaining);
}

/**
 * Decide si una persona puede hacer una búsqueda más, dado cuántas hizo en el
 * último minuto y en el último día (la que se intenta ahora no cuenta todavía).
 *
 * @param recent - Búsquedas ya hechas en la ventana.
 * @param limits - Topes vigentes.
 * @returns Si se admite, qué tope se superó y si el volumen es anómalo.
 */
export function evaluateSearchRate(
  recent: { readonly lastMinute: number; readonly lastDay: number },
  limits: SearchLimits,
): SearchRateVerdict {
  const anomalous =
    recent.lastMinute + 1 >= limits.perMinute * SEARCH_ANOMALY_RATIO ||
    recent.lastDay + 1 >= limits.perDay * SEARCH_ANOMALY_RATIO;
  if (recent.lastMinute >= limits.perMinute) {
    return { allowed: false, exceeded: 'MINUTE', anomalous: true };
  }
  if (recent.lastDay >= limits.perDay) {
    return { allowed: false, exceeded: 'DAY', anomalous: true };
  }
  return { allowed: true, anomalous };
}
