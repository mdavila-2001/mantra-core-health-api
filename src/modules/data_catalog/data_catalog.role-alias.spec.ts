import { jest } from '@jest/globals';
import { EntityManager } from '@mikro-orm/postgresql';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import { AuthTokenModule } from '../../common/auth/auth-token.module';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { JwtStrategy } from '../../common/auth/jwt.strategy';
import { RolesGuard } from '../../common/auth/roles.guard';
import { SessionValidator } from '../../common/auth/session-validator';
import { TenantScopeGuard } from '../../common/auth/tenant-scope.guard';
import { TokenService } from '../../common/auth/token.service';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { TracingService } from '../../observability';
import { CrossStoreAdminController } from '../cross_store_consistency/controllers/cross-store-admin.controller';
import {
  DeletionService,
  ProjectionDeliveryService,
  ReconciliationService,
  StorageMaintenanceService,
} from '../cross_store_consistency/services';
import { GovernanceReadController } from '../system_ops/controllers/governance-read.controller';
import { GovernanceReadRepository } from '../system_ops/repositories/governance-read.repository';
import { GovernanceReadService } from '../system_ops/services/governance-read.service';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/auth/roles.decorator';
import { GraphQueryController } from '../graph_intelligence/controllers/graph-query.controller';
import { StorageGovernanceController } from '../polyglot_storage/controllers/storage-governance.controller';
import { WorkflowDefinitionsController } from '../workflow/controllers/workflow-definitions.controller';
import { DATA_CATALOG_ROLE_SEED } from './data_catalog.roles';
import { AuthzGrantsService } from '../authz/services/authz-grants.service';
import { AUTHZ } from '../authz/authz.concepts';
import { PreconditionFailedException } from '../../common';
import { AdminCatalogController } from './presentation/controllers/admin-catalog.controller';
import { CatalogInsightsService } from './application/catalog-insights.service';
import { CatalogClassificationService } from './application/catalog-classification.service';
import { CatalogGovernanceService } from './application/catalog-governance.service';
import { CatalogReadService } from './application/catalog-read.service';
import { CatalogScanService } from './application/catalog-scan.service';
import { PermissionDriftService } from './application/permission-drift.service';
import { CatalogInsightsRepository } from './infrastructure/repositories/catalog-insights.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * Decisión X-6: `GOVERNANCE_ADMIN` (data_catalog) y `DATA_GOVERNANCE_ADMIN` (authz, exigido por
 * cross_store_consistency) autorizan lo mismo. Controladores REALES de ambos módulos con los guards
 * reales; los servicios son dobles porque lo que se prueba es la puerta.
 */
