import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { PharmacyController, PharmacyReadController } from './controllers';
import {
  PharmaciesService,
  PharmacySitesService,
  PharmacyProductsService,
  PharmacyPricingService,
  PharmacyIntegrationService,
  PharmacyCatalogService,
  PharmacyReadService,
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
} from './repositories';

/**
 * Módulo Pharmacy (24): identidad de farmacia con licencias, sedes dispensadoras,
 * catálogo de productos con identificadores, listas de precios y precios
 * versionados, conexiones de integración externa con mapeo de productos, retiro
 * de catálogo y proyección de catálogo/precios al read-model.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [PharmacyController, PharmacyReadController],
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
    // Servicios
    PharmaciesService,
    PharmacySitesService,
    PharmacyProductsService,
    PharmacyPricingService,
    PharmacyIntegrationService,
    PharmacyCatalogService,
    PharmacyReadService,
  ],
  // La cara de lectura se exporta para que el inventario (módulo 25) componga
  // disponibilidad sin duplicar los finders de publicación y precios.
  exports: [PharmacyReadRepository],
})
export class PharmacyModule {}
