import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'js-yaml';

/**
 * Static checks of every compose manifest that starts Redis (N-4).
 *
 * They do not replace probing the real server; they stop an edit from
 * re-opening an unauthenticated Redis, or one published on every interface.
 */
interface ComposeService {
  command?: string | string[];
  environment?: Record<string, unknown>;
  healthcheck?: { test?: string[] };
  ports?: string[];
}
interface Compose {
  services: Record<string, ComposeService>;
  'x-app-env'?: Record<string, unknown>;
}

const read = (file: string): string =>
  readFileSync(join(process.cwd(), file), 'utf8').replace(/\r\n/g, '\n');
const parse = (file: string): Compose => load(read(file)) as Compose;

const MANIFESTS = [
  'docker-compose.yml',
  'docker-compose.coolify.yml',
  'infra/resilience/data-stack/docker-compose.yml',
];

describe.each(MANIFESTS)('Redis en %s', (file) => {
  const redis = parse(file).services.redis;

  it('exige contraseña cuando REDIS_PASSWORD está definida, sin dejarla escrita', () => {
    const command = ([] as string[]).concat(redis.command ?? []).join(' ');
    expect(command).toContain('--requirepass');
    // Resolved by the shell from the container env, not by compose.
    expect(command).toMatch(/\$\{REDIS_PASSWORD:\+--requirepass/);
    expect(command).not.toMatch(/--requirepass\s+[^"$\s]/);
    expect(redis.environment?.REDIS_PASSWORD).toBe('${REDIS_PASSWORD:-}');
  });

  it('el healthcheck se autentica y exige PONG', () => {
    const test = (redis.healthcheck?.test ?? []).join(' ');
    expect(test).toContain('REDISCLI_AUTH');
    expect(test).toContain('PONG');
  });

  it('no publica el puerto fuera de loopback', () => {
    for (const mapping of redis.ports ?? []) {
      expect(mapping).toMatch(/^\$\{REDIS_BIND:-127\.0\.0\.1\}:/);
    }
  });
});

describe.each(['docker-compose.yml', 'docker-compose.coolify.yml'])(
  'la API recibe la contraseña de Redis en %s',
  (file) => {
    it('x-app-env declara REDIS_PASSWORD, vacía por defecto', () => {
      expect(parse(file)['x-app-env']?.REDIS_PASSWORD).toBe(
        '${REDIS_PASSWORD:-}',
      );
    });
  },
);

describe('plantillas de entorno', () => {
  it.each(['.env.example', '.env.coolify.example'])(
    '%s documenta REDIS_PASSWORD',
    (file) => {
      expect(read(file)).toMatch(/^REDIS_PASSWORD=/m);
    },
  );
});
