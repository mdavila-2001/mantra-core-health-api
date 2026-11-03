import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { AppReadinessService } from './app-readiness.service';

describe('AppReadinessService', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const build = () => {
    const execute = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue([{ '?column?': 1 }]);
    const documents = {
      ping: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };
    const redis = {
      ping: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };
    const search = {
      ping: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };
    const service = new AppReadinessService(
      { em: { getConnection: () => ({ execute }) } } as never,
      documents as never,
      redis as never,
      search as never,
    );
    return { service, execute, documents, redis, search };
  };

  it('reporta ok sólo cuando todas las dependencias responden', async () => {
    const { service } = build();
    const result = await service.check();
    expect(result.status).toBe('ok');
    expect(result.checks).toMatchObject({
      postgresql: { status: 'up' },
      mongodb: { status: 'up' },
      redis: { status: 'up' },
      opensearch: { status: 'up' },
    });
  });

  it('responde 503 e identifica la dependencia caída', async () => {
    const { service, redis } = build();
    redis.ping.mockRejectedValue(new Error('connection refused'));

    await expect(service.check()).rejects.toMatchObject({
      status: 503,
      response: {
        code: 'DEPENDENCY_UNAVAILABLE',
        details: {
          checks: { redis: { status: 'down' } },
        },
      },
    });
  });

  it('503 catalogado: DEPENDENCY_UNAVAILABLE + reason estable (APO-01 / IC-06)', async () => {
    const { service, redis } = build();
    redis.ping.mockRejectedValue(
      new Error('connect ECONNREFUSED 10.0.0.5:6379'),
    );

    await expect(service.check()).rejects.toMatchObject({
      status: 503,
      response: {
        code: 'DEPENDENCY_UNAVAILABLE',
        reason: 'SYSTEM_READINESS_DEPENDENCY_UNAVAILABLE',
      },
    });
  });

  it('el cuerpo público sólo trae nombre, estado y latencia: ni el error del driver ni su clase', async () => {
    const { service, redis, execute } = build();
    redis.ping.mockRejectedValue(
      new Error('connect ECONNREFUSED 10.0.0.5:6379'),
    );
    execute.mockRejectedValue(
      new Error('password authentication failed for user "app_rw"'),
    );

    const error = await service.check().then(
      () => undefined,
      (e: unknown) => e as { getResponse(): { details: unknown } },
    );

    const publicBody = JSON.stringify(error?.getResponse());
    expect(publicBody).not.toMatch(/ECONNREFUSED|10\.0\.0\.5|app_rw|password/);
    expect(error?.getResponse().details).toMatchObject({
      status: 'error',
      checks: {
        postgresql: { status: 'down', latencyMs: expect.any(Number) },
        redis: { status: 'down', latencyMs: expect.any(Number) },
        mongodb: { status: 'up' },
      },
    });
    const redisCheck = (
      error?.getResponse().details as { checks: Record<string, object> }
    ).checks.redis;
    expect(Object.keys(redisCheck).sort()).toEqual(['latencyMs', 'status']);
  });

  it('límite: una sonda que tarda 2,9 s responde ok con su latencia', async () => {
    jest.useFakeTimers();
    try {
      const { service, redis } = build();
      redis.ping.mockImplementation(
        () => new Promise<void>((resolve) => setTimeout(resolve, 2_999)),
      );

      const pending = service.check();
      await jest.advanceTimersByTimeAsync(2_999);
      const result = await pending;

      expect(result.status).toBe('ok');
      expect(result.checks.redis).toMatchObject({ status: 'up' });
      expect(result.checks.redis.latencyMs).toBeGreaterThanOrEqual(2_999);
    } finally {
      jest.useRealTimers();
    }
  });

  it('timeout de una sonda → 503 catalogado sin el texto del timeout en la respuesta', async () => {
    jest.useFakeTimers();
    try {
      const { service, documents } = build();
      documents.ping.mockImplementation(() => new Promise<void>(() => {}));

      const pending = service.check().then(
        () => undefined,
        (e: unknown) => e as { getResponse(): { reason: string } },
      );
      await jest.advanceTimersByTimeAsync(3_000);
      const error = await pending;

      expect(error?.getResponse().reason).toBe(
        'SYSTEM_READINESS_DEPENDENCY_UNAVAILABLE',
      );
      expect(JSON.stringify(error?.getResponse())).not.toContain('timeout de');
    } finally {
      jest.useRealTimers();
    }
  });

  // MCH-013: la sonda no puede anunciar aislamiento por tenant que no existe.
  describe('rls (MCH-013)', () => {
    const previous = process.env.RLS_ENFORCE;
    afterEach(() => {
      if (previous === undefined) delete process.env.RLS_ENFORCE;
      else process.env.RLS_ENFORCE = previous;
    });

    it('no consulta nada cuando RLS_ENFORCE no está activado (sin cambio de comportamiento hoy)', async () => {
      delete process.env.RLS_ENFORCE;
      const { service, execute } = build();

      const result = await service.check();

      expect(result.checks.rls).toMatchObject({ status: 'up' });
      // Una sola llamada: la del postgresql. No se agrega una consulta nueva
      // para un modo que ni siquiera está activado.
      expect(execute).toHaveBeenCalledTimes(1);
    });

    it('con RLS_ENFORCE=true y el rol de runtime sin BYPASSRLS ni superusuario: up', async () => {
      process.env.RLS_ENFORCE = 'true';
      const { service, execute } = build();
      execute.mockImplementation((async (sql: string) =>
        sql.includes('pg_roles')
          ? [{ rolbypassrls: false, rolsuper: false }]
          : [{ '?column?': 1 }]) as never);

      const result = await service.check();

      expect(result.checks.rls).toMatchObject({ status: 'up' });
    });

    it('con RLS_ENFORCE=true pero el rol de runtime tiene BYPASSRLS: down, no ok falso', async () => {
      process.env.RLS_ENFORCE = 'true';
      const { service, execute } = build();
      execute.mockImplementation((async (sql: string) =>
        sql.includes('pg_roles')
          ? [{ rolbypassrls: true, rolsuper: false }]
          : [{ '?column?': 1 }]) as never);

      await expect(service.check()).rejects.toMatchObject({
        status: 503,
        response: {
          details: { checks: { rls: { status: 'down' } } },
        },
      });
    });

    it('con RLS_ENFORCE=true y rol superusuario: down (superusuario ignora RLS igual que BYPASSRLS)', async () => {
      process.env.RLS_ENFORCE = 'true';
      const { service, execute } = build();
      execute.mockImplementation((async (sql: string) =>
        sql.includes('pg_roles')
          ? [{ rolbypassrls: false, rolsuper: true }]
          : [{ '?column?': 1 }]) as never);

      await expect(service.check()).rejects.toMatchObject({
        status: 503,
        response: { details: { checks: { rls: { status: 'down' } } } },
      });
    });
  });
});
