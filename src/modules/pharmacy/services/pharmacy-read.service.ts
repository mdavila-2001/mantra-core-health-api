import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { requireTenantId, ResourceNotFoundException } from '../../../common';
import type { Addresses } from '../../common/entities';
import type { CatalogConcepts } from '../../terminology/entities';
import type {
  Pharmacies,
  PharmacyPriceLists,
  PharmacySites,
} from '../entities';
import type {
  PharmacyConceptDto,
  PharmacyDetailDto,
  PharmacyDirectoryItemDto,
  PharmacyDirectoryResponseDto,
  PharmacyProductSearchResponseDto,
  PharmacySiteListItemDto,
  PharmacySiteListResponseDto,
  PharmacySitePricesResponseDto,
  PharmacySiteReadDto,
} from '../dto';
import {
  PharmacyReadRepository,
  type ProductSearchFilter,
} from '../repositories';

/**
 * Lecturas del directorio de farmacias del tenant activo (carril E2).
 *
 * Mismo patrón que el directorio de unidades diagnósticas: sólo lectura sobre
 * un fork del `EntityManager`, lotes `$in` en vez de N+1, visible = activo y
 * verificado dentro del tenant, y 404 indistinguible para lo ajeno o lo no
 * publicado. Los conceptos se sirven resueltos (`{code, display}`) y las sedes
 * con su dirección en texto y sus coordenadas: el que consume esto es un
 * directorio, no un panel administrativo.
 */