describe('alias GOVERNANCE_ADMIN = DATA_GOVERNANCE_ADMIN en rutas de ambos módulos', () => {
  let app: INestApplication;
  let tokens: TokenService;
  const repoCatalogo: Record<string, any> = {
    piiBySensitivity: mockFn(async () => []),
    piiTotals: mockFn(async () => ({
      observed_columns: 0,
      classified_columns: 0,
      personal_columns: 0,
      objects_with_personal: 0,
    })),
    registryTotals: mockFn(async () => ({
      entities: 0,
      entities_personal: 0,
      fields: 0,
      fields_personal: 0,
    })),
  };
  const repoGobierno: Record<string, any> = {
    policies: mockFn(async () => []),
  };

  const token = (roles: string[]): string =>
    tokens.signAccessToken('00000000-0000-4000-8000-000000000001', 's1', roles);
  const get = (ruta: string, roles: string[]) =>
    request(app.getHttpServer())
      .get(ruta)
      .set('Authorization', `Bearer ${token(roles)}`);
  /** Ruta de cross_store (sólo POST): con rol pasa al ValidationPipe → 400; sin rol → 403. */
  const post = (roles: string[]) =>
    request(app.getHttpServer())
      .post('/admin/projections/definitions')
      // cross_store sí exige organización (no es TenantAgnostic): el actor tiene una.
      .set(
        'Authorization',
        `Bearer ${tokens.signAccessToken(
          '00000000-0000-4000-8000-000000000001',
          's1',
          roles,
          ['00000000-0000-4000-8000-0000000000a1'],
        )}`,
      )
      .send({});

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [PassportModule, AuthTokenModule],
      controllers: [
        AdminCatalogController,
        GovernanceReadController,
        CrossStoreAdminController,
      ],
      providers: [
        CatalogInsightsService,
        { provide: CatalogInsightsRepository, useValue: repoCatalogo },
        GovernanceReadService,
        { provide: GovernanceReadRepository, useValue: repoGobierno },
        { provide: EntityManager, useValue: { fork: () => ({}) } },
        { provide: CatalogReadService, useValue: {} },
        { provide: CatalogGovernanceService, useValue: {} },
        { provide: CatalogScanService, useValue: {} },
        { provide: CatalogClassificationService, useValue: {} },
        { provide: PermissionDriftService, useValue: {} },
        { provide: ProjectionDeliveryService, useValue: {} },
        { provide: ReconciliationService, useValue: {} },
        { provide: DeletionService, useValue: {} },
        { provide: StorageMaintenanceService, useValue: {} },
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

  it.each(['GOVERNANCE_ADMIN', 'DATA_GOVERNANCE_ADMIN'])(
    '%s pasa en las LECTURAS de data_catalog y de system_ops (ambos nombres figuran en el @Roles de cada GET)',
    async (rol) => {
      await get('/admin/catalog/pii/summary', [rol]).expect(200);
      await get('/admin/governance/policies', [rol]).expect(200);
    },
  );

  // Contrato (revisión independiente): el alias es SÓLO de lectura. Cada rol conserva únicamente las
  // rutas de escritura que su nombre exacto ya autorizaba.
  it('DATA_GOVERNANCE_ADMIN pasa la puerta de cross_store (lo exige por su nombre): llega a la validación → 400', async () => {
    await post(['DATA_GOVERNANCE_ADMIN']).expect(400);
  });

  it('GOVERNANCE_ADMIN SIN DATA_GOVERNANCE_ADMIN NO pasa la escritura de cross_store → 403', async () => {
    await post(['GOVERNANCE_ADMIN']).expect(403);
  });

  it.each(['DATA_STEWARD', 'DPO', 'PHARMACIST', 'CLINICIAN'])(
    'un rol ajeno (%s) no pasa por el alias en cross_store → 403',
    async (rol) => {
      await post([rol]).expect(403);
    },
  );

  it('un rol ajeno sigue en 403 en las rutas de gobierno que no lo admiten', async () => {
    await get('/admin/governance/policies', ['PHARMACIST']).expect(403);
    await get('/admin/catalog/pii/summary', ['PHARMACIST']).expect(403);
  });

  it('ninguna lectura nueva exige uno solo de los dos nombres', () => {
    const lectura = (controller: any, handler: string): string[] =>
      new Reflector().getAllAndOverride<string[]>(ROLES_KEY, [
        controller.prototype[handler],
        controller,
      ]);
    for (const handler of ['piiSummary', 'piiColumns', 'piiReconciliation'])
      expect(lectura(AdminCatalogController, handler)).toEqual(
        expect.arrayContaining(['GOVERNANCE_ADMIN', 'DATA_GOVERNANCE_ADMIN']),
      );
    expect(lectura(GovernanceReadController, 'policies')).toEqual(
      expect.arrayContaining(['GOVERNANCE_ADMIN', 'DATA_GOVERNANCE_ADMIN']),
    );
  });
});

/**
 * Escrituras que exigen UNO de los dos nombres: el guard REAL con el `@Roles` REAL de cada handler.
 * Prueba que el alias no amplía privilegios de escritura en ningún sentido.
 */
describe('el alias no concede escritura (RolesGuard real sobre el @Roles real de cada handler)', () => {
  const pasa = (controller: any, handler: string, roles: string[]): boolean => {
    const guard = new RolesGuard(new Reflector());
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'u1', roles },
          resolvedTenantId: undefined,
        }),
      }),
      getHandler: () => controller.prototype[handler],
      getClass: () => controller,
    };
    try {
      return guard.canActivate(ctx as never) === true;
    } catch {
      return false;
    }
  };

  // Rutas que exigen DATA_GOVERNANCE_ADMIN por su nombre exacto.
  it.each([
    [CrossStoreAdminController, 'registerProjection'],
    [CrossStoreAdminController, 'replayDeadLetter'],
    [CrossStoreAdminController, 'repairDrift'],
    [CrossStoreAdminController, 'moveData'],
    [GraphQueryController, 'defineAccessScope'],
  ])('%p.%s: DATA_GOVERNANCE_ADMIN pasa, GOVERNANCE_ADMIN solo NO', (c, h) => {
    expect(pasa(c, h as string, ['DATA_GOVERNANCE_ADMIN'])).toBe(true);
    expect(pasa(c, h as string, ['GOVERNANCE_ADMIN'])).toBe(false);
  });

  // Rutas que exigen GOVERNANCE_ADMIN por su nombre exacto.
  it.each([
    [AdminCatalogController, 'saveAnnotation'],
    [StorageGovernanceController, 'defineDataset'],
    [StorageGovernanceController, 'defineCollection'],
    [StorageGovernanceController, 'approvePlacement'],
    [WorkflowDefinitionsController, 'registerStateMachine'],
  ])('%p.%s: GOVERNANCE_ADMIN pasa, DATA_GOVERNANCE_ADMIN solo NO', (c, h) => {
    expect(pasa(c, h as string, ['GOVERNANCE_ADMIN'])).toBe(true);
    expect(pasa(c, h as string, ['DATA_GOVERNANCE_ADMIN'])).toBe(false);
  });

  it('con ambos nombres pasan las dos familias (cada uno por el suyo)', () => {
    const ambos = ['GOVERNANCE_ADMIN', 'DATA_GOVERNANCE_ADMIN'];
    expect(pasa(CrossStoreAdminController, 'registerProjection', ambos)).toBe(
      true,
    );
    expect(pasa(AdminCatalogController, 'saveAnnotation', ambos)).toBe(true);
  });
});

