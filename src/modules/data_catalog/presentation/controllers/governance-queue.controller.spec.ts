import { jest } from '@jest/globals';
import { EntityManager } from '@mikro-orm/postgresql';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
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
import { TenantScopeGuard } from '../../../../common/auth/tenant-scope.guard';
import { TokenService } from '../../../../common/auth/token.service';
import { AllExceptionsFilter } from '../../../../common/filters/all-exceptions.filter';
import { TracingService } from '../../../../observability';
import { GOVERNANCE_VIEW_ROLES } from '../../../system_ops/governance-read.roles';
import { GovernanceQueueService } from '../../application/governance-queue.service';
import { GovernanceQueueRepository } from '../../infrastructure/repositories/governance-queue.repository';
import { GovernanceQueueController } from './governance-queue.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const ID = '00000000-0000-4000-8000-0000000000a1';

const cola = (n: number) => ({
  annotation_id: `00000000-0000-4000-8000-00000000050${n}`,
  kind: n % 2 ? 'COLUMN' : 'OBJECT',
  object_id: ID,
  column_id: n % 2 ? ID : null,
  schema_name: 'iam',
  object_name: 'users',
  column_name: n % 2 ? 'email' : null,
  sensitivity: 'PHI_IDENTIFIER',
  origin: 'MANUAL',
  revision_no: 2,
  submitted_by_user_id: ID,
  updated_at: `2026-10-0${n}T00:00:00.000000Z`,
  // no seleccionados por el repositorio real: no deben salir
  definition: 'texto libre de la ficha',
});

const job = (n: number, extra: Record<string, unknown> = {}) => ({
  type: 'CATALOG_SCAN',
  id: `00000000-0000-4000-8000-00000000060${n}`,
  status: 'SUCCEEDED',
  requested_by_user_id: ID,
  requested_at: `2026-10-0${n}T10:00:00.000000Z`,
  started_at: `2026-10-0${n}T10:00:01.000000Z`,
  finished_at: `2026-10-0${n}T10:00:04.000000Z`,
  lease_owner: null,
  lease_expires_at: null,
  counters: { objectsObserved: 10 },
  error_code: null,
  has_error: false,
  sort_at: `2026-10-0${n}T10:00:00.000000Z`,
  error_message: 'violación en (paciente@example.com)',
  ...extra,
});

