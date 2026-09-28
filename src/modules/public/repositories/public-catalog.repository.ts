import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import { COMM } from '../../community/community.concepts';
import { PHARM } from '../../pharmacy/pharmacy.concepts';
import { PINV } from '../../pharmacy_inventory/pharmacy_inventory.concepts';
import { PRAC } from '../../practice/practice.concepts';

/** Un perfil público visible, con lo justo para saber de quién es. */
export interface PublicProfileRef {
  readonly id: string;
  readonly tenantId: string;
  readonly targetTypeConceptId: string;
}

/** Posición de la última fila de una página: las columnas del `ORDER BY`. */
export interface KeysetAfter {
  readonly sortKey: string;
  readonly id: string;
}

/** Un servicio del catálogo de la organización, tal como sale de la base. */
export interface OfferedServiceRow {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly descriptionText: string | null;
  /** `numeric` como texto: nunca pasa por `number`. */
  readonly price: string;
  readonly currency: string | null;
  readonly isActive: boolean;
}

/** Un producto de la farmacia, tal como sale de la base. */
export interface PharmacyProductRow {
  readonly id: string;
  /** El genérico resuelto; es también la clave de orden. */
  readonly sortName: string;
  readonly brandName: string | null;
  readonly strengthText: string | null;
  readonly packageSizeText: string | null;
  readonly requiresPrescription: boolean | null;
  /** Precio vigente más bajo en una lista pública, como texto; `null` si no hay. */
  readonly price: string | null;
  readonly currency: string | null;
  /** Suma de `available_quantity` en las sedes activas, como texto. */
  readonly availableQuantity: string;
}

/**
 * Las lecturas de las fichas públicas de organización y farmacia (M4 · H2).
 *
 * SQL crudo y de sólo lectura, con el mismo criterio que el marketplace de
 * farmacia (`pharmacy-marketplace.repository.ts`): una consulta por página, con
 * `LIMIT`, sin N+1 por fila, y proyectando **sólo** columnas publicables —
 * nunca `tax_code_id`, `income_account_id`, `practice_id` ni ids de tenant—.
 *
 * Paginación por keyset sobre `(clave de orden, id)`: estable aunque se
 * inserten filas entre dos pedidos, y sin `OFFSET`.
 */
@Injectable()
export class PublicCatalogRepository {
  /**
   * El perfil público de un slug, si está visible y activo.
   *
   * @param em - Contexto de persistencia.
   * @param slug - Slug de la ficha.
   * @returns El perfil, o `null` si no hay ninguno publicable con ese slug.
   */
  async findVisibleProfileBySlug(
    em: EntityManager,
    slug: string,
  ): Promise<PublicProfileRef | null> {
    const filas: PublicProfileRef[] = await em.getConnection().execute(
      `SELECT prof.id,
              prof.tenant_id              AS "tenantId",
              prof.target_type_concept_id AS "targetTypeConceptId"
         FROM community.public_profiles prof
        WHERE prof.slug = ?
          AND prof.visibility_concept_id = ?
          AND prof.status_concept_id = ?
        LIMIT 1`,
      [slug, COMM.PROFILE_VISIBILITY_PUBLIC, CONCEPTS.STATE_ACTIVE],
      'all',
    );
    return filas[0] ?? null;
  }

  /**
   * Una página del catálogo de servicios de las prácticas activas de una
   * organización, ordenada por código.
   *
   * @param em - Contexto de persistencia.
   * @param tenantId - Organización dueña de la ficha.
   * @param after - Última fila de la página anterior, o `null`.
   * @param take - Filas a traer (el tope de la página más una, para saber si sigue).
   * @returns Las filas, en orden.
   */
  async findOfferedServices(
    em: EntityManager,
    tenantId: string,
    after: KeysetAfter | null,
    take: number,
  ): Promise<OfferedServiceRow[]> {
    return em.getConnection().execute(
      `SELECT sc.id,
              sc.code,
              sc.name,
              sc.description_text  AS "descriptionText",
              sc.default_price::text AS price,
              cur.code             AS currency,
              sc.is_active         AS "isActive"
         FROM billing.service_catalog sc
         JOIN practice.practices pr
           ON pr.id = sc.practice_id
          AND pr.tenant_id = ?
          AND pr.status_concept_id = ?
    LEFT JOIN terminology.catalog_concepts cur
           ON cur.id = sc.currency_concept_id
        WHERE (CAST(? AS text) IS NULL
               OR (sc.code, sc.id) > (CAST(? AS text), CAST(? AS uuid)))
        ORDER BY sc.code ASC, sc.id ASC
        LIMIT ?`,
      [
        tenantId,
        PRAC.PRACTICE_ACTIVE,
        after?.sortKey ?? null,
        after?.sortKey ?? null,
        after?.id ?? null,
        take,
      ],
      'all',
    );
  }

