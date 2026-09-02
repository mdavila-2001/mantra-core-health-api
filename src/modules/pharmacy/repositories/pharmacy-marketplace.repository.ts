import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import { COMM } from '../../community/community.concepts';
import { PHARM } from '../pharmacy.concepts';
import { PINV } from '../../pharmacy_inventory/pharmacy_inventory.concepts';

/** Una oferta publicada: un producto de una farmacia, con precio y stock. */
export interface OfertaPublicada {
  /** Concepto del vademécum al que responde. */
  conceptId: string;
  /** Código ATC. */
  atcCode: string;
  /** Principio activo. */
  genericName: string;
  /** Slug del perfil público de la farmacia. */
  pharmacySlug: string;
  /** Nombre comercial de la farmacia. */
  pharmacyName: string;
  /** Dirección en una línea. */
  addressText: string | null;
  /** Ciudad. */
  city: string | null;
  /** Latitud WGS84. */
  latitude: number;
  /** Longitud WGS84. */
  longitude: number;
  /** Marca con que se publica. */
  brandName: string | null;
  /** Concentración publicada. */
  strengthText: string | null;
  /** Tamaño del envase publicado. */
  packageSizeText: string | null;
  /** Lo que paga el paciente, texto exacto. */
  price: string;
  /** Código de moneda. */
  currency: string;
  /** Unidades disponibles hoy. */
  availableQuantity: number;
  /** La sede entrega a domicilio. */
  homeDelivery: boolean;
  /** Se puede retirar en la sede. */
  pickup: boolean;
  /** Exige receta. */
  requiresPrescription: boolean;
}

/**
 * La cara pública del catálogo de farmacia: **cross-tenant y anónima**.
 *
 * ## Por qué no reutiliza `PharmacyReadRepository`
 *
 * Aquél acota por `tenant_id` en cada consulta, porque su cliente es el panel
 * de una farmacia mirando lo suyo. Acá el cliente es cualquiera que entra a
 * `/buscar/medicamentos` sin sesión: no hay tenant que exigir, y exigirlo
 * dejaría la vitrina vacía. El filtro que reemplaza al tenant es el de
 * **publicación**, y es más estricto que el del panel:
 *
 * - la farmacia está activa **y verificada**;
 * - la sede está activa;
 * - el producto está activo;
 * - su precio está en una lista **pública**, activa y dentro de su vigencia;
 * - la farmacia tiene perfil público **visible** con dirección geolocalizada.
 *
 * Lo último no es decorativo: sin coordenadas la farmacia no puede aparecer en
 * un mapa ni en un «cerca tuyo», que es lo único que esta pantalla promete.
 *
 * ## El stock no filtra, informa
 *
 * `available_quantity = 0` **no** excluye la oferta: la farmacia la publica y
 * el precio es cierto, sólo que hoy no le quedan unidades. Esconderla haría
 * creer que ahí no se consigue nunca. La pantalla lo distingue con palabras.
 */
