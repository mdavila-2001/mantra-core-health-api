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
import { CONCEPTS } from '../../../common/constants/concepts';
import { AllExceptionsFilter } from '../../../common/filters/all-exceptions.filter';
import { RouteMetadataService } from '../../../observability/route-index/route-metadata.service';
import { TracingService } from '../../../observability';
import { AuditQueryRepository } from '../repositories/audit-query.repository';
import { AuditOversightReadService } from '../services/audit-oversight-read.service';
import { AuditQueryService } from '../services/audit-query.service';
import {
  AUDIT_READ_ROLES,
  AuditQueryController,
} from './audit-query.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ACTOR = '00000000-0000-4000-8000-0000000000aa';
const RECURSO = '00000000-0000-4000-8000-0000000000bb';

/**
 * `GET /audit/log` y `GET /audit/log/filter-catalog` con los guards reales (JWT y roles) y el mismo
 * `ValidationPipe` que `main.ts`. El repositorio es un DOBLE declarado: lo que se prueba acá es el
 * contrato HTTP (autorización, validación, forma de la respuesta y filtros que llegan a la
 * consulta); que el SQL corra contra PostgreSQL real no se prueba en esta suite.
 */
describe('AuditQueryController (HTTP, repositorio doble)', () => {
  let app: INestApplication;
  let tokens: TokenService;
  const repo = { auditLog: mockFn(async () => []), dataAccess: mockFn() };
  const rutas = { routesByAuditedAction: () => new Map() };

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
      controllers: [AuditQueryController],
      providers: [
        AuditQueryService,
        // Las lecturas agregadas y DSAR tienen su propia suite (audit-oversight.controller.spec.ts).
        { provide: AuditOversightReadService, useValue: {} },
        { provide: AuditQueryRepository, useValue: repo },
        { provide: RouteMetadataService, useValue: rutas },
        // El servicio sólo hace `em.fork()` y se lo pasa al repositorio doble.
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
    repo.auditLog.mockClear();
  });

  const RUTAS = ['/audit/log', '/audit/log/filter-catalog'];

  describe('matriz de autorización negativa', () => {
    it.each(RUTAS)('%s sin token → 401', async (ruta) => {
      await get(ruta).expect(401);
    });

    it.each(RUTAS)('%s con un rol clínico → 403', async (ruta) => {
      const res = await get(ruta, ['PATIENT', 'CLINICIAN']).expect(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it.each(['GOVERNANCE_ADMIN', 'PLATFORM_ADMIN', 'DATA_PLATFORM_ADMIN'])(
      'leer la bitácora no se hereda de un rol de gobierno: %s → 403',
      async (rol) => {
        await get('/audit/log', [rol]).expect(403);
        await get('/audit/log/filter-catalog', [rol]).expect(403);
      },
    );

    it.each(AUDIT_READ_ROLES)('el rol %s puede leer', async (rol) => {
      await get('/audit/log', [rol]).expect(200);
      await get('/audit/log/filter-catalog', [rol]).expect(200);
    });

    it('un token con la firma alterada es 401', async () => {
      const [h, p] = tokens.signAccessToken('u', 's', ['DPO']).split('.');
      await request(app.getHttpServer())
        .get('/audit/log')
        .set('Authorization', `Bearer ${h}.${p}.firma-falsa`)
        .expect(401);
    });
  });

  describe('filtros: actor, recurso, acción y fecha', () => {
    it('pasa actor, recurso, acción, entidad y rango a la consulta', async () => {
      await get(
        `/audit/log?userId=${ACTOR}&entity=catalog_annotation&entityId=${RECURSO}` +
          '&action=CATALOG_ANNOTATION_SAVED&result=SUCCESS' +
          '&from=2026-10-01T00:00:00.000Z&to=2026-10-02T00:00:00.000Z&limit=10',
        ['AUDITOR'],
      ).expect(200);
      const filtro = repo.auditLog.mock.calls[0][1];
      expect(filtro).toMatchObject({
        userId: ACTOR,
        entity: 'catalog_annotation',
        entityId: RECURSO,
        action: 'CATALOG_ANNOTATION_SAVED',
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        limit: 10,
      });
      expect(filtro.from.toISOString()).toBe('2026-10-01T00:00:00.000Z');
      expect(filtro.to.toISOString()).toBe('2026-10-02T00:00:00.000Z');
    });

    it('la respuesta es paginada y no trae más campos que los del contrato', async () => {
      repo.auditLog.mockImplementationOnce(async () => [
        {
          id: '00000000-0000-4000-8000-000000000010',
          user_id: ACTOR,
          tenant_id: null,
          action: 'HTTP POST /audit/events',
          entity: 'audit',
          entity_id: RECURSO,
          outcome_concept_id: CONCEPTS.OUTCOME_SUCCESS,
          ip: '10.0.0.1',
          recorded_at: '2026-10-24T11:00:00.000000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000009',
          user_id: ACTOR,
          tenant_id: null,
          action: 'HTTP POST /audit/events',
          entity: 'audit',
          entity_id: null,
          outcome_concept_id: CONCEPTS.OUTCOME_FAILURE,
          ip: null,
          recorded_at: '2026-10-24T10:00:00.000000Z',
        },
      ]);
      const res = await get('/audit/log?limit=1', ['DPO']).expect(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.limit).toBe(1);
      expect(typeof res.body.nextCursor).toBe('string');
      expect(Object.keys(res.body.items[0]).sort()).toEqual(
        [
          'action',
          'entity',
          'entityId',
          'healthRisk',
          'id',
          'ip',
          'method',
          'recordedAt',
          'result',
          'route',
          'tenantId',
          'userId',
        ].sort(),
      );
    });
  });

  describe('entrada inválida → error del contrato, nunca 500', () => {
    it.each([
      ['un entityId que no es uuid', '/audit/log?entityId=no-es-uuid'],
      ['un userId que no es uuid', '/audit/log?userId=1234'],
      ['una fecha que no es ISO 8601', '/audit/log?from=ayer'],
      ['un límite mayor al tope', '/audit/log?limit=201'],
      ['un límite cero', '/audit/log?limit=0'],
      ['un resultado inventado', '/audit/log?result=MAYBE'],
      ['un verbo que no muta', '/audit/log?method=GET'],
      ['un filtro no declarado (requestId)', '/audit/log?requestId=abc'],
      ['un orden que no existe', '/audit/log?sort=asc'],
      ['un cursor corrupto', '/audit/log?cursor=%25%25%25'],
    ])('%s → 400', async (_caso, ruta) => {
      await get(ruta, ['AUDITOR']).expect(400);
      expect(repo.auditLog).not.toHaveBeenCalled();
    });

    it('una ventana invertida o vacía → 400', async () => {
      await get(
        '/audit/log?from=2026-10-02T00:00:00.000Z&to=2026-10-01T00:00:00.000Z',
        ['AUDITOR'],
      ).expect(400);
      await get(
        '/audit/log?from=2026-10-02T00:00:00.000Z&to=2026-10-02T00:00:00.000Z',
        ['AUDITOR'],
      ).expect(400);
      expect(repo.auditLog).not.toHaveBeenCalled();
    });
  });

  describe('GET /audit/log/filter-catalog', () => {
    it('declara los filtros, los límites y lo que no se mide', async () => {
      const res = await get('/audit/log/filter-catalog', ['DPO']).expect(200);
      const nombres = res.body.filters.map((f: { name: string }) => f.name);
      expect(nombres).toEqual(
        expect.arrayContaining([
          'userId',
          'entity',
          'entityId',
          'action',
          'from',
          'to',
        ]),
      );
      expect(res.body).toMatchObject({
        defaultWindowDays: 30,
        defaultPageSize: 50,
        maxPageSize: 200,
        order: 'recorded_at desc, id desc',
      });
      expect(
        res.body.notMeasured.map((n: { field: string }) => n.field),
      ).toEqual(['requestId', 'correlationId']);
      expect(repo.auditLog).not.toHaveBeenCalled();
    });

    it('cada filtro del catálogo es uno que la consulta acepta', async () => {
      const res = await get('/audit/log/filter-catalog', ['DPO']).expect(200);
      const ejemplo: Record<string, string> = {
        userId: ACTOR,
        tenantId: ACTOR,
        entity: 'x',
        entityId: RECURSO,
        action: 'X',
        method: 'POST',
        route: '/x',
        result: 'FAILURE',
        from: '2026-10-01T00:00:00.000Z',
        to: '2026-10-02T00:00:00.000Z',
      };
      for (const f of res.body.filters as { name: string }[]) {
        expect(ejemplo[f.name]).toBeDefined();
        await get(
          `/audit/log?${f.name}=${encodeURIComponent(ejemplo[f.name])}`,
          ['AUDITOR'],
        ).expect(200);
      }
    });
  });
});
