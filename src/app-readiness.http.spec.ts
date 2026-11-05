import { jest } from '@jest/globals';
import { type INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import type { TracingService } from './observability';
import { AppController } from './app.controller';
import { AppReadinessService } from './app-readiness.service';
import { AppService } from './app.service';

/**
 * `/readiness` por HTTP, con Express, el controlador real, el servicio de
 * readiness real y el filtro global: lo que ve un orquestador o un cliente
 * (APO-01 / IC-06).
 */
describe('GET /readiness (HTTP)', () => {
  let app: INestApplication;
  const ping = () => jest.fn<() => Promise<void>>().mockResolvedValue();
  const deps = {
    execute: jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue([{ '?column?': 1 }]),
    mongo: { ping: ping() },
    redis: { ping: ping() },
    search: { ping: ping() },
  };

  beforeAll(async () => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    delete process.env.RLS_ENFORCE;
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: AppReadinessService,
          useValue: new AppReadinessService(
            {
              em: { getConnection: () => ({ execute: deps.execute }) },
            } as never,
            deps.mongo as never,
            deps.redis as never,
            deps.search as never,
          ),
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalFilters(
      new AllExceptionsFilter(
        {
          setContext: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
        } as unknown as PinoLogger,
        {
          setAttribute: jest.fn(),
          recordException: jest.fn(),
          addEvent: jest.fn(),
        } as unknown as TracingService,
      ),
    );
    await app.init();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  afterEach(() => {
    deps.redis.ping.mockResolvedValue();
    deps.execute.mockResolvedValue([{ '?column?': 1 }]);
  });

  it('Correcto: las cinco sondas arriba → 200 y status ok', async () => {
    const res = await request(app.getHttpServer())
      .get('/readiness')
      .expect(200);
    expect(res.body.status).toBe('ok');
    expect(Object.keys(res.body.checks)).toEqual(
      expect.arrayContaining([
        'mongodb',
        'opensearch',
        'postgresql',
        'redis',
        'rls',
      ]),
    );
  });

  it('Falla catalogada: dependencia caída → 503 / DEPENDENCY_UNAVAILABLE / SYSTEM_READINESS_DEPENDENCY_UNAVAILABLE', async () => {
    deps.redis.ping.mockRejectedValue(
      new Error('connect ECONNREFUSED 10.0.0.5:6379'),
    );

    const res = await request(app.getHttpServer())
      .get('/readiness')
      .expect(503);

    expect(res.body).toMatchObject({
      code: 'DEPENDENCY_UNAVAILABLE',
      reason: 'SYSTEM_READINESS_DEPENDENCY_UNAVAILABLE',
      details: {
        status: 'error',
        checks: { redis: { status: 'down' }, postgresql: { status: 'up' } },
      },
    });
  });

  it('Error: la falla de PostgreSQL no filtra el texto del driver', async () => {
    deps.execute.mockRejectedValue(
      new Error('password authentication failed for user "app_rw"'),
    );

    const res = await request(app.getHttpServer())
      .get('/readiness')
      .expect(503);

    expect(res.body.reason).toBe('SYSTEM_READINESS_DEPENDENCY_UNAVAILABLE');
    expect(JSON.stringify(res.body)).not.toMatch(/app_rw|password/);
  });
});
