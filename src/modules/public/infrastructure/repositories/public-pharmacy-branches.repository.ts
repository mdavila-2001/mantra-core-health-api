import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { normalizeSearchText } from '../../../../common/text/normalize-search-text';
import { DIR } from '../../../directory/directory.concepts';
import { PHARM } from '../../../pharmacy/pharmacy.concepts';
import { siteProductAvailabilitySql } from '../../../pharmacy_inventory/domain/site-product-availability';
import {
  containsPattern,
  sqlSearchKey,
} from '../../../terminology/repositories/glossary-search.sql';
import type {
  BranchProductRow,
  PublicBranchRow,
} from '../../domain/public-pharmacy-branches.domain';

/** Tope duro de filas producto×sede de una búsqueda de receta. */
const MAX_PRODUCT_ROWS = 5000;

/**
 * Las lecturas de P37: las sedes de una farmacia y qué tienen en stock de una
 * receta escrita a mano.
 *
 * SQL crudo y de sólo lectura, como `PublicCatalogRepository`: proyecta sólo
 * columnas publicables y nunca ids de tenant, de práctica ni de dirección.
 *
 * ## La cadena, en la base
 *
 * `pharmacy.pharmacies (tenant)` → `pharmacy.pharmacy_sites` → `practice.practice_sites`
 * (con `branch_id` → `directory.branches` y `address_id` → `common.addresses`).
 * El stock es por sede: `pharmacy_inventory.inventory_locations (pharmacy_site_id)`.
 * Es la misma cadena que recorre `pharmacy-inventory/availability` con sesión.
 */
@Injectable()
export class PublicPharmacyBranchesRepository {
  /**
   * Las sedes activas de las farmacias activas y verificadas de un tenant.
   *
   * El punto sale primero de la sucursal (`directory.branches`, lo edita la
   * cadena en su pestaña Sucursales) y, si no tiene, de la dirección de la
   * sede física. Una sucursal suspendida esconde su sede.
   *
   * @param em - Contexto de persistencia.
   * @param tenantId - Tenant dueño de la ficha.
   * @param take - Tope de sedes.
   */
  async findPublicSites(
    em: EntityManager,
    tenantId: string,
    take: number,
  ): Promise<PublicBranchRow[]> {
    return em.getConnection().execute(
      `SELECT site.id                AS "siteId",
              site.name              AS "siteName",
              COALESCE(NULLIF(btrim(ph.trade_name), ''), ph.legal_name) AS "pharmacyName",
              addr.lines             AS "addressLines",
              addr.city              AS city,
              CASE WHEN br.latitude IS NOT NULL AND br.longitude IS NOT NULL
                   THEN br.latitude::text ELSE addr.latitude::text END  AS latitude,
              CASE WHEN br.latitude IS NOT NULL AND br.longitude IS NOT NULL
                   THEN br.longitude::text ELSE addr.longitude::text END AS longitude,
              br.description         AS description,
              br.location_url        AS "locationUrl"
         FROM pharmacy.pharmacy_sites site
         JOIN pharmacy.pharmacies ph
           ON ph.id = site.pharmacy_id
          AND ph.tenant_id = ?
          AND ph.status_concept_id = ?
          AND ph.verification_status_concept_id = ?
    LEFT JOIN practice.practice_sites ps
           ON ps.id = site.practice_site_id
    LEFT JOIN directory.branches br
           ON br.id = ps.branch_id
          AND br.tenant_id = ph.tenant_id
    LEFT JOIN common.addresses addr
           ON addr.id = ps.address_id
        WHERE site.status_concept_id = ?
          AND (ps.branch_id IS NULL OR br.status_concept_id = ?)
        ORDER BY site.name ASC, site.id ASC
        LIMIT ?`,
      [
        tenantId,
        PHARM.PHARMACY_ACTIVE,
        PHARM.VERIFICATION_VERIFIED,
        PHARM.SITE_ACTIVE,
        DIR.BRANCH_ACTIVE,
        take,
      ],
      'all',
    );
  }

