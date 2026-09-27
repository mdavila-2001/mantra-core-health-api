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

/** Una sede de farmacia de la cadena, tal como sale de la base (P37). */
export interface PharmacyBranchRow {
  readonly siteId: string;
  readonly siteName: string;
  /** Nombre comercial de la farmacia, o su razón social. */
  readonly pharmacyName: string;
  /** Slug de la ficha pública del tenant dueño de la sede. */
  readonly slug: string;
  readonly tenantId: string;
  readonly lines: string | null;
  readonly city: string | null;
  /** `numeric` como texto; `null` si ni la dirección ni la sucursal lo tienen. */
  readonly latitude: string | null;
  readonly longitude: string | null;
}

/** Un producto con stock en una sede, candidato a un renglón de receta (P37). */
export interface BranchStockRow {
  readonly siteId: string;
  readonly productId: string;
  readonly genericName: string;
  readonly brandName: string | null;
  readonly strengthText: string | null;
  readonly packageSizeText: string | null;
  /** Precio público vigente más bajo, como texto; `null` si no hay. */
  readonly price: string | null;
  readonly currency: string | null;
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

  /**
   * Las sucursales públicas de la cadena a la que pertenece un tenant de
   * farmacia, **con las suyas adentro** (P37).
   *
   * ## Qué es «la cadena»
   *
   * El tenant raíz (`parent_tenant_id`, o el propio tenant si no tiene padre)
   * y sus hijos directos. Cada uno puede tener su propia ficha de farmacia, y
   * cada sede activa de una farmacia activa y verificada de esos tenants es una
   * sucursal. Una farmacia que no pertenece a ninguna cadena devuelve sólo sus
   * propias sedes.
   *
   * ## Qué se publica
   *
   * Sólo lo que ya está a la vista en una ficha: nombre de la farmacia y de la
   * sede, dirección, ciudad y coordenadas. Una sede cuyo tenant no tiene ficha
   * visible **no** aparece: no hay a dónde llevar a quien la toque, y que no la
   * haya publicado es una decisión suya. Las coordenadas salen de la dirección
   * de la sede y, si no tiene, de la sucursal del directorio.
   *
   * @param em - Contexto de persistencia.
   * @param tenantId - Tenant de la ficha que se mira.
   * @param take - Tope de sucursales.
   * @returns Una fila por sede, sin orden garantizado.
   */
  async findPharmacyBranches(
    em: EntityManager,
    tenantId: string,
    take: number,
  ): Promise<PharmacyBranchRow[]> {
    return em.getConnection().execute(
      `WITH chain AS (
             SELECT COALESCE(t.parent_tenant_id, t.id) AS root
               FROM directory.tenants t
              WHERE t.id = ?
           )
       SELECT DISTINCT ON (site.id)
              site.id                AS "siteId",
              site.name              AS "siteName",
              COALESCE(NULLIF(btrim(ph.trade_name), ''), ph.legal_name) AS "pharmacyName",
              prof.slug              AS slug,
              prof.tenant_id         AS "tenantId",
              addr.lines             AS lines,
              addr.city              AS city,
              CASE WHEN addr.latitude IS NOT NULL AND addr.longitude IS NOT NULL
                   THEN addr.latitude::text ELSE br.latitude::text END  AS latitude,
              CASE WHEN addr.latitude IS NOT NULL AND addr.longitude IS NOT NULL
                   THEN addr.longitude::text ELSE br.longitude::text END AS longitude
         FROM chain
         JOIN directory.tenants t
           ON t.id = chain.root OR t.parent_tenant_id = chain.root
         JOIN community.public_profiles prof
           ON prof.tenant_id = t.id
          AND prof.target_type_concept_id = ?
          AND prof.visibility_concept_id = ?
          AND prof.status_concept_id = ?
         JOIN pharmacy.pharmacies ph
           ON ph.tenant_id = t.id
          AND ph.status_concept_id = ?
          AND ph.verification_status_concept_id = ?
         JOIN pharmacy.pharmacy_sites site
           ON site.pharmacy_id = ph.id
          AND site.status_concept_id = ?
         JOIN practice.practice_sites ps
           ON ps.id = site.practice_site_id
    LEFT JOIN common.addresses addr
           ON addr.id = ps.address_id
    LEFT JOIN directory.branches br
           ON br.id = ps.branch_id
        ORDER BY site.id, prof.created_at ASC
        LIMIT ?`,
      [
        tenantId,
        COMM.PROFILE_TARGET_PHARMACY,
        COMM.PROFILE_VISIBILITY_PUBLIC,
        CONCEPTS.STATE_ACTIVE,
        PHARM.PHARMACY_ACTIVE,
        PHARM.VERIFICATION_VERIFIED,
        PHARM.SITE_ACTIVE,
        take,
      ],
      'all',
    );
  }

