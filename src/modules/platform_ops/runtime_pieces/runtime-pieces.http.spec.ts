import { jest } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import { AuthTokenModule } from '../../../common/auth/auth-token.module';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { JwtStrategy } from '../../../common/auth/jwt.strategy';
import { RolesGuard } from '../../../common/auth/roles.guard';
import { SessionValidator } from '../../../common/auth/session-validator';
import { TokenService } from '../../../common/auth/token.service';
import { AllExceptionsFilter } from '../../../common/filters/all-exceptions.filter';
import { createGlobalValidationPipe } from '../../../common/http/validation-pipe';
import { TracingService } from '../../../observability';
import { loadInstanceLivenessEnv } from '../../ops_console/domain/instance-liveness.env';
import { PLATFORM_OPS } from '../platform_ops.concepts';
import { buildPurpose } from './domain/provenance';
import { HeartbeatReader } from './heartbeat-reader';
import { RUNTIME_PIECE_KIND } from './runtime-pieces.concepts';
import { RuntimePiecesController } from './runtime-pieces.controller';
import { RuntimePiecesRepository } from './runtime-pieces.repository';
import {
  RUNTIME_PIECES_CLOCK,
  RUNTIME_PIECES_LIVENESS_ENV,
  RUNTIME_PIECES_SQL,
  RuntimePiecesService,
} from './runtime-pieces.service';
import { RuntimePiecesSeedService } from './runtime-pieces-seed.service';
import type { DiscoveredPiece, ScanResult } from './runtime-pieces.types';
import { ScanCache } from './scan-cache';

/**
 * Contrato HTTP con la cadena REAL de autenticación (`JwtAuthGuard`,
 * `RolesGuard`), el `ValidationPipe` global y el filtro de errores. La lectura
 * del código, el registro y Redis son DOBLES declarados.
 */
const NOW = new Date('2026-10-31T12:00:00.000Z');

const job = (
  id: string,
  over: Partial<DiscoveredPiece> = {},
): DiscoveredPiece => ({
  id,
  kind: 'JOB_PROGRAMADO',
  name: id,
  module: 'demo',
  hosts: ['worker-messaging'],
  schedule: { type: 'interval', intervalMs: 5000, cron: null, raw: '5000' },
  enable: { how: 'x', envVars: [], launchers: [] },
  evidence: { file: `src/${id}.ts`, line: 4 },
  related: [],
  heartbeat: { mode: 'INHERITED', instanceId: 'worker-messaging' },
  wired: true,
  attributes: {},
  ...over,
});

const PIECES = [
  job('rtp.job.a'),
  job('rtp.job.b'),
  job('rtp.job.c', { module: 'otro' }),
];
let scan: ScanResult;
const registryRows = () =>
  PIECES.slice(0, 2).map((p) => ({
    id: `id-${p.id}`,
    code: p.id,
    name: p.name,
    toolTypeConceptId: RUNTIME_PIECE_KIND.JOB_PROGRAMADO,
    purpose: buildPurpose(p, '2026-10-30'),
    stateConceptId: PLATFORM_OPS.TOOL_STATE_ACTIVE,
    updatedAt: NOW,
  }));

