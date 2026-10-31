import { jest } from '@jest/globals';
import { EntityManager } from '@mikro-orm/postgresql';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
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
import { TenantScopeGuard } from '../../../common/auth/tenant-scope.guard';
import { TokenService } from '../../../common/auth/token.service';
import { AllExceptionsFilter } from '../../../common/filters/all-exceptions.filter';
import { TracingService } from '../../../observability';
import { RouteMetadataService } from '../../../observability/route-index/route-metadata.service';
import { AuditOversightReadRepository } from '../repositories/audit-oversight-read.repository';
import { AuditQueryRepository } from '../repositories/audit-query.repository';
import { AuditOversightReadService } from '../services/audit-oversight-read.service';
import { AuditQueryService } from '../services/audit-query.service';
import { ComplianceService } from '../services/compliance.service';
import {
  AUDIT_READ_ROLES,
  AUDIT_SUMMARY_ROLES,
  AuditQueryController,
} from './audit-query.controller';
import { PrivacyController } from './privacy.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ID = '00000000-0000-4000-8000-0000000000a1';

const dsar = (n: number, extra: Record<string, unknown> = {}) => ({
  id: `00000000-0000-4000-8000-00000000040${n}`,
  user_id: ID,
  type: 'DSAR_TYPE_ACCESS',
  status: 'DSAR_RECEIVED',
  jurisdiction: null,
  requested_at: `2026-10-0${n}T00:00:00.000000Z`,
  completed_at: null,
  has_result_file: false,
  row_version: 1,
  created_at: `2026-10-0${n}T00:00:00.000000Z`,
  updated_at: `2026-10-0${n}T00:00:00.000000Z`,
  result_file_id: '00000000-0000-4000-8000-0000000000ff',
  ...extra,
});

/**
 * `GET /audit/data-access/summary` y `GET /privacy/dsar[/:id]` con los guards reales (JWT, alcance de
 * tenant y roles) y el `ValidationPipe` de `main.ts`. Repositorios DOBLES; el SQL real se verificó
 * contra Postgres (evidencia-f0/F2-datos.md).
 */
