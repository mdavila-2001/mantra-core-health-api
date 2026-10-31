import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import request from 'supertest';
import { JwtAuthGuard } from '../../../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../../../common/auth/roles.guard';
import { createGlobalValidationPipe } from '../../../../common/http/validation-pipe';
import {
  OpsInstancesService,
  INSTANCE_REGISTRY_TOKEN,
} from '../../application/ops-instances.service';
import { resolveRegistry } from '../../domain/instance-liveness.env';
import type { ProbeResult } from '../../domain/instance-liveness';
import { DependencyProbeService } from '../../infrastructure/probes/dependency-probe.service';
import { InstanceHeartbeatRepository } from '../../infrastructure/repositories/instance-heartbeat.repository';
import { OpsHeartbeatController } from './ops-heartbeat.controller';
import { OpsInstancesController } from './ops-instances.controller';

/**
 * Contrato HTTP con la cadena REAL de autenticación y autorización
 * (`JwtAuthGuard` + `RolesGuard` + pipe de validación global de la API). Lo que
 * está doblado, y así se declara: el almacén (Redis, en memoria) y las sondas de
 * dependencias. BLOQUEADO contra Redis/Postgres reales (no existen en esta
 * máquina): ver el reporte.
 */
const SECRET = 'test-secret-only-for-this-spec';
const token = (roles: string[]) => jwt.sign({ sub: 'u-1', roles }, SECRET);
const bearer = (roles: string[]) => `Bearer ${token(roles)}`;

const OPS_READ_ROLES = [
  'PLATFORM_ADMIN',
  'SRE',
  'SECURITY_ADMIN',
  'RELEASE_MANAGER',
  'GOVERNANCE_ADMIN',
];

