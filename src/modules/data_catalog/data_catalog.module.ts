import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AdminCatalogController } from './presentation/controllers/admin-catalog.controller';
import { GovernanceQueueController } from './presentation/controllers/governance-queue.controller';
import { GovernanceQueueRepository } from './infrastructure/repositories/governance-queue.repository';
import { GovernanceQueueService } from './application/governance-queue.service';
import { AdminPortalController } from './presentation/controllers/admin-portal.controller';
import {
  InternalCatalogInventoryController,
  InternalCatalogScansController,
} from './presentation/controllers/internal-catalog.controller';
import * as entities from './entities';
import { InventoryRepository } from './infrastructure/repositories/inventory.repository';
import { RouteIndexModule } from '../../observability/route-index/route-index.module';
import { CatalogInsightsRepository } from './infrastructure/repositories/catalog-insights.repository';
import { CatalogInventoryRepository } from './infrastructure/repositories/catalog-inventory.repository';
import { CatalogRepository } from './infrastructure/repositories/catalog.repository';
import { CatalogClassificationService } from './application/catalog-classification.service';
import { CatalogGovernanceService } from './application/catalog-governance.service';
import { CatalogInsightsService } from './application/catalog-insights.service';
import { CatalogReadService } from './application/catalog-read.service';
import { CatalogScanService } from './application/catalog-scan.service';
import { InventoryImportService } from './application/inventory-import.service';
import { PermissionDriftService } from './application/permission-drift.service';
import { PortalInventoryService } from './application/portal-inventory.service';
import { PLATFORM_ROLE_CODES_PORT } from './application/ports/platform-role-codes.port';
import { IamPlatformRoleCodesAdapter } from './infrastructure/adapters/iam-platform-role-codes.adapter';
import { CatalogFitService } from './application/fit/catalog-fit.service';
import { FitCheckRegistry } from './application/fit/fit-check.registry';
import { FitInputsCollector } from './application/fit/fit-inputs.collector';
import { FitLiveRepository } from './application/fit/fit-live.repository';
import { FitResultsStore } from './application/fit/fit-results.store';
import { FIT_MUTABILITY_SOURCE } from './application/fit/fit.types';
import { MutabilityFitSource } from './application/fit/mutability-source.adapter';
import { MutabilityModule } from '../system_ops/mutability/mutability.module';
import {
  AdminCatalogFitController,
  InternalCatalogFitController,
} from './presentation/controllers/catalog-fit.controller';

/**
 * Módulo 67 — catálogo de datos y portal administrativo de datos.
 *
 * Tiene dos mitades que no se mezclan:
 *   - `admin/portal/*`: lecturas del **inventario generado** (operaciones, flujos, catálogo
 *     estático, linaje, glosario). Sin base de datos; ver {@link InventoryRepository}.
 *   - `admin/catalog/*`: el catálogo **vivo**, sobre el esquema `data_catalog` del modelo
 *     (objetos observados por un escaneo de `pg_catalog`, fichas, revisiones, evidencia).
 *
 * Las entidades las genera `salud-db/gen_entities.py 67` del repo del modelo: el esquema
 * fluye modelo → entidades, nunca al revés.
 */
@Module({
  imports: [
    MutabilityModule,
    MikroOrmModule.forFeature(Object.values(entities)),
    RouteIndexModule,
  ],
  controllers: [
    AdminPortalController,
    AdminCatalogController,
    GovernanceQueueController,
    InternalCatalogScansController,
    InternalCatalogInventoryController,
    AdminCatalogFitController,
    InternalCatalogFitController,
  ],
  providers: [
    InventoryRepository,
    PortalInventoryService,
    CatalogRepository,
    CatalogInventoryRepository,
    CatalogInsightsRepository,
    CatalogInsightsService,
    GovernanceQueueRepository,
    GovernanceQueueService,
    CatalogReadService,
    CatalogGovernanceService,
    CatalogClassificationService,
    CatalogScanService,
    InventoryImportService,
    PermissionDriftService,
    // sonda de ajuste de la catalogación (application/fit)
    FitLiveRepository,
    FitInputsCollector,
    FitCheckRegistry,
    FitResultsStore,
    CatalogFitService,
    { provide: FIT_MUTABILITY_SOURCE, useClass: MutabilityFitSource },
    IamPlatformRoleCodesAdapter,
    {
      provide: PLATFORM_ROLE_CODES_PORT,
      useExisting: IamPlatformRoleCodesAdapter,
    },
  ],
  exports: [InventoryRepository, FitCheckRegistry],
})
export class DataCatalogModule {}
