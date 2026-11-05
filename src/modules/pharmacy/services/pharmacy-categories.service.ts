import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import type { PharmacyProductCategories } from '../entities';
import {
  PharmaciesRepository,
  PharmacyCatalogRepository,
} from '../repositories';
import type {
  PharmacyCategoryItemDto,
  PharmacyCategoryListDto,
  StatusResultDto,
} from '../dto';
import { requireManagedPharmacy } from './pharmacy-scope';
import {
  CATEGORY_NAME_MAX,
  DEFAULT_CATEGORY_NAMES,
  categoryNameKey,
  cleanCategoryName,
} from './pharmacy-catalog-rules';

/**
 * Las categorías de la vitrina de una farmacia (P47 D8).
 *
 * El producto lleva su categoría por FK compuesta (pharmacy_id, categoría), así
 * que la base ya impide colgarle la categoría de otra farmacia; acá se resuelve
 * el nombre que manda el portal contra las de **esta** farmacia y nada más.
 * Renombrar no toca los productos (apuntan por id). Eliminar una con productos
 * vivos es 409; los retirados la sueltan.
 */
@Injectable()
export class PharmacyCategoriesService {
  constructor(
    private readonly em: EntityManager,
    private readonly pharmaciesRepo: PharmaciesRepository,
    private readonly catalogRepo: PharmacyCatalogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PharmacyCategoriesService.name);
  }

  /** Las categorías de la farmacia, con cuántos productos vivos usan cada una. */
  async list(
    pharmacyId: string,
    actor: AuthenticatedUser,
  ): Promise<PharmacyCategoryListDto> {
    const em = this.em.fork();
    await requireManagedPharmacy(this.pharmaciesRepo, em, pharmacyId, actor);
    const [categories, counts] = await Promise.all([
      this.catalogRepo.listCategories(em, pharmacyId),
      this.catalogRepo.countLiveProductsByCategory(em, pharmacyId),
    ]);
    return {
      items: categories
        .map((category) => toItem(category, counts.get(category.id) ?? 0))
        .sort((a, b) => a.name.localeCompare(b.name, 'es')),
    };
  }

  /** Crea una categoría. 409 si el nombre ya existe (sin mayúsculas ni tildes). */
  async create(
    pharmacyId: string,
    rawName: string,
    actor: AuthenticatedUser,
  ): Promise<PharmacyCategoryItemDto> {
    return this.em.transactional(async (tx) => {
      await requireManagedPharmacy(this.pharmaciesRepo, tx, pharmacyId, actor);
      const name = requireName(rawName);
      const nameKey = categoryNameKey(name);
      if (await this.catalogRepo.findCategoryByKey(tx, pharmacyId, nameKey)) {
        throw new ConflictException('Ya existe una categoría con ese nombre', {
          name,
        });
      }
      const category = this.catalogRepo.createCategory(tx, {
        pharmacyId,
        name,
        nameKey,
        actorUserId: actor.id,
      });
      await tx.flush();
      this.logger.info(
        {
          operation: 'pharmacy.category.create',
          pharmacyId,
          categoryId: category.id,
        },
        'Pharmacy category created',
      );
      return toItem(category, 0);
    });
  }

  /** Renombra; los productos la siguen porque apuntan por id. */
  async rename(
    pharmacyId: string,
    categoryId: string,
    rawName: string,
    actor: AuthenticatedUser,
  ): Promise<PharmacyCategoryItemDto> {
    return this.em.transactional(async (tx) => {
      await requireManagedPharmacy(this.pharmaciesRepo, tx, pharmacyId, actor);
      const category = await this.requireCategory(tx, pharmacyId, categoryId);
      const name = requireName(rawName);
      const nameKey = categoryNameKey(name);
      const clash = await this.catalogRepo.findCategoryByKey(
        tx,
        pharmacyId,
        nameKey,
      );
      if (clash && clash.id !== category.id) {
        throw new ConflictException('Ya existe una categoría con ese nombre', {
          name,
        });
      }
      category.name = name;
      category.nameKey = nameKey;
      touch(category, actor.id);
      await tx.flush();
      const counts = await this.catalogRepo.countLiveProductsByCategory(
        tx,
        pharmacyId,
      );
      return toItem(category, counts.get(category.id) ?? 0);
    });
  }

  /** Elimina una categoría sin productos vivos; con productos, 409. */
  async remove(
    pharmacyId: string,
    categoryId: string,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.em.transactional(async (tx) => {
      await requireManagedPharmacy(this.pharmaciesRepo, tx, pharmacyId, actor);
      const category = await this.requireCategory(tx, pharmacyId, categoryId);
      const counts = await this.catalogRepo.countLiveProductsByCategory(
        tx,
        pharmacyId,
      );
      const used = counts.get(category.id) ?? 0;
      if (used > 0) {
        throw new ConflictException(
          'La categoría tiene productos: páselos a otra antes de eliminarla',
          { productCount: used },
        );
      }
      await this.catalogRepo.detachCategoryFromRetired(
        tx,
        pharmacyId,
        category.id,
      );
      tx.remove(category);
      await tx.flush();
      return { ok: true };
    });
  }

  /**
   * La categoría de esta farmacia con ese nombre, o 422 si no es de ella. Es lo
   * que usan el alta y la edición del producto.
   *
   * @param tx - Transacción activa.
   * @param pharmacyId - Farmacia dueña del producto (ya autorizada).
   * @param rawName - Nombre que mandó el portal.
   */
  async resolveByName(
    tx: EntityManager,
    pharmacyId: string,
    rawName: string,
  ): Promise<PharmacyProductCategories> {
    const found = await this.catalogRepo.findCategoryByKey(
      tx,
      pharmacyId,
      categoryNameKey(rawName),
    );
    if (!found) {
      throw new PreconditionFailedException(
        'La categoría no es una de las de su farmacia',
        { field: 'category', category: rawName },
      );
    }
    return found;
  }

  /**
   * Las seis categorías de partida de una farmacia nueva (idempotente). Las de
   * las farmacias que ya existían las sembró el patch v4.2.55.
   */
  provisionDefaults(
    tx: EntityManager,
    pharmacyId: string,
    actorUserId?: string,
  ): Promise<void> {
    return this.catalogRepo.insertMissingCategories(
      tx,
      pharmacyId,
      DEFAULT_CATEGORY_NAMES.map((name) => ({
        name,
        nameKey: categoryNameKey(name),
      })),
      actorUserId,
    );
  }

  private async requireCategory(
    tx: EntityManager,
    pharmacyId: string,
    categoryId: string,
  ): Promise<PharmacyProductCategories> {
    const category = await this.catalogRepo.findCategory(
      tx,
      pharmacyId,
      categoryId,
    );
    // La de otra farmacia y la inexistente: el mismo 404.
    if (!category) {
      throw new ResourceNotFoundException('Categoría no encontrada', {
        categoryId,
      });
    }
    return category;
  }
}

function requireName(raw: string): string {
  const name = cleanCategoryName(raw);
  if (name === null) {
    throw new PreconditionFailedException(
      `El nombre es obligatorio y tiene hasta ${CATEGORY_NAME_MAX} caracteres`,
      { field: 'name' },
    );
  }
  return name;
}

function toItem(
  category: PharmacyProductCategories,
  productCount: number,
): PharmacyCategoryItemDto {
  return { id: category.id, name: category.name, productCount };
}
