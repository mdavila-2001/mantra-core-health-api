import { createHash, randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { loadBuildInfo } from '../../common/build-info';

/**
 * Identidad de este proceso en `observability.instances`.
 *
 * El `id` se genera al cargar el módulo: **cada arranque es una instancia
 * nueva**. Así las claves de idempotencia de las series (`instance_id`,
 * `flush_seq`) nunca chocan con las de la ejecución anterior aunque el
 * contador de volcados reinicie en 1. El host se guarda como hash, no en claro.
 */
export interface InstanceIdentity {
  readonly id: string;
  readonly kind: 'API';
  readonly name: string;
  readonly buildCommit: string | null;
  readonly buildVersion: string | null;
  readonly hostHash: string;
  readonly startedAt: Date;
}

export function createInstanceIdentity(
  source: NodeJS.ProcessEnv = process.env,
): InstanceIdentity {
  const build = loadBuildInfo(source);
  return {
    id: randomUUID(),
    kind: 'API',
    name: 'api',
    buildCommit: build.commit === 'desconocido' ? null : build.commit,
    buildVersion: build.version === 'desconocido' ? null : build.version,
    hostHash: createHash('sha256').update(hostname()).digest('hex'),
    startedAt: new Date(),
  };
}

/** Identidad del proceso (la comparten los sinks y el servicio de volcado). */
export const instanceIdentity: InstanceIdentity = createInstanceIdentity();
