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
import { TokenService } from '../../../common/auth/token.service';
import { AllExceptionsFilter } from '../../../common/filters/all-exceptions.filter';
import { TracingService } from '../../../observability';
import { GovernanceReadRepository } from '../repositories/governance-read.repository';
import { GovernanceReadService } from '../services/governance-read.service';
import {
  GOVERNANCE_READ_ROLES,
  GovernanceReadController,
} from './governance-read.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ID = '00000000-0000-4000-8000-0000000000a1';
const OTRO = '00000000-0000-4000-8000-0000000000b2';

const fila = (n: number, extra: Record<string, unknown> = {}) => ({
  policy_type: 'WRITE',
  id: `00000000-0000-4000-8000-00000000010${n}`,
  code: `p${n}`,
  name: `Política ${n}`,
  state: 'ACTIVE',
  row_version: 1,
  updated_at: `2026-10-0${n}T00:00:00.000000Z`,
  ...extra,
});

/**
 * Las lecturas de gobierno de `admin/governance` con los guards reales (JWT y roles) y el mismo
 * `ValidationPipe` que `main.ts`. El repositorio es un DOBLE declarado: el SQL contra PostgreSQL
 * real no se ejerce en esta suite.
 */
describe('GovernanceReadController (HTTP, repositorio doble)', () => {
  let app: INestApplication;
  let tokens: TokenService;
  const repo: Record<string, any> = {
    policies: mockFn(async () => []),
    policyDetail: mockFn(async () => null),
    appliedTo: mockFn(async () => []),
    changeLog: mockFn(async () => []),
    entityRegistry: mockFn(async () => []),
    entityExists: mockFn(async () => true),
    fieldRegistry: mockFn(async () => []),
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
      controllers: [GovernanceReadController],
      providers: [
        GovernanceReadService,
        { provide: GovernanceReadRepository, useValue: repo },
        { provide: EntityManager, useValue: { fork: () => ({}) } },
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
    '/admin/governance/policies',
    `/admin/governance/policies/WRITE/${ID}`,
    '/admin/governance/change-log',
    '/admin/governance/entity-registry',
    `/admin/governance/entity-registry/${ID}/fields`,
  ];

  describe('matriz de autorización negativa', () => {
    it.each(RUTAS)('%s sin token → 401', async (ruta) => {
      await get(ruta).expect(401);
    });

    it.each(RUTAS)('%s con un rol clínico → 403', async (ruta) => {
      const res = await get(ruta, ['PATIENT', 'CLINICIAN']).expect(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it.each(['PHARMACIST', 'MEDICAL_DIRECTOR', 'QA_ADMIN'])(
      'un rol ajeno al gobierno de datos (%s) → 403',
      async (rol) => {
        for (const ruta of RUTAS) await get(ruta, [rol]).expect(403);
      },
    );

    // Matriz §3.12 (D-2): el auditor y el custodio leen políticas y bitácora en sólo lectura.
    it.each(['AUDITOR', 'DATA_STEWARD'])(
      'el rol %s lee el gobierno (matriz de roles §3.12)',
      async (rol) => {
        await get('/admin/governance/policies', [rol]).expect(200);
        await get('/admin/governance/change-log', [rol]).expect(200);
      },
    );

    it('nada llega a la base antes de autorizar', async () => {
      for (const ruta of RUTAS) await get(ruta, ['PATIENT']).expect(403);
      for (const f of Object.values(repo)) expect(f).not.toHaveBeenCalled();
    });

    it.each(GOVERNANCE_READ_ROLES)('el rol %s puede leer', async (rol) => {
      repo.policyDetail.mockResolvedValueOnce(null);
      for (const ruta of RUTAS.filter((r) => !r.includes(`/WRITE/${ID}`)))
        await get(ruta, [rol]).expect(200);
      // el detalle de una política inexistente es 404, no 403
      await get(`/admin/governance/policies/WRITE/${ID}`, [rol]).expect(404);
    });

    it('no hay verbos de escritura en estas rutas de lectura', async () => {
      for (const ruta of [
        '/admin/governance/policies',
        '/admin/governance/change-log',
      ])
        for (const verbo of ['post', 'put', 'patch', 'delete'] as const) {
          const res = await request(app.getHttpServer())
            [verbo](ruta)
            .set('Authorization', `Bearer ${token(['SECURITY_ADMIN'])}`);
          expect(res.status).toBe(404);
        }
    });
  });

  describe('GET /admin/governance/policies', () => {
    it('lista paginada con código de estado, sin ids de concepto', async () => {
      repo.policies.mockResolvedValueOnce([fila(1), fila(2), fila(3)]);
      const res = await get('/admin/governance/policies?limit=2', [
        'DPO',
      ]).expect(200);
      expect(res.body.items).toHaveLength(2);
      expect(typeof res.body.nextCursor).toBe('string');
      expect(Object.keys(res.body.items[0]).sort()).toEqual(
        [
          'code',
          'id',
          'name',
          'policyType',
          'state',
          'updatedAt',
          'version',
        ].sort(),
      );
      expect(res.body).toMatchObject({ limit: 2, sort: 'code', order: 'asc' });
    });

    it('la segunda página continúa desde la clave de la primera', async () => {
      repo.policies.mockResolvedValueOnce([fila(1), fila(2), fila(3)]);
      const p1 = await get('/admin/governance/policies?limit=2', [
        'DPO',
      ]).expect(200);
      await get(
        `/admin/governance/policies?limit=2&cursor=${p1.body.nextCursor}`,
        ['DPO'],
      ).expect(200);
      expect(repo.policies.mock.calls[1][1].cursor).toEqual({
        k: 'p2',
        t: 'WRITE',
        i: '00000000-0000-4000-8000-000000000102',
      });
    });

    it('un cursor emitido para otro orden → 400 (no salta filas en silencio)', async () => {
      repo.policies.mockResolvedValueOnce([fila(1), fila(2)]);
      const p1 = await get('/admin/governance/policies?limit=1', [
        'DPO',
      ]).expect(200);
      await get(
        `/admin/governance/policies?limit=1&sort=updatedAt&cursor=${p1.body.nextCursor}`,
        ['DPO'],
      ).expect(400);
      await get(
        `/admin/governance/policies?limit=1&order=desc&cursor=${p1.body.nextCursor}`,
        ['DPO'],
      ).expect(400);
    });

    it.each([
      ['un tipo inventado', '?type=BACKUP'],
      ['un orden fuera de la lista blanca', '?sort=password'],
      ['un sentido inválido', '?order=up'],
      ['un estado con caracteres de SQL', "?state=ACTIVE';--"],
      ['un límite fuera de rango', '?limit=201'],
      ['un límite cero', '?limit=0'],
      ['un parámetro no declarado', '?tenantId=x'],
      ['un cursor corrupto', '?cursor=%25%25%25'],
      ['una búsqueda demasiado larga', `?q=${'x'.repeat(121)}`],
    ])('%s → 400, nunca 500', async (_caso, query) => {
      await get(`/admin/governance/policies${query}`, ['DPO']).expect(400);
      expect(repo.policies).not.toHaveBeenCalled();
    });
  });

  describe('GET /admin/governance/policies/:policyType/:id', () => {
    it('devuelve ajustes por código y dónde se aplica, acotado', async () => {
      repo.policyDetail.mockResolvedValueOnce({
        ...fila(1, { policy_type: 'ANONYMIZATION', name: null, state: null }),
        created_at: '2026-10-01T00:00:00.000000Z',
        created_by_user_id: OTRO,
        updated_by_user_id: null,
        settings: {
          technique: 'HASH',
          description: 'x',
          parameterKeys: ['salt'],
        },
      });
      repo.appliedTo.mockResolvedValueOnce(
        [1, 2].map((n) => ({
          schema_name: 'iam',
          table_name: 'users',
          column_name: `c${n}`,
          total: 120,
        })),
      );
      const res = await get(`/admin/governance/policies/ANONYMIZATION/${ID}`, [
        'GOVERNANCE_ADMIN',
      ]).expect(200);
      expect(res.body.settings.parameterKeys).toEqual(['salt']);
      expect(res.body.appliedTo).toMatchObject({ total: 120, truncated: true });
      expect(res.body.appliedTo.items).toHaveLength(2);
      expect(JSON.stringify(res.body)).not.toMatch(/parameters_json|snapshot/);
    });

    it('una política que existe en otro tipo no se encuentra bajo éste → 404', async () => {
      await get(`/admin/governance/policies/RETENTION/${ID}`, ['DPO']).expect(
        404,
      );
      expect(repo.policyDetail.mock.calls[0].slice(1)).toEqual([
        'RETENTION',
        ID,
      ]);
    });

    it.each([
      ['un tipo inventado', `/admin/governance/policies/BACKUP/${ID}`],
      ['un id que no es uuid', '/admin/governance/policies/WRITE/123'],
      [
        'un id con caracteres de SQL',
        "/admin/governance/policies/WRITE/1'%20or%20'1'='1",
      ],
    ])('%s → 400', async (_caso, ruta) => {
      await get(ruta, ['DPO']).expect(400);
      expect(repo.policyDetail).not.toHaveBeenCalled();
    });
  });

  describe('GET /admin/governance/change-log', () => {
    it('sin rango mira los últimos 30 días y filtra por objeto y actor', async () => {
      await get(
        `/admin/governance/change-log?targetType=write_policies&targetId=${ID}&changedBy=${OTRO}`,
        ['SECURITY_ADMIN'],
      ).expect(200);
      const f = repo.changeLog.mock.calls[0][1];
      expect(f).toMatchObject({
        targetType: 'write_policies',
        targetId: ID,
        changedBy: OTRO,
      });
      const dias = (Date.now() - f.from.getTime()) / 86_400_000;
      expect(dias).toBeGreaterThan(29.9);
      expect(dias).toBeLessThan(30.1);
    });

    it('la respuesta no trae snapshots y marca la acción desconocida en vez de inventarla', async () => {
      repo.changeLog.mockResolvedValueOnce([
        {
          id: ID,
          target_type: 'entity_registry',
          target_id: OTRO,
          action: null,
          changed_by_user_id: OTRO,
          reason: 'alta',
          recorded_at: '2026-10-24T11:00:00.000000Z',
          new_snapshot_json: { secreto: 1 },
        },
      ]);
      const res = await get('/admin/governance/change-log', ['DPO']).expect(
        200,
      );
      expect(res.body.items[0].action).toBe('UNKNOWN');
      expect(JSON.stringify(res.body)).not.toContain('secreto');
    });

    it.each([
      [
        'una ventana invertida',
        '?from=2026-10-02T00:00:00Z&to=2026-10-01T00:00:00Z',
      ],
      [
        'una ventana vacía',
        '?from=2026-10-02T00:00:00Z&to=2026-10-02T00:00:00Z',
      ],
      ['una fecha que no es ISO 8601', '?from=ayer'],
      ['un actor que no es uuid', '?changedBy=1234'],
      ['un objeto que no es uuid', '?targetId=1234'],
      ['un tipo de objeto con caracteres de SQL', "?targetType=a';--"],
      ['un límite fuera de rango', '?limit=999'],
      ['un cursor corrupto', '?cursor=%25%25%25'],
      ['un parámetro no declarado', '?requestId=abc'],
    ])('%s → 400, nunca 500', async (_caso, query) => {
      await get(`/admin/governance/change-log${query}`, ['DPO']).expect(400);
      expect(repo.changeLog).not.toHaveBeenCalled();
    });
  });

  describe('registro de entidades y campos', () => {
    it('un registro vacío se declara en notMeasured, no se inventa', async () => {
      const res = await get('/admin/governance/entity-registry', [
        'DPO',
      ]).expect(200);
      expect(res.body.items).toEqual([]);
      expect(res.body.notMeasured[0].field).toBe('entityRegistry');
    });

    it('con un filtro, una lista vacía es un resultado y no un registro vacío', async () => {
      const res = await get('/admin/governance/entity-registry?schema=iam', [
        'DPO',
      ]).expect(200);
      expect(res.body.notMeasured).toEqual([]);
    });

    it('los booleanos se leen del texto: `false` no es verdadero', async () => {
      await get(
        '/admin/governance/entity-registry?containsPii=false&containsPhi=true',
        ['DPO'],
      ).expect(200);
      expect(repo.entityRegistry.mock.calls[0][1]).toMatchObject({
        containsPii: false,
        containsPhi: true,
      });
    });

    it('los campos de una entidad inexistente → 404 sin consultar los campos', async () => {
      repo.entityExists.mockResolvedValueOnce(false);
      await get(`/admin/governance/entity-registry/${ID}/fields`, [
        'DPO',
      ]).expect(404);
      expect(repo.fieldRegistry).not.toHaveBeenCalled();
    });

    it('los campos no exponen notas libres aunque la fila las traiga', async () => {
      repo.fieldRegistry.mockResolvedValueOnce([
        {
          id: ID,
          column_name: 'email',
          classification: 'PHI',
          is_pii: true,
          is_phi: false,
          masking_strategy: 'MASK_PARTIAL',
          anonymization_rule_code: null,
          notes: 'nota con datos de una persona',
        },
      ]);
      const res = await get(`/admin/governance/entity-registry/${ID}/fields`, [
        'DPO',
      ]).expect(200);
      expect(JSON.stringify(res.body)).not.toContain('nota con datos');
      expect(res.body.items[0]).toMatchObject({
        columnName: 'email',
        isPii: true,
      });
    });

    it.each([
      [
        'un schema con caracteres de SQL',
        '/admin/governance/entity-registry?schema=a%20b',
      ],
      ['un dominio inválido', "/admin/governance/entity-registry?domain=a';--"],
      [
        'un booleano inválido',
        '/admin/governance/entity-registry?containsPii=quizas',
      ],
      [
        'un cursor corrupto',
        '/admin/governance/entity-registry?cursor=%25%25%25',
      ],
      [
        'un id de entidad que no es uuid',
        '/admin/governance/entity-registry/123/fields',
      ],
      [
        'un límite fuera de rango',
        `/admin/governance/entity-registry/${ID}/fields?limit=0`,
      ],
    ])('%s → 400, nunca 500', async (_caso, ruta) => {
      await get(ruta, ['DPO']).expect(400);
      expect(repo.entityRegistry).not.toHaveBeenCalled();
      expect(repo.fieldRegistry).not.toHaveBeenCalled();
    });
  });
});
