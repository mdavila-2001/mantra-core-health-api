import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  marketplaceTenantScope,
  ResourceNotFoundException,
} from '../../../../common';
import type {
  PharmacyAddressSnapshot,
  PharmacyConceptSnapshot,
  PharmacyDirectoryPort,
  PharmacyPriceListSnapshot,
  PharmacyProductPriceSnapshot,
  PharmacyProductSnapshot,
  PharmacySiteSnapshot,
  PharmacySnapshot,
} from '../ports/pharmacy-directory.port';
import { PHARMACY_DIRECTORY_PORT } from '../ports/pharmacy-directory.port';
import { isRetailList } from '../../domain/pricing/is-retail-list';
import {
  sumAmounts,
  winningPriceFor,
} from '../../domain/pricing/pharmacy-pricing';
import type { InventoryStockPositions } from '../../entities';
import type {
  AvailabilityPriceDto,
  AvailabilityResponseDto,
  AvailabilitySiteDto,
  InventoryConceptDto,
  SiteStockResponseDto,
} from '../../presentation/dto';
import { InventoryReadRepository } from '../../infrastructure/repositories';

/** El punto desde el que se mide la distancia, si la consulta lo trae. */
export interface GeoPoint {
  /** Latitud WGS84 en grados. */
  lat: number;
  /** Longitud WGS84 en grados. */
  lng: number;
}

/** Radio medio terrestre en km, para el Haversine. */
const EARTH_RADIUS_KM = 6371;

/** Cuántas sedes sirve la disponibilidad por defecto. */
const DEFAULT_AVAILABILITY_LIMIT = 20;

/**
 * Lecturas de inventario para el directorio (carril E2): stock por sede y
 * disponibilidad multi-sede.
 *
 * La visibilidad es la del directorio de farmacias —sede activa de una
 * farmacia activa y verificada del tenant— y la reutiliza literalmente: este
 * servicio compone con `PharmacyReadRepository` (exportado por el módulo 24)
 * en vez de repetir sus filtros de publicación. El stock disponible es la
 * columna `available` que mantiene el ledger: acá no se recalcula, se agrega
 * por sede.
 *
 * ## Cómo ordena la disponibilidad
 *
 * Primero las sedes **completas** (tienen todo lo solicitado); después la
 * distancia Haversine sobre las coordenadas de `common.addresses` (si la
 * consulta trajo un punto; sin coordenadas la sede va al final); después el
 * total (sin total al final); después el nombre. La completitud manda porque
 * un pedido repartido en dos farmacias son dos viajes.
 */