/** Cola de revisión y trabajos con los guards reales; repositorio DOBLE (SQL real: F2-datos.md). */
describe('GovernanceQueueController (HTTP, repositorio doble)', () => {
  let app: INestApplication;
  let tokens: TokenService;
  const repo: Record<string, any> = {
    reviewQueue: mockFn(async () => []),
    reviewQueueCounts: mockFn(async () => []),
    jobs: mockFn(async () => []),
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
      controllers: [GovernanceQueueController],
      providers: [
        GovernanceQueueService,
        { provide: GovernanceQueueRepository, useValue: repo },
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

  const RUTAS = ['/admin/governance/review-queue', '/admin/governance/jobs'];

  describe('matriz de autorización', () => {
    it.each(RUTAS)('%s sin token → 401', async (r) => {
      await get(r).expect(401);
    });
    it.each(RUTAS)('%s con rol clínico o ajeno → 403', async (r) => {
      await get(r, ['PATIENT', 'CLINICIAN']).expect(403);
      await get(r, ['PHARMACIST']).expect(403);
    });
    it('nada llega a la base antes de autorizar', async () => {
      for (const r of RUTAS) await get(r, ['PATIENT']).expect(403);
      for (const f of Object.values(repo)) expect(f).not.toHaveBeenCalled();
    });
    it.each(GOVERNANCE_VIEW_ROLES)('el rol %s puede leer', async (rol) => {
      for (const r of RUTAS) await get(r, [rol]).expect(200);
    });
    it('DATA_GOVERNANCE_ADMIN (alias) y SUPERADMIN también', async () => {
      for (const rol of ['DATA_GOVERNANCE_ADMIN', 'SUPERADMIN'])
        for (const r of RUTAS) await get(r, [rol]).expect(200);
    });
  });

  describe('GET /admin/governance/review-queue', () => {
    it('resume por fuente, calcula la antigüedad y no devuelve texto de ficha', async () => {
      repo.reviewQueue.mockResolvedValueOnce([cola(1), cola(2)]);
      repo.reviewQueueCounts.mockResolvedValueOnce([
        { kind: 'COLUMN', total: 4 },
        { kind: 'OBJECT', total: 1 },
      ]);
      const res = await get('/admin/governance/review-queue', [
        'DATA_STEWARD',
      ]).expect(200);
      expect(res.body.summary).toEqual({
        total: 5,
        bySource: { CATALOG_OBJECT: 1, CATALOG_COLUMN: 4 },
      });
      expect(res.body.items[0]).toMatchObject({
        source: 'CATALOG_COLUMN',
        columnName: 'email',
        submittedByUserId: ID,
      });
      expect(res.body.items[0].ageDays).toBeGreaterThanOrEqual(0);
      expect(JSON.stringify(res.body)).not.toContain('texto libre');
      expect(res.body.notMeasured.map((n: any) => n.field)).toEqual([
        'glossaryTerms',
        'policyRevisions',
        'certifications',
      ]);
    });

    it('pagina por (updated_at, id) y pasa los filtros', async () => {
      repo.reviewQueue.mockResolvedValueOnce([cola(1), cola(2), cola(3)]);
      const p1 = await get(
        '/admin/governance/review-queue?limit=2&kind=COLUMN&schema=iam',
        ['DPO'],
      ).expect(200);
      expect(repo.reviewQueue.mock.calls[0][1]).toMatchObject({
        kind: 'COLUMN',
        schema: 'iam',
        limit: 2,
      });
      await get(
        `/admin/governance/review-queue?limit=2&cursor=${p1.body.nextCursor}`,
        ['DPO'],
      ).expect(200);
      expect(repo.reviewQueue.mock.calls[1][1].cursor).toEqual({
        t: cola(2).updated_at,
        i: cola(2).annotation_id,
      });
    });

    it.each([
      ['una clase inventada', '?kind=TERM'],
      ['un schema con SQL', "?schema=iam'--"],
      ['un límite fuera de rango', '?limit=201'],
      ['un cursor corrupto', '?cursor=%25%25'],
      ['un parámetro no declarado', '?status=APPROVED'],
    ])('%s → 400', async (_c, q) => {
      await get(`/admin/governance/review-queue${q}`, ['DPO']).expect(400);
      expect(repo.reviewQueue).not.toHaveBeenCalled();
    });
  });

  describe('GET /admin/governance/jobs', () => {
    it('une las fuentes, calcula duración y lease vencido, y declara lo que no persiste', async () => {
      repo.jobs.mockResolvedValueOnce([
        job(3, {
          type: 'CATALOG_SCAN',
          status: 'RUNNING',
          finished_at: null,
          lease_owner: 'w1',
          lease_expires_at: '2020-01-01T00:00:00.000000Z',
        }),
        job(2, { type: 'CLASSIFICATION', counters: {} }),
        job(1, { type: 'RETENTION', has_error: true, status: 'FAILED' }),
      ]);
      const res = await get('/admin/governance/jobs', ['AUDITOR']).expect(200);
      const [scan, clasif, ret] = res.body.items;
      expect(scan.lease).toEqual({
        owner: 'w1',
        expiresAt: '2020-01-01T00:00:00.000000Z',
        expired: true,
      });
      expect(scan.durationMs).toBeNull();
      expect(clasif.counters).toBeNull();
      expect(clasif.durationMs).toBe(3000);
      expect(ret).toMatchObject({ status: 'FAILED', hasError: true });
      expect(JSON.stringify(res.body)).not.toContain('paciente@example.com');
      const campos = res.body.notMeasured.map((n: any) => n.field);
      expect(campos).toEqual(
        expect.arrayContaining([
          'classificationRuns.detail',
          'qualityRuleRuns',
          'requestId',
        ]),
      );
    });

    it('sin rango mira 30 días; con filtros los pasa a la consulta', async () => {
      await get('/admin/governance/jobs?type=RETENTION&status=FAILED', [
        'DPO',
      ]).expect(200);
      const f = repo.jobs.mock.calls[0][1];
      expect(f).toMatchObject({ type: 'RETENTION', status: 'FAILED' });
      expect(Math.round((Date.now() - f.from.getTime()) / 86400000)).toBe(30);
    });

    it('pagina por (sort_at, tipo, id)', async () => {
      repo.jobs.mockResolvedValueOnce([job(3), job(2), job(1)]);
      const p1 = await get('/admin/governance/jobs?limit=2', ['DPO']).expect(
        200,
      );
      await get(`/admin/governance/jobs?limit=2&cursor=${p1.body.nextCursor}`, [
        'DPO',
      ]).expect(200);
      expect(repo.jobs.mock.calls[1][1].cursor).toEqual({
        t: job(2).sort_at,
        ty: 'CATALOG_SCAN',
        i: job(2).id,
      });
    });

    it.each([
      ['un tipo inventado', '?type=QUALITY'],
      ['un estado inventado', '?status=DONE'],
      [
        'una ventana invertida',
        '?from=2026-10-02T00:00:00Z&to=2026-10-01T00:00:00Z',
      ],
      ['una fecha no ISO', '?from=ayer'],
      ['un límite cero', '?limit=0'],
      [
        'un cursor de otra forma',
        `?cursor=${Buffer.from('{"z":"1"}').toString('base64url')}`,
      ],
    ])('%s → 400', async (_c, q) => {
      await get(`/admin/governance/jobs${q}`, ['DPO']).expect(400);
      expect(repo.jobs).not.toHaveBeenCalled();
    });
  });

  describe('cursor forjado → 400 INVALID_CURSOR, nunca 500', () => {
    const forjado = (o: Record<string, unknown>): string =>
      Buffer.from(JSON.stringify(o)).toString('base64url');
    it.each([
      ['/admin/governance/review-queue', { t: 'abc', i: 'x' }],
      [
        '/admin/governance/review-queue',
        { t: '2026-10-01T00:00:00.000000Z', i: 'x' },
      ],
      ['/admin/governance/jobs', { t: 'abc', ty: 'RETENTION', i: ID }],
      [
        '/admin/governance/jobs',
        { t: '2026-10-01T00:00:00.000000Z', ty: 'DROP', i: ID },
      ],
      [
        '/admin/governance/jobs',
        { t: '2026-10-01T00:00:00.000000Z', ty: 'RETENTION', i: 'x' },
      ],
    ])('%s con %j', async (ruta, cursor) => {
      const res = await get(`${ruta}?cursor=${forjado(cursor)}`, [
        'DPO',
      ]).expect(400);
      expect(res.body.reason).toBe('INVALID_CURSOR');
      expect(repo.reviewQueue).not.toHaveBeenCalled();
      expect(repo.jobs).not.toHaveBeenCalled();
    });
  });
});
