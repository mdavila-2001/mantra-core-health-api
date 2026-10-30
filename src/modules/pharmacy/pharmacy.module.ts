import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { DirectoryModule } from '../directory/directory.module';
import { PracticeModule } from '../practice/practice.module';
import { CommonModule } from '../common/common.module';
import {
  PharmacyBulkController,
  PharmacyController,
  PharmacyPublicController,
  PharmacyReadController,
} from './controllers';
import {
  PharmaciesService,
  PharmacySitesService,
  PharmacyProductsService,
  PharmacyPricingService,
  PharmacyIntegrationService,
  PharmacyCatalogService,
  PharmacyReadService,
  PharmacyStaffReadService,
  PharmacyMarketplaceService,
  MedicineCatalogSearchService,
  PharmacyCategoriesService,
  PharmacyOpeningHoursService,
  PharmacyProvisioningService,
  PharmacyBulkService,
  CategoriesBulkHandler,
  ProductsBulkHandler,
  PricesBulkHandler,
  SitesBulkHandler,
} from './services';
import {
  PharmaciesRepository,
  PharmacyLicensesRepository,
  PharmacySitesRepository,
  PharmacyReferencesRepository,
  PharmacyProductsRepository,
  MedicineCatalogRepository,
  PharmacyProductIdentifiersRepository,
  PharmacyPriceListsRepository,
  PharmacyProductPricesRepository,
  PharmacyIntegrationConnectionsRepository,
  PharmacyExternalProductMappingsRepository,
  PharmacyReadRepository,
  PharmacyMarketplaceRepository,
  PharmacyCatalogRepository,
  PharmacyOnCallShiftsRepository,
} from './repositories';

/**
 * Módulo Pharmacy (24): identidad de farmacia con licencias, sedes dispensadoras,
 * catálogo de productos con identificadores, listas de precios y precios
 * versionados, conexiones de integración externa con mapeo de productos, retiro
 * de catálogo y proyección de catálogo/precios al read-model.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    // La ficha de la farmacia reservada a su personal: la pertenencia a la
    // organización (`TenantAdministrationService`, vía
    // `DirectoryAuthorizationModule`) y el representante y las gerencias
    // (`DirectoryReadService`), leídos en el mismo lugar que `GET /tenants/me`.
    DirectoryModule,
    // P50: el alta de farmacia crea su práctica, sus sedes físicas y sus
    // direcciones (`PharmacyProvisioningService`). Ni `practice` ni `common`
    // importan `pharmacy`, así que no cierra ciclo.
    PracticeModule,
    // P47: las imágenes del producto pasan por `AttachableFileService` (archivo
    // vivo, de imagen y subido por quien edita).
    CommonModule,
  ],
  controllers: [
    PharmacyController,
    PharmacyReadController,
    PharmacyPublicController,
    PharmacyBulkController,
  ],
  providers: [
    // Repositorios
    PharmaciesRepository,
    PharmacyLicensesRepository,
    PharmacySitesRepository,
    PharmacyReferencesRepository,
    PharmacyProductsRepository,
    MedicineCatalogRepository,
    PharmacyProductIdentifiersRepository,
    PharmacyPriceListsRepository,
    PharmacyProductPricesRepository,
    PharmacyIntegrationConnectionsRepository,
    PharmacyExternalProductMappingsRepository,
    PharmacyReadRepository,
    PharmacyMarketplaceRepository,
    PharmacyCatalogRepository,
    PharmacyOnCallShiftsRepository,
    // Servicios
    PharmaciesService,
    PharmacySitesService,
    PharmacyProductsService,
    PharmacyPricingService,
    PharmacyIntegrationService,
    PharmacyCatalogService,
    PharmacyReadService,
    PharmacyStaffReadService,
    PharmacyMarketplaceService,
    MedicineCatalogSearchService,
    PharmacyCategoriesService,
    PharmacyOpeningHoursService,
    PharmacyProvisioningService,
    // FAR-05: la carga masiva, una tabla por manejador.
    PharmacyBulkService,
    CategoriesBulkHandler,
    ProductsBulkHandler,
    PricesBulkHandler,
    SitesBulkHandler,
  ],
  // La cara de lectura se exporta para que el inventario (módulo 25) componga
  // disponibilidad sin duplicar los finders de publicación y precios.
  // `PharmacyProvisioningService` se exporta para `iam`: el alta pública de
  // farmacia la provisiona dentro de su propia transacción (P50).
  exports: [PharmacyReadRepository, PharmacyProvisioningService],
})
export class PharmacyModule {}