@Injectable()
export class PharmacyReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param readRepo - Consultas de la cara de lectura.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly readRepo: PharmacyReadRepository,
  ) {}

  /** El directorio: farmacias publicadas del tenant, con sus números. */
  async listPharmacies(): Promise<PharmacyDirectoryResponseDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();
    const pharmacies = await this.readRepo.findVisibleByTenant(em, tenantId);
    if (pharmacies.length === 0) return { items: [], count: 0 };

    const pharmacyIds = pharmacies.map((pharmacy) => pharmacy.id);
    const [sites, productOwners, concepts] = await Promise.all([
      this.readRepo.findActiveSites(em, pharmacyIds),
      this.readRepo.findActiveProductOwners(em, pharmacyIds),
      this.readRepo.findConcepts(
        em,
        unique(
          pharmacies
            .map((pharmacy) => pharmacy.pharmacyTypeConceptId)
            .filter((id): id is string => Boolean(id)),
        ),
      ),
    ]);

    const conceptById = new Map(
      concepts.map((concept) => [concept.id, concept]),
    );
    const sitesByPharmacy = groupBy(sites, (site) => site.pharmacyId);
    const productCount = countBy(productOwners, (row) => row.pharmacyId);

    const items = pharmacies.map((pharmacy) =>
      this.toDirectoryItem(
        pharmacy,
        conceptById,
        sitesByPharmacy.get(pharmacy.id) ?? [],
        productCount.get(pharmacy.id) ?? 0,
      ),
    );
    return { items, count: items.length };
  }

  /** El perfil de una farmacia: su ficha y sus sedes con dirección resuelta. */
  async getPharmacy(id: string): Promise<PharmacyDetailDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();
    const pharmacy = await this.readRepo.findVisibleById(em, tenantId, id);
    // 404 también para la de otro tenant o la no publicada: confirmar que ese
    // uuid existe ya filtra información.
    if (!pharmacy) {
      throw new ResourceNotFoundException('Farmacia no encontrada', {
        pharmacyId: id,
      });
    }

    const [sites, productOwners] = await Promise.all([
      this.readRepo.findActiveSites(em, [pharmacy.id]),
      this.readRepo.findActiveProductOwners(em, [pharmacy.id]),
    ]);
    const { addressBySite, conceptById } = await this.resolveSiteContext(
      em,
      sites,
      pharmacy.pharmacyTypeConceptId ? [pharmacy.pharmacyTypeConceptId] : [],
    );

    return {
      ...this.toDirectoryItem(
        pharmacy,
        conceptById,
        sites,
        productOwners.length,
      ),
      sites: sites.map((site) =>
        this.toSiteItem(site, addressBySite.get(site.id), conceptById),
      ),
    };
  }

  /**
   * Las sedes publicadas del tenant, sueltas: lo que «elegir farmacia»
   * necesita antes de que la persona haya buscado nada — a diferencia de
   * {@link getPharmacy}, que exige entrar primero a UNA farmacia.
   *
   * Reusa exactamente los mismos finders que {@link listPharmacies} y
   * {@link getPharmacy} (sedes publicadas, dirección resuelta) más el
   * Haversine que ya usa `pharmacy_inventory` para `availability` — es el
   * mismo cálculo, sólo que acá se lista sin evaluarlo contra pedidos.
   *
   * @param query - Texto, origen (para ordenar por distancia) y tope.
   */
  async listSites(query: {
    search?: string;
    origin?: GeoPoint;
    limit: number;
  }): Promise<PharmacySiteListResponseDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();
    const pharmacies = await this.readRepo.findVisibleByTenant(em, tenantId);
    if (pharmacies.length === 0) return { items: [], count: 0 };

    const pharmacyIds = pharmacies.map((pharmacy) => pharmacy.id);
    const [sites, productOwners] = await Promise.all([
      this.readRepo.findActiveSites(em, pharmacyIds),
      this.readRepo.findActiveProductOwners(em, pharmacyIds),
    ]);
    const { addressBySite } = await this.resolveSiteContext(em, sites, []);

    const pharmacyById = new Map(
      pharmacies.map((pharmacy) => [pharmacy.id, pharmacy]),
    );
    const productCount = countBy(productOwners, (row) => row.pharmacyId);
    const term = query.search?.trim().toLocaleLowerCase('es');

    const items: PharmacySiteListItemDto[] = sites
      .map((site) => {
        const pharmacy = pharmacyById.get(site.pharmacyId)!;
        const address = addressBySite.get(site.id);
        const latitude = coordinate(address?.latitude);
        const longitude = coordinate(address?.longitude);
        return {
          siteId: site.id,
          siteName: site.name,
          pharmacyId: pharmacy.id,
          pharmacyName: displayName(pharmacy),
          addressText: address ? addressText(address) : null,
          latitude,
          longitude,
          distanceKm:
            query.origin && latitude !== null && longitude !== null
              ? haversineKm(query.origin, { lat: latitude, lng: longitude })
              : null,
          homeDeliveryAvailable: site.homeDeliveryAvailable ?? null,
          pickupAvailable: site.pickupAvailable ?? null,
          productCount: productCount.get(pharmacy.id) ?? 0,
        };
      })
      .filter(
        (item) =>
          term === undefined ||
          term === '' ||
          item.pharmacyName.toLocaleLowerCase('es').includes(term) ||
          item.siteName.toLocaleLowerCase('es').includes(term),
      )
      .sort(
        (a, b) =>
          (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) ||
          a.pharmacyName.localeCompare(b.pharmacyName, 'es') ||
          a.siteName.localeCompare(b.siteName, 'es'),
      )
      .slice(0, query.limit);

    return { items, count: items.length };
  }

  /**
   * Búsqueda de productos publicados en los catálogos del tenant.
   *
   * `conceptId` acota por el medicamento del vademécum: es el mismo
   * `medication_concept_id` con que la receta identifica el fármaco, así que
   * una prescripción encuentra sus productos sin traducir nada. `pharmacyId`
   * acota a lo publicado por una sola farmacia — una no visible o ajena no
   * existe para esta lectura, así que devuelve vacío sin filtrar información.
   *
   * @param filter - Texto, medicamento del vademécum, y farmacia puntual.
   * @param limit - Tope del listado.
   */
  async searchProducts(
    filter: ProductSearchFilter & { pharmacyId?: string },
    limit: number,
  ): Promise<PharmacyProductSearchResponseDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();
    const pharmacies = await this.readRepo.findVisibleByTenant(em, tenantId);
    if (pharmacies.length === 0) {
      return { items: [], limit, truncated: false };
    }

    const pharmacyIds = filter.pharmacyId
      ? pharmacies
          .filter((pharmacy) => pharmacy.id === filter.pharmacyId)
          .map((pharmacy) => pharmacy.id)
      : pharmacies.map((pharmacy) => pharmacy.id);
    if (pharmacyIds.length === 0) {
      return { items: [], limit, truncated: false };
    }

    const rows = await this.readRepo.findActiveProducts(
      em,
      pharmacyIds,
      filter,
      limit + 1,
    );
    const truncated = rows.length > limit;
    const page = rows.slice(0, limit);

    const concepts = await this.readRepo.findConcepts(
      em,
      unique(
        page
          .flatMap((row) => [row.medicationConceptId, row.dosageFormConceptId])
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const conceptById = new Map(
      concepts.map((concept) => [concept.id, concept]),
    );
    const nameByPharmacy = new Map(
      pharmacies.map((pharmacy) => [pharmacy.id, displayName(pharmacy)]),
    );

    return {
      items: page.map((row) => ({
        id: row.id,
        pharmacyId: row.pharmacyId,
        pharmacyName: nameByPharmacy.get(row.pharmacyId) ?? 'Sin registrar',
        productCode: row.productCode,
        brandName: row.brandName ?? null,
        genericName: row.genericName ?? null,
        strengthText: row.strengthText ?? null,
        packageSizeText: row.packageSizeText ?? null,
        dosageForm: optionalConcept(conceptById, row.dosageFormConceptId),
        medication: optionalConcept(conceptById, row.medicationConceptId),
        requiresPrescription: row.requiresPrescription ?? null,
      })),
      limit,
      truncated,
    };
  }

  /**
   * Los precios públicos vigentes de una sede, opcionalmente de un producto.
   *
   * Vigente quiere decir tres ventanas a la vez: la lista ACTIVA y dentro de
   * su `valid_from`/`valid_to`, y la versión de precio ACTIVA dentro de su
   * `effective_from`/`effective_to` — el versionado deja a lo sumo una por
   * lista y producto. Sólo listas públicas: el acuerdo con una aseguradora no
   * es un precio de mostrador.
   *
   * @param siteId - Sede cuyos precios se consultan.
   * @param productId - Producto puntual, si se acota.
   */
  async getSitePrices(
    siteId: string,
    productId?: string,
  ): Promise<PharmacySitePricesResponseDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();

    const site = await this.readRepo.findActiveSiteById(em, siteId);
    const pharmacy = site
      ? await this.readRepo.findVisibleById(em, tenantId, site.pharmacyId)
      : null;
    // Mismo 404 para sede inexistente, inactiva o de una farmacia ajena o no
    // publicada: distinguirlos ya filtra información.
    if (!site || !pharmacy) {
      throw new ResourceNotFoundException('Sede de farmacia no encontrada', {
        siteId,
      });
    }

    const now = new Date();
    // El repo ya excluye lo ligado a aseguradora; el filtro acá vuelve a
    // afirmarlo: por esta cara sólo pasa precio de mostrador.
    const lists = (
      await this.readRepo.findCurrentPublicPriceLists(em, [pharmacy.id], now)
    ).filter((list) => isRetailList(list) && appliesToSite(list, siteId));

    const prices = await this.readRepo.findCurrentPrices(
      em,
      lists.map((list) => list.id),
      productId ? [productId] : undefined,
      now,
    );

    const products = await this.readRepo.findActiveProductsByIds(
      em,
      unique(prices.map((price) => price.pharmacyProductId)),
    );
    const concepts = await this.readRepo.findConcepts(
      em,
      unique(
        [
          ...lists.map((list) => list.currencyConceptId),
          ...products.map((product) => product.medicationConceptId),
        ].filter((id): id is string => Boolean(id)),
      ),
    );
    const conceptById = new Map(
      concepts.map((concept) => [concept.id, concept]),
    );
    const productById = new Map(
      products.map((product) => [product.id, product]),
    );
    const listById = new Map(lists.map((list) => [list.id, list]));

    const items = prices
      // Un precio cuyo producto fue retirado no se sirve: sería vender lo que
      // el catálogo ya no publica.
      .filter((price) => productById.has(price.pharmacyProductId))
      .map((price) => {
        const product = productById.get(price.pharmacyProductId)!;
        const list = listById.get(price.pharmacyPriceListId)!;
        return {
          productId: product.id,
          productCode: product.productCode,
          brandName: product.brandName ?? null,
          genericName: product.genericName ?? null,
          strengthText: product.strengthText ?? null,
          packageSizeText: product.packageSizeText ?? null,
          medication: optionalConcept(conceptById, product.medicationConceptId),
          requiresPrescription: product.requiresPrescription ?? null,
          priceListId: list.id,
          priceListCode: list.code,
          currency: optionalConcept(conceptById, list.currencyConceptId),
          unitAmount: price.unitAmount,
          taxAmount: price.taxAmount ?? null,
          patientAmount: price.patientAmount ?? null,
          minimumQuantity: price.minimumQuantity ?? null,
          effectiveFrom: price.effectiveFrom,
          effectiveTo: price.effectiveTo ?? null,
        };
      })
      .sort(
        (a, b) =>
          (a.genericName ?? a.productCode).localeCompare(
            b.genericName ?? b.productCode,
          ) || a.priceListCode.localeCompare(b.priceListCode),
      );

    return {
      siteId: site.id,
      siteName: site.name,
      pharmacyId: pharmacy.id,
      pharmacyName: displayName(pharmacy),
      items,
      count: items.length,
    };
  }

  /**
   * Resuelve direcciones y conceptos de un lote de sedes en tres lotes:
   * practice_sites → addresses, más los conceptos pedidos y los modos de
   * dispensación de las sedes.
   */
  private async resolveSiteContext(
    em: EntityManager,
    sites: readonly PharmacySites[],
    extraConceptIds: readonly string[],
  ): Promise<{
    addressBySite: Map<string, Addresses>;
    conceptById: Map<string, CatalogConcepts>;
  }> {
    const practiceSites = await this.readRepo.findPracticeSites(
      em,
      unique(sites.map((site) => site.practiceSiteId)),
    );
    const [addresses, concepts] = await Promise.all([
      this.readRepo.findAddresses(
        em,
        unique(
          practiceSites
            .map((site) => site.addressId)
            .filter((id): id is string => Boolean(id)),
        ),
      ),
      this.readRepo.findConcepts(
        em,
        unique(
          [
            ...extraConceptIds,
            ...sites.map((site) => site.dispensingModeConceptId),
          ].filter((id): id is string => Boolean(id)),
        ),
      ),
    ]);

    const addressById = new Map(
      addresses.map((address) => [address.id, address]),
    );
    const practiceSiteById = new Map(
      practiceSites.map((site) => [site.id, site]),
    );
    const addressBySite = new Map<string, Addresses>();
    for (const site of sites) {
      const addressId = practiceSiteById.get(site.practiceSiteId)?.addressId;
      const address = addressId ? addressById.get(addressId) : undefined;
      if (address) addressBySite.set(site.id, address);
    }
    return {
      addressBySite,
      conceptById: new Map(concepts.map((concept) => [concept.id, concept])),
    };
  }

  /**
   * Proyecta una farmacia a su item de directorio.
   *
   * @param pharmacy - Entidad leída.
   * @param concepts - Conceptos ya resueltos.
   * @param sites - Sedes activas de la farmacia.
   * @param productCount - Productos activos publicados.
   */
  private toDirectoryItem(
    pharmacy: Pharmacies,
    concepts: ReadonlyMap<string, CatalogConcepts>,
    sites: readonly PharmacySites[],
    productCount: number,
  ): PharmacyDirectoryItemDto {
    return {
      id: pharmacy.id,
      code: pharmacy.code,
      name: displayName(pharmacy),
      legalName: pharmacy.legalName,
      type: optionalConcept(concepts, pharmacy.pharmacyTypeConceptId),
      siteCount: sites.length,
      productCount,
      homeDeliveryAvailable: anyFlag(
        sites.map((site) => site.homeDeliveryAvailable),
      ),
      pickupAvailable: anyFlag(sites.map((site) => site.pickupAvailable)),
    };
  }

  /**
   * Proyecta una sede con su dirección resuelta.
   *
   * @param site - Sede leída.
   * @param address - Dirección de su practice site, si existe.
   * @param concepts - Conceptos ya resueltos.
   */
  private toSiteItem(
    site: PharmacySites,
    address: Addresses | undefined,
    concepts: ReadonlyMap<string, CatalogConcepts>,
  ): PharmacySiteReadDto {
    return {
      id: site.id,
      code: site.code,
      name: site.name,
      addressText: address ? addressText(address) : null,
      latitude: coordinate(address?.latitude),
      longitude: coordinate(address?.longitude),
      dispensingMode: optionalConcept(concepts, site.dispensingModeConceptId),
      homeDeliveryAvailable: site.homeDeliveryAvailable ?? null,
      pickupAvailable: site.pickupAvailable ?? null,
    };
  }
}

