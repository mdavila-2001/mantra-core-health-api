import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { BulkProductCreateRowDto, BulkProductUpdateRowDto } from '../../dto';
import type { PharmacyProducts } from '../../entities';
import { PHARM } from '../../pharmacy.concepts';
import { PharmacyErrorReason } from '../../pharmacy.error-reasons';
import {
  PharmacyCatalogRepository,
  PharmacyProductsRepository,
} from '../../repositories';
import { MedicationCatalogResolver } from '../medication-catalog.resolver';
import { prescriptionWarnings } from '../pharmacy-catalog-rules';
import { PharmacyProductsService } from '../pharmacy-products.service';
import {
  rejectRow,
  textField,
  type BulkContext,
  type BulkHandler,
  type BulkOtherKey,
  type BulkRowError,
} from './bulk-handler';
import { PricesBulkHandler } from './prices.bulk-handler';

/** Lo que la carga compara para saber si una fila cambió algo. */
type ProductSnapshot = readonly unknown[];

/**
 * Productos por su código. La base no tiene índice único por
 * `(pharmacy_id, product_code)`: lo garantiza el servicio de alta, y la carga
 * masiva, con su candado por farmacia. El alta y el cambio son los de siempre
 * (`publishProduct` y `updateProduct`), con sus reglas.
 *
 * El medicamento se escribe por su nombre (`medicationName`) y se resuelve
 * contra el catálogo con que se receta: la farmacia nunca tipea un UUID, y un
 * nombre que no está rechaza la fila ya en la vista previa.
 */
@Injectable()
export class ProductsBulkHandler implements BulkHandler<
  PharmacyProducts,
  BulkProductCreateRowDto,
  BulkProductUpdateRowDto
> {
  readonly keyField = 'productCode';
  readonly createRow = BulkProductCreateRowDto;
  readonly updateRow = BulkProductUpdateRowDto;

  constructor(
    private readonly productsRepo: PharmacyProductsRepository,
    private readonly products: PharmacyProductsService,
    private readonly prices: PricesBulkHandler,
    private readonly catalog: PharmacyCatalogRepository,
    private readonly medications: MedicationCatalogResolver,
  ) {}

  keyOf(raw: Record<string, unknown>): string | null {
    return textField(raw, 'productCode');
  }

  /**
   * El mismo producto del catálogo oficial (y presentación) no puede venir en
   * dos filas: la vista previa deshace cada fila y daría las dos por buenas,
   * mientras la carga real rechazaría la segunda.
   */
  otherKeysOf(raw: Record<string, unknown>): readonly BulkOtherKey[] {
    const catalogProductId = textField(raw, 'catalogProductId');
    if (catalogProductId === null) return [];
    const presentation = textField(raw, 'catalogPresentationCode') ?? '';
    return [
      {
        field: 'catalogProductId',
        key: `${catalogProductId.toLowerCase()}|${presentation}`,
      },
    ];
  }

  /** Lo que se avisa con lo que quedó guardado, no con lo que trajo la fila. */
  async warningsFor(
    tx: EntityManager,
    _ctx: BulkContext,
    id: string,
  ): Promise<readonly BulkRowError[]> {
    const product = await this.productsRepo.findById(tx, id);
    return product === null ? [] : prescriptionWarnings(product);
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
    input: BulkProductCreateRowDto,
  ): Promise<string> {
    const { medicationName, ...row } = input;
    if (medicationName !== undefined) {
      if (row.catalogProductId || row.medicationConceptId) {
        throw rejectRow(
          'medicationName',
          PharmacyErrorReason.MEDICATION_FROM_CATALOG,
          row.catalogProductId
            ? 'Un producto del catálogo oficial ya trae su medicamento: deje vacía la columna «medicamento»'
            : 'El medicamento va por su nombre o por su concepto, no los dos',
        );
      }
      row.medicationConceptId = await this.medicationOf(medicationName);
    }
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
    const { productCode: _code, medicationName, ...changes } = row;
    if (medicationName !== undefined) {
      if (changes.medicationConceptId !== undefined) {
        throw rejectRow(
          'medicationName',
          PharmacyErrorReason.MEDICATION_FROM_CATALOG,
          'El medicamento va por su nombre o por su concepto, no los dos',
        );
      }
      changes.medicationConceptId = await this.medicationOf(medicationName);
    }
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
      product.medicationConceptId ?? null,
      await this.prices.activeAmount(tx, ctx, product.id),
      // Sin las imágenes, una fila que sólo cambia fotos daba «sin cambios» y
      // se deshacía en silencio.
      (await this.catalog.findImageFileIds(tx, [product.id])).get(product.id) ??
        [],
    ];
  }

  /** El concepto del nombre escrito, o el rechazo de la fila con su motivo. */
  private async medicationOf(name: string): Promise<string> {
    const resolved = await this.medications.resolveName(name);
    if (!resolved.found) {
      throw rejectRow('medicationName', resolved.reason, resolved.message);
    }
    return resolved.conceptId;
  }
}
