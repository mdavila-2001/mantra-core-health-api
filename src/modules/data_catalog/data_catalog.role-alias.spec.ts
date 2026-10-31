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
    '%s pasa en las rutas de data_catalog y de system_ops (lo exige GOVERNANCE_ADMIN)',
    async (rol) => {
      await get('/admin/catalog/pii/summary', [rol]).expect(200);
      await get('/admin/governance/policies', [rol]).expect(200);
    },
  );

  it.each(['GOVERNANCE_ADMIN', 'DATA_GOVERNANCE_ADMIN'])(
    '%s pasa la puerta de cross_store (lo exige DATA_GOVERNANCE_ADMIN): llega a la validación → 400, no 403',
    async (rol) => {
      await post([rol]).expect(400);
    },
  );

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
});
