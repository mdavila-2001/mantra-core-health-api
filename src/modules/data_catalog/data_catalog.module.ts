import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AdminCatalogController } from './presentation/controllers/admin-catalog.controller';
import { AdminPortalController } from './presentation/controllers/admin-portal.controller';
import {
  InternalCatalogInventoryController,
  InternalCatalogScansController,
} from './presentation/controllers/internal-catalog.controller';
import * as entities from './entities';
import { InventoryRepository } from './infrastructure/repositories/inventory.repository';
import { RouteIndexModule } from '../../observability/route-index/route-index.module';
import { CatalogInventoryRepository } from './infrastructure/repositories/catalog-inventory.repository';
import { CatalogRepository } from './infrastructure/repositories/catalog.repository';
import { CatalogClassificationService } from './application/catalog-classification.service';
import { CatalogGovernanceService } from './application/catalog-governance.service';
import { CatalogReadService } from './application/catalog-read.service';
import { CatalogScanService } from './application/catalog-scan.service';
import { InventoryImportService } from './application/inventory-import.service';
import { PermissionDriftService } from './application/permission-drift.service';
import { PortalInventoryService } from './application/portal-inventory.service';
import { PLATFORM_ROLE_CODES_PORT } from './application/ports/platform-role-codes.port';
import { IamPlatformRoleCodesAdapter } from './infrastructure/adapters/iam-platform-role-codes.adapter';

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
    MikroOrmModule.forFeature(Object.values(entities)),
    RouteIndexModule,
  ],
  controllers: [
    AdminPortalController,
    AdminCatalogController,
    InternalCatalogScansController,
    InternalCatalogInventoryController,
  ],
  providers: [
    InventoryRepository,
    PortalInventoryService,
    CatalogRepository,
    CatalogInventoryRepository,
    CatalogReadService,
    CatalogGovernanceService,
    CatalogClassificationService,
    CatalogScanService,
    InventoryImportService,
    PermissionDriftService,
    IamPlatformRoleCodesAdapter,
    {
      provide: PLATFORM_ROLE_CODES_PORT,
      useExisting: IamPlatformRoleCodesAdapter,
    },
  ],
  exports: [InventoryRepository],
})
export class DataCatalogModule {}
