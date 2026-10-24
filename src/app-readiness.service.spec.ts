import { jest } from '@jest/globals';
import { AppReadinessService } from './app-readiness.service';

describe('AppReadinessService', () => {
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
