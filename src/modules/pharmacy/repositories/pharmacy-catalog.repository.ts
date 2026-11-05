import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { CONCEPTS, createdBy } from '../../../common';
import {
  PharmacyPriceLists,
  PharmacyProductCategories,
  PharmacyProductImages,
  PharmacyProducts,
} from '../entities';
import { PHARM } from '../pharmacy.concepts';
import { CATALOG_PRICE_LIST_CODE } from '../services/pharmacy-catalog-rules';

/** El precio vigente con que el catálogo muestra un producto. */
export interface CatalogPrice {
  /** Importe exacto, como texto (`numeric` de la base). */
  readonly amount: string;
  /** Código ISO 4217 de la moneda de la lista, si la lista la declara. */
  readonly currency: string | null;
}

/** Una fila de la bitácora que el resumen lee como actividad reciente. */
export interface CatalogAuditRow {
  readonly id: string;
  readonly action: string;
  readonly entityId: string | null;
  readonly recordedAt: Date;
}

/** Las acciones del catálogo que el resumen muestra como actividad. */
export const CATALOG_ACTIVITY_ACTIONS = [
  'PHARMACY_PRODUCT_PUBLISHED',
  'PHARMACY_PRODUCT_UPDATED',
  'PHARMACY_PRODUCT_RETIRED',
  'PHARMACY_INVENTORY_UPDATED',
  'PHARMACY_CATEGORY_CREATED',
  'PHARMACY_CATEGORY_RENAMED',
  'PHARMACY_CATEGORY_DELETED',
] as const;

/**
 * Acceso a datos del catálogo que administra la farmacia (P47 §3-5):
 * categorías, imágenes, la lista pública `CATALOGO` donde vive el precio y la
 * actividad reciente leída de la bitácora.
 */
@Injectable()
export class PharmacyCatalogRepository {
  /* ---- categorías --------------------------------------------------------- */

  /** Las categorías de una farmacia, por nombre. */
  listCategories(
    em: EntityManager,
    pharmacyId: string,
  ): Promise<PharmacyProductCategories[]> {
    return em.find(
      PharmacyProductCategories,
      { pharmacyId },
      { orderBy: { nameKey: 'ASC' } },
    );
  }

  /** Categorías por id (para resolver nombres en lote). */
  findCategoriesByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<PharmacyProductCategories[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(PharmacyProductCategories, { id: { $in: [...ids] } });
  }

  /** Una categoría de esa farmacia por id; `null` si no es de ella. */
  findCategory(
    em: EntityManager,
    pharmacyId: string,
    categoryId: string,
  ): Promise<PharmacyProductCategories | null> {
    return em.findOne(PharmacyProductCategories, {
      id: categoryId,
      pharmacyId,
    });
  }

  /** La categoría de esa farmacia con esa clave de nombre. */
  findCategoryByKey(
    em: EntityManager,
    pharmacyId: string,
    nameKey: string,
  ): Promise<PharmacyProductCategories | null> {
    return em.findOne(PharmacyProductCategories, { pharmacyId, nameKey });
  }