describe('Supervisión agregada y DSAR (HTTP, repositorios dobles)', () => {
  let app: INestApplication;
  let tokens: TokenService;
  const repo: Record<string, any> = {
    accessTotals: mockFn(async () => ({
      events: 40,
      distinct_actors: 3,
      patient_scoped_events: 12,
    })),
    accessBuckets: mockFn(async (_em: unknown, dim: string) =>
      dim === 'purpose'
        ? [
            { key: 'TREATMENT', events: 30, distinct_actors: 3 },
            { key: 'SECURITY_OVERSIGHT', events: 2, distinct_actors: 1 },
          ]
        : dim === 'operation'
          ? [{ key: 'ACTION_READ', events: 40, distinct_actors: 3 }]
          : [{ key: 'LAB_RESULT', events: 40, distinct_actors: 3 }],
    ),
    accessDaily: mockFn(async () => [{ day: '2026-10-01', events: 40 }]),
    dsarList: mockFn(async () => []),
    dsarById: mockFn(async () => null),
  };

  const token = (roles: string[]): string =>
    tokens.signAccessToken('00000000-0000-4000-8000-000000000001', 's1', roles);
  const get = (ruta: string, roles?: string[]) => {
    const r = request(app.getHttpServer()).get(ruta);
    return roles ? r.set('Authorization', `Bearer ${token(roles)}`) : r;
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [PassportModule, AuthTokenModule],
      controllers: [AuditQueryController, PrivacyController],
      providers: [
        AuditOversightReadService,
        { provide: AuditOversightReadRepository, useValue: repo },
        { provide: AuditQueryService, useValue: {} },
        { provide: AuditQueryRepository, useValue: {} },
        { provide: RouteMetadataService, useValue: {} },
        { provide: ComplianceService, useValue: {} },
        { provide: EntityManager, useValue: { fork: () => ({}) } },
        JwtStrategy,
        {
          provide: SessionValidator,
          useValue: { assertActive: jest.fn(async () => undefined) },
        },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: TenantScopeGuard },
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
      ],
    }).compile();
    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    tokens = modulo.get(TokenService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    for (const f of Object.values(repo)) f.mockClear();
  });

  const RUTAS = [
    '/audit/data-access/summary',
    '/privacy/dsar',
    `/privacy/dsar/${ID}`,
  ];

  describe('matriz de autorización', () => {
    it.each(RUTAS)('%s sin token → 401', async (ruta) => {
      await get(ruta).expect(401);
    });

    it.each(RUTAS)('%s con un rol clínico o ajeno → 403', async (ruta) => {
      const res = await get(ruta, ['PATIENT', 'CLINICIAN']).expect(403);
      expect(res.body.code).toBe('FORBIDDEN');
      await get(ruta, ['PHARMACIST']).expect(403);
      await get(ruta, ['DATA_STEWARD']).expect(403);
    });

    it('nada llega a la base antes de autorizar', async () => {
      for (const ruta of RUTAS) await get(ruta, ['PATIENT']).expect(403);
      for (const f of Object.values(repo)) expect(f).not.toHaveBeenCalled();
    });

    it.each(AUDIT_SUMMARY_ROLES)('el rol %s lee el resumen', async (rol) => {
      await get('/audit/data-access/summary', [rol]).expect(200);
    });

    it('GOVERNANCE_ADMIN lee el resumen agregado pero NO la bitácora ni el DSAR (D-2)', async () => {
      expect(AUDIT_READ_ROLES).not.toContain('GOVERNANCE_ADMIN');
      await get('/audit/data-access/summary', ['GOVERNANCE_ADMIN']).expect(200);
      await get('/privacy/dsar', ['GOVERNANCE_ADMIN']).expect(403);
      await get('/privacy/dsar', ['DATA_GOVERNANCE_ADMIN']).expect(403);
    });

    it.each(AUDIT_READ_ROLES)(
      'el rol %s lee el DSAR (sin tenant)',
      async (rol) => {
        await get('/privacy/dsar', [rol]).expect(200);
      },
    );
  });

  describe('GET /audit/data-access/summary', () => {
    it('devuelve sólo conteos, suprime grupos bajo minSample y declara byRole', async () => {
      const res = await get('/audit/data-access/summary', ['AUDITOR']).expect(
        200,
      );
      expect(res.body.totals).toEqual({
        events: 40,
        distinctActors: 3,
        patientScopedEvents: 12,
      });
      expect(res.body.byPurpose).toEqual([
        { key: 'TREATMENT', events: 30, distinctActors: 3 },
      ]);
      expect(res.body.suppressed).toEqual({ buckets: 1, events: 2 });
      expect(res.body.minSample).toBe(5);
      expect(res.body.byOperation).toEqual([
        { key: 'READ', events: 40, distinctActors: 3 },
      ]);
      expect(res.body.notMeasured.map((n: any) => n.field)).toContain('byRole');
      const texto = JSON.stringify(res.body);
      expect(texto).not.toMatch(/patient_profile_id|resource_id|userId/);
    });

    it('minSample=1 muestra todo; la ventana por omisión son 30 días', async () => {
      const res = await get('/audit/data-access/summary?minSample=1', [
        'DPO',
      ]).expect(200);
      expect(res.body.suppressed).toEqual({ buckets: 0, events: 0 });
      const { from, to } = res.body.window;
      expect(Math.round((Date.parse(to) - Date.parse(from)) / 86400000)).toBe(
        30,
      );
    });

    it.each([
      [
        'una ventana invertida',
        '?from=2026-10-02T00:00:00Z&to=2026-10-01T00:00:00Z',
      ],
      ['una fecha no ISO', '?from=ayer'],
      ['minSample cero', '?minSample=0'],
      ['minSample enorme', '?minSample=5000'],
      ['un parámetro no declarado', '?userId=x'],
    ])('%s → 400, nunca 500', async (_c, query) => {
      await get(`/audit/data-access/summary${query}`, ['AUDITOR']).expect(400);
      expect(repo.accessTotals).not.toHaveBeenCalled();
    });
  });

  describe('GET /privacy/dsar', () => {
    it('lista sin prefijos de concepto, sin el archivo resultante y marca vencidas', async () => {
      repo.dsarList.mockResolvedValueOnce([
        dsar(2, { requested_at: '2026-01-02T00:00:00.000000Z' }),
        dsar(1, {
          status: 'DSAR_COMPLETED',
          completed_at: '2026-10-03T00:00:00.000000Z',
        }),
      ]);
      const res = await get('/privacy/dsar', ['DPO']).expect(200);
      expect(res.body.items[0]).toMatchObject({
        type: 'ACCESS',
        status: 'RECEIVED',
        subjectUserId: ID,
        hasResultFile: false,
        overdue: true,
      });
      expect(res.body.items[1]).toMatchObject({
        status: 'COMPLETED',
        overdue: false,
      });
      expect(JSON.stringify(res.body)).not.toContain('result_file_id');
      expect(JSON.stringify(res.body)).not.toContain('0000000000ff');
      expect(res.body.notMeasured.map((n: any) => n.field)).toContain(
        'resultFile',
      );
    });

    it('pasa los filtros con el prefijo del concepto y pagina por (requested_at, id)', async () => {
      repo.dsarList.mockResolvedValueOnce([dsar(3), dsar(2), dsar(1)]);
      const p1 = await get(
        '/privacy/dsar?limit=2&status=RECEIVED&type=ERASURE',
        ['DPO'],
      ).expect(200);
      expect(repo.dsarList.mock.calls[0][1]).toMatchObject({
        status: 'DSAR_RECEIVED',
        type: 'DSAR_TYPE_ERASURE',
        limit: 2,
      });
      await get(`/privacy/dsar?limit=2&cursor=${p1.body.nextCursor}`, [
        'DPO',
      ]).expect(200);
      expect(repo.dsarList.mock.calls[1][1].cursor).toEqual({
        t: dsar(2).requested_at,
        i: dsar(2).id,
      });
    });

    it.each([
      ['un estado inventado', '?status=MAYBE'],
      ['un tipo inventado', '?type=SELL'],
      ['un límite fuera de rango', '?limit=201'],
      ['un cursor corrupto', '?cursor=%25%25'],
      ['un parámetro no declarado', '?userId=x'],
      [
        'una ventana invertida',
        '?from=2026-10-02T00:00:00Z&to=2026-10-01T00:00:00Z',
      ],
    ])('%s → 400', async (_c, query) => {
      await get(`/privacy/dsar${query}`, ['DPO']).expect(400);
      expect(repo.dsarList).not.toHaveBeenCalled();
    });
  });

  describe('GET /privacy/dsar/:id', () => {
    it('200 con el detalle y 404 si no existe', async () => {
      repo.dsarById.mockResolvedValueOnce(dsar(1));
      await get(`/privacy/dsar/${ID}`, ['AUDITOR']).expect(200);
      await get(`/privacy/dsar/${ID}`, ['AUDITOR']).expect(404);
    });

    it('un id que no es uuid → 400', async () => {
      await get('/privacy/dsar/abc', ['AUDITOR']).expect(400);
      expect(repo.dsarById).not.toHaveBeenCalled();
    });

    it('no abre verbos de escritura nuevos: PATCH/POST siguen exigiendo SECURITY_ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/privacy/dsar/${ID}`)
        .set('Authorization', `Bearer ${token(['DPO'])}`)
        .send({ status: 'COMPLETED' });
      expect(res.status).toBe(403);
    });
  });
});
