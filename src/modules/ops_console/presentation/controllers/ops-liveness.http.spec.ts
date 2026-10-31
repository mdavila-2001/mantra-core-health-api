import { jest } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import { AuthTokenModule } from '../../../../common/auth/auth-token.module';
import { JwtAuthGuard } from '../../../../common/auth/jwt-auth.guard';
import { JwtStrategy } from '../../../../common/auth/jwt.strategy';
import { RolesGuard } from '../../../../common/auth/roles.guard';
import { SessionValidator } from '../../../../common/auth/session-validator';
import { TokenService } from '../../../../common/auth/token.service';
import { AllExceptionsFilter } from '../../../../common/filters/all-exceptions.filter';
import { createGlobalValidationPipe } from '../../../../common/http/validation-pipe';
import { TracingService } from '../../../../observability';
import {
  AppReadinessService,
  type DependencyStatus,
} from '../../../../app-readiness.service';
import { REDIS_CLIENT } from '../../../redis_runtime/redis.provider';
import {
  INSTANCE_LIVENESS_ENV,
  InstanceLivenessService,
} from '../../application/instance-liveness.service';
import { loadInstanceLivenessEnv } from '../../domain/instance-liveness.env';
import {
  HEARTBEAT_HASH_KEY,
  InstanceHeartbeatRepository,
} from '../../infrastructure/repositories/instance-heartbeat.repository';
import { OPS_READ_ROLES } from './ops-console.controller';
import { OpsHeartbeatController } from './ops-heartbeat.controller';
import { OpsLivenessController } from './ops-liveness.controller';

/**
 * Contrato HTTP de la sonda de vida con la cadena real de autenticación
 * (`JwtAuthGuard` + `JwtStrategy`, `RolesGuard`), el `ValidationPipe` global y
 * el filtro de errores reales. Redis es un doble en memoria que puede «caerse»;
 * las sondas de dependencias son un doble de `AppReadinessService.collect()`.
 */
class FakeRedis {
  readonly hashes = new Map<string, Map<string, string>>();
  down = false;
  writes = 0;
  ttl: number | null = null;

  private fail() {
    const error = new Error('connect ECONNREFUSED 10.0.0.9:6379');
    error.name = 'RedisConnectionError';
    throw error;
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    if (this.down) this.fail();
    this.writes += 1;
    const hash = this.hashes.get(key) ?? new Map<string, string>();
    const created = hash.has(field) ? 0 : 1;
    hash.set(field, value);
    this.hashes.set(key, hash);
    return created;
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (this.down) this.fail();
    this.ttl = seconds;
    return this.hashes.has(key) ? 1 : 0;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    if (this.down) this.fail();
    return Object.fromEntries(this.hashes.get(key) ?? []);
  }
}

const validHeartbeat = (over: Record<string, unknown> = {}) => ({
  instanceId: 'worker-messaging',
  pid: 41,
  startedAt: '2026-10-30T12:00:00.000Z',
  sentAt: new Date().toISOString(),
  status: 'running',
  liveness: { healthy: true, reasons: [] },
  readiness: { healthy: true, reasons: [] },
  stuckTicks: 0,
  openCircuits: [],
  ...over,
});