@Injectable()
export class ReadPharmacyInventoryUseCase {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param inventoryRepo - Consultas del modelo de inventario.
   * @param pharmacyRepo - Cara de lectura del directorio de farmacias.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly inventoryRepo: InventoryReadRepository,
    @Inject(PHARMACY_DIRECTORY_PORT)
    private readonly pharmacyRepo: PharmacyDirectoryPort,
  ) {}

  /**
   * El stock disponible de una sede, agregado por producto sobre sus
   * ubicaciones activas.
   *
   * @param siteId - Sede cuyo stock se consulta.
   * @param productId - Producto puntual, si se acota.
   */
  async getSiteStock(
    siteId: string,
    productId?: string,
  ): Promise<SiteStockResponseDto> {
    const tenantId = marketplaceTenantScope();
    const em = this.em.fork();

    const site = await this.pharmacyRepo.findActiveSiteById(em, siteId);
    const pharmacy = site
      ? await this.pharmacyRepo.findVisibleById(em, tenantId, site.pharmacyId)
      : null;
    // Mismo 404 para sede inexistente, inactiva o de farmacia ajena/no
    // publicada: distinguirlos ya filtra información.
    if (!site || !pharmacy) {
      throw new ResourceNotFoundException('Sede de farmacia no encontrada', {
        siteId,
      });
    }

    const locations = await this.inventoryRepo.findActiveLocationsBySites(em, [
      site.id,
    ]);
    const positions = await this.inventoryRepo.findStockPositions(
      em,
      locations.map((location) => location.id),
      productId ? [productId] : undefined,
    );

    const products = await this.pharmacyRepo.findActiveProductsByIds(
      em,
      unique(positions.map((position) => position.pharmacyProductId)),
    );
    const concepts = await this.pharmacyRepo.findConcepts(
      em,
      unique(
        products
          .map((product) => product.medicationConceptId)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const conceptById = new Map(
      concepts.map((concept) => [concept.id, concept]),
    );
    const stockByProduct = aggregateStock(positions);

    const items = products
      .map((product) => {
        const stock = stockByProduct.get(product.id)!;
        return {
          productId: product.id,
          productCode: product.productCode,
          brandName: product.brandName ?? null,
          genericName: product.genericName ?? null,
          strengthText: product.strengthText ?? null,
          packageSizeText: product.packageSizeText ?? null,
          medication: optionalConcept(conceptById, product.medicationConceptId),
          onHandQuantity: stock.onHand,
          reservedQuantity: stock.reserved,
          availableQuantity: stock.available,
          locationCount: stock.locationCount,
        };
      })
      .sort((a, b) =>
        (a.genericName ?? a.productCode).localeCompare(
          b.genericName ?? b.productCode,
        ),
      );

    return {
      siteId: site.id,
      siteName: site.name,
      pharmacyId: pharmacy.id,
      pharmacyName: pharmacyName(pharmacy),
      items,
      count: items.length,
    };
  }

  /**
   * Qué sedes del tenant pueden surtir un conjunto de productos, ya ordenadas.
   *
   * Los productos llegan por id (los devuelve la búsqueda del directorio, que
   * ya sabe acotar por texto o por `medication_concept_id` del vademécum). El
   * cruce entre farmacias sale solo: cada sede sólo puede tener stock de los
   * productos de su propia farmacia, y los demás le cuentan como faltantes.
   *
   * @param productIds - Productos solicitados (deduplicados por el pipe).
   * @param origin - Punto desde el que medir distancia, si la consulta lo trae.
   * @param limit - Tope de sedes servidas.
   */
  async availability(
    productIds: readonly string[],
    origin: GeoPoint | undefined,
    limit: number = DEFAULT_AVAILABILITY_LIMIT,
  ): Promise<AvailabilityResponseDto> {
    const tenantId = marketplaceTenantScope();
    const em = this.em.fork();

    // Sólo productos activos de farmacias publicadas del tenant: un id ajeno
    // o retirado simplemente no aparece — y contará como faltante en cada sede.
    const [pharmacies, requested] = await Promise.all([
      this.pharmacyRepo.findVisibleByTenant(em, tenantId),
      // Lo que la farmacia marcó «no tengo» no surte un pedido (P47).
      this.pharmacyRepo.findSellableProductsByIds(em, productIds),
    ]);
    const visiblePharmacyIds = new Set(
      pharmacies.map((pharmacy) => pharmacy.id),
    );
    const products = requested.filter((product) =>
      visiblePharmacyIds.has(product.pharmacyId),
    );
    if (products.length === 0) {
      return { requestedProductIds: [...productIds], items: [], count: 0 };
    }

    // Todas las sedes de las farmacias que publican alguno de los productos.
    const ownerIds = unique(products.map((product) => product.pharmacyId));
    const sites = await this.pharmacyRepo.findActiveSites(em, ownerIds);

    const now = new Date();
    const [availabilityRows, locations, allPriceLists, practiceContext] =
      await Promise.all([
        // La regla única de existencias por sede (A1): lotes si el producto
        // tiene posición en la sede, lo declarado en el catálogo si no.
        this.inventoryRepo.findSiteProductAvailability(
          em,
          sites.map((site) => site.id),
          products.map((product) => product.id),
        ),
        this.inventoryRepo.findActiveLocationsBySites(
          em,
          sites.map((site) => site.id),
        ),
        this.pharmacyRepo.findCurrentPublicPriceLists(em, ownerIds, now),
        this.resolveAddresses(em, sites),
      ]);
    // El repo ya excluye lo ligado a aseguradora; el filtro acá vuelve a
    // afirmarlo: al directorio sólo llega precio de mostrador.
    const priceLists = allPriceLists.filter(isRetailList);
    // Las posiciones del libro ya no deciden qué hay (eso es la regla de
    // arriba): sólo fechan lo que respalda el stock de cada sede que lleva
    // lotes (`stockUpdatedAt`). Una sede sin lotes no tiene posiciones, y su
    // fecha queda en `null`: no se inventa una antigüedad.
    const [positions, prices] = await Promise.all([
      this.inventoryRepo.findStockPositions(
        em,
        locations.map((location) => location.id),
        products.map((product) => product.id),
      ),
      this.pharmacyRepo.findCurrentPrices(
        em,
        priceLists.map((list) => list.id),
        products.map((product) => product.id),
        now,
      ),
    ]);
    const siteByLocation = new Map(
      locations.map((location) => [location.id, location.pharmacySiteId]),
    );
    const concepts = await this.pharmacyRepo.findConcepts(
      em,
      unique(
        [
          ...products.map((product) => product.medicationConceptId),
          ...priceLists.map((list) => list.currencyConceptId),
        ].filter((id): id is string => Boolean(id)),
      ),
    );

    const conceptById = new Map(
      concepts.map((concept) => [concept.id, concept]),
    );
    const pharmacyById = new Map(
      pharmacies.map((pharmacy) => [pharmacy.id, pharmacy]),
    );
    const listById = new Map(priceLists.map((list) => [list.id, list]));

    // Disponible por sede y producto: la fila existe sólo si está disponible;
    // la cantidad es `null` si no tiene posición y no se declaró conteo.
    const availableBySite = new Map<string, Map<string, number | null>>();
    for (const row of availabilityRows) {
      const perProduct =
        availableBySite.get(row.siteId) ?? new Map<string, number | null>();
      perProduct.set(
        row.productId,
        row.availableQuantity === null ? null : quantity(row.availableQuantity),
      );
      availableBySite.set(row.siteId, perProduct);
    }
    const stockUpdatedAtBySite = oldestStockUpdateBySite(
      positions,
      siteByLocation,
    );

    const items = sites
      .map((site): AvailabilitySiteDto => ({
        ...this.toAvailabilitySite(
          site,
          pharmacyById.get(site.pharmacyId)!,
          productIds,
          products,
          availableBySite.get(site.id) ?? new Map(),
          prices,
          listById,
          conceptById,
          practiceContext.get(site.id),
          origin,
        ),
        stockUpdatedAt:
          stockUpdatedAtBySite.get(site.id)?.toISOString() ?? null,
      }))
      // Una sede sin ninguno de los solicitados no es una candidata: servirla
      // sería ruido, no información.
      .filter((item) => item.availableCount > 0)
      .sort(compareAvailability)
      .slice(0, limit);

    return { requestedProductIds: [...productIds], items, count: items.length };
  }

  /** Dirección por sede: pharmacy_site → practice_site → common.addresses. */
  private async resolveAddresses(
    em: EntityManager,
    sites: readonly PharmacySiteSnapshot[],
  ): Promise<Map<string, PharmacyAddressSnapshot>> {
    const practiceSites = await this.pharmacyRepo.findPracticeSites(
      em,
      unique(sites.map((site) => site.practiceSiteId)),
    );
    const addresses = await this.pharmacyRepo.findAddresses(
      em,
      unique(
        practiceSites
          .map((site) => site.addressId)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const addressById = new Map(
      addresses.map((address) => [address.id, address]),
    );
    const practiceSiteById = new Map(
      practiceSites.map((site) => [site.id, site]),
    );
    const result = new Map<string, PharmacyAddressSnapshot>();
    for (const site of sites) {
      const addressId = practiceSiteById.get(site.practiceSiteId)?.addressId;
      const address = addressId ? addressById.get(addressId) : undefined;
      if (address) result.set(site.id, address);
    }
    return result;
  }

  /**
   * Compone la candidatura de una sede: cobertura, precios y distancia.
   *
   * Los faltantes se miden contra los **ids solicitados**, no contra los
   * productos que se pudieron resolver: un id retirado, ajeno o inexistente
   * cuenta como faltante en todas las sedes — desaparecerlo en silencio haría
   * que una sede se declare completa sobre un pedido que no cubrió.
   */
  private toAvailabilitySite(
    site: PharmacySiteSnapshot,
    pharmacy: PharmacySnapshot,
    requestedIds: readonly string[],
    requested: readonly PharmacyProductSnapshot[],
    availableByProduct: ReadonlyMap<string, number | null>,
    prices: readonly PharmacyProductPriceSnapshot[],
    listById: ReadonlyMap<string, PharmacyPriceListSnapshot>,
    conceptById: ReadonlyMap<string, PharmacyConceptSnapshot>,
    address: PharmacyAddressSnapshot | undefined,
    origin: GeoPoint | undefined,
  ): Omit<AvailabilitySiteDto, 'stockUpdatedAt'> {
    const available = requested.filter(
      (product) =>
        product.pharmacyId === site.pharmacyId &&
        availableByProduct.has(product.id),
    );
    const availableIds = new Set(available.map((product) => product.id));
    const missing = requestedIds.filter((id) => !availableIds.has(id));

    const productItems = available.map((product) => ({
      productId: product.id,
      productCode: product.productCode,
      brandName: product.brandName ?? null,
      genericName: product.genericName ?? null,
      strengthText: product.strengthText ?? null,
      packageSizeText: product.packageSizeText ?? null,
      medication: optionalConcept(conceptById, product.medicationConceptId),
      availableQuantity: availableByProduct.get(product.id) ?? null,
      price: currentPriceFor(
        product.id,
        site.id,
        prices,
        listById,
        conceptById,
      ),
    }));

    const { totalAmount, currency } = totalOf(productItems);
    const latitude = coordinate(address?.latitude);
    const longitude = coordinate(address?.longitude);

    return {
      siteId: site.id,
      siteName: site.name,
      pharmacyId: pharmacy.id,
      pharmacyName: pharmacyName(pharmacy),
      addressText: address ? addressText(address) : null,
      latitude,
      longitude,
      distanceKm:
        origin && latitude !== null && longitude !== null
          ? haversineKm(origin, { lat: latitude, lng: longitude })
          : null,
      homeDeliveryAvailable: site.homeDeliveryAvailable ?? null,
      pickupAvailable: site.pickupAvailable ?? null,
      complete: missing.length === 0,
      availableCount: available.length,
      missingProductIds: [...missing],
      totalAmount,
      currency,
      products: productItems,
    };
  }
}

/** El nombre con que la farmacia se muestra: comercial, o la razón social. */
function pharmacyName(pharmacy: PharmacySnapshot): string {
  const trade = pharmacy.tradeName?.trim();
  return trade && trade !== '' ? trade : pharmacy.legalName;
}

/** La dirección en una línea, o null si no tiene ninguna parte con texto. */
function addressText(address: PharmacyAddressSnapshot): string | null {
  const parts = [address.lines, address.city, address.postalCode]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return parts.length === 0 ? null : parts.join(', ');
}

/** Una coordenada `numeric` (string de BD) como número, o null. */
function coordinate(value: string | undefined): number | null {
  if (value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Por sede, el `updated_at` más viejo de las posiciones que respaldan stock
 * disponible. Una posición sin cantidad disponible no afirma nada y no cuenta;
 * una fecha ausente o ilegible tampoco: no se inventa una antigüedad.
 */
function oldestStockUpdateBySite(
  positions: readonly InventoryStockPositions[],
  siteByLocation: ReadonlyMap<string, string>,
): Map<string, Date> {
  const oldest = new Map<string, Date>();
  for (const position of positions) {
    const siteId = siteByLocation.get(position.inventoryLocationId);
    const updatedAt: Date | undefined = position.updatedAt;
    if (
      !siteId ||
      quantity(position.availableQuantity) <= 0 ||
      !(updatedAt instanceof Date) ||
      Number.isNaN(updatedAt.getTime())
    ) {
      continue;
    }
    const current = oldest.get(siteId);
    if (!current || updatedAt < current) oldest.set(siteId, updatedAt);
  }
  return oldest;
}

/** Una cantidad `numeric` (string de BD) como número; lo ilegible cuenta 0. */
function quantity(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Distancia Haversine en km entre dos puntos WGS84, con un decimal.
 *
 * Es distancia en línea recta sobre la esfera media terrestre — suficiente
 * para ordenar sedes de una ciudad; no pretende ser distancia de ruta.
 */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (degrees: number): number => (degrees * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const withoutLat = Math.sin(dLat / 2);
  const withoutLng = Math.sin(dLng / 2);
  const h =
    withoutLat * withoutLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * withoutLng * withoutLng;
  const distance = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
  return Math.round(distance * 10) / 10;
}

/**
 * El precio vigente de un producto en una sede: gana la lista propia de la
 * sede sobre la lista general de la farmacia; a igualdad, el más barato para
 * el paciente.
 */
function currentPriceFor(
  productId: string,
  siteId: string,
  prices: readonly PharmacyProductPriceSnapshot[],
  listById: ReadonlyMap<string, PharmacyPriceListSnapshot>,
  conceptById: ReadonlyMap<string, PharmacyConceptSnapshot>,
): AvailabilityPriceDto | null {
  // La elección vive en el módulo compartido: el pedido congela con la MISMA
  // regla con la que este comparador muestra (cierre de farmacia, v4.2.1).
  const winner = winningPriceFor(productId, siteId, prices, listById);
  if (!winner) return null;
  return {
    unitAmount: winner.price.unitAmount,
    patientAmount: winner.price.patientAmount ?? null,
    currency: optionalConcept(conceptById, winner.list.currencyConceptId),
    priceListCode: winner.list.code,
  };
}

/**
 * Suma de precios de los disponibles. Si a alguno le falta precio o las
 * monedas difieren, no hay total: una suma con huecos o que mezcla monedas
 * afirma un costo que nadie publicó.
 */
function totalOf(
  products: readonly {
    price: AvailabilityPriceDto | null;
  }[],
): { totalAmount: string | null; currency: InventoryConceptDto | null } {
  if (products.length === 0) return { totalAmount: null, currency: null };
  const priced = products
    .map((product) => product.price)
    .filter((price): price is AvailabilityPriceDto => price !== null);
  if (priced.length !== products.length) {
    return { totalAmount: null, currency: null };
  }
  const currencies = new Set(priced.map((price) => price.currency?.code));
  if (currencies.size > 1) return { totalAmount: null, currency: null };

  return {
    totalAmount: sumAmounts(
      priced.map((price) => price.patientAmount ?? price.unitAmount),
    ),
    currency: priced[0].currency ?? null,
  };
}

/** El orden de candidatura: completas, cerca, baratas, y por nombre. */
export function compareAvailability(
  a: AvailabilitySiteDto,
  b: AvailabilitySiteDto,
): number {
  if (a.complete !== b.complete) return a.complete ? -1 : 1;
  const byDistance = nullsLast(a.distanceKm, b.distanceKm);
  if (byDistance !== 0) return byDistance;
  const byTotal = nullsLast(
    a.totalAmount === null ? null : Number(a.totalAmount),
    b.totalAmount === null ? null : Number(b.totalAmount),
  );
  if (byTotal !== 0) return byTotal;
  return a.siteName.localeCompare(b.siteName);
}

/** Ascendente con null al final: lo desconocido no puede ganar el orden. */
function nullsLast(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

function optionalConcept(
  concepts: ReadonlyMap<string, PharmacyConceptSnapshot>,
  id: string | undefined,
): InventoryConceptDto | null {
  const value = id === undefined ? undefined : concepts.get(id);
  return value ? { code: value.code, display: value.display } : null;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

/**
 * Agrega posiciones por producto: sumas y en cuántas ubicaciones está. La
 * cuarentena no sale de acá: es estado interno del ledger, no dato del
 * directorio — ya está descontada del `available`.
 */
function aggregateStock(positions: readonly InventoryStockPositions[]): Map<
  string,
  {
    onHand: number;
    reserved: number;
    available: number;
    locationCount: number;
  }
> {
  const sums = new Map<
    string,
    {
      onHand: number;
      reserved: number;
      available: number;
      // Ubicaciones DISTINTAS: dos lotes en el mismo estante son una sola.
      locations: Set<string>;
    }
  >();
  for (const position of positions) {
    const current = sums.get(position.pharmacyProductId) ?? {
      onHand: 0,
      reserved: 0,
      available: 0,
      locations: new Set<string>(),
    };
    current.onHand += quantity(position.onHandQuantity);
    current.reserved += quantity(position.reservedQuantity);
    current.available += quantity(position.availableQuantity);
    current.locations.add(position.inventoryLocationId);
    sums.set(position.pharmacyProductId, current);
  }
  return new Map(
    [...sums].map(([productId, sum]) => [
      productId,
      {
        onHand: sum.onHand,
        reserved: sum.reserved,
        available: sum.available,
        locationCount: sum.locations.size,
      },
    ]),
  );
}
