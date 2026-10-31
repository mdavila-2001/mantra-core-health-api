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
import {
  GOVERNANCE_VIEW_ROLES,
  LEGAL_HOLD_VIEW_ROLES,
} from '../governance-read.roles';
import { GovernanceOperationsReadRepository } from '../repositories/governance-operations-read.repository';
import { GovernanceOperationsReadService } from '../services/governance-operations-read.service';
import { GovernanceOperationsReadController } from './governance-operations-read.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ID = '00000000-0000-4000-8000-0000000000a1';
const T1 = '2026-10-01T00:00:00.000000Z';

const dominio = (n: number) => ({
  id: `00000000-0000-4000-8000-00000000010${n}`,
  code: `dom${n}`,
  name: `Dominio ${n}`,
  description: null,
  owner_team: 'Datos',
  entity_count: n,
  row_version: 1,
  created_at: T1,
  updated_at: T1,
});

const hold = (n: number) => ({
  id: `00000000-0000-4000-8000-00000000020${n}`,
  tenant_id: ID,
  target_type: 'PATIENT_PROFILE',
  target_id: ID,
  reason: 'LITIGATION',
  status: 'ACTIVE',
  starts_at: T1,
  ends_at: null,
  has_authority_reference: true,
  row_version: 1,
  created_at: T1,
  updated_at: `2026-10-0${n}T00:00:00.000000Z`,
  // Campos que el repositorio real NO selecciona: si aparecieran, no deben salir.
  authority_reference: 'Expediente 123/2026 - Juan Pérez',
});

const ejecucion = (n: number, extra: Record<string, unknown> = {}) => ({
  id: `00000000-0000-4000-8000-00000000030${n}`,
  policy_id: ID,
  policy_code: 'RET-1',
  entity_registry_id: ID,
  schema_name: 'audit',
  table_name: 'audit_log',
  status: 'EXEC_SUCCEEDED',
  started_at: '2026-10-01T10:00:00.000000Z',
  finished_at: '2026-10-01T10:00:02.500000Z',
  total_scanned: 100,
  total_deleted: 7,
  total_anonymized: 0,
  total_archived: 0,
  has_error: false,
  recorded_at: `2026-10-0${n}T10:00:03.000000Z`,
  error_text: 'duplicate key value (paciente@example.com)',
  ...extra,
});

/**
 * Dominios, retenciones legales y ejecuciones de retención con los guards reales (JWT, alcance de
 * tenant y roles) y el `ValidationPipe` de `main.ts`. El repositorio es un DOBLE declarado: el SQL
 * contra PostgreSQL real se verificó aparte (evidencia-f0/F2-datos.md).
 */