  /**
   * Los productos **disponibles** de las sedes de un tenant que casan con algún
   * renglón de la receta, con su precio vigente para esa sede. «Disponible» es
   * la regla única de {@link siteProductAvailabilitySql}: lotes si el producto
   * tiene posición en la sede, lo declarado en el catálogo si no.
   *
   * El filtro por renglón va en SQL (sin tildes ni mayúsculas, «contiene») para
   * no traer el catálogo entero; cuál gana por renglón lo decide el dominio.
   * El precio: gana la lista propia de la sede sobre la general de la
   * farmacia, y a igualdad el más barato; sólo listas públicas de mostrador.
   *
   * @param em - Contexto de persistencia.
   * @param tenantId - Tenant dueño de la ficha.
   * @param siteIds - Sedes publicadas (las de {@link findPublicSites}).
   * @param terms - Renglones limpios de la receta (al menos uno).
   */
  async findInStockMatches(
    em: EntityManager,
    tenantId: string,
    siteIds: readonly string[],
    terms: readonly string[],
  ): Promise<BranchProductRow[]> {
    if (siteIds.length === 0 || terms.length === 0) return [];
    const searchText = `concat_ws(' ', prod.generic_name, prod.brand_name, med.display, prod.strength_text, prod.package_size_text)`;
    const termFilter = terms
      .map(() => `${sqlSearchKey(searchText)} LIKE ?`)
      .join(' OR ');
    const sitePlaceholders = siteIds.map(() => '?').join(', ');
    const availability = siteProductAvailabilitySql();
    return em.getConnection().execute(
      `SELECT stock.site_id            AS "siteId",
              prod.id                  AS "productId",
              COALESCE(prod.generic_name, med.display, prod.brand_name, prod.product_code) AS "genericName",
              prod.brand_name          AS "brandName",
              prod.strength_text       AS "strengthText",
              prod.package_size_text   AS "packageSizeText",
              ${searchText}            AS "searchText",
              price.price              AS price,
              price.currency           AS currency
         FROM (
               -- La regla única de disponibilidad por sede: lotes si la sede
               -- los lleva; si no, lo declarado en el catálogo (A1).
               SELECT av.site_id, av.product_id
                 FROM (${availability.sql}) av
                WHERE av.site_id IN (${sitePlaceholders})
              ) stock
         JOIN pharmacy.pharmacy_products prod
           ON prod.id = stock.product_id
          AND prod.status_concept_id = ?
         JOIN pharmacy.pharmacies ph
           ON ph.id = prod.pharmacy_id
          AND ph.tenant_id = ?
    LEFT JOIN terminology.catalog_concepts med
           ON med.id = prod.medication_concept_id
    LEFT JOIN LATERAL (
                SELECT COALESCE(pp.patient_amount, pp.unit_amount)::text AS price,
                       cur.code AS currency
                  FROM pharmacy.pharmacy_product_prices pp
                  JOIN pharmacy.pharmacy_price_lists list
                    ON list.id = pp.pharmacy_price_list_id
                   AND list.pharmacy_id = prod.pharmacy_id
                   AND (list.pharmacy_site_id IS NULL OR list.pharmacy_site_id = stock.site_id)
                   AND list.status_concept_id = ?
                   AND list.public_visibility = true
                   AND list.insurer_tenant_id IS NULL
                   AND (list.valid_from IS NULL OR list.valid_from <= now())
                   AND (list.valid_to   IS NULL OR list.valid_to   >= now())
             LEFT JOIN terminology.catalog_concepts cur
                    ON cur.id = list.currency_concept_id
                 WHERE pp.pharmacy_product_id = prod.id
                   AND pp.status_concept_id = ?
                   AND pp.effective_from <= now()
                   AND (pp.effective_to IS NULL OR pp.effective_to > now())
                 ORDER BY (list.pharmacy_site_id IS NULL) ASC,
                          COALESCE(pp.patient_amount, pp.unit_amount) ASC
                 LIMIT 1
              ) price ON true
        WHERE (${termFilter})
        ORDER BY stock.site_id ASC, prod.id ASC
        LIMIT ?`,
      [
        ...availability.params,
        ...siteIds,
        PHARM.PRODUCT_ACTIVE,
        tenantId,
        PHARM.PRICE_LIST_ACTIVE,
        PHARM.PRICE_ACTIVE,
        ...terms.map((term) => containsPattern(normalizeSearchText(term))),
        MAX_PRODUCT_ROWS,
      ],
      'all',
    );
  }
}
