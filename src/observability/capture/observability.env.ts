/**
 * Configuración de la captura persistida del portal «Sistema» (módulo 70).
 *
 * | Variable | Por defecto | Qué hace |
 * |---|---|---|
 * | `OBSERVABILITY_ENABLED` | `false` | Enciende la captura (HTTP por código exacto, errores, SQL) y su volcado a `observability.*` |
 * | `OBSERVABILITY_FLUSH_SECONDS` | `30` | Cada cuánto se vuelca lo capturado (15–3600) |
 * | `OBSERVABILITY_SLOW_REQUEST_MS` | `2000` | Umbral de una petición «lenta» para guardar su muestra (50–600000) |
 * | `OBSERVABILITY_ACTOR_HASH_SECRET` | sólo `development`/`test` | Secreto del HMAC de `actor_hash` (mínimo 16 caracteres) |
 *
 * Apagada por defecto, igual que `OBSERVABILITY_HTTP_SLI_ENABLED` y `OTEL_ENABLED`:
 * encenderla escribe en la base, y eso lo decide el entorno.
 *
 * Un valor inválido **falla al arrancar** en vez de caer en el valor por
 * defecto (regla 90.3 de la casa): una medición que parece encendida y no lo
 * está es peor que una caída visible.
 *
 * ## Secreto del actor (D-02)
 *
 * `actor_hash = HMAC-SHA256(user_id, OBSERVABILITY_ACTOR_HASH_SECRET)`. Es un
 * secreto **propio**: no se reutiliza el de idempotencia de telemetría ni el
 * del JWT, para que filtrar uno no permita re-identificar con el otro. Mismo
 * criterio fail-closed que `telemetry-idempotency.env.ts`: el secreto por
 * defecto es público (está en el repositorio) y sólo vale en `development` y
 * `test`; en cualquier otro entorno sin secreto propio **no se guarda
 * `actor_hash`** (queda `null` y «usuarios afectados» se declara no medido).
 */

export interface ObservabilityEnv {
  readonly enabled: boolean;
  readonly flushSeconds: number;
  readonly slowRequestMs: number;
  /** `null` = sin secreto utilizable: no se guarda `actor_hash`. */
  readonly actorHashSecret: string | null;
}

export const OBSERVABILITY_DEFAULT_FLUSH_SECONDS = 30;
export const OBSERVABILITY_MIN_FLUSH_SECONDS = 15;
export const OBSERVABILITY_MAX_FLUSH_SECONDS = 3600;
export const OBSERVABILITY_DEFAULT_SLOW_REQUEST_MS = 2000;
export const OBSERVABILITY_MIN_SLOW_REQUEST_MS = 50;
export const OBSERVABILITY_MAX_SLOW_REQUEST_MS = 600_000;
export const OBSERVABILITY_MIN_SECRET_LENGTH = 16;

const DEV_ACTOR_HASH_SECRET =
  'dev-only-observability-actor-hash-secret-change-before-production';

function readInteger(
  source: NodeJS.ProcessEnv,
  name: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = (source[name] ?? '').trim();
  if (raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(
      `${name} debe ser un entero entre ${min} y ${max}; llegó "${raw}"`,
    );
  }
  return parsed;
}

/**
 * Lee y valida la configuración.
 *
 * @param source - Variables de entorno; por defecto, las del proceso.
 * @throws Error si una variable tiene un valor que no se puede interpretar.
 */
export function loadObservabilityEnv(
  source: NodeJS.ProcessEnv = process.env,
): ObservabilityEnv {
  const rawEnabled = (source.OBSERVABILITY_ENABLED ?? '').trim();
  if (rawEnabled !== '' && rawEnabled !== 'true' && rawEnabled !== 'false') {
    throw new Error(
      `OBSERVABILITY_ENABLED debe ser "true" o "false"; llegó "${rawEnabled}"`,
    );
  }

  const flushSeconds = readInteger(
    source,
    'OBSERVABILITY_FLUSH_SECONDS',
    OBSERVABILITY_DEFAULT_FLUSH_SECONDS,
    OBSERVABILITY_MIN_FLUSH_SECONDS,
    OBSERVABILITY_MAX_FLUSH_SECONDS,
  );
  const slowRequestMs = readInteger(
    source,
    'OBSERVABILITY_SLOW_REQUEST_MS',
    OBSERVABILITY_DEFAULT_SLOW_REQUEST_MS,
    OBSERVABILITY_MIN_SLOW_REQUEST_MS,
    OBSERVABILITY_MAX_SLOW_REQUEST_MS,
  );

  const configured = source.OBSERVABILITY_ACTOR_HASH_SECRET;
  let actorHashSecret: string | null;
  if (configured !== undefined && configured !== '') {
    if (configured.length < OBSERVABILITY_MIN_SECRET_LENGTH) {
      throw new Error(
        `OBSERVABILITY_ACTOR_HASH_SECRET debe tener al menos ${OBSERVABILITY_MIN_SECRET_LENGTH} caracteres`,
      );
    }
    actorHashSecret = configured;
  } else {
    const nodeEnv = source.NODE_ENV;
    actorHashSecret =
      nodeEnv === 'development' || nodeEnv === 'test'
        ? DEV_ACTOR_HASH_SECRET
        : null;
  }

  return {
    enabled: rawEnabled === 'true',
    flushSeconds,
    slowRequestMs,
    actorHashSecret,
  };
}
