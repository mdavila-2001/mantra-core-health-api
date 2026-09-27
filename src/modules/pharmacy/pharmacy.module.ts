import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { DirectoryModule } from '../directory/directory.module';
import {
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
} from './services';
import {
  PharmaciesRepository,
  PharmacyLicensesRepository,
  PharmacySitesRepository,
  PharmacyProductsRepository,
  PharmacyProductIdentifiersRepository,
  PharmacyPriceListsRepository,
  PharmacyProductPricesRepository,
  PharmacyIntegrationConnectionsRepository,
  PharmacyExternalProductMappingsRepository,
  PharmacyReadRepository,
  PharmacyMarketplaceRepository,
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
  ],
  controllers: [
    PharmacyController,
    PharmacyReadController,
    PharmacyPublicController,
  ],
  providers: [
    // Repositorios
    PharmaciesRepository,
    PharmacyLicensesRepository,
    PharmacySitesRepository,
    PharmacyProductsRepository,
    PharmacyProductIdentifiersRepository,
    PharmacyPriceListsRepository,
    PharmacyProductPricesRepository,
    PharmacyIntegrationConnectionsRepository,
    PharmacyExternalProductMappingsRepository,
    PharmacyReadRepository,
    PharmacyMarketplaceRepository,
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
  ],
  // La cara de lectura se exporta para que el inventario (módulo 25) componga
  // disponibilidad sin duplicar los finders de publicación y precios.
  exports: [PharmacyReadRepository],
})
export class PharmacyModule {}
