import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { PharmacyController } from './controllers';
import {
  PharmaciesService,
  PharmacySitesService,
  PharmacyProductsService,
  PharmacyPricingService,
  PharmacyIntegrationService,
  PharmacyCatalogService,
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
} from './repositories';

/**
 * Módulo Pharmacy (24): identidad de farmacia con licencias, sedes dispensadoras,
 * catálogo de productos con identificadores, listas de precios y precios
 * versionados, conexiones de integración externa con mapeo de productos, retiro
 * de catálogo y proyección de catálogo/precios al read-model.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [PharmacyController],
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
    // Servicios
    PharmaciesService,
    PharmacySitesService,
    PharmacyProductsService,
    PharmacyPricingService,
    PharmacyIntegrationService,
    PharmacyCatalogService,
  ],
})
export class PharmacyModule {}
