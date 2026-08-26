import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Addresses } from '../../common/entities';
import { PracticeSites } from '../../practice/entities';
import { CatalogConcepts } from '../../terminology/entities';
import {
  Pharmacies,
  PharmacyPriceLists,
  PharmacyProductPrices,
  PharmacyProducts,
  PharmacySites,
} from '../entities';
import { PHARM } from '../pharmacy.concepts';

/** Acotaciones de la búsqueda de productos del directorio. */
export interface ProductSearchFilter {
  /** Texto a buscar en marca, genérico o código de producto. */
  search?: string;
  /** Medicamento del vademécum (`medication_concept_id`). */
  conceptId?: string;
}

/**
 * Consultas que componen las lecturas públicas del módulo 24 (carril E2).
 *
 * Mismo criterio de publicación que el directorio de unidades diagnósticas:
 * visible = activo **y** verificado, siempre dentro del tenant del contexto.
 * Todo lo demás —borradores, rechazados, lo de otro tenant— no existe para
 * estas lecturas.
 */
@Injectable()
export class PharmacyReadRepository {
  /** Farmacias activas y verificadas del tenant activo. */
  findVisibleByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<Pharmacies[]> {
    return em.find(
      Pharmacies,
      {
        tenantId,
        statusConceptId: PHARM.PHARMACY_ACTIVE,
        verificationStatusConceptId: PHARM.VERIFICATION_VERIFIED,
      },
      { orderBy: { legalName: 'ASC' } },
    );
  }

  /** Detalle con el mismo filtro de publicación y aislamiento que el listado. */
  findVisibleById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<Pharmacies | null> {
    return em.findOne(Pharmacies, {
      id,
      tenantId,
      statusConceptId: PHARM.PHARMACY_ACTIVE,
      verificationStatusConceptId: PHARM.VERIFICATION_VERIFIED,
    });
  }

  /** Sedes activas de las farmacias dadas. */
  findActiveSites(
    em: EntityManager,
    pharmacyIds: readonly string[],
  ): Promise<PharmacySites[]> {
    if (pharmacyIds.length === 0) return Promise.resolve([]);
    return em.find(
      PharmacySites,
      {
        pharmacyId: { $in: [...pharmacyIds] },
        statusConceptId: PHARM.SITE_ACTIVE,
      },
      { orderBy: { name: 'ASC' } },
    );
  }

  /** Una sede activa por id; la propiedad la comprueba el servicio. */
  findActiveSiteById(
    em: EntityManager,
    siteId: string,
  ): Promise<PharmacySites | null> {
    return em.findOne(PharmacySites, {
      id: siteId,
      statusConceptId: PHARM.SITE_ACTIVE,
    });
  }

  /**
   * Productos activos de las farmacias dadas, acotados por texto o por
   * medicamento del vademécum. El texto busca en marca, genérico y código con
   * `$ilike`; el llamador pide una fila de más para declarar el recorte.
   */
  findActiveProducts(
    em: EntityManager,
    pharmacyIds: readonly string[],
    filter: ProductSearchFilter,
    limit: number,
  ): Promise<PharmacyProducts[]> {
    if (pharmacyIds.length === 0) return Promise.resolve([]);
    const term = filter.search?.trim();
    return em.find(
      PharmacyProducts,
      {
        pharmacyId: { $in: [...pharmacyIds] },
        statusConceptId: PHARM.PRODUCT_ACTIVE,
        ...(filter.conceptId ? { medicationConceptId: filter.conceptId } : {}),
        ...(term
          ? {
              $or: [
                { brandName: { $ilike: `%${term}%` } },
                { genericName: { $ilike: `%${term}%` } },
                { productCode: { $ilike: `%${term}%` } },
              ],
            }
          : {}),
      },
      { orderBy: { genericName: 'ASC', brandName: 'ASC' }, limit },
    );
  }

  /**
   * Sólo el dueño de cada producto activo, para contar catálogo por farmacia
   * sin traer las filas enteras (proyección de columnas, no N+1 de counts).
   */
  findActiveProductOwners(
    em: EntityManager,
    pharmacyIds: readonly string[],
  ): Promise<Pick<PharmacyProducts, 'id' | 'pharmacyId'>[]> {
    if (pharmacyIds.length === 0) return Promise.resolve([]);
    return em.find(
      PharmacyProducts,
      {
        pharmacyId: { $in: [...pharmacyIds] },
        statusConceptId: PHARM.PRODUCT_ACTIVE,
      },
      { fields: ['id', 'pharmacyId'] },
    );
  }

  /** Productos activos por id, para resolver nombres en lote. */
  findActiveProductsByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<PharmacyProducts[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(PharmacyProducts, {
      id: { $in: [...ids] },
      statusConceptId: PHARM.PRODUCT_ACTIVE,
    });
  }

  /**
   * Listas de precios **públicas** vigentes que aplican a una sede: las de la
   * farmacia entera (`pharmacy_site_id` null) y las propias de la sede. Las
   * listas ligadas a una aseguradora no salen por acá aunque alguien las
   * marque visibles: son un acuerdo entre partes, no un precio de mostrador.
   */
  findCurrentPublicPriceLists(
    em: EntityManager,
    pharmacyIds: readonly string[],
    now: Date,
  ): Promise<PharmacyPriceLists[]> {
    if (pharmacyIds.length === 0) return Promise.resolve([]);
    return em.find(PharmacyPriceLists, {
      pharmacyId: { $in: [...pharmacyIds] },
      statusConceptId: PHARM.PRICE_LIST_ACTIVE,
      publicVisibility: true,
      insurerTenantId: null,
      $and: [
        { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
        { $or: [{ validTo: null }, { validTo: { $gte: now } }] },
      ],
    });
  }

  /**
   * Precios vigentes de las listas dadas: versión ACTIVE dentro de su ventana
   * `effective_from`/`effective_to` (el versionado supersede la anterior y le
   * fija el fin, así que a lo sumo hay una vigente por lista y producto).
   */
  findCurrentPrices(
    em: EntityManager,
    priceListIds: readonly string[],
    productIds: readonly string[] | undefined,
    now: Date,
  ): Promise<PharmacyProductPrices[]> {
    if (priceListIds.length === 0) return Promise.resolve([]);
    if (productIds !== undefined && productIds.length === 0) {
      return Promise.resolve([]);
    }
    return em.find(PharmacyProductPrices, {
      pharmacyPriceListId: { $in: [...priceListIds] },
      ...(productIds ? { pharmacyProductId: { $in: [...productIds] } } : {}),
      statusConceptId: PHARM.PRICE_ACTIVE,
      effectiveFrom: { $lte: now },
      $or: [{ effectiveTo: null }, { effectiveTo: { $gt: now } }],
    });
  }

  /** Sitios de práctica por id, para llegar del sitio a su dirección. */
  findPracticeSites(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<PracticeSites[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(PracticeSites, { id: { $in: [...ids] } });
  }

  /** Direcciones por id (`common.addresses`): texto y coordenadas. */
  findAddresses(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<Addresses[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(Addresses, { id: { $in: [...ids] } });
  }

  /** Conceptos por id, para resolver `{code, display}` en lote. */
  findConcepts(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<CatalogConcepts[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(CatalogConcepts, { id: { $in: [...ids] } });
  }
}