describe('sonda de vida de instancias (HTTP)', () => {
  let app: INestApplication;
  let tokens: TokenService;
  const redis = new FakeRedis();
  let probes: Array<[string, DependencyStatus]>;
  const collect = jest.fn(async () => probes);

  const token = (roles: string[]) =>
    tokens.signAccessToken(
      '00000000-0000-4000-8000-000000000001',
      'sesion-1',
      roles,
    );
  const post = (body: unknown, roles?: string[]) => {
    const r = request(app.getHttpServer()).post('/internal/ops/heartbeats');
    return (roles ? r.set('Authorization', `Bearer ${token(roles)}`) : r).send(
      body as object,
    );
  };
  const get = (roles?: string[]) => {
    const r = request(app.getHttpServer()).get('/admin/ops/instances/liveness');
    return roles ? r.set('Authorization', `Bearer ${token(roles)}`) : r;
  };
  const stored = () => redis.hashes.get(HEARTBEAT_HASH_KEY) ?? new Map();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PassportModule, AuthTokenModule],
      controllers: [OpsHeartbeatController, OpsLivenessController],
      providers: [
        JwtStrategy,
        {
          provide: SessionValidator,
          useValue: { assertActive: jest.fn(async () => undefined) },
        },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
        {
          provide: PinoLogger,
          useValue: {
            setContext: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: TracingService,
          useValue: {
            setAttribute: jest.fn(),
            recordException: jest.fn(),
            addEvent: jest.fn(),
          },
        },
        { provide: REDIS_CLIENT, useValue: redis },
        { provide: AppReadinessService, useValue: { collect } },
        {
          provide: INSTANCE_LIVENESS_ENV,
          useValue: loadInstanceLivenessEnv({}, 3_000),
        },
        InstanceHeartbeatRepository,
        InstanceLivenessService,
      ],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(createGlobalValidationPipe());
    await app.init();
    tokens = moduleRef.get(TokenService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    redis.hashes.clear();
    redis.down = false;
    redis.writes = 0;
    probes = [
      ['postgresql', { status: 'up', latencyMs: 12 }],
      ['mongodb', { status: 'up', latencyMs: 20 }],
      ['redis', { status: 'up', latencyMs: 3 }],
      ['opensearch', { status: 'up', latencyMs: 1_500 }],
      ['rls', { status: 'up', latencyMs: 1 }],
    ];
  });

  describe('POST /internal/ops/heartbeats', () => {
    it('H3: sin token → 401 y nada guardado', async () => {
      await post(validHeartbeat()).expect(401);
      expect(stored().size).toBe(0);
    });

    it.each(['PLATFORM_ADMIN', 'SRE', 'SECURITY_ADMIN'])(
      'H4: el rol %s no fabrica latidos → 403 y nada guardado',
      async (rol) => {
        const res = await post(validHeartbeat(), [rol]).expect(403);
        expect(res.body.code).toBe('FORBIDDEN');
        expect(stored().size).toBe(0);
      },
    );

    it('H5: un instanceId fuera del registro → 422 INSTANCE_UNKNOWN y nada guardado', async () => {
      const res = await post(
        validHeartbeat({ instanceId: 'worker-inventado' }),
        ['SYSTEM'],
      ).expect(422);
      expect(res.body).toMatchObject({
        code: 'VALIDATION_FAILED',
        reason: 'INSTANCE_UNKNOWN',
      });
      expect(stored().size).toBe(0);
    });

    it.each([
      ['campo extra', validHeartbeat({ isAdmin: true })],
      ['status fuera del enumerado', validHeartbeat({ status: 'zombie' })],
      [
        'reasons con 11 elementos',
        validHeartbeat({
          liveness: { healthy: false, reasons: Array(11).fill('x') },
        }),
      ],
      [
        'reason de 201 caracteres',
        validHeartbeat({
          readiness: { healthy: false, reasons: ['y'.repeat(201)] },
        }),
      ],
      ['instanceId sin prefijo worker-', validHeartbeat({ instanceId: 'api' })],
      ['cuerpo vacío', {}],
    ])('H6: %s → 400 y nada guardado (lista blanca)', async (_n, body) => {
      const res = await post(body, ['SYSTEM']).expect(400);
      expect(res.body.code).toBe('VALIDATION_FAILED');
      expect(stored().size).toBe(0);
    });

    it('H1: con rol SYSTEM y cuerpo válido → 201, y el GET lo muestra VIVA con edad ≤ 1 s', async () => {
      const res = await post(validHeartbeat(), ['SYSTEM']).expect(201);
      expect(res.body).toEqual({
        instanceId: 'worker-messaging',
        receivedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      });
      expect(redis.ttl).toBe(604_800);
      const saved = JSON.parse(stored().get('worker-messaging')!);
      expect(typeof saved.receivedAt).toBe('number');

      const live = await get(['SRE']).expect(200);
      const messaging = live.body.instances.find(
        (i: { id: string }) => i.id === 'worker-messaging',
      );
      expect(messaging).toMatchObject({
        state: 'VIVA',
        cause: 'OK',
        evidence: {
          source: 'heartbeat',
          reportedStatus: 'running',
          startedAt: '2026-10-30T12:00:00.000Z',
        },
      });
      expect(messaging.ageSeconds).toBeLessThanOrEqual(1);
    });

    it('H2: dos latidos de la misma instancia → una sola entrada cuyo lastHeartbeatAt avanza', async () => {
      await post(validHeartbeat(), ['SYSTEM']).expect(201);
      const first = JSON.parse(stored().get('worker-messaging')!).receivedAt;
      await new Promise((resolve) => setTimeout(resolve, 5));
      await post(validHeartbeat(), ['SYSTEM']).expect(201);
      expect(stored().size).toBe(1);
      const second = JSON.parse(stored().get('worker-messaging')!).receivedAt;
      expect(second).toBeGreaterThan(first);
    });
  });

  describe('GET /admin/ops/instances/liveness', () => {
    it('H7: sin token → 401; con PATIENT → 403', async () => {
      await get().expect(401);
      const res = await get(['PATIENT']).expect(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it.each([...OPS_READ_ROLES])('H8: el rol %s lee → 200', async (rol) => {
      await get([rol]).expect(200);
    });

    it('H8: la respuesta tiene exactamente la forma del contrato instance-liveness/v1', async () => {
      const res = await get(['PLATFORM_ADMIN']).expect(200);
      expect(Object.keys(res.body).sort()).toEqual(
        [
          'modelVersion',
          'evaluatedAt',
          'overall',
          'summary',
          'heartbeatStore',
          'thresholds',
          'instances',
          'notMeasured',
        ].sort(),
      );
      expect(res.body).toMatchObject({
        modelVersion: 'instance-liveness/v1',
        heartbeatStore: { status: 'up', reason: null },
        thresholds: {
          workerHeartbeatIntervalSeconds: 15,
          degradedAfterSeconds: 30,
          downAfterSeconds: 60,
          dependencyLatencyDegradedMs: 1000,
          dependencyProbeTimeoutMs: 3000,
          clockToleranceSeconds: 5,
        },
        notMeasured: [
          'replicasOfApi',
          'storageObjectStore',
          'malwareScanner',
          'providerEmulator',
          'processInternals',
        ],
      });
      expect(res.body.summary.total).toBe(33);
      expect(res.body.instances).toHaveLength(33);
      expect(res.body.instances[0]).toMatchObject({
        id: 'api',
        type: 'API',
        state: 'VIVA',
        evidence: { source: 'self' },
      });
      for (const instance of res.body.instances) {
        expect(Object.keys(instance).sort()).toEqual(
          [
            'id',
            'label',
            'type',
            'required',
            'state',
            'lastHeartbeatAt',
            'ageSeconds',
            'thresholdSeconds',
            'cause',
            'causeDetail',
            'evidence',
          ].sort(),
        );
      }
      // Sin latidos: los workers requeridos son SIN_DATO → ATENCION, no OK ni CRITICO.
      expect(res.body.overall).toBe('ATENCION');
      const opensearch = res.body.instances.find(
        (i: { id: string }) => i.id === 'opensearch',
      );
      expect(opensearch).toMatchObject({
        state: 'DEGRADADA',
        cause: 'PROBE_SLOW',
        evidence: { source: 'probe', latencyMs: 1500 },
      });
    });

    it('con Redis caído → 200, heartbeatStore down y workers SIN_DATO / STORE_UNAVAILABLE, nunca VIVA ni CAIDA', async () => {
      // La sonda de `redis` como dependencia queda cacheada 10 s desde el GET
      // anterior; su paso a CAIDA se prueba en `instance-liveness.service.spec.ts`.
      redis.down = true;
      const res = await get(['SRE']).expect(200);
      expect(res.body.heartbeatStore).toEqual({
        status: 'down',
        reason: 'STORE_UNAVAILABLE',
      });
      const workers = res.body.instances.filter(
        (i: { type: string }) => i.type === 'WORKER',
      );
      expect(workers).toHaveLength(25);
      for (const worker of workers) {
        expect(worker).toMatchObject({
          state: 'SIN_DATO',
          cause: 'STORE_UNAVAILABLE',
        });
      }
      expect(res.body.overall).not.toBe('OK');
      expect(JSON.stringify(res.body)).not.toContain('ECONNREFUSED');
    });

    it('H9/H12: el GET no escribe en Redis y la respuesta no filtra pid ni mensajes de error', async () => {
      await post(validHeartbeat(), ['SYSTEM']).expect(201);
      const writesBefore = redis.writes;
      const res = await get(['GOVERNANCE_ADMIN']).expect(200);
      expect(redis.writes).toBe(writesBefore);
      expect(JSON.stringify(res.body)).not.toContain('"pid"');
    });
  });
});