  /**
   * Una página de los productos activos de las farmacias activas y verificadas
   * de una organización, ordenada por genérico.
   *
   * Un producto **sin stock se lista igual** (`availableQuantity = '0'`), y uno
   * sin precio en ninguna lista pública vigente viaja con `price = null`: la
   * farmacia lo tiene en catálogo, sólo que hoy no lo publica con precio.
   *
   * @param em - Contexto de persistencia.
   * @param tenantId - Organización dueña de la ficha.
   * @param after - Última fila de la página anterior, o `null`.
   * @param take - Filas a traer (el tope de la página más una).
   * @returns Las filas, en orden.
   */
  async findPharmacyProducts(
    em: EntityManager,
    tenantId: string,
    after: KeysetAfter | null,
    take: number,
  ): Promise<PharmacyProductRow[]> {
    return em.getConnection().execute(
      `SELECT p.id,
              p.sort_name              AS "sortName",
              p.brand_name             AS "brandName",
              p.strength_text          AS "strengthText",
              p.package_size_text      AS "packageSizeText",
              p.requires_prescription  AS "requiresPrescription",
              price.price              AS price,
              price.currency           AS currency,
              COALESCE(stock.available, 0)::text AS "availableQuantity"
         FROM (
               SELECT prod.id,
                      prod.pharmacy_id,
                      prod.brand_name,
                      prod.strength_text,
                      prod.package_size_text,
                      prod.requires_prescription,
                      COALESCE(prod.generic_name, med.display, prod.brand_name, prod.product_code) AS sort_name
                 FROM pharmacy.pharmacy_products prod
                 JOIN pharmacy.pharmacies ph
                   ON ph.id = prod.pharmacy_id
                  AND ph.tenant_id = ?
                  AND ph.status_concept_id = ?
                  AND ph.verification_status_concept_id = ?
            LEFT JOIN terminology.catalog_concepts med
                   ON med.id = prod.medication_concept_id
                WHERE prod.status_concept_id = ?
              ) p
    LEFT JOIN LATERAL (
                SELECT COALESCE(pp.patient_amount, pp.unit_amount)::text AS price,
                       cur.code AS currency
                  FROM pharmacy.pharmacy_product_prices pp
                  JOIN pharmacy.pharmacy_price_lists list
                    ON list.id = pp.pharmacy_price_list_id
                   AND list.pharmacy_id = p.pharmacy_id
                   AND list.status_concept_id = ?
                   AND list.public_visibility = true
                   AND list.insurer_tenant_id IS NULL
                   AND (list.valid_from IS NULL OR list.valid_from <= now())
                   AND (list.valid_to   IS NULL OR list.valid_to   >= now())
             LEFT JOIN terminology.catalog_concepts cur
                    ON cur.id = list.currency_concept_id
                 WHERE pp.pharmacy_product_id = p.id
                   AND pp.status_concept_id = ?
                   AND pp.effective_from <= now()
                   AND (pp.effective_to IS NULL OR pp.effective_to > now())
                 ORDER BY COALESCE(pp.patient_amount, pp.unit_amount) ASC
                 LIMIT 1
              ) price ON true
    LEFT JOIN LATERAL (
                SELECT SUM(st.available_quantity) AS available
                  FROM pharmacy.pharmacy_sites site
                  JOIN pharmacy_inventory.inventory_locations loc
                    ON loc.pharmacy_site_id = site.id
                   AND loc.status_concept_id = ?
                  JOIN pharmacy_inventory.inventory_stock_positions st
                    ON st.inventory_location_id = loc.id
                   AND st.pharmacy_product_id = p.id
                 WHERE site.pharmacy_id = p.pharmacy_id
                   AND site.status_concept_id = ?
              ) stock ON true
        WHERE (CAST(? AS text) IS NULL
               OR (p.sort_name, p.id) > (CAST(? AS text), CAST(? AS uuid)))
        ORDER BY p.sort_name ASC, p.id ASC
        LIMIT ?`,
      [
        tenantId,
        PHARM.PHARMACY_ACTIVE,
        PHARM.VERIFICATION_VERIFIED,
        PHARM.PRODUCT_ACTIVE,
        PHARM.PRICE_LIST_ACTIVE,
        PHARM.PRICE_ACTIVE,
        PINV.LOCATION_ACTIVE,
        PHARM.SITE_ACTIVE,
        after?.sortKey ?? null,
        after?.sortKey ?? null,
        after?.id ?? null,
        take,
      ],
      'all',
    );
  }
}