describe('GovernanceOperationsReadController (HTTP, repositorio doble)', () => {
  let app: INestApplication;
  let tokens: TokenService;
  const repo: Record<string, any> = {
    domains: mockFn(async () => []),
    legalHolds: mockFn(async () => []),
    retentionExecutions: mockFn(async () => []),
  };

  const token = (roles: string[]): string =>
    tokens.signAccessToken(
      '00000000-0000-4000-8000-000000000001',
      'sesion-1',
      roles,
    );
  const get = (ruta: string, roles?: string[]) => {
    const r = request(app.getHttpServer()).get(ruta);
    return roles ? r.set('Authorization', `Bearer ${token(roles)}`) : r;
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [PassportModule, AuthTokenModule],
      controllers: [GovernanceOperationsReadController],
      providers: [
        GovernanceOperationsReadService,
        { provide: GovernanceOperationsReadRepository, useValue: repo },
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
    '/admin/governance/domains',
    '/admin/governance/legal-holds',
    '/admin/governance/retention-executions',
  ];

  describe('matriz de autorización', () => {
    it.each(RUTAS)('%s sin token → 401', async (ruta) => {
      await get(ruta).expect(401);
    });

    it.each(RUTAS)('%s con un rol clínico → 403', async (ruta) => {
      const res = await get(ruta, ['PATIENT', 'CLINICIAN']).expect(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it.each(RUTAS)('%s con un rol ajeno → 403', async (ruta) => {
      await get(ruta, ['PHARMACIST']).expect(403);
      await get(ruta, ['QA_ADMIN']).expect(403);
    });

    it('nada llega a la base antes de autorizar', async () => {
      for (const ruta of RUTAS) await get(ruta, ['PATIENT']).expect(403);
      for (const f of Object.values(repo)) expect(f).not.toHaveBeenCalled();
    });

    it.each(GOVERNANCE_VIEW_ROLES)(
      '%s (sin tenant ni cabecera) lee dominios y ejecuciones',
      async (rol) => {
        await get('/admin/governance/domains', [rol]).expect(200);
        await get('/admin/governance/retention-executions', [rol]).expect(200);
      },
    );

    it.each(LEGAL_HOLD_VIEW_ROLES)(
      '%s lee las retenciones legales',
      async (rol) => {
        await get('/admin/governance/legal-holds', [rol]).expect(200);
      },
    );

    it.each(['DATA_PLATFORM_ADMIN', 'DATA_STEWARD'])(
      '%s NO lee las retenciones legales (nombran objetivos bajo litigio) → 403',
      async (rol) => {
        await get('/admin/governance/legal-holds', [rol]).expect(403);
      },
    );

    it('un rol de plataforma con X-Tenant-Id de una organización ajena → 403 (rige la membresía)', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/governance/domains')
        .set('Authorization', `Bearer ${token(['GOVERNANCE_ADMIN'])}`)
        .set('X-Tenant-Id', '00000000-0000-4000-8000-0000000000aa')
        .expect(403);
      expect(res.body.reason).toBe('TENANT_MEMBERSHIP_REQUIRED');
    });

    it('un DPO (sin alcance plataforma, asignado sin tenant) lee sin cabecera', async () => {
      await get('/admin/governance/domains', ['DPO']).expect(200);
    });

    it('SUPERADMIN (comodín) lee las tres', async () => {
      for (const ruta of RUTAS) await get(ruta, ['SUPERADMIN']).expect(200);
    });

    it('no hay verbos de escritura en estas rutas', async () => {
      for (const ruta of RUTAS)
        for (const verbo of ['post', 'put', 'patch', 'delete'] as const) {
          const res = await request(app.getHttpServer())
            [verbo](ruta)
            .set('Authorization', `Bearer ${token(['SECURITY_ADMIN'])}`);
          expect(res.status).toBe(404);
        }
    });
  });

  describe('GET /admin/governance/domains', () => {
    it('pagina con keyset por código e id y declara lo que no mide', async () => {
      repo.domains.mockResolvedValueOnce([dominio(1), dominio(2), dominio(3)]);
      const p1 = await get('/admin/governance/domains?limit=2', [
        'DATA_STEWARD',
      ]).expect(200);
      expect(p1.body.items).toHaveLength(2);
      expect(p1.body.items[0]).toMatchObject({
        code: 'dom1',
        ownerTeam: 'Datos',
        entityCount: 1,
        version: 1,
      });
      expect(p1.body.order).toBe('code, id');
      expect(p1.body.notMeasured[0].field).toBe('stewards');
      await get(
        `/admin/governance/domains?limit=2&cursor=${p1.body.nextCursor}`,
        ['DPO'],
      ).expect(200);
      expect(repo.domains.mock.calls[1][1].cursor).toEqual({
        c: 'dom2',
        i: dominio(2).id,
      });
    });

    it('un registro vacío es un hecho (notMeasured), no un error', async () => {
      const res = await get('/admin/governance/domains', ['DPO']).expect(200);
      expect(res.body.items).toEqual([]);
      expect(res.body.nextCursor).toBeNull();
      expect(res.body.notMeasured.map((n: any) => n.field)).toContain(
        'domains',
      );
    });

    it.each([
      ['un límite fuera de rango', '?limit=201'],
      ['un parámetro no declarado', '?tenantId=x'],
      ['un cursor corrupto', '?cursor=%25%25%25'],
      [
        'un cursor de otra forma',
        `?cursor=${Buffer.from('{"z":"1"}').toString('base64url')}`,
      ],
      ['una búsqueda demasiado larga', `?q=${'x'.repeat(121)}`],
    ])('%s → 400, nunca 500', async (_c, query) => {
      await get(`/admin/governance/domains${query}`, ['DPO']).expect(400);
      expect(repo.domains).not.toHaveBeenCalled();
    });
  });

  describe('GET /admin/governance/legal-holds', () => {
    it('pasa los filtros y nunca devuelve la referencia de la autoridad', async () => {
      repo.legalHolds.mockResolvedValueOnce([hold(1)]);
      const res = await get(
        `/admin/governance/legal-holds?status=ACTIVE&targetType=PATIENT_PROFILE&tenantId=${ID}&targetId=${ID}`,
        ['AUDITOR'],
      ).expect(200);
      expect(repo.legalHolds.mock.calls[0][1]).toMatchObject({
        status: 'ACTIVE',
        targetType: 'PATIENT_PROFILE',
        tenantId: ID,
        targetId: ID,
        limit: 50,
      });
      expect(res.body.items[0]).toMatchObject({
        hasAuthorityReference: true,
        status: 'ACTIVE',
      });
      expect(JSON.stringify(res.body)).not.toContain('Juan Pérez');
      expect(JSON.stringify(res.body)).not.toContain('authority_reference');
    });

    it('la segunda página parte de (updated_at, id) de la última fila', async () => {
      repo.legalHolds.mockResolvedValueOnce([hold(3), hold(2), hold(1)]);
      const p1 = await get('/admin/governance/legal-holds?limit=2', [
        'DPO',
      ]).expect(200);
      await get(
        `/admin/governance/legal-holds?limit=2&cursor=${p1.body.nextCursor}`,
        ['DPO'],
      ).expect(200);
      expect(repo.legalHolds.mock.calls[1][1].cursor).toEqual({
        t: hold(2).updated_at,
        i: hold(2).id,
      });
    });

    it.each([
      ['un uuid inválido', '?tenantId=abc'],
      ['un estado con caracteres de SQL', "?status=ACTIVE';--"],
      ['un parámetro no declarado', '?q=x'],
      ['un límite cero', '?limit=0'],
    ])('%s → 400', async (_c, query) => {
      await get(`/admin/governance/legal-holds${query}`, ['DPO']).expect(400);
      expect(repo.legalHolds).not.toHaveBeenCalled();
    });
  });

  describe('GET /admin/governance/retention-executions', () => {
    it('calcula la duración y no devuelve el texto del error', async () => {
      repo.retentionExecutions.mockResolvedValueOnce([
        ejecucion(1, { has_error: true, status: 'EXEC_FAILED' }),
      ]);
      const res = await get('/admin/governance/retention-executions', [
        'GOVERNANCE_ADMIN',
      ]).expect(200);
      expect(res.body.items[0]).toMatchObject({
        policy: { id: ID, code: 'RET-1' },
        entity: { id: ID, schemaName: 'audit', tableName: 'audit_log' },
        status: 'FAILED',
        durationMs: 2500,
        totals: { scanned: 100, deleted: 7, anonymized: 0, archived: 0 },
        hasError: true,
      });
      expect(JSON.stringify(res.body)).not.toContain('paciente@example.com');
    });

    it('una ejecución sin tiempos tiene duración null, no 0', async () => {
      repo.retentionExecutions.mockResolvedValueOnce([
        ejecucion(1, {
          started_at: null,
          finished_at: null,
          entity_registry_id: null,
        }),
      ]);
      const res = await get('/admin/governance/retention-executions', [
        'DPO',
      ]).expect(200);
      expect(res.body.items[0].durationMs).toBeNull();
      expect(res.body.items[0].entity).toBeNull();
    });

    it('filtra por política, estado y ventana', async () => {
      await get(
        `/admin/governance/retention-executions?policyId=${ID}&status=SUCCEEDED&from=2026-10-01T00:00:00Z&to=2026-10-02T00:00:00Z`,
        ['DPO'],
      ).expect(200);
      const f = repo.retentionExecutions.mock.calls[0][1];
      expect(f).toMatchObject({ policyId: ID, status: 'EXEC_SUCCEEDED' });
      expect(f.from).toEqual(new Date('2026-10-01T00:00:00Z'));
      expect(f.to).toEqual(new Date('2026-10-02T00:00:00Z'));
    });

    it.each([
      [
        'una ventana invertida',
        '?from=2026-10-02T00:00:00Z&to=2026-10-01T00:00:00Z',
      ],
      ['una fecha no ISO', '?from=ayer'],
      ['un uuid inválido', '?policyId=1'],
      ['un estado inventado', '?status=DONE'],
    ])('%s → 400', async (_c, query) => {
      await get(`/admin/governance/retention-executions${query}`, [
        'DPO',
      ]).expect(400);
      expect(repo.retentionExecutions).not.toHaveBeenCalled();
    });
  });
});