/** El nombre con que la farmacia se muestra: comercial, o la razón social. */
export function displayName(pharmacy: Pharmacies): string {
  const trade = pharmacy.tradeName?.trim();
  return trade && trade !== '' ? trade : pharmacy.legalName;
}

/** La dirección en una línea, o null si no tiene ninguna parte con texto. */
export function addressText(address: Addresses): string | null {
  const partes = [address.lines, address.city, address.postalCode]
    .map((parte) => parte?.trim())
    .filter((parte): parte is string => Boolean(parte));
  return partes.length === 0 ? null : partes.join(', ');
}

/** Una coordenada `numeric` (string de BD) como número, o null. */
export function coordinate(value: string | undefined): number | null {
  if (value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Un punto WGS84 desde donde medir distancias (carril A, H4). */
export interface GeoPoint {
  readonly lat: number;
  readonly lng: number;
}

/** Radio medio terrestre en km, para el Haversine. */
const EARTH_RADIUS_KM = 6371;

/**
 * Distancia Haversine en km entre dos puntos WGS84, con un decimal.
 *
 * Copiado a propósito de
 * `pharmacy_inventory/services/pharmacy-inventory-read.service.ts:haversineKm`
 * en vez de importarlo: ese módulo es de sólo lectura para este carril
 * (reservado de otro dueño) y esta cara de lectura no depende de él. Es
 * distancia en línea recta sobre la esfera media terrestre — suficiente para
 * ordenar sedes de una ciudad, no pretende ser distancia de ruta.
 */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (degrees: number): number => (degrees * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  const distance = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
  return Math.round(distance * 10) / 10;
}

/** Si una lista es de mostrador: sin aseguradora de por medio. */
export function isRetailList(list: PharmacyPriceLists): boolean {
  return !list.insurerTenantId;
}

/** Si una lista aplica a una sede: es de la farmacia entera o de esa sede. */
export function appliesToSite(
  list: PharmacyPriceLists,
  siteId: string,
): boolean {
  return !list.pharmacySiteId || list.pharmacySiteId === siteId;
}

function optionalConcept(
  concepts: ReadonlyMap<string, CatalogConcepts>,
  id: string | undefined,
): PharmacyConceptDto | null {
  const value = id === undefined ? undefined : concepts.get(id);
  return value ? { code: value.code, display: value.display } : null;
}

/** true si alguna sede declara el flag; null si ninguna lo declara. */
function anyFlag(values: readonly (boolean | undefined)[]): boolean | null {
  const declared = values.filter(
    (value): value is boolean => value !== undefined,
  );
  if (declared.length === 0) return null;
  return declared.some(Boolean);
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function groupBy<T>(
  rows: readonly T[],
  keyOf: (row: T) => string,
): Map<string, T[]> {
  const result = new Map<string, T[]>();
  for (const row of rows) {
    const key = keyOf(row);
    const bucket = result.get(key) ?? [];
    bucket.push(row);
    result.set(key, bucket);
  }
  return result;
}

function countBy<T>(
  rows: readonly T[],
  keyOf: (row: T) => string,
): Map<string, number> {
  const result = new Map<string, number>();
  for (const row of rows) {
    const key = keyOf(row);
    result.set(key, (result.get(key) ?? 0) + 1);
  }
  return result;
}
