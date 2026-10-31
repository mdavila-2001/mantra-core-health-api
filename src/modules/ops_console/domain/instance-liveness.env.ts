import {
  KNOWN_WORKER_IDS,
  OPTIONAL_WORKERS,
  WORKER_INSTANCES,
} from './instance-registry';
import type { LivenessThresholds } from './instance-liveness';

/**
 * Configuración de la sonda de vida de instancias (`/admin/ops/instances/liveness`).
 *
 * | Variable | Por defecto | Qué hace |
 * |---|---|---|
 * | `OPS_LIVENESS_DEGRADED_AFTER_SECONDS` | `30` | Edad del último latido a partir de la cual un worker pasa a `DEGRADADA` |
 * | `OPS_LIVENESS_DOWN_AFTER_SECONDS` | `60` | Edad a partir de la cual pasa a `CAIDA` |
 * | `OPS_LIVENESS_REQUIRED_WORKERS` | todos salvo `worker-files` | CSV de ids `worker-<dominio>` que pesan en `overall` |
 * | `WORKER_HEARTBEAT_INTERVAL_MS` | `15000` | Intervalo con el que laten los workers; se declara en la respuesta |
 *
 * Un valor inválido **falla al arrancar** en vez de caer en el valor por
 * defecto, igual que `http-sli.env.ts`: un umbral que parece configurado y no
 * lo está convierte «caída» en «viva» sin que nadie lo vea.
 */

export interface InstanceLivenessEnv {
  readonly thresholds: LivenessThresholds;
  /** Ids de worker cuya ausencia o caída pesa en `overall`. */
  readonly requiredWorkers: ReadonlySet<string>;
}

export const OPS_LIVENESS_DEFAULT_DEGRADED_AFTER_SECONDS = 30;
export const OPS_LIVENESS_DEFAULT_DOWN_AFTER_SECONDS = 60;
export const OPS_LIVENESS_DEFAULT_HEARTBEAT_INTERVAL_MS = 15_000;
/** Latencia de sonda a partir de la cual una dependencia es `DEGRADADA`. */
export const OPS_LIVENESS_DEPENDENCY_LATENCY_DEGRADED_MS = 1_000;
/** Un latido «del futuro» hasta aquí se trata como edad 0; más allá, `CLOCK_INCONSISTENT`. */
export const OPS_LIVENESS_CLOCK_TOLERANCE_MS = 5_000;

function positiveInteger(
  source: NodeJS.ProcessEnv,
  name: string,
): number | null {
  const raw = (source[name] ?? '').trim();
  if (raw === '') return null;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} debe ser un entero positivo; llegó "${raw}"`);
  }
  return parsed;
}

function requiredWorkersFrom(source: NodeJS.ProcessEnv): ReadonlySet<string> {
  const raw = (source.OPS_LIVENESS_REQUIRED_WORKERS ?? '').trim();
  if (raw === '') {
    return new Set(
      WORKER_INSTANCES.map((worker) => worker.id).filter(
        (id) => !OPTIONAL_WORKERS.includes(id),
      ),
    );
  }
  const ids = raw
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  const unknown = ids.filter((id) => !KNOWN_WORKER_IDS.has(id));
  if (unknown.length > 0) {
    throw new Error(
      `OPS_LIVENESS_REQUIRED_WORKERS contiene ids que no son workers conocidos: ${unknown.join(', ')}`,
    );
  }
  return new Set(ids);
}

/**
 * Lee y valida la configuración.
 *
 * @param source - Variables de entorno; por defecto, las del proceso.
 * @param dependencyProbeTimeoutMs - Plazo de las sondas de dependencia (el de `/readiness`).
 * @throws Error si un valor no se puede interpretar o los umbrales no cumplen
 *         `down > degraded ≥ intervalo del latido`.
 */
export function loadInstanceLivenessEnv(
  source: NodeJS.ProcessEnv = process.env,
  dependencyProbeTimeoutMs = 3_000,
): InstanceLivenessEnv {
  const degradedAfterSeconds =
    positiveInteger(source, 'OPS_LIVENESS_DEGRADED_AFTER_SECONDS') ??
    OPS_LIVENESS_DEFAULT_DEGRADED_AFTER_SECONDS;
  const downAfterSeconds =
    positiveInteger(source, 'OPS_LIVENESS_DOWN_AFTER_SECONDS') ??
    OPS_LIVENESS_DEFAULT_DOWN_AFTER_SECONDS;
  const workerHeartbeatIntervalMs =
    positiveInteger(source, 'WORKER_HEARTBEAT_INTERVAL_MS') ??
    OPS_LIVENESS_DEFAULT_HEARTBEAT_INTERVAL_MS;

  if (downAfterSeconds <= degradedAfterSeconds) {
    throw new Error(
      `OPS_LIVENESS_DOWN_AFTER_SECONDS (${downAfterSeconds}) debe ser mayor que OPS_LIVENESS_DEGRADED_AFTER_SECONDS (${degradedAfterSeconds})`,
    );
  }
  if (degradedAfterSeconds * 1000 < workerHeartbeatIntervalMs) {
    throw new Error(
      `OPS_LIVENESS_DEGRADED_AFTER_SECONDS (${degradedAfterSeconds}) no puede ser menor que el intervalo del latido WORKER_HEARTBEAT_INTERVAL_MS (${workerHeartbeatIntervalMs} ms)`,
    );
  }

  return {
    thresholds: {
      workerHeartbeatIntervalMs,
      degradedAfterMs: degradedAfterSeconds * 1000,
      downAfterMs: downAfterSeconds * 1000,
      dependencyLatencyDegradedMs: OPS_LIVENESS_DEPENDENCY_LATENCY_DEGRADED_MS,
      dependencyProbeTimeoutMs,
      clockToleranceMs: OPS_LIVENESS_CLOCK_TOLERANCE_MS,
    },
    requiredWorkers: requiredWorkersFrom(source),
  };
}
