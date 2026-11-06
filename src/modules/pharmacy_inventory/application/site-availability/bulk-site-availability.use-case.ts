import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../common';
import type {
  BulkRequestDto,
  BulkResponseDto,
} from '../../../../common/dto/bulk-load.dto';
import {
  InventoryScopeRepository,
  StockPositionsRepository,
  type InventoryProduct,
} from '../../infrastructure/repositories';
import { PharmacyInventoryErrorReason } from '../../pharmacy_inventory.error-reasons';
import { BulkSiteAvailabilityRowDto } from '../../presentation/dto';
import {
  BulkRowRejected,
  CATALOG_BULK_LOAD_PORT,
  type BulkLoadRows,
  type CatalogBulkLoadPort,
} from '../ports/catalog-bulk-load.port';
import {
  PharmacyInventoryScopePolicy,
  type SiteScope,
} from '../scope/pharmacy-inventory-scope.policy';
import { SetSiteProductAvailabilityUseCase } from './set-site-product-availability.use-case';

/** Ruta de la carga, tal como llega del controlador. */
export interface SiteRef {
  readonly pharmacyId: string;
  readonly siteId: string;
}

/** Un producto que la sucursal ya lleva por su cuenta. */
interface TrackedProduct {
  readonly product: InventoryProduct;
}

/**
 * **El stock de una sucursal en lote** (FAR-06 con el contrato de FAR-05): una
 * fila por producto de esa sede, con «lo tengo / no lo tengo» y la cantidad.
 *
 * Corre en el bucle común de la carga masiva (`CatalogBulkLoadPort`): el mismo
 * `{ mode, dryRun }`, una transacción por fila, la vista previa que ejecuta y
 * deshace, y el rechazo de **todas** las filas que repiten un código. Cada fila
 * escribe por el mismo camino que el `PUT` de una sede
 * (`SetSiteProductAvailabilityUseCase.writeInSite`), con sus reglas: producto
 * publicado, sin la marca «sin stock» del catálogo, no llevado por lotes.
 *
 * Alcanza a las sedes con stock propio: escribe la posición de la sede, no el
 * conteo del catálogo de la farmacia. El modo se lee sobre la sede: `CREATE`
 * es un producto que la sede todavía no lleva por su cuenta, `UPDATE` uno que
 * ya lleva.
 *
 * Una sede ajena o inexistente responde el 404 de siempre, antes de leer las
 * filas.
 */
@Injectable()
export class BulkSiteAvailabilityUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly scope: PharmacyInventoryScopePolicy,
    private readonly scopeRepo: InventoryScopeRepository,
    private readonly positions: StockPositionsRepository,
    @Inject(CATALOG_BULK_LOAD_PORT)
    private readonly bulk: CatalogBulkLoadPort,
    private readonly setAvailability: SetSiteProductAvailabilityUseCase,
  ) {}

  async execute(
    ref: SiteRef,
    body: BulkRequestDto,
    actor: AuthenticatedUser,
  ): Promise<BulkResponseDto> {
    const em = this.em.fork();
    const pharmacy = await this.scope.requireManagedPharmacy(
      em,
      ref.pharmacyId,
      actor,
    );
    const site = await this.scope.requireSite(em, pharmacy, ref.siteId);
    return this.bulk.run(
      'site-availability',
      ref.pharmacyId,
      body,
      this.handlerFor(site),
      actor,
    );
  }

  /** Lo que cada fila hace en esta sede. */
  handlerFor(
    site: SiteScope,
  ): BulkLoadRows<TrackedProduct, BulkSiteAvailabilityRowDto> {
    const productOf = async (
      tx: EntityManager,
      code: string,
    ): Promise<InventoryProduct> => {
      const product = await this.scopeRepo.findProductByCodeInPharmacy(
        tx,
        code,
        site.pharmacyId,
      );
      if (product === null) {
        throw new BulkRowRejected(
          'productCode',
          PharmacyInventoryErrorReason.PRODUCT_NOT_FOUND,
          'No hay un producto con ese código en su catálogo',
        );
      }
      return product;
    };
    const write = async (
      tx: EntityManager,
      product: InventoryProduct,
      row: BulkSiteAvailabilityRowDto,
      actor: AuthenticatedUser,
    ) => {
      const { productCode: _code, ...dto } = row;
      return this.setAvailability.writeInSite(tx, site, product, dto, actor);
    };
    return {
      keyField: 'productCode',
      rowType: BulkSiteAvailabilityRowDto,
      findExisting: async (tx, key) => {
        const product = await productOf(tx, key);
        const tracked = await this.positions.countLoosePositionsInSite(
          tx,
          site.siteId,
          product.id,
        );
        return tracked > 0 ? { product } : null;
      },
      create: async (tx, row, actor) => {
        const product = await productOf(tx, row.productCode.trim());
        await write(tx, product, row, actor);
        return product.id;
      },
      update: async (tx, existing, row, actor) => {
        const { changed } = await write(tx, existing.product, row, actor);
        return { id: existing.product.id, changed };
      },
    };
  }
}