describe('HTTP de la sonda de vida', () => {
  let app: INestApplication;
  const store = new Map<string, string>();
  let storeUp = true;
  const hset = jest.fn();

  const repo = {
    record: async (hb: { instanceId: string }) => {
      hset(hb);
      if (!storeUp) throw new Error('ECONNREFUSED 10.0.0.5:6379');
      store.set(hb.instanceId, JSON.stringify(hb));
    },
    readAll: async () => ({
      available: storeUp,
      records: new Map(storeUp ? store : []),
    }),
  };
  const probes = {
    probeAll: async () =>
      new Map<string, ProbeResult>(
        ['postgresql', 'mongodb', 'redis', 'opensearch'].map((id) => [
          id,
          { status: 'up', latencyMs: 4, observedAtMs: Date.now() },
        ]),
      ),
  };

  beforeAll(async () => {
    passport.use(
      'jwt',
      new JwtStrategy(
        {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          secretOrKey: SECRET,
        },
        (
          payload: { sub: string; roles: string[] },
          done: (e: unknown, u?: unknown) => void,
        ) => done(null, { id: payload.sub, roles: payload.roles }),
      ),
    );
    const module = await Test.createTestingModule({
      controllers: [OpsInstancesController, OpsHeartbeatController],
      providers: [
        OpsInstancesService,
        {
          provide: INSTANCE_REGISTRY_TOKEN,
          useValue: resolveRegistry({ requiredWorkers: null }),
        },
        { provide: InstanceHeartbeatRepository, useValue: repo },
        { provide: DependencyProbeService, useValue: probes },
      ],
    }).compile();
    app = module.createNestApplication();
    const reflector = app.get(Reflector);
    app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));
    app.useGlobalPipes(createGlobalValidationPipe());
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    store.clear();
    storeUp = true;
    hset.mockClear();
  });

  const post = (body: unknown, auth?: string) => {
    const r = request(app.getHttpServer()).post('/internal/ops/heartbeats');
    return (auth ? r.set('Authorization', auth) : r).send(body as object);
  };
  const get = (auth?: string) => {
    const r = request(app.getHttpServer()).get('/admin/ops/instances/liveness');
    return auth ? r.set('Authorization', auth) : r;
  };

  describe('POST /internal/ops/heartbeats', () => {
    it('H1: SYSTEM + cuerpo válido => 202 y el siguiente GET lo muestra VIVA con edad <= 1 s', async () => {
      const res = await post(
        { instanceId: 'worker-messaging', type: 'worker', version: '0.0.1' },
        bearer(['SYSTEM']),
      );
      expect(res.status).toBe(202);
      expect(res.body).toEqual({ accepted: true });

      const live = await get(bearer(['SRE']));
      expect(live.status).toBe(200);
      const w = live.body.instances.find(
        (i: { id: string }) => i.id === 'worker-messaging',
      );
      expect(w.state).toBe('VIVA');
      expect(w.ageSeconds).toBeLessThanOrEqual(1);
      expect(w.cause).toBeNull();
    });

    it('H2: dos veces => una sola entrada, sin duplicar', async () => {
      await post(
        { instanceId: 'worker-billing', type: 'worker' },
        bearer(['SYSTEM']),
      ).expect(202);
      await post(
        { instanceId: 'worker-billing', type: 'worker' },
        bearer(['SYSTEM']),
      ).expect(202);
      expect([...store.keys()]).toEqual(['worker-billing']);
    });

    it('H3: sin token => 401 y no guarda', async () => {
      await post({ instanceId: 'worker-messaging', type: 'worker' }).expect(
        401,
      );
      expect(hset).not.toHaveBeenCalled();
    });

    it.each(['PLATFORM_ADMIN', 'SRE', 'SECURITY_ADMIN', 'PATIENT'])(
      'H4: rol %s (no SYSTEM) => 403, los administradores no fabrican latidos',
      async (role) => {
        await post(
          { instanceId: 'worker-messaging', type: 'worker' },
          bearer([role]),
        ).expect(403);
        expect(hset).not.toHaveBeenCalled();
      },
    );

    it('H5: instanceId fuera del registro => 422 INSTANCE_UNKNOWN y nada guardado', async () => {
      const res = await post(
        { instanceId: 'worker-inventado', type: 'worker' },
        bearer(['SYSTEM']),
      );
      expect(res.status).toBe(422);
      expect(
        res.body.reason ?? res.body.error?.reason ?? JSON.stringify(res.body),
      ).toMatch(/INSTANCE_UNKNOWN/);
      expect(hset).not.toHaveBeenCalled();
    });

    it.each([
      [
        'campo extra isAdmin',
        { instanceId: 'worker-messaging', type: 'worker', isAdmin: true },
      ],
      [
        'receivedAt del cliente',
        {
          instanceId: 'worker-messaging',
          type: 'worker',
          receivedAt: 4102444800000,
        },
      ],
      [
        'sentAt del cliente',
        {
          instanceId: 'worker-messaging',
          type: 'worker',
          sentAt: '2099-01-01T00:00:00Z',
        },
      ],
      [
        'type fuera del enum',
        { instanceId: 'worker-messaging', type: 'admin' },
      ],
      ['sin type', { instanceId: 'worker-messaging' }],
      [
        'instanceId con caracteres inválidos',
        { instanceId: 'worker messaging; DROP', type: 'worker' },
      ],
      [
        'instanceId de 65 caracteres',
        { instanceId: 'w'.repeat(65), type: 'worker' },
      ],
      [
        'version de 65 caracteres',
        {
          instanceId: 'worker-messaging',
          type: 'worker',
          version: 'v'.repeat(65),
        },
      ],
      ['cuerpo vacío', {}],
    ])('H6: %s => 400 y nada guardado', async (_n, body) => {
      const res = await post(body, bearer(['SYSTEM']));
      expect(res.status).toBe(400);
      expect(hset).not.toHaveBeenCalled();
    });

    it('no falsificable: aunque el cliente intente adelantar la hora, el estado sale del reloj del servidor', async () => {
      await post(
        {
          instanceId: 'worker-messaging',
          type: 'worker',
          receivedAt: Date.now() + 86_400_000,
        },
        bearer(['SYSTEM']),
      ).expect(400);
      const live = await get(bearer(['SRE']));
      const w = live.body.instances.find(
        (i: { id: string }) => i.id === 'worker-messaging',
      );
      expect(w.state).toBe('SIN_DATO');
      expect(w.cause).toBe('NEVER_SEEN');
    });

    it('el instante guardado es el del servidor', async () => {
      const before = Date.now();
      await post(
        { instanceId: 'worker-scheduling', type: 'worker' },
        bearer(['SYSTEM']),
      ).expect(202);
      const stored = JSON.parse(store.get('worker-scheduling')!);
      expect(stored.receivedAt).toBeGreaterThanOrEqual(before);
      expect(stored.receivedAt).toBeLessThanOrEqual(Date.now());
    });

    it('Redis caído al guardar => 503 sin filtrar el error', async () => {
      storeUp = false;
      const res = await post(
        { instanceId: 'worker-messaging', type: 'worker' },
        bearer(['SYSTEM']),
      );
      expect(res.status).toBe(503);
      expect(JSON.stringify(res.body)).not.toMatch(/ECONNREFUSED|10\.0\.0\.5/);
    });
  });

  describe('GET /admin/ops/instances/liveness', () => {
    it('H7: sin token => 401', async () => {
      await get().expect(401);
    });

    it.each(['PATIENT', 'SYSTEM', 'DOCTOR', 'PLATFORM_OPERATOR'])(
      'H7: rol %s sin OPS_READ_ROLES => 403',
      async (role) => {
        await get(bearer([role])).expect(403);
      },
    );

    it.each(OPS_READ_ROLES)(
      'H8: rol %s => 200 con el contrato completo',
      async (role) => {
        const res = await get(bearer([role]));
        expect(res.status).toBe(200);
        expect(res.headers['cache-control']).toBe('no-store');
        expect(Object.keys(res.body).sort()).toEqual(
          [
            'evaluatedAt',
            'instances',
            'notMeasured',
            'overall',
            'thresholds',
          ].sort(),
        );
        expect(res.body.thresholds).toEqual({
          heartbeatIntervalSeconds: 15,
          liveSeconds: 30,
          degradedSeconds: 60,
        });
        expect(new Date(res.body.evaluatedAt).toISOString()).toBe(
          res.body.evaluatedAt,
        );
        expect(res.body.instances).toHaveLength(30);
        expect(['VIVA', 'DEGRADADA', 'CAIDA', 'SIN_DATO']).toContain(
          res.body.overall,
        );
      },
    );

    it('H9: el GET no escribe en el almacén', async () => {
      await get(bearer(['SRE'])).expect(200);
      expect(hset).not.toHaveBeenCalled();
      expect(store.size).toBe(0);
    });

    it('sin ningún latido, overall nunca es VIVA y los workers son SIN_DATO', async () => {
      const res = await get(bearer(['SRE']));
      expect(res.body.overall).not.toBe('VIVA');
      const workers = res.body.instances.filter(
        (i: { type: string }) => i.type === 'worker',
      );
      expect(
        workers.every((w: { state: string }) => w.state === 'SIN_DATO'),
      ).toBe(true);
    });

    it('Redis caído: sigue 200 y los workers son SIN_DATO / STORE_UNAVAILABLE', async () => {
      await post(
        { instanceId: 'worker-messaging', type: 'worker' },
        bearer(['SYSTEM']),
      ).expect(202);
      storeUp = false;
      const res = await get(bearer(['SRE']));
      expect(res.status).toBe(200);
      const w = res.body.instances.find(
        (i: { id: string }) => i.id === 'worker-messaging',
      );
      expect(w).toMatchObject({
        state: 'SIN_DATO',
        cause: 'STORE_UNAVAILABLE',
      });
    });

    it('H12: la respuesta no filtra pid, hosts, cadenas de conexión ni mensajes de error', async () => {
      storeUp = false;
      const res = await get(bearer(['SRE']));
      expect(JSON.stringify(res.body)).not.toMatch(
        /pid|ECONNREFUSED|10\.0\.0\.5|mongodb:\/\/|postgres:\/\/|password/i,
      );
    });
  });
});