  /**
   * Los productos **con stock en cada sede** que pueden responder a un renglón
   * de receta, con su precio público vigente más bajo (P37).
   *
   * El filtro de texto de acá es grueso a propósito: casa la palabra más
   * larga de cada renglón contra el genérico, la marca y la presentación, sin
   * tildes ni mayúsculas. El servicio afina después (todas las palabras del
   * renglón). Así la base no devuelve el catálogo entero de la cadena y la
   * regla fina queda en un solo lugar, probada sin base.
   *
   * Los arreglos viajan como JSON (`jsonb_array_elements_text`): el driver
   * expande un arreglo de JS en `?, ?, ?` y rompería un `?::uuid[]`.
   *
   * @param em - Contexto de persistencia.
   * @param siteIds - Sedes donde buscar.
   * @param words - Palabras ya normalizadas (minúsculas, sin tildes) y
   *   escapadas para `LIKE`.
   * @returns Una fila por producto con stock que casa alguna palabra.
   */
  async findBranchStockMatches(
    em: EntityManager,
    siteIds: readonly string[],
    words: readonly string[],
  ): Promise<BranchStockRow[]> {
    if (siteIds.length === 0 || words.length === 0) return [];
    return em.getConnection().execute(
      `SELECT DISTINCT ON (site.id, prod.id)
              site.id                 AS "siteId",
              prod.id                 AS "productId",
              COALESCE(prod.generic_name, med.display, prod.brand_name, prod.product_code) AS "genericName",
              prod.brand_name         AS "brandName",
              prod.strength_text      AS "strengthText",
              prod.package_size_text  AS "packageSizeText",
              price.price             AS price,
              price.currency          AS currency
         FROM pharmacy.pharmacy_sites site
         JOIN pharmacy.pharmacy_products prod
           ON prod.pharmacy_id = site.pharmacy_id
          AND prod.status_concept_id = ?
    LEFT JOIN terminology.catalog_concepts med
           ON med.id = prod.medication_concept_id
         JOIN jsonb_array_elements_text(CAST(? AS jsonb)) AS w(word)
           ON translate(
                lower(concat_ws(' ', prod.generic_name, med.display, prod.brand_name,
                                prod.strength_text, prod.package_size_text)),
                'áéíóúüñàèìòù', 'aeiouunaeiou'
              ) LIKE '%' || w.word || '%'
         JOIN LATERAL (
                SELECT SUM(st.available_quantity) AS available
                  FROM pharmacy_inventory.inventory_locations loc
                  JOIN pharmacy_inventory.inventory_stock_positions st
                    ON st.inventory_location_id = loc.id
                   AND st.pharmacy_product_id = prod.id
                 WHERE loc.pharmacy_site_id = site.id
                   AND loc.status_concept_id = ?
              ) stock ON stock.available > 0
    LEFT JOIN LATERAL (
                SELECT COALESCE(pp.patient_amount, pp.unit_amount)::text AS price,
                       cur.code AS currency
                  FROM pharmacy.pharmacy_product_prices pp
                  JOIN pharmacy.pharmacy_price_lists list
                    ON list.id = pp.pharmacy_price_list_id
                   AND list.pharmacy_id = site.pharmacy_id
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
                 ORDER BY COALESCE(pp.patient_amount, pp.unit_amount) ASC
                 LIMIT 1
              ) price ON true
        WHERE site.id IN (
                SELECT CAST(value AS uuid)
                  FROM jsonb_array_elements_text(CAST(? AS jsonb))
              )
        ORDER BY site.id, prod.id
        LIMIT 5000`,
      [
        PHARM.PRODUCT_ACTIVE,
        JSON.stringify(words),
        PINV.LOCATION_ACTIVE,
        PHARM.PRICE_LIST_ACTIVE,
        PHARM.PRICE_ACTIVE,
        JSON.stringify(siteIds),
      ],
      'all',
    );
  }
}
