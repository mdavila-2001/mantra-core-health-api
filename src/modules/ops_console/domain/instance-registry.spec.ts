import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from '@jest/globals';
import {
  applyRequiredWorkers,
  findInstance,
  INSTANCE_REGISTRY,
  OPTIONAL_WORKER_DOMAINS,
  WORKER_DOMAINS,
} from './instance-registry';
import {
  loadInstanceLivenessEnv,
  resolveRegistry,
} from './instance-liveness.env';

// Jest corre desde la raíz del repo (`import.meta`/`__dirname` no existen aquí).
const SRC = join(process.cwd(), 'src');
const COMPOSE = join(process.cwd(), 'docker-compose.yml');

describe('registro de instancias esperadas', () => {
  it('U24a: los workers declarados son exactamente los src/worker-*.ts', () => {
    const onDisk = readdirSync(SRC)
      .filter((f) => /^worker-.+\.ts$/.test(f))
      .map((f) => f.replace(/\.ts$/, ''))
      .sort();
    const declared = INSTANCE_REGISTRY.filter((i) => i.type === 'worker')
      .map((i) => i.id)
      .sort();
    expect(declared).toEqual(onDisk);
    expect(declared).toHaveLength(25);
  });

  it('U24b: los workers declarados son exactamente los servicios worker-* de docker-compose.yml', () => {
    const compose = readFileSync(COMPOSE, 'utf-8');
    const services = [...compose.matchAll(/^ {2}(worker-[a-z_-]+):\s*$/gm)]
      .map((m) => m[1])
      .sort();
    const declared = INSTANCE_REGISTRY.filter((i) => i.type === 'worker')
      .map((i) => i.id)
      .sort();
    expect(declared).toEqual(services);
  });

  it('ids únicos y sin worker duplicado', () => {
    const ids = INSTANCE_REGISTRY.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(WORKER_DOMAINS).size).toBe(WORKER_DOMAINS.length);
  });

  it('por defecto: 24 workers requeridos y worker-files opt-in no requerido', () => {
    const workers = INSTANCE_REGISTRY.filter((i) => i.type === 'worker');
    expect(workers.filter((w) => w.required)).toHaveLength(24);
    expect(findInstance('worker-files')?.required).toBe(false);
    expect(OPTIONAL_WORKER_DOMAINS).toEqual(['files']);
  });

  it('sólo los workers viven de latidos; api es self; bases y servicios se sondean', () => {
    expect(findInstance('api')?.source).toBe('self');
    for (const id of ['postgresql', 'mongodb', 'redis', 'opensearch']) {
      expect(findInstance(id)?.source).toBe('probe');
    }
    expect(
      INSTANCE_REGISTRY.filter((i) => i.source === 'heartbeat').every(
        (i) => i.type === 'worker',
      ),
    ).toBe(true);
  });

  it('findInstance devuelve undefined para lo no declarado', () => {
    expect(findInstance('worker-inventado')).toBeUndefined();
  });
});

describe('OPS_LIVENESS_REQUIRED_WORKERS', () => {
  it('sin configurar rige el registro por defecto', () => {
    expect(loadInstanceLivenessEnv({})).toEqual({ requiredWorkers: null });
    expect(
      loadInstanceLivenessEnv({ OPS_LIVENESS_REQUIRED_WORKERS: '  ' }),
    ).toEqual({
      requiredWorkers: null,
    });
  });

  it('Coolify: 4 workers requeridos; los demás pasan a no requeridos', () => {
    const env = loadInstanceLivenessEnv({
      OPS_LIVENESS_REQUIRED_WORKERS:
        'messaging, scheduling,workflow,worker-read_models',
    });
    const registry = resolveRegistry(env);
    const required = registry
      .filter((i) => i.type === 'worker' && i.required)
      .map((i) => i.id);
    expect(required.sort()).toEqual([
      'worker-messaging',
      'worker-read_models',
      'worker-scheduling',
      'worker-workflow',
    ]);
    // La infraestructura no se toca.
    expect(registry.find((i) => i.id === 'redis')?.required).toBe(true);
  });

  it('U22: un worker desconocido aborta el arranque', () => {
    expect(() =>
      applyRequiredWorkers(INSTANCE_REGISTRY, ['messaging', 'inventado']),
    ).toThrow(/worker-inventado/);
  });

  it('U22: un nombre con caracteres inválidos aborta el arranque', () => {
    expect(() =>
      loadInstanceLivenessEnv({
        OPS_LIVENESS_REQUIRED_WORKERS: 'messaging;rm -rf',
      }),
    ).toThrow(/inválido/);
  });
});