@Injectable()
export class PharmacyMarketplaceRepository {
  /**
   * Todas las ofertas publicadas, opcionalmente acotadas por texto o por
   * medicamento.
   *
   * Es una sola consulta y no una por vertical: el catálogo publicado de todo
   * el país cabe holgadamente en memoria —son productos, no eventos—, y
   * agrupar por medicamento en SQL obligaría a una segunda vuelta para las
   * marcas y las presentaciones de cada tarjeta.
   *
   * @param em - Contexto de persistencia.
   * @param filtro - Texto libre y/o concepto del vademécum.
   * @returns Las ofertas crudas, sin agrupar y sin distancias.
   */
  async findPublishedOffers(
    em: EntityManager,
    filtro: { texto?: string; conceptId?: string },
  ): Promise<OfertaPublicada[]> {
    const texto = filtro.texto?.trim();
    const filas = await em.getConnection().execute<
      Array<{
        concept_id: string;
        atc_code: string;
        generic_name: string;
        pharmacy_slug: string;
        pharmacy_name: string;
        address_text: string | null;
        city: string | null;
        latitude: string;
        longitude: string;
        brand_name: string | null;
        strength_text: string | null;
        package_size_text: string | null;
        price: string;
        currency: string;
        available_quantity: string;
        home_delivery: boolean | null;
        pickup: boolean | null;
        requires_prescription: boolean | null;
      }>
    >(
      `SELECT DISTINCT ON (prod.id)
              med.id                AS concept_id,
              med.code              AS atc_code,
              COALESCE(es.value, med.display) AS generic_name,
              prof.slug             AS pharmacy_slug,
              COALESCE(ph.trade_name, ph.legal_name) AS pharmacy_name,
              addr.lines            AS address_text,
              addr.city             AS city,
              addr.latitude         AS latitude,
              addr.longitude        AS longitude,
              prod.brand_name       AS brand_name,
              prod.strength_text    AS strength_text,
              prod.package_size_text AS package_size_text,
              COALESCE(price.patient_amount, price.unit_amount)::text AS price,
              cur.code              AS currency,
              COALESCE(stock.available_quantity, 0)::text AS available_quantity,
              site.home_delivery_available AS home_delivery,
              site.pickup_available        AS pickup,
              prod.requires_prescription   AS requires_prescription
         FROM pharmacy.pharmacy_products prod
         JOIN pharmacy.pharmacies ph
           ON ph.id = prod.pharmacy_id
          AND ph.status_concept_id = ?
          AND ph.verification_status_concept_id = ?
         JOIN terminology.catalog_concepts med
           ON med.id = prod.medication_concept_id
         JOIN pharmacy.pharmacy_sites site
           ON site.pharmacy_id = ph.id
          AND site.status_concept_id = ?
         JOIN pharmacy.pharmacy_price_lists list
           ON list.pharmacy_id = ph.id
          AND list.status_concept_id = ?
          AND list.public_visibility = true
          AND list.insurer_tenant_id IS NULL
          AND (list.valid_from IS NULL OR list.valid_from <= now())
          AND (list.valid_to   IS NULL OR list.valid_to   >= now())
         JOIN pharmacy.pharmacy_product_prices price
           ON price.pharmacy_price_list_id = list.id
          AND price.pharmacy_product_id = prod.id
          AND price.status_concept_id = ?
          AND price.effective_from <= now()
          AND (price.effective_to IS NULL OR price.effective_to > now())
         JOIN terminology.catalog_concepts cur
           ON cur.id = list.currency_concept_id
         JOIN community.public_profiles prof
           ON prof.id = ph.public_profile_id
          AND prof.visibility_concept_id = ?
          AND prof.status_concept_id = ?
         JOIN common.addresses addr
           ON addr.owner_id = prof.target_id
          AND addr.latitude IS NOT NULL
          AND addr.longitude IS NOT NULL
          AND (addr.valid_to IS NULL OR addr.valid_to >= CURRENT_DATE)
    LEFT JOIN LATERAL (
                SELECT d.value
                  FROM terminology.concept_designations d
                  JOIN terminology.catalog_concepts lang
                    ON lang.id = d.language_concept_id
                   AND lang.code = 'ES'
                 WHERE d.concept_id = med.id
                 ORDER BY d.preferred DESC
                 LIMIT 1
              ) es ON true
    LEFT JOIN pharmacy_inventory.inventory_locations loc
           ON loc.pharmacy_site_id = site.id
          AND loc.status_concept_id = ?
    LEFT JOIN pharmacy_inventory.inventory_stock_positions stock
           ON stock.inventory_location_id = loc.id
          AND stock.pharmacy_product_id = prod.id
        WHERE prod.status_concept_id = ?
          AND (CAST(? AS uuid) IS NULL OR prod.medication_concept_id = CAST(? AS uuid))
          AND (
                CAST(? AS text) IS NULL
             OR med.display   ILIKE '%' || CAST(? AS text) || '%'
             OR es.value      ILIKE '%' || CAST(? AS text) || '%'
             OR med.code      ILIKE '%' || CAST(? AS text) || '%'
             OR prod.brand_name   ILIKE '%' || CAST(? AS text) || '%'
             OR prod.generic_name ILIKE '%' || CAST(? AS text) || '%'
          )
        ORDER BY prod.id, stock.available_quantity DESC NULLS LAST`,
      [
        PHARM.PHARMACY_ACTIVE,
        PHARM.VERIFICATION_VERIFIED,
        PHARM.SITE_ACTIVE,
        PHARM.PRICE_LIST_ACTIVE,
        PHARM.PRICE_ACTIVE,
        COMM.PROFILE_VISIBILITY_PUBLIC,
        CONCEPTS.STATE_ACTIVE,
        PINV.LOCATION_ACTIVE,
        PHARM.PRODUCT_ACTIVE,
        filtro.conceptId ?? null,
        filtro.conceptId ?? null,
        texto || null,
        texto || null,
        texto || null,
        texto || null,
        texto || null,
        texto || null,
      ],
      'all',
    );

    return filas.map((fila) => ({
      conceptId: fila.concept_id,
      atcCode: fila.atc_code,
      genericName: fila.generic_name,
      pharmacySlug: fila.pharmacy_slug,
      pharmacyName: fila.pharmacy_name,
      addressText: fila.address_text,
      city: fila.city,
      latitude: Number(fila.latitude),
      longitude: Number(fila.longitude),
      brandName: fila.brand_name,
      strengthText: fila.strength_text,
      packageSizeText: fila.package_size_text,
      price: fila.price,
      currency: fila.currency,
      availableQuantity: Number(fila.available_quantity),
      homeDelivery: fila.home_delivery === true,
      pickup: fila.pickup === true,
      requiresPrescription: fila.requires_prescription === true,
    }));
  }
}
