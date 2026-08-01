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
});