/**
 * DPO, AUDITOR y DATA_STEWARD (y los demás roles de gobierno) son de ámbito GLOBAL y NO se pueden
 * asignar con tenant (`authz-grants.service.ts`). De eso depende que no lean datos de toda la
 * plataforma «desde su propio tenant»: un rol con tenant entra a `scopedRoles` y deja de autorizar
 * las rutas sin tenant.
 */
describe('roles de gobierno: ámbito GLOBAL y sin asignación con tenant', () => {
  const ROLES = [
    'DPO',
    'AUDITOR',
    'DATA_STEWARD',
    'GOVERNANCE_ADMIN',
    'DATA_PLATFORM_ADMIN',
  ];

  it.each(ROLES)('%s se siembra con ámbito GLOBAL', (codigo) => {
    const fila = DATA_CATALOG_ROLE_SEED.find((r) => r.code === codigo);
    expect(fila?.scope).toBe('GLOBAL');
  });

  it.each(ROLES)(
    'asignar %s con tenant → 412 ROLE_ASSIGNMENT_GLOBAL_ROLE_WITH_SCOPE',
    async (codigo) => {
      const rolesRepo = {
        findById: mockFn(async () => ({
          id: 'r1',
          code: codigo,
          isAssignable: true,
          scopeConceptId: AUTHZ.SCOPE_GLOBAL,
        })),
      };
      const assignments = {
        findActive: mockFn(async () => null),
        create: mockFn(),
      };
      const tx = { flush: mockFn(async () => undefined) };
      const service = new AuthzGrantsService(
        { transactional: mockFn((cb: any) => cb(tx)) } as any,
        rolesRepo as any,
        assignments as any,
        {} as any,
        {} as any,
        {} as any,
        { setContext: mockFn(), info: mockFn(), warn: mockFn() } as any,
      );
      const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
      const conTenant = service.assignRole(
        'u1',
        {
          roleId: 'r1',
          tenantId: '00000000-0000-4000-8000-0000000000a1',
        } as any,
        actor,
      );
      await expect(conTenant).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(assignments.create).not.toHaveBeenCalled();
    },
  );
});
