import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from '@jest/globals';
import {
  INFRASTRUCTURE_INSTANCES,
  KNOWN_WORKER_IDS,
  NOT_MEASURED,
  OPTIONAL_WORKERS,
  WORKER_INSTANCES,
  WORKER_INSTANCE_PREFIX,
  buildInstanceRegistry,
} from './instance-registry';

const ROOT = process.cwd();

/** `src/worker-<dominio>.ts` → `worker-<dominio>`. */
function workerIdsOnDisk(): string[] {
  return readdirSync(join(ROOT, 'src'))
    .filter((name) => /^worker-.+\.ts$/.test(name))
    .map((name) => name.replace(/\.ts$/, ''))
    .sort();
}

/** Servicios `worker-*` declarados en el compose de desarrollo. */
function workerServicesInCompose(): string[] {
  const compose = readFileSync(join(ROOT, 'docker-compose.yml'), 'utf8');
  return [...compose.matchAll(/^ {2}(worker-[a-z0-9_-]+):\s*$/gm)]
    .map((match) => match[1])
    .sort();
}

describe('instance-registry', () => {
  it('U24: los workers del registro son exactamente los entrypoints src/worker-*.ts', () => {
    const registry = WORKER_INSTANCES.map((w) => w.id).sort();
    expect(registry).toEqual(workerIdsOnDisk());
    expect(registry).toHaveLength(27);
  });

  it('U24: y los servicios worker-* de docker-compose.yml', () => {
    expect(WORKER_INSTANCES.map((w) => w.id).sort()).toEqual(
      workerServicesInCompose(),
    );
  });

  it('cada id de worker lleva el prefijo y un label no vacío; sólo worker-files es opcional', () => {
    for (const worker of WORKER_INSTANCES) {
      expect(worker.id.startsWith(WORKER_INSTANCE_PREFIX)).toBe(true);
      expect(worker.type).toBe('WORKER');
      expect(worker.label.trim().length).toBeGreaterThan(0);
      expect(worker.required).toBe(!OPTIONAL_WORKERS.includes(worker.id));
    }
    expect(
      WORKER_INSTANCES.filter((w) => !w.required).map((w) => w.id),
    ).toEqual(['worker-files']);
    expect(KNOWN_WORKER_IDS.has('worker-messaging')).toBe(true);
    expect(KNOWN_WORKER_IDS.has('api')).toBe(false);
  });

  it('la infraestructura son los 8 ids fijos del contrato y los no sondados no son requeridos', () => {
    expect(INFRASTRUCTURE_INSTANCES.map((i) => i.id)).toEqual([
      'api',
      'postgresql',
      'mongodb',
      'redis',
      'opensearch',
      'minio',
      'clamav',
      'mock-provider-server',
    ]);
    expect(
      INFRASTRUCTURE_INSTANCES.filter((i) => !i.required).map((i) => i.id),
    ).toEqual(['minio', 'clamav', 'mock-provider-server']);
    expect(NOT_MEASURED).toEqual([
      'replicasOfApi',
      'storageObjectStore',
      'malwareScanner',
      'providerEmulator',
      'processInternals',
    ]);
  });

  it('buildInstanceRegistry marca requeridos sólo los workers indicados y conserva 35 instancias sin repetir ids', () => {
    const registry = buildInstanceRegistry(
      new Set(['worker-messaging', 'worker-scheduling']),
    );
    expect(registry).toHaveLength(35);
    expect(new Set(registry.map((i) => i.id)).size).toBe(35);
    expect(registry[0].id).toBe('api');
    expect(
      registry
        .filter((i) => i.type === 'WORKER' && i.required)
        .map((i) => i.id)
        .sort(),
    ).toEqual(['worker-messaging', 'worker-scheduling']);
  });
});
