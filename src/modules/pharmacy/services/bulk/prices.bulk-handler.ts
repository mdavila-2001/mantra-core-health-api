import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { BulkPriceRowDto } from '../../dto';
import type { PharmacyProducts } from '../../entities';
import { PHARM } from '../../pharmacy.concepts';
import { PharmacyErrorReason } from '../../pharmacy.error-reasons';
import {
  PharmacyCatalogRepository,
  PharmacyProductPricesRepository,
  PharmacyProductsRepository,
} from '../../repositories';
import { normalizeMoney } from '../pharmacy-catalog-rules';
import { PharmacyProductsService } from '../pharmacy-products.service';
import {
  rejectRow,
  textField,
  type BulkContext,
  type BulkHandler,
} from './bulk-handler';

/** El producto de la fila y su precio de venta vigente, si tiene. */
export interface PricedProduct {
  readonly product: PharmacyProducts;
  readonly amount: string | null;
}

/**
 * Precios de venta por código de producto. «Existe» es que el producto tenga
 * precio vigente en la lista `CATALOGO`: `CREATE` pone el primero y `UPDATE`
 * lo cambia. Escribe por `updateProduct`, que versiona el precio
 * (`setCatalogPrice`): el mismo importe no crea versión y la fila vuelve
 * `UNCHANGED`. Un código que no es de un producto de la farmacia no crea nada.
 */
@Injectable()
export class PricesBulkHandler implements BulkHandler<
  PricedProduct,
  BulkPriceRowDto,
  BulkPriceRowDto
> {
  readonly keyField = 'productCode';
  readonly createRow = BulkPriceRowDto;
  readonly updateRow = BulkPriceRowDto;

  constructor(
    private readonly productsRepo: PharmacyProductsRepository,
    private readonly catalogRepo: PharmacyCatalogRepository,
    private readonly pricesRepo: PharmacyProductPricesRepository,
    private readonly products: PharmacyProductsService,
  ) {}

  keyOf(raw: Record<string, unknown>): string | null {
    return textField(raw, 'productCode');
  }

  async findExisting(
    tx: EntityManager,
    ctx: BulkContext,
    key: string,
  ): Promise<PricedProduct | null> {
    const product = await this.requireProduct(tx, ctx, key);
    const amount = await this.activeAmount(tx, ctx, product.id);
    return amount === null ? null : { product, amount };
  }

  async create(
    tx: EntityManager,
    ctx: BulkContext,
    row: BulkPriceRowDto,
  ): Promise<string> {
    const product = await this.requireProduct(tx, ctx, row.productCode.trim());
    await this.setPrice(ctx, product, row.unitPrice);
    return product.id;
  }

  async update(
    _tx: EntityManager,
    ctx: BulkContext,
    existing: PricedProduct,
    row: BulkPriceRowDto,
  ): Promise<{ id: string; changed: boolean }> {
    if (normalizeMoney(row.unitPrice) === existing.amount) {
      return { id: existing.product.id, changed: false };
    }
    await this.setPrice(ctx, existing.product, row.unitPrice);
    return { id: existing.product.id, changed: true };
  }

  /** El importe vigente del producto en la lista `CATALOGO`, normalizado. */
  async activeAmount(
    tx: EntityManager,
    ctx: BulkContext,
    productId: string,
  ): Promise<string | null> {
    const list = await this.catalogRepo.lockCatalogPriceList(
      tx,
      ctx.pharmacy.id,
    );
    if (!list) return null;
    const active = await this.pricesRepo.findActiveByListAndProduct(
      tx,
      list.id,
      productId,
      PHARM.PRICE_ACTIVE,
    );
    return active.length === 1 ? normalizeMoney(active[0].unitAmount) : null;
  }

  private async requireProduct(
    tx: EntityManager,
    ctx: BulkContext,
    code: string,
  ): Promise<PharmacyProducts> {
    const product = await this.productsRepo.findByPharmacyAndCode(
      tx,
      ctx.pharmacy.id,
      code,
    );
    if (!product) {
      throw rejectRow(
        'productCode',
        PharmacyErrorReason.PRODUCT_NOT_FOUND,
        'No hay un producto con ese código en el catálogo',
      );
    }
    if (product.statusConceptId === PHARM.PRODUCT_RETIRED) {
      throw rejectRow(
        'productCode',
        PharmacyErrorReason.PRODUCT_RETIRED,
        'El producto de ese código está retirado',
      );
    }
    return product;
  }

  private async setPrice(
    ctx: BulkContext,
    product: PharmacyProducts,
    unitPrice: number | string,
  ): Promise<void> {
    await this.products.updateProduct(
      ctx.pharmacy.id,
      product.id,
      { unitPrice },
      ctx.actor,
    );
  }
}