describe('/admin/ops/runtime-pieces (HTTP)', () => {
  let app: INestApplication;
  let tokens: TokenService;
  const discover = jest.fn();
  let heartbeats: Record<string, string> | null;

  const token = (roles: string[]) =>
    tokens.signAccessToken(
      '00000000-0000-4000-8000-000000000001',
      'sesion-1',
      roles,
    );
  const get = (path: string, roles?: string[]) => {
    const r = request(app.getHttpServer()).get(
      `/admin/ops/runtime-pieces${path}`,
    );
    return roles ? r.set('Authorization', `Bearer ${token(roles)}`) : r;
  };
  const post = (body: object, roles?: string[]) => {
    const r = request(app.getHttpServer()).post(
      '/admin/ops/runtime-pieces/discover',
    );
    return (roles ? r.set('Authorization', `Bearer ${token(roles)}`) : r).send(
      body,
    );
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PassportModule, AuthTokenModule],
      controllers: [RuntimePiecesController],
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
        RuntimePiecesService,
        { provide: ScanCache, useValue: { get: async () => scan } },
        {
          provide: RuntimePiecesRepository,
          useValue: { listRegistered: async () => registryRows() },
        },
        {
          provide: HeartbeatReader,
          useValue: {
            read: async () =>
              heartbeats === null
                ? { status: 'down', reason: 'STORE_UNAVAILABLE', records: null }
                : { status: 'up', reason: null, records: heartbeats },
          },
        },
        { provide: RuntimePiecesSeedService, useValue: { run: discover } },
        {
          provide: RUNTIME_PIECES_SQL,
          useValue: {
            transaction: async (w: (t: unknown) => unknown) => w({}),
            query: async () => [],
          },
        },
        {
          provide: RUNTIME_PIECES_LIVENESS_ENV,
          useValue: loadInstanceLivenessEnv({}, 3_000),
        },
        { provide: RUNTIME_PIECES_CLOCK, useValue: () => NOW },
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
    scan = {
      available: true,
      source: 'live',
      generatedAt: null,
      reason: null,
      root: '/secreto/ruta',
      filesRead: 10,
      pieces: PIECES,
      warnings: [],
    };
    heartbeats = {
      'worker-messaging': JSON.stringify({
        receivedAt: NOW.getTime() - 5_000,
        status: 'running',
        startedAt: '2026-10-31T08:00:00.000Z',
        liveness: { healthy: true },
        readiness: { healthy: true },
      }),
    };
    discover.mockReset();
  });

  describe('autorización', () => {
    it('sin token → 401 en las tres rutas', async () => {
      await get('').expect(401);
      await get('/rtp.job.a').expect(401);
      await post({}).expect(401);
    });

    it('un rol sin acceso a operación → 403', async () => {
      await get('', ['PATIENT']).expect(403);
      await post({}, ['PATIENT']).expect(403);
    });

    it.each([
      'PLATFORM_ADMIN',
      'SRE',
      'SECURITY_ADMIN',
      'RELEASE_MANAGER',
      'GOVERNANCE_ADMIN',
    ])('%s puede leer', async (rol) => {
      await get('', [rol]).expect(200);
    });

    it.each(['SECURITY_ADMIN', 'RELEASE_MANAGER', 'GOVERNANCE_ADMIN'])(
      'leer no es escribir: %s no puede descubrir → 403 y el seeder no corre',
      async (rol) => {
        await post({}, [rol]).expect(403);
        expect(discover).not.toHaveBeenCalled();
      },
    );

    it.each(['PLATFORM_ADMIN', 'SRE'])('%s puede descubrir', async (rol) => {
      discover.mockImplementation(async () => ({ created: 0 }));
      await post({}, [rol]).expect(200);
    });
  });

  describe('GET /admin/ops/runtime-pieces', () => {
    it('devuelve las piezas contrastadas, el resumen, las instancias y lo que no se mide', async () => {
      const { body } = await get('', ['SRE']).expect(200);
      expect(body.meta).toEqual({
        page: 1,
        pageSize: 25,
        total: 3,
        totalPages: 1,
      });
      expect(
        body.data.map(
          (p: { id: string; state: string }) => `${p.id}:${p.state}`,
        ),
      ).toEqual([
        'rtp.job.a:VIVA',
        'rtp.job.b:VIVA',
        'rtp.job.c:NO_REGISTRADA',
      ]);
      expect(body.summary.byState).toMatchObject({ VIVA: 2, NO_REGISTRADA: 1 });
      expect(body.heartbeatStore).toEqual({ status: 'up', reason: null });
      expect(body.thresholds).toMatchObject({
        degradedAfterSeconds: 30,
        downAfterSeconds: 60,
      });
      expect(
        body.instances.find((i: { id: string }) => i.id === 'worker-messaging'),
      ).toMatchObject({ state: 'VIVA', pieceCount: 3 });
      expect(body.findings.map((f: { rule: string }) => f.rule)).toContain(
        'NO_REGISTRADA',
      );
      expect(body.notMeasured.length).toBeGreaterThan(0);
    });

    it('no revela la ruta del servidor ni mensajes crudos', async () => {
      const { text } = await get('', ['SRE']).expect(200);
      expect(text).not.toContain('/secreto/ruta');
    });

    it('sin latidos (Redis caído) las piezas del worker son SIN_LATIDO, con el motivo, nunca VIVA', async () => {
      heartbeats = null;
      const { body } = await get('', ['SRE']).expect(200);
      expect(body.heartbeatStore).toEqual({
        status: 'down',
        reason: 'STORE_UNAVAILABLE',
      });
      const states = body.data
        .filter((p: { registry: { present: boolean } }) => p.registry.present)
        .map((p: { state: string; cause: string }) => `${p.state}/${p.cause}`);
      expect(states).toEqual([
        'SIN_LATIDO/STORE_UNAVAILABLE',
        'SIN_LATIDO/STORE_UNAVAILABLE',
      ]);
    });

    it('si el código viene del manifiesto de compilación lo dice, con su fecha', async () => {
      scan = {
        ...scan,
        source: 'manifest',
        generatedAt: '2026-10-30T20:00:00.000Z',
      };
      const { body } = await get('', ['SRE']).expect(200);
      expect(body.scan).toMatchObject({
        available: true,
        source: 'manifest',
        generatedAt: '2026-10-30T20:00:00.000Z',
      });
    });

    it('filtra y pagina', async () => {
      const filtered = await get('?state=NO_REGISTRADA', ['SRE']).expect(200);
      expect(filtered.body.data.map((p: { id: string }) => p.id)).toEqual([
        'rtp.job.c',
      ]);
      const paged = await get('?page=2&pageSize=2', ['SRE']).expect(200);
      expect(paged.body.meta).toEqual({
        page: 2,
        pageSize: 2,
        total: 3,
        totalPages: 2,
      });
      expect(paged.body.data).toHaveLength(1);
      const byModule = await get('?module=otro&q=RTP.JOB', ['SRE']).expect(200);
      expect(byModule.body.data).toHaveLength(1);
      const withFindings = await get('?withFindings=true', ['SRE']).expect(200);
      expect(withFindings.body.data.map((p: { id: string }) => p.id)).toEqual([
        'rtp.job.c',
      ]);
    });

    it.each([
      '?pageSize=500',
      '?page=0',
      '?state=INVENTADO',
      '?kind=NADA',
      '?host=' + 'x'.repeat(101),
    ])('entrada inválida %s → 4xx, nunca 500', async (query) => {
      const res = await get(query, ['SRE']);
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('sin código fuente lo declara y no inventa huérfanas', async () => {
      scan = {
        available: false,
        source: 'live',
        generatedAt: null,
        reason: 'No hay código fuente',
        root: '/r',
        filesRead: 0,
        pieces: [],
        warnings: [],
      };
      const { body } = await get('', ['SRE']).expect(200);
      expect(body.scan).toMatchObject({
        available: false,
        source: 'live',
        reason: 'No hay código fuente',
      });
      expect(body.summary.byState.HUERFANA).toBe(0);
      expect(body.findings.map((f: { rule: string }) => f.rule)).toContain(
        'CODIGO_NO_DISPONIBLE',
      );
    });
  });

  describe('GET /admin/ops/runtime-pieces/:id', () => {
    it('una pieza con su evidencia, su registro y sus hallazgos', async () => {
      const { body } = await get('/rtp.job.c', ['SRE']).expect(200);
      expect(body).toMatchObject({
        id: 'rtp.job.c',
        state: 'NO_REGISTRADA',
        evidence: { file: 'src/rtp.job.c.ts', line: 4 },
      });
      expect(body.findings.map((f: { rule: string }) => f.rule)).toEqual([
        'NO_REGISTRADA',
      ]);
    });

    it('una pieza inexistente → 404 con su reason', async () => {
      const { body } = await get('/rtp.no.existe', ['SRE']).expect(404);
      expect(body).toMatchObject({
        code: 'NOT_FOUND',
        reason: 'RUNTIME_PIECE_NOT_FOUND',
      });
    });
  });

  describe('POST /admin/ops/runtime-pieces/discover', () => {
    it('pasa el actor y dryRun al seeder y devuelve su informe con los avisos del escáner', async () => {
      scan = { ...scan, warnings: ['aviso del escáner'] };
      discover.mockImplementation(async () => ({
        dryRun: true,
        created: 1,
        updated: 0,
        unchanged: 2,
      }));
      const { body } = await post({ dryRun: true }, ['PLATFORM_ADMIN']).expect(
        200,
      );
      expect(body).toMatchObject({
        dryRun: true,
        created: 1,
        unchanged: 2,
        warnings: ['aviso del escáner'],
      });
      expect(discover).toHaveBeenCalledWith(
        expect.anything(),
        scan,
        expect.objectContaining({
          actorUserId: '00000000-0000-4000-8000-000000000001',
          dryRun: true,
        }),
      );
    });

    it('un campo no declarado se rechaza, no se ignora en silencio', async () => {
      const res = await post({ dryRun: false, tenantId: 'otro' }, [
        'PLATFORM_ADMIN',
      ]);
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
      expect(discover).not.toHaveBeenCalled();
    });
  });
});
