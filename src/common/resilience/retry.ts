import { delay } from './with-timeout';
import { isTransientError, retryAfterFromError } from './transient-error';

/**
 * Reintento con backoff exponencial y **jitter completo**.
 *
 * El jitter no es un adorno estadístico. Sin él, N clientes que fallan por la
 * misma causa (la API se reinició) reintentan todos en el mismo milisegundo,
 * vuelven a tumbarla y repiten el patrón amplificándolo en cada ronda: es la
 * "tormenta de reintentos" / "thundering herd". Con jitter completo —esperar un
 * tiempo aleatorio *dentro* de la ventana, no la ventana entera— la carga de
 * recuperación se reparte y la dependencia tiene margen para levantarse.
 *
 * Tres límites, no uno, porque cada uno ataja un fallo distinto:
 *   - `attempts` acota el número de llamadas (evita el reintento infinito).
 *   - `totalBudgetMs` acota el **tiempo total**, incluido lo que tardan los
 *     intentos: 5 intentos de 30 s son 2,5 minutos colgado aunque "sólo" sean 5.
 *   - `isRetryable` acota el **tipo** de fallo: un 409 no se cura reintentando.
 */
export interface RetryPolicy {
  /** Intentos totales, incluido el primero. `1` desactiva el reintento. */
  attempts: number;
  /** Ventana base del backoff exponencial, en ms. */
  baseDelayMs: number;
  /** Techo de la ventana, para que el exponencial no se dispare. */
  maxDelayMs: number;
  /**
   * Presupuesto de tiempo total (ms). Al agotarse no se inicia otro intento,
   * aunque queden en `attempts`. Sin esto, la política acota llamadas pero no
   * latencia, y quien espera al otro lado ya se rindió hace rato.
   */
  totalBudgetMs?: number;
  /** Clasificador de transitoriedad. Por defecto, `isTransientError`. */
  isRetryable?: (error: unknown) => boolean;
  /** Gancho de observabilidad: se invoca antes de cada espera. */
  onRetry?: (info: RetryAttemptInfo) => void;
}

/** Contexto de un reintento, para el log/métrica de quien lo configura. */
export interface RetryAttemptInfo {
  operation: string;
  /** Número del intento que acaba de fallar (1 = el primero). */
  attempt: number;
  /** Espera calculada antes del siguiente intento. */
  delayMs: number;
  /** `true` si la espera la impuso el servidor con `Retry-After`. */
  serverDirected: boolean;
  error: unknown;
}

/** Dependencias inyectables; sólo las sustituyen las pruebas. */
export interface RetryClock {
  now: () => number;
  random: () => number;
  sleep: (ms: number, signal?: AbortSignal) => Promise<void>;
}

const DEFAULT_CLOCK: RetryClock = {
  now: () => Date.now(),
  random: () => Math.random(),
  sleep: delay,
};

/**
 * Política por defecto para llamadas salientes idempotentes.
 *
 * Tres intentos y no más: el cuarto casi nunca cambia el resultado y sí
 * multiplica la carga sobre algo que ya está sufriendo. El presupuesto total
 * (15 s) es lo que impide que tres intentos con backoff dejen colgada una
 * petición HTTP más de lo que ningún cliente va a esperar.
 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  attempts: 3,
  baseDelayMs: 200,
  maxDelayMs: 5_000,
  totalBudgetMs: 15_000,
};

/**
 * Ejecuta `fn` reintentando los fallos transitorios.
 *
 * **Contrato de idempotencia**: `retry` reintenta a ciegas, así que sólo debe
 * envolver operaciones idempotentes (lecturas, o escrituras con clave de
 * idempotencia). Envolver un `POST` de cobro sin clave duplicaría cargos ante
 * un simple timeout de red, donde la petición sí llegó y sólo se perdió la
 * respuesta.
 *
 * La señal se respeta en las dos posiciones donde el reintento puede quedarse
 * quieto: antes de iniciar un intento y durante el backoff. Un apagado no debe
 * esperar a que termine una escalera de esperas de varios segundos.
 */
export async function retry<T>(
  operation: string,
  fn: (attempt: number, signal?: AbortSignal) => Promise<T>,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
  signal?: AbortSignal,
  clock: RetryClock = DEFAULT_CLOCK,
): Promise<T> {
  const isRetryable = policy.isRetryable ?? isTransientError;
  const startedAt = clock.now();
  const attempts = Math.max(1, Math.trunc(policy.attempts));

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (signal?.aborted) {
      throw signal.reason instanceof Error
        ? signal.reason
        : new Error(`"${operation}" cancelada antes del intento ${attempt}`);
    }

    try {
      return await fn(attempt, signal);
    } catch (error) {
      // Último intento, fallo permanente o cancelación: se propaga el error
      // original. Envolverlo escondería la causa real detrás de un "se agotaron
      // los reintentos" que no le sirve a nadie para diagnosticar.
      if (attempt === attempts || !isRetryable(error) || signal?.aborted) {
        throw error;
      }

      const serverDirected = retryAfterFromError(error, clock.now);
      const delayMs =
        serverDirected ?? fullJitter(attempt, policy, clock.random);

      // Presupuesto: si la espera nos pasaría del total, no se espera en vano.
      // Se falla ya con el error real en vez de dormir para fallar igual luego.
      if (policy.totalBudgetMs !== undefined) {
        const elapsed = clock.now() - startedAt;
        if (elapsed + delayMs >= policy.totalBudgetMs) {
          throw error;
        }
      }

      policy.onRetry?.({
        operation,
        attempt,
        delayMs,
        serverDirected: serverDirected !== undefined,
        error,
      });

      await clock.sleep(delayMs, signal);
    }
  }

  // Inalcanzable: el bucle sale por `return` o por `throw` (el último intento
  // siempre propaga). Se deja explícito para que un cambio futuro que rompa esa
  // invariante falle de forma visible en vez de devolver `undefined`.
  throw new Error(`"${operation}" terminó sin resultado ni error`);
}

/**
 * Backoff exponencial con jitter completo: `random(0, min(max, base * 2^n))`.
 *
 * "Completo" frente a "igual"/"descorrelacionado": es el que mejor reparte la
 * carga de recuperación según la medición clásica de AWS, y el que menos
 * parámetros pide (uno menos que equivocarse).
 */
function fullJitter(
  attempt: number,
  policy: RetryPolicy,
  random: () => number,
): number {
  const exponential = policy.baseDelayMs * 2 ** (attempt - 1);
  const window = Math.min(policy.maxDelayMs, exponential);
  return Math.round(random() * window);
}
