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
import { TokenService } from '../../../../common/auth/token.service';
import { AllExceptionsFilter } from '../../../../common/filters/all-exceptions.filter';
import { TracingService } from '../../../../observability';
import { CatalogClassificationService } from '../../application/catalog-classification.service';
import { CatalogGovernanceService } from '../../application/catalog-governance.service';
import { CatalogInsightsService } from '../../application/catalog-insights.service';
import { CatalogReadService } from '../../application/catalog-read.service';
import { CatalogScanService } from '../../application/catalog-scan.service';
import { PermissionDriftService } from '../../application/permission-drift.service';
import { PORTAL_READ_ROLES } from '../../data_catalog.constants';
import { CatalogInsightsRepository } from '../../infrastructure/repositories/catalog-insights.repository';
import { AdminCatalogController } from './admin-catalog.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * Las lecturas de gobierno de `/admin/catalog` (datos personales y calidad del catálogo) con los
 * guards reales (JWT y roles) y el mismo `ValidationPipe` que `main.ts`. El repositorio es un DOBLE
 * declarado: lo que se prueba es el contrato HTTP; el SQL contra PostgreSQL real no se ejerce acá.
 */
describe('AdminCatalogController · gobierno de datos (HTTP, repositorio doble)', () => {
  let app: INestApplication;
  let tokens: TokenService;
  const repo: Record<string, any> = {
    piiColumns: mockFn(async () => []),
    piiBySensitivity: mockFn(async () => []),
    piiTotals: mockFn(async () => ({
      observed_columns: 10,
      classified_columns: 4,
      personal_columns: 2,
      objects_with_personal: 1,
    })),
    registryTotals: mockFn(async () => ({
      entities: 0,
      entities_personal: 0,
      fields: 0,
      fields_personal: 0,
    })),
    piiReconciliation: mockFn(async () => []),
    piiReconciliationCounts: mockFn(async () => []),
    piiReconciliationTotals: mockFn(async () => ({
      approved_personal: 3,
      declared_fields: 0,
      observed_objects: 2,
    })),
    qualityIssues: mockFn(async () => []),
    qualityCounts: mockFn(async () => []),
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
      controllers: [AdminCatalogController],
      providers: [
        CatalogInsightsService,
        { provide: CatalogInsightsRepository, useValue: repo },
        { provide: EntityManager, useValue: { fork: () => ({}) } },
        // Las demás dependencias del controlador no participan en estas rutas.
        { provide: CatalogReadService, useValue: {} },
        { provide: CatalogGovernanceService, useValue: {} },
        { provide: CatalogScanService, useValue: {} },
        { provide: CatalogClassificationService, useValue: {} },
        { provide: PermissionDriftService, useValue: {} },
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
    '/admin/catalog/pii/summary',
    '/admin/catalog/pii/columns',
    '/admin/catalog/pii/reconciliation',
    '/admin/catalog/quality/rules',
    '/admin/catalog/quality/issues',
  ];

  describe('matriz de autorización negativa', () => {
    it.each(RUTAS)('%s sin token → 401', async (ruta) => {
      await get(ruta).expect(401);
    });

    it.each(RUTAS)('%s con un rol clínico → 403', async (ruta) => {
      const res = await get(ruta, ['PATIENT', 'CLINICIAN']).expect(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it.each(RUTAS)('%s con un rol de otro dominio → 403', async (ruta) => {
      await get(ruta, ['PHARMACIST']).expect(403);
    });

    it.each(PORTAL_READ_ROLES)('el rol %s puede leer', async (rol) => {
      for (const ruta of RUTAS) await get(ruta, [rol]).expect(200);
    });

    it('ninguna ruta se ejecuta antes de autorizar', async () => {
      await get('/admin/catalog/pii/columns', ['PATIENT']).expect(403);
      await get('/admin/catalog/quality/issues').expect(401);
      expect(repo.piiColumns).not.toHaveBeenCalled();
      expect(repo.qualityIssues).not.toHaveBeenCalled();
    });
  });

  describe('GET /admin/catalog/pii/columns', () => {
    it('pasa los filtros a la consulta con la escala y el orden pedidos', async () => {
      await get(
        '/admin/catalog/pii/columns?schema=iam&minSensitivity=PSEUDONYMIZED&sensitivity=CREDENTIAL' +
          '&reviewStatus=NEEDS_REVIEW&q=email&sort=sensitivity&limit=5',
        ['DPO'],
      ).expect(200);
      expect(repo.piiColumns.mock.calls[0][1]).toMatchObject({
        schema: 'iam',
        minRank: 4,
        sensitivity: 'CREDENTIAL',
        reviewStatus: 'NEEDS_REVIEW',
        q: 'email',
        sort: 'sensitivity',
        limit: 5,
      });
    });

    it('la respuesta no contiene valores de datos ni texto de fichas', async () => {
      repo.piiColumns.mockResolvedValueOnce([
        {
          column_id: '00000000-0000-4000-8000-0000000000c1',
          object_id: '00000000-0000-4000-8000-0000000000a1',
          schema_name: 'iam',
          object_name: 'users',
          column_name: 'email',
          native_type: 'varchar',
          sensitivity: 'PHI_IDENTIFIER',
          review_status: 'APPROVED',
          origin: 'MANUAL',
          approved: true,
          registry_marks_personal: true,
          rk: -6,
          sample_value: 'paciente@example.com',
          definition: 'texto libre de la ficha',
        },
      ]);
      const res = await get('/admin/catalog/pii/columns', ['AUDITOR']).expect(
        200,
      );
      const texto = JSON.stringify(res.body);
      expect(texto).not.toContain('paciente@example.com');
      expect(texto).not.toContain('texto libre de la ficha');
      expect(res.body.items[0]).toMatchObject({
        columnName: 'email',
        sensitivity: 'PHI_IDENTIFIER',
        approved: true,
        registryMarksPersonal: true,
      });
    });

    it.each([
      ['un nivel inventado', '?minSensitivity=ULTRA'],
      ['UNKNOWN como mínimo', '?minSensitivity=UNKNOWN'],
      ['un orden fuera de la lista blanca', '?sort=column_name;drop'],
      ['un orden con sentido contrario', '?sort=-name'],
      ['un estado de revisión inventado', '?reviewStatus=MAYBE'],
      ['un schema con caracteres de SQL', "?schema=iam'--"],
      ['un límite fuera de rango', '?limit=201'],
      ['un límite cero', '?limit=0'],
      ['un parámetro no declarado', '?values=true'],
      ['un cursor corrupto', '?cursor=%25%25%25'],
      ['un búsqueda demasiado larga', `?q=${'x'.repeat(121)}`],
    ])('%s → 400, nunca 500', async (_caso, query) => {
      await get(`/admin/catalog/pii/columns${query}`, ['DPO']).expect(400);
      expect(repo.piiColumns).not.toHaveBeenCalled();
    });

    it('un cursor de otro orden → 400', async () => {
      repo.piiColumns.mockResolvedValueOnce(
        [1, 2].map((n) => ({
          column_id: String(n),
          object_id: 'o',
          schema_name: 'iam',
          object_name: 'users',
          column_name: `c${n}`,
          native_type: 'text',
          sensitivity: 'PERSONAL',
          review_status: 'AUTO_DETECTED',
          origin: 'AUTO_CLASSIFIER',
          approved: false,
          registry_marks_personal: null,
          rk: -5,
        })),
      );
      const p1 = await get('/admin/catalog/pii/columns?limit=1&sort=name', [
        'DPO',
      ]).expect(200);
      await get(
        `/admin/catalog/pii/columns?sort=sensitivity&cursor=${p1.body.nextCursor}`,
        ['DPO'],
      ).expect(400);
    });
  });

  describe('GET /admin/catalog/pii/summary', () => {
    it('declara en notMeasured un registro de campos vacío en vez de inventar cifras', async () => {
      const res = await get('/admin/catalog/pii/summary', [
        'GOVERNANCE_ADMIN',
      ]).expect(200);
      expect(res.body.declaredRegistry.fields).toBe(0);
      expect(
        res.body.notMeasured.map((n: { field: string }) => n.field),
      ).toContain('declaredRegistry.fields');
    });
  });

  describe('GET /admin/catalog/quality/*', () => {
    it('las reglas listan sus incidencias abiertas', async () => {
      repo.qualityCounts.mockResolvedValueOnce([
        { rule_code: 'CAT-PII-UNREVIEWED', severity: 'HIGH', issues: 2 },
      ]);
      const res = await get('/admin/catalog/quality/rules', [
        'DATA_STEWARD',
      ]).expect(200);
      expect(res.body.rules).toHaveLength(4);
      expect(
        res.body.rules.find(
          (r: { code: string }) => r.code === 'CAT-PII-UNREVIEWED',
        ).openIssues,
      ).toBe(2);
    });

    it('las incidencias se declaran derivadas, sin acción de cierre', async () => {
      const res = await get(
        '/admin/catalog/quality/issues?rule=CAT-PII-UNREVIEWED&severity=HIGH&schema=iam&limit=10',
        ['SECURITY_ADMIN'],
      ).expect(200);
      expect(res.body.derived).toBe(true);
      expect(res.body.summary.total).toBe(0);
      expect(repo.qualityIssues.mock.calls[0][1]).toMatchObject({
        rule: 'CAT-PII-UNREVIEWED',
        severity: 'HIGH',
        schema: 'iam',
        limit: 10,
      });
    });

    it('no hay verbos de escritura sobre estas rutas', async () => {
      const token_ = token(['GOVERNANCE_ADMIN']);
      for (const ruta of RUTAS)
        for (const verbo of ['post', 'put', 'patch', 'delete'] as const)
          await request(app.getHttpServer())
            [verbo](ruta)
            .set('Authorization', `Bearer ${token_}`)
            .expect(404);
    });

    it.each([
      ['una regla inventada', '?rule=CAT-INVENTADA'],
      ['una severidad inventada', '?severity=CRITICAL'],
      ['un schema con caracteres de SQL', '?schema=a%20b'],
      ['un límite fuera de rango', '?limit=500'],
      ['un cursor corrupto', '?cursor=%25%25%25'],
      ['un parámetro no declarado', '?status=OPEN'],
    ])('%s → 400, nunca 500', async (_caso, query) => {
      await get(`/admin/catalog/quality/issues${query}`, ['DPO']).expect(400);
      expect(repo.qualityIssues).not.toHaveBeenCalled();
    });
  });

  describe('GET /admin/catalog/pii/reconciliation', () => {
    const fila = (n: number, kind = 'MISSING_IN_REGISTRY') => ({
      kind,
      schema_name: 'iam',
      object_name: 'users',
      column_name: `c${n}`,
      object_id: kind === 'ORPHAN_IN_REGISTRY' ? null : 'o1',
      column_id: kind === 'ORPHAN_IN_REGISTRY' ? null : `c${n}`,
      sensitivity: kind === 'ORPHAN_IN_REGISTRY' ? null : 'PERSONAL',
      review_status: kind === 'ORPHAN_IN_REGISTRY' ? null : 'APPROVED',
      entity_registry_id: null,
      field_registry_id: null,
    });

    it('con el registro vacío lo declara en notMeasured y cuenta por clase', async () => {
      repo.piiReconciliation.mockResolvedValueOnce([fila(1), fila(2)]);
      repo.piiReconciliationCounts.mockResolvedValueOnce([
        { kind: 'MISSING_IN_REGISTRY', total: 3 },
      ]);
      const res = await get('/admin/catalog/pii/reconciliation', [
        'DPO',
      ]).expect(200);
      expect(res.body.summary).toEqual({
        approvedPersonalColumns: 3,
        declaredFields: 0,
        registryEmpty: true,
        byKind: {
          MISSING_IN_REGISTRY: 3,
          REGISTRY_DISAGREES: 0,
          ORPHAN_IN_REGISTRY: 0,
        },
        total: 3,
      });
      const campos = res.body.notMeasured.map(
        (n: { field: string }) => n.field,
      );
      expect(campos).toEqual(['declaredRegistry.fields', 'unapprovedColumns']);
      expect(res.body.items[0]).toMatchObject({
        kind: 'MISSING_IN_REGISTRY',
        columnName: 'c1',
      });
    });

    it('sin escaneo declara catalog y no inventa huérfanos', async () => {
      repo.piiReconciliationTotals.mockResolvedValueOnce({
        approved_personal: 0,
        declared_fields: 4,
        observed_objects: 0,
      });
      const res = await get('/admin/catalog/pii/reconciliation', [
        'AUDITOR',
      ]).expect(200);
      expect(res.body.notMeasured[0].field).toBe('catalog');
      expect(res.body.summary.registryEmpty).toBe(false);
    });

    it('pagina por (schema, objeto, columna, clase) y pasa los filtros', async () => {
      repo.piiReconciliation.mockResolvedValueOnce([fila(1), fila(2), fila(3)]);
      const p1 = await get(
        '/admin/catalog/pii/reconciliation?limit=2&kind=MISSING_IN_REGISTRY&schema=iam',
        ['DPO'],
      ).expect(200);
      expect(repo.piiReconciliation.mock.calls[0][1]).toMatchObject({
        kind: 'MISSING_IN_REGISTRY',
        schema: 'iam',
        limit: 2,
      });
      await get(
        `/admin/catalog/pii/reconciliation?limit=2&cursor=${p1.body.nextCursor}`,
        ['DPO'],
      ).expect(200);
      expect(repo.piiReconciliation.mock.calls[1][1].cursor).toEqual({
        s: 'iam',
        o: 'users',
        c: 'c2',
        k: 'MISSING_IN_REGISTRY',
      });
    });

    it.each([
      ['una clase inventada', '?kind=ALL'],
      ['un schema con SQL', "?schema=iam'--"],
      ['un límite fuera de rango', '?limit=201'],
      ['un cursor corrupto', '?cursor=%25%25'],
      ['un parámetro no declarado', '?q=email'],
    ])('%s → 400, nunca 500', async (_c, query) => {
      await get(`/admin/catalog/pii/reconciliation${query}`, ['DPO']).expect(
        400,
      );
      expect(repo.piiReconciliation).not.toHaveBeenCalled();
    });
  });
});
