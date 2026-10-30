import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { BulkProductUpdateRowDto, CreateProductDto } from '../../dto';
import type { PharmacyProducts } from '../../entities';
import { PHARM } from '../../pharmacy.concepts';
import { PharmacyErrorReason } from '../../pharmacy.error-reasons';
import { PharmacyProductsRepository } from '../../repositories';
import { PharmacyProductsService } from '../pharmacy-products.service';
import {
  rejectRow,
  textField,
  type BulkContext,
  type BulkHandler,
} from './bulk-handler';
import { PricesBulkHandler } from './prices.bulk-handler';

/** Lo que la carga compara para saber si una fila cambió algo. */
type ProductSnapshot = readonly unknown[];

/**
 * Productos por su código. La base no tiene índice único por
 * `(pharmacy_id, product_code)`: lo garantiza el servicio de alta, y la carga
 * masiva, con su candado por farmacia. El alta y el cambio son los de siempre
 * (`publishProduct` y `updateProduct`), con sus reglas.
 */
@Injectable()
export class ProductsBulkHandler implements BulkHandler<
  PharmacyProducts,
  CreateProductDto,
  BulkProductUpdateRowDto
> {
  readonly keyField = 'productCode';
  readonly createRow = CreateProductDto;
  readonly updateRow = BulkProductUpdateRowDto;

  constructor(
    private readonly productsRepo: PharmacyProductsRepository,
    private readonly products: PharmacyProductsService,
    private readonly prices: PricesBulkHandler,
  ) {}

  keyOf(raw: Record<string, unknown>): string | null {
    return textField(raw, 'productCode');
  }

  findExisting(
    tx: EntityManager,
    ctx: BulkContext,
    key: string,
  ): Promise<PharmacyProducts | null> {
    return this.productsRepo.findByPharmacyAndCode(tx, ctx.pharmacy.id, key);
  }

  async create(
    tx: EntityManager,
    ctx: BulkContext,
    row: CreateProductDto,
  ): Promise<string> {
    if (row.catalogProductId) {
      const taken = await this.productsRepo.findByPharmacyAndCatalog(
        tx,
        ctx.pharmacy.id,
        row.catalogProductId,
        row.catalogPresentationCode ?? null,
      );
      if (taken) {
        throw rejectRow(
          'catalogProductId',
          PharmacyErrorReason.CATALOG_PRODUCT_TAKEN,
          `Ese producto del catálogo oficial ya está cargado con el código ${taken.productCode}`,
        );
      }
    }
    const created = await this.products.publishProduct(
      ctx.pharmacy.id,
      row,
      ctx.actor,
    );
    return created.id;
  }

  async update(
    tx: EntityManager,
    ctx: BulkContext,
    existing: PharmacyProducts,
    row: BulkProductUpdateRowDto,
  ): Promise<{ id: string; changed: boolean }> {
    if (existing.statusConceptId === PHARM.PRODUCT_RETIRED) {
      throw rejectRow(
        'productCode',
        PharmacyErrorReason.PRODUCT_RETIRED,
        'El producto de ese código está retirado',
      );
    }
    const before = await this.snapshot(tx, ctx, existing);
    const { productCode: _code, ...changes } = row;
    await this.products.updateProduct(
      ctx.pharmacy.id,
      existing.id,
      changes,
      ctx.actor,
    );
    await tx.refresh(existing);
    const after = await this.snapshot(tx, ctx, existing);
    return {
      id: existing.id,
      changed: JSON.stringify(before) !== JSON.stringify(after),
    };
  }

  private async snapshot(
    tx: EntityManager,
    ctx: BulkContext,
    product: PharmacyProducts,
  ): Promise<ProductSnapshot> {
    return [
      product.brandName ?? null,
      product.genericName ?? null,
      product.strengthText ?? null,
      product.packageSizeText ?? null,
      product.requiresPrescription ?? null,
      product.descriptionText ?? null,
      product.stockQuantity ?? null,
      product.minStockQuantity ?? null,
      product.outOfStockDeclared,
      product.statusConceptId,
      product.pharmacyProductCategoryId ?? null,
      await this.prices.activeAmount(tx, ctx, product.id),
    ];
  }
}