  /** Crea una categoría en la unidad de trabajo (sin flush). */
  createCategory(
    em: EntityManager,
    data: {
      pharmacyId: string;
      name: string;
      nameKey: string;
      actorUserId?: string;
    },
  ): PharmacyProductCategories {
    return em.create(
      PharmacyProductCategories,
      {
        pharmacyId: data.pharmacyId,
        name: data.name,
        nameKey: data.nameKey,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Inserta las categorías que falten (por clave) y no toca las que ya
   * existen: `ON CONFLICT DO NOTHING` sobre el índice único por farmacia.
   */
  async insertMissingCategories(
    em: EntityManager,
    pharmacyId: string,
    categories: readonly { name: string; nameKey: string }[],
    actorUserId?: string,
  ): Promise<void> {
    for (const category of categories) {
      await em.getConnection().execute(
        `insert into pharmacy.pharmacy_product_categories
           (id, pharmacy_id, name, name_key, created_at, updated_at,
            created_by_user_id, updated_by_user_id)
         values (?, ?, ?, ?, now(), now(), ?, ?)
         on conflict (pharmacy_id, name_key) do nothing`,
        [
          randomUUID(),
          pharmacyId,
          category.name,
          category.nameKey,
          actorUserId ?? null,
          actorUserId ?? null,
        ],
        'run',
        em.getTransactionContext(),
      );
    }
  }

  /**
   * Cuántos productos vivos (publicados o borradores; no retirados) usan cada
   * categoría de la farmacia.
   */
  async countLiveProductsByCategory(
    em: EntityManager,
    pharmacyId: string,
  ): Promise<Map<string, number>> {
    const rows = await em.find(
      PharmacyProducts,
      {
        pharmacyId,
        pharmacyProductCategoryId: { $ne: null },
        statusConceptId: { $ne: PHARM.PRODUCT_RETIRED },
      },
      { fields: ['pharmacyProductCategoryId'] },
    );
    const counts = new Map<string, number>();
    for (const row of rows) {
      const id = row.pharmacyProductCategoryId!;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }

  /**
   * Suelta la categoría de los productos retirados que la usaban, para poder
   * borrarla: un retirado no se muestra y no impide eliminarla.
   */
  async detachCategoryFromRetired(
    em: EntityManager,
    pharmacyId: string,
    categoryId: string,
  ): Promise<void> {
    await em.getConnection().execute(
      `update pharmacy.pharmacy_products
          set pharmacy_product_category_id = null
        where pharmacy_id = ? and pharmacy_product_category_id = ?
          and status_concept_id = ?`,
      [pharmacyId, categoryId, PHARM.PRODUCT_RETIRED],
      'run',
      em.getTransactionContext(),
    );
  }

  /* ---- imágenes ----------------------------------------------------------- */

  /** Los archivos de imagen de cada producto, en su orden. */
  async findImageFileIds(
    em: EntityManager,
    productIds: readonly string[],
  ): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>();
    if (productIds.length === 0) return result;
    const rows = await em.find(
      PharmacyProductImages,
      { pharmacyProductId: { $in: [...productIds] } },
      { orderBy: { pharmacyProductId: 'ASC', ordinal: 'ASC' } },
    );
    for (const row of rows) {
      const list = result.get(row.pharmacyProductId) ?? [];
      list.push(row.imageFileId);
      result.set(row.pharmacyProductId, list);
    }
    return result;
  }

  /** Reemplaza las imágenes de un producto por las dadas, en ese orden. */
  async replaceImages(
    em: EntityManager,
    productId: string,
    fileIds: readonly string[],
    actorUserId?: string,
  ): Promise<void> {
    await em.nativeDelete(PharmacyProductImages, {
      pharmacyProductId: productId,
    });
    const now = new Date();
    fileIds.forEach((fileId, index) => {
      em.create(
        PharmacyProductImages,
        {
          pharmacyProductId: productId,
          imageFileId: fileId,
          ordinal: index + 1,
          createdAt: now,
          createdByUserId: actorUserId,
        },
        { partial: true },
      );
    });
  }

  /* ---- precio ------------------------------------------------------------- */

  /**
   * La lista `CATALOGO` de la farmacia, bloqueando la fila de la farmacia para
   * que dos primeros precios simultáneos no creen dos listas.
   */
  async lockCatalogPriceList(
    em: EntityManager,
    pharmacyId: string,
  ): Promise<PharmacyPriceLists | null> {
    await em
      .getConnection()
      .execute(
        `select id from pharmacy.pharmacies where id = ? for update`,
        [pharmacyId],
        'all',
        em.getTransactionContext(),
      );
    return em.findOne(PharmacyPriceLists, {
      pharmacyId,
      code: CATALOG_PRICE_LIST_CODE,
      statusConceptId: PHARM.PRICE_LIST_ACTIVE,
    });
  }

  /** Crea la lista pública de mostrador del catálogo, en bolivianos. */
  createCatalogPriceList(
    em: EntityManager,
    pharmacyId: string,
    actorUserId?: string,
  ): PharmacyPriceLists {
    return em.create(
      PharmacyPriceLists,
      {
        pharmacyId,
        code: CATALOG_PRICE_LIST_CODE,
        priceListTypeConceptId: PHARM.PRICE_LIST_TYPE_PUBLIC,
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
        publicVisibility: true,
        statusConceptId: PHARM.PRICE_LIST_ACTIVE,
        ...createdBy(actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * El precio vigente de cada producto: el de la lista `CATALOGO` si lo tiene;
   * si no, el menor de sus listas públicas de mostrador vigentes (las mismas
   * tres ventanas que `GET /pharmacy/sites/:siteId/prices`).
   */
  async findCurrentPrices(
    em: EntityManager,
    productIds: readonly string[],
  ): Promise<Map<string, CatalogPrice>> {
    const result = new Map<string, CatalogPrice>();
    if (productIds.length === 0) return result;
    const rows = await em
      .getConnection()
      .execute<
        { productId: string; amount: string; currency: string | null }[]
      >(
        `select distinct on (pp.pharmacy_product_id)
              pp.pharmacy_product_id as "productId",
              pp.unit_amount::text   as amount,
              cur.code               as currency
         from pharmacy.pharmacy_product_prices pp
         join pharmacy.pharmacy_price_lists list
           on list.id = pp.pharmacy_price_list_id
          and list.status_concept_id = ?
          and list.public_visibility = true
          and list.insurer_tenant_id is null
          and (list.valid_from is null or list.valid_from <= now())
          and (list.valid_to is null or list.valid_to >= now())
    left join terminology.catalog_concepts cur
           on cur.id = list.currency_concept_id
        where pp.pharmacy_product_id in (${productIds.map(() => '?').join(', ')})
          and pp.status_concept_id = ?
          and pp.effective_from <= now()
          and (pp.effective_to is null or pp.effective_to > now())
        order by pp.pharmacy_product_id,
                 (list.code = ?) desc,
                 pp.unit_amount asc`,
        [
          PHARM.PRICE_LIST_ACTIVE,
          ...productIds,
          PHARM.PRICE_ACTIVE,
          CATALOG_PRICE_LIST_CODE,
        ],
        'all',
        em.getTransactionContext(),
      );
    for (const row of rows) {
      result.set(row.productId, {
        amount: row.amount,
        currency: row.currency ?? null,
      });
    }
    return result;
  }

  /* ---- actividad ---------------------------------------------------------- */

  /** Lo último que el personal hizo con éxito en el catálogo del tenant. */
  async findRecentActivity(
    em: EntityManager,
    tenantId: string,
    limit: number,
  ): Promise<CatalogAuditRow[]> {
    const rows = await em.getConnection().execute<
      {
        id: string;
        action: string;
        entityId: string | null;
        recordedAt: Date | string;
      }[]
    >(
      `select id, action, entity_id as "entityId", recorded_at as "recordedAt"
         from audit.audit_log
        where tenant_id = ?
          and outcome_concept_id = ?
          and action in (${CATALOG_ACTIVITY_ACTIONS.map(() => '?').join(', ')})
        order by recorded_at desc, id desc
        limit ?`,
      [tenantId, CONCEPTS.OUTCOME_SUCCESS, ...CATALOG_ACTIVITY_ACTIONS, limit],
      'all',
      em.getTransactionContext(),
    );
    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      entityId: row.entityId ?? null,
      recordedAt: new Date(row.recordedAt),
    }));
  }
}
