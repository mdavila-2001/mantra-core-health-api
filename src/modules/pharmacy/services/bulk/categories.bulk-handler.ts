import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { BulkCategoryRowDto } from '../../dto';
import type { PharmacyProductCategories } from '../../entities';
import { PharmacyCatalogRepository } from '../../repositories';
import { PharmacyCategoriesService } from '../pharmacy-categories.service';
import { categoryNameKey, cleanCategoryName } from '../pharmacy-catalog-rules';
import type { BulkContext, BulkHandler } from './bulk-handler';

/**
 * Categorías por su nombre. La clave es `name_key` (sin mayúsculas ni tildes),
 * la misma que garantiza el índice único de la base: «Analgésicos» y
 * «analgesicos» son la misma categoría, y la segunda grafía la renombra.
 */
@Injectable()
export class CategoriesBulkHandler implements BulkHandler<
  PharmacyProductCategories,
  BulkCategoryRowDto,
  BulkCategoryRowDto
> {
  readonly keyField = 'name';
  readonly createRow = BulkCategoryRowDto;
  readonly updateRow = BulkCategoryRowDto;

  constructor(
    private readonly catalogRepo: PharmacyCatalogRepository,
    private readonly categories: PharmacyCategoriesService,
  ) {}

  keyOf(raw: Record<string, unknown>): string | null {
    if (typeof raw.name !== 'string') return null;
    const name = cleanCategoryName(raw.name);
    return name === null ? null : categoryNameKey(name);
  }

  findExisting(
    tx: EntityManager,
    ctx: BulkContext,
    key: string,
  ): Promise<PharmacyProductCategories | null> {
    return this.catalogRepo.findCategoryByKey(tx, ctx.pharmacy.id, key);
  }

  async create(
    _tx: EntityManager,
    ctx: BulkContext,
    row: BulkCategoryRowDto,
  ): Promise<string> {
    const created = await this.categories.create(
      ctx.pharmacy.id,
      row.name,
      ctx.actor,
    );
    return created.id;
  }

  async update(
    _tx: EntityManager,
    ctx: BulkContext,
    existing: PharmacyProductCategories,
    row: BulkCategoryRowDto,
  ): Promise<{ id: string; changed: boolean }> {
    if (cleanCategoryName(row.name) === existing.name) {
      return { id: existing.id, changed: false };
    }
    await this.categories.rename(
      ctx.pharmacy.id,
      existing.id,
      row.name,
      ctx.actor,
    );
    return { id: existing.id, changed: true };
  }
}
