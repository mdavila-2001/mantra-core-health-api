import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  PharmaciesRepository,
  PharmacyProductsRepository,
  PharmacyProductPricesRepository,
} from '../repositories';
import { PHARM } from '../pharmacy.concepts';
import { CatalogEntryDto, CatalogProjectionDto } from '../dto';

/**
 * UC-24-11: proyección de catálogo y precios al read-model.
 *
 * En producción esto lo dispara un worker que consume `messaging.outbox_events`
 * y materializa docs de búsqueda / vistas materializadas. Aquí se expone como una
 * operación de lectura idempotente que reúne los productos activos de la farmacia
 * con sus precios vigentes y devuelve el documento proyectado (sin escribir en las
 * tiendas poliglotas, que viven fuera de este servicio). Es de solo lectura, por
 * eso usa `em.fork()` en lugar de una transacción de escritura.
 */
@Injectable()
export class PharmacyCatalogService {
  constructor(
    private readonly em: EntityManager,
    private readonly pharmaciesRepo: PharmaciesRepository,
    private readonly productsRepo: PharmacyProductsRepository,
    private readonly pricesRepo: PharmacyProductPricesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PharmacyCatalogService.name);
  }

  /** Proyecta el catálogo activo y sus precios vigentes de una farmacia. */
  async projectCatalog(
    pharmacyId: string,
    actor: AuthenticatedUser,
  ): Promise<CatalogProjectionDto> {
    this.logger.info(
      { operation: 'pharmacy.catalog.project', pharmacyId, actorId: actor.id },
      'Projecting pharmacy catalog',
    );
    const em = this.em.fork();

    const pharmacy = await this.pharmaciesRepo.findById(em, pharmacyId);
    if (!pharmacy)
      throw new ResourceNotFoundException('Farmacia no encontrada', {
        pharmacyId,
      });

    const products = await this.productsRepo.findByPharmacyAndStatus(
      em,
      pharmacyId,
      PHARM.PRODUCT_ACTIVE,
    );

    const entries: CatalogEntryDto[] = [];
    for (const product of products) {
      const prices = await this.pricesRepo.findActiveByProduct(
        em,
        product.id,
        PHARM.PRICE_ACTIVE,
      );
      entries.push({
        productId: product.id,
        productCode: product.productCode,
        brandName: product.brandName,
        prices: prices.map((p) => ({
          priceListId: p.pharmacyPriceListId,
          unitAmount: p.unitAmount,
          versionNumber: p.versionNumber,
        })),
      });
    }

    this.logger.info(
      {
        operation: 'pharmacy.catalog.project',
        pharmacyId,
        productCount: entries.length,
      },
      'Pharmacy catalog projected',
    );
    return {
      pharmacyId,
      productCount: entries.length,
      entries,
      projectedAt: new Date(),
    };
  }
}
