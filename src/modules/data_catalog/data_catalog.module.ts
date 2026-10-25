import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AdminCatalogController } from './controllers/admin-catalog.controller';
import { AdminPortalController } from './controllers/admin-portal.controller';
import { InternalCatalogScansController } from './controllers/internal-catalog.controller';
import * as entities from './entities';
import { InventoryRepository } from './inventory/inventory.repository';
import { RouteIndexModule } from '../../observability/route-index/route-index.module';
import { CatalogRepository } from './repositories/catalog.repository';
import { CatalogClassificationService } from './services/catalog-classification.service';
import { CatalogGovernanceService } from './services/catalog-governance.service';
import { CatalogReadService } from './services/catalog-read.service';
import { CatalogScanService } from './services/catalog-scan.service';
import { PermissionDriftService } from './services/permission-drift.service';
import { PortalInventoryService } from './services/portal-inventory.service';

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
  ],
  providers: [
    InventoryRepository,
    PortalInventoryService,
    CatalogRepository,
    CatalogReadService,
    CatalogGovernanceService,
    CatalogClassificationService,
    CatalogScanService,
    PermissionDriftService,
  ],
  exports: [InventoryRepository],
})
export class DataCatalogModule {}
