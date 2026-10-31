import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../common';
import type { BulkRequestDto, BulkResponseDto } from '../../../pharmacy/dto';
import type { PharmacyProducts } from '../../../pharmacy/entities';
import { PharmacyErrorReason } from '../../../pharmacy/pharmacy.error-reasons';
import {
  rejectRow,
  textField,
  type BulkHandler,
} from '../../../pharmacy/services/bulk/bulk-handler';
import { PharmacyBulkService } from '../../../pharmacy/services/pharmacy-bulk.service';
import {
  InventoryScopeRepository,
  StockPositionsRepository,
} from '../../infrastructure/repositories';
import { BulkSiteAvailabilityRowDto } from '../../presentation/dto';
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
  readonly product: PharmacyProducts;
}

/**
 * **El stock de una sucursal en lote** (FAR-06 con el contrato de FAR-05): una
 * fila por producto de esa sede, con «lo tengo / no lo tengo» y la cantidad.
 *
 * Corre en el bucle común de la carga masiva (`PharmacyBulkService`): el mismo
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
    private readonly bulk: PharmacyBulkService,
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
  ): BulkHandler<
    TrackedProduct,
    BulkSiteAvailabilityRowDto,
    BulkSiteAvailabilityRowDto
  > {
    const productOf = async (
      tx: EntityManager,
      code: string,
    ): Promise<PharmacyProducts> => {
      const product = await this.scopeRepo.findProductByCodeInPharmacy(
        tx,
        code,
        site.pharmacyId,
      );
      if (product === null) {
        throw rejectRow(
          'productCode',
          PharmacyErrorReason.PRODUCT_NOT_FOUND,
          'No hay un producto con ese código en su catálogo',
        );
      }
      return product;
    };
    const write = async (
      tx: EntityManager,
      product: PharmacyProducts,
      row: BulkSiteAvailabilityRowDto,
      actor: AuthenticatedUser,
    ) => {
      const { productCode: _code, ...dto } = row;
      return this.setAvailability.writeInSite(tx, site, product, dto, actor);
    };
    return {
      keyField: 'productCode',
      createRow: BulkSiteAvailabilityRowDto,
      updateRow: BulkSiteAvailabilityRowDto,
      keyOf: (raw) => textField(raw, 'productCode'),
      findExisting: async (tx, _ctx, key) => {
        const product = await productOf(tx, key);
        const tracked = await this.positions.countLoosePositionsInSite(
          tx,
          site.siteId,
          product.id,
        );
        return tracked > 0 ? { product } : null;
      },
      create: async (tx, ctx, row) => {
        const product = await productOf(tx, row.productCode.trim());
        await write(tx, product, row, ctx.actor);
        return product.id;
      },
      update: async (tx, ctx, existing, row) => {
        const { changed } = await write(tx, existing.product, row, ctx.actor);
        return { id: existing.product.id, changed };
      },
    };
  }
}
