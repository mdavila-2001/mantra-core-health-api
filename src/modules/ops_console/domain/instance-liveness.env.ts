/**
 * Configuración de la sonda de vida de instancias.
 *
 * | Variable | Por defecto | Qué hace |
 * |---|---|---|
 * | `OPS_LIVENESS_REQUIRED_WORKERS` | (vacía = todos menos `worker-files`) | Lista CSV de workers que cuentan para `overall` |
 *
 * Los umbrales (15/30/60 s) son constantes del contrato y no se configuran: el
 * front y el worker los asumen (`WORKER_HEARTBEAT_INTERVAL_MS` por defecto 15 s).
 *
 * Un valor inválido **falla al arrancar** en vez de caer en el defecto (regla
 * 90.3.4): una lista de requeridos mal escrita no puede degradar `overall` en
 * silencio.
 */
import {
  applyRequiredWorkers,
  INSTANCE_REGISTRY,
  type InstanceDefinition,
} from './instance-registry';

export interface InstanceLivenessEnv {
  /** `null` = no configurada. */
  readonly requiredWorkers: readonly string[] | null;
}

const NAME_PATTERN = /^[a-z0-9_-]+$/;

export function loadInstanceLivenessEnv(
  source: NodeJS.ProcessEnv = process.env,
): InstanceLivenessEnv {
  const raw = (source.OPS_LIVENESS_REQUIRED_WORKERS ?? '').trim();
  if (raw === '') return { requiredWorkers: null };
  const names = raw
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name !== '');
  for (const name of names) {
    if (!NAME_PATTERN.test(name)) {
      throw new Error(
        `OPS_LIVENESS_REQUIRED_WORKERS contiene un nombre inválido: "${name}"`,
      );
    }
  }
  return { requiredWorkers: names };
}

/** Registro efectivo: el declarado, con `required` ajustado por el entorno. */
export function resolveRegistry(
  env: InstanceLivenessEnv = loadInstanceLivenessEnv(),
): InstanceDefinition[] {
  return applyRequiredWorkers(INSTANCE_REGISTRY, env.requiredWorkers);
}
