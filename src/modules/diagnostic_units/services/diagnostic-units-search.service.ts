import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { coordinateOf, straightLineKm, type GeoPoint } from '../../../common';
import { CommunityRatingsService } from '../../community/services';
import {
  DiagnosticUnitsReadRepository,
  type SearchDiagnosticUnitsCriteria,
} from '../repositories';
import { DUNIT } from '../diagnostic_units.concepts';
import {
  CATALOG_MAX_LIMIT,
  type DiagnosticUnitCoverageItem,
  type DiagnosticUnitCoveragePage,
  type DiagnosticUnitKind,
  type DiagnosticUnitSearchItemDto,
  type SearchDiagnosticUnitsQueryDto,
  type SearchDiagnosticUnitsResponseDto,
} from '../dto';
import type { CatalogConcepts } from '../../terminology/entities';
import type { Addresses } from '../../common/entities';
import type { DiagnosticUnitSites, DiagnosticUnits } from '../entities';

/** Tipo pedido por el buscador → concepto de tipo de unidad. */
const KIND_CONCEPT: Readonly<Record<DiagnosticUnitKind, string>> = {
  LABORATORY: DUNIT.UNIT_TYPE_LABORATORY,
  IMAGING: DUNIT.UNIT_TYPE_IMAGING,
};

const DEFAULT_LIMIT = 20;

/**
 * El buscador de centros de diagnóstico, laboratorio e imagen.
 *
 * ## Por qué no alcanzaba con el directorio
 *
 * `DiagnosticUnitsReadService.list()` contesta «qué centros publicados tiene mi
 * organización»: sin filtros y acotado al `X-Tenant-Id`. Es la lectura correcta
 * para el personal, y **no** es la que la especificación le pide al portal del
 * paciente, que es «dónde me hago este estudio»: entre todos los centros de la
 * plataforma, filtrando por tipo, estudio, prestaciones, convenio, precio y
 * calificación. Son dos preguntas distintas sobre las mismas tablas, así que
 * este servicio comparte el repositorio del directorio en vez de duplicarlo.
 *
 * ## Qué se ve
 *
 * Sólo centros **activos y verificados**, con el mismo filtro de publicación
 * que el directorio, y sólo tarifas marcadas como públicas: lo que un centro
 * negoció con una aseguradora es una condición comercial de un tercero.
 */
@Injectable()
export class DiagnosticUnitsSearchService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param readRepo - Consultas del catálogo, compartidas con el directorio.
   * @param ratings - Calificación pública, encapsulada por Community.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly readRepo: DiagnosticUnitsReadRepository,
    private readonly ratings: CommunityRatingsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DiagnosticUnitsSearchService.name);
  }

  /**
   * Busca centros publicados.
   *
   * @param query - Filtros del buscador.
   * @returns La página de centros.
   */
  async search(
    query: SearchDiagnosticUnitsQueryDto,
  ): Promise<SearchDiagnosticUnitsResponseDto> {
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, CATALOG_MAX_LIMIT);
    const offset = query.offset ?? 0;
    const em = this.em.fork();

    this.logger.info(
      {
        operation: 'diagnostic_units.search',
        limit,
        offset,
        porEstudio: query.studyCode !== undefined,
        porAseguradora: query.insurerTenantId !== undefined,
      },
      'Buscando centros de diagnóstico',
    );

    // Los filtros que viven en otras tablas se resuelven primero y **acotan** la
    // búsqueda. Cuando alguno no encuentra nada, la respuesta es vacía sin
    // seguir consultando.
    const restrictToUnitIds = intersect(await this.restrictions(em, query));
    if (restrictToUnitIds !== undefined && restrictToUnitIds.length === 0) {
      return { items: [], total: 0, limit, offset };
    }

    const criteria = criteriaFor(query, restrictToUnitIds);
    const [units, total] = await Promise.all([
      this.readRepo.searchVisible(em, criteria, limit, offset),
      this.readRepo.countVisible(em, criteria),
    ]);
    if (units.length === 0) {
      return { items: [], total, limit, offset };
    }

    const items = await this.project(em, units);
    const filtered = withinPriceAndRating(items, query);

    // El total se corrige cuando esos filtros recortaron: decir «hay 40» y
    // devolver 3 haría paginar hacia páginas vacías.
    const totalReal =
      filtered.length === items.length ? total : offset + filtered.length;

    return { items: filtered, total: totalReal, limit, offset };
  }

  /**
   * Busca centros por cobertura de un conjunto de estudios.
   *
   * Entran los centros publicados que ofrecen **al menos uno** de los
   * conceptos pedidos y pasan los mismos filtros del buscador. Cada uno dice si
   * los ofrece todos y cuáles le faltan; los completos van primero, después por
   * distancia en línea recta desde el origen (los que no tienen distancia, al
   * final) y después por nombre.
   *
   * El orden y la página se arman en memoria: la distancia sale de la
   * dirección de la sede principal, dos saltos más allá de la unidad, y no se
   * puede ordenar en SQL sin tocar el esquema. Es lo mismo que hace la
   * disponibilidad de farmacia con los medicamentos.
   *
   * @param query - Filtros del buscador, con `studyConceptIds`.
   * @returns La página de centros, con su cobertura.
   * @throws BadRequestException si llega `lat` sin `lng` o al revés.
   */
  async searchCoverage(
    query: SearchDiagnosticUnitsQueryDto,
  ): Promise<DiagnosticUnitCoveragePage> {
    const requested = query.studyConceptIds ?? [];
    const origin = originOf(query.lat, query.lng);
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, CATALOG_MAX_LIMIT);
    const offset = query.offset ?? 0;
    const empty = { items: [], total: 0, limit, offset };
    const em = this.em.fork();

    this.logger.info(
      {
        operation: 'diagnostic_units.search_coverage',
        limit,
        offset,
        estudios: requested.length,
        conOrigen: origin !== undefined,
      },
      'Buscando centros por cobertura de estudios',
    );

    const offered = await this.readRepo.findOfferedConcepts(em, requested);
    if (offered.size === 0) return empty;

    const restrictToUnitIds = intersect([
      ...(await this.restrictions(em, query)),
      [...offered.keys()],
    ]) as string[];
    if (restrictToUnitIds.length === 0) return empty;

    const criteria = criteriaFor(query, restrictToUnitIds);
    const matching = await this.readRepo.countVisible(em, criteria);
    if (matching === 0) return empty;
    const units = await this.readRepo.searchVisible(em, criteria, matching, 0);

    const cards = withinPriceAndRating(await this.project(em, units), query);
    const places = await this.mainSitePlaces(
      em,
      cards.map((card) => card.id),
    );

    const items = cards
      .map((card): DiagnosticUnitCoverageItem => {
        const offeredHere = offered.get(card.id) ?? new Set<string>();
        const missing = requested.filter((id) => !offeredHere.has(id));
        const place = places.get(card.id);
        const latitude = place?.latitude ?? null;
        const longitude = place?.longitude ?? null;
        return {
          ...card,
          complete: missing.length === 0,
          missingStudyConceptIds: missing,
          distanceKm:
            origin === undefined || latitude === null || longitude === null
              ? null
              : straightLineKm(origin, { lat: latitude, lng: longitude }),
          addressText: place?.addressText ?? null,
          latitude,
          longitude,
        };
      })
      .sort(byCoverage);

    return {
      items: items.slice(offset, offset + limit),
      total: items.length,
      limit,
      offset,
    };
  }

  /**
   * Los filtros que viven en otras tablas, como listas de unidades permitidas.
   *
   * @param em - Contexto de persistencia.
   * @param query - Filtros del buscador.
   * @returns Una lista de ids por filtro pedido; ninguna si no se pidió nada.
   */
  private async restrictions(
    em: EntityManager,
    query: SearchDiagnosticUnitsQueryDto,
  ): Promise<string[][]> {
    const restrictions: string[][] = [];
    if (query.studyCode !== undefined && query.studyCode !== '') {
      restrictions.push(
        await this.readRepo.findUnitIdsOfferingStudy(em, query.studyCode),
      );
    }
    if (query.insurerTenantId !== undefined) {
      restrictions.push(
        await this.readRepo.findUnitIdsWithInsurerAgreement(
          em,
          query.insurerTenantId,
        ),
      );
    }
    return restrictions;
  }

  /**
   * Dirección y coordenadas de la sede principal de cada unidad.
   *
   * La principal es la sede activa con rol `SITE_ROLE_PRIMARY`; si una unidad
   * no tiene ninguna, la primera sede activa, que es el orden en que las da
   * `findActiveSites`. Sigue el mismo salto que la ciudad de las tarjetas:
   * sede del centro → sede de `practice` → dirección de `common`.
   *
   * @param em - Contexto de persistencia.
   * @param unitIds - Las unidades.
   * @returns Por unidad, su lugar; las que no tienen dirección no figuran.
   */
  private async mainSitePlaces(
    em: EntityManager,
    unitIds: readonly string[],
  ): Promise<Map<string, Place>> {
    const sites = await this.readRepo.findActiveSites(em, unitIds);
    const mainSite = new Map<string, DiagnosticUnitSites>();
    for (const site of sites) {
      const current = mainSite.get(site.diagnosticUnitId);
      const isPrimary = site.siteRoleConceptId === DUNIT.SITE_ROLE_PRIMARY;
      const currentIsPrimary =
        current?.siteRoleConceptId === DUNIT.SITE_ROLE_PRIMARY;
      if (current === undefined || (isPrimary && !currentIsPrimary)) {
        mainSite.set(site.diagnosticUnitId, site);
      }
    }

    const practiceSites = await this.readRepo.findPracticeSites(
      em,
      [...mainSite.values()].map((site) => site.practiceSiteId),
    );
    const addressIdByPracticeSite = new Map(
      practiceSites
        .filter((ps) => ps.addressId !== undefined)
        .map((ps) => [ps.id, ps.addressId as string]),
    );
    const addresses = await this.readRepo.findAddresses(em, [
      ...new Set(addressIdByPracticeSite.values()),
    ]);
    const addressById = new Map(addresses.map((a) => [a.id, a]));

    const places = new Map<string, Place>();
    for (const [unitId, site] of mainSite) {
      const addressId = addressIdByPracticeSite.get(site.practiceSiteId);
      const address =
        addressId === undefined ? undefined : addressById.get(addressId);
      if (address === undefined) continue;
      places.set(unitId, placeOf(address));
    }
    return places;
  }

  /** Proyecta las unidades a tarjetas, con sus contadores, nota y precio. */
  private async project(
    em: EntityManager,
    units: readonly DiagnosticUnits[],
  ): Promise<DiagnosticUnitSearchItemDto[]> {
    const ids = units.map((unit) => unit.id);
    const now = new Date();

    const [sites, offers, concepts, schedules, notes] = await Promise.all([
      this.readRepo.findActiveSites(em, ids),
      this.readRepo.findActiveOfferings(em, ids),
      this.readRepo.findConcepts(em, [
        ...new Set(units.map((u) => u.diagnosticUnitTypeConceptId)),
      ]),
      this.readRepo.findCurrentPublicSchedulesFor(em, ids, now),
      this.ratings.ratingsByProfiles(
        em,
        units
          .map((unit) => unit.publicProfileId)
          .filter((profile): profile is string => profile !== undefined),
      ),
    ]);

    const teams = await this.readRepo.findEquipment(
      em,
      sites.map((site) => site.id),
    );
    const prices = await this.readRepo.findCurrentPricesForSchedules(
      em,
      schedules.map((schedule) => schedule.id),
      now,
    );

    // CL-45/CL-51: ciudad de cada sede, siguiendo el mismo salto que ya usa la
    // consola de administración (C16): sede del centro → sede de `practice` →
    // dirección de `common`.
    const practiceSites = await this.readRepo.findPracticeSites(
      em,
      sites.map((site) => site.practiceSiteId),
    );
    const addressIds = practiceSites
      .map((ps) => ps.addressId)
      .filter((id): id is string => id !== undefined);
    const addresses = await this.readRepo.findAddresses(em, addressIds);
    const cityByAddressId = new Map(
      addresses
        .filter((a) => a.city !== undefined && a.city !== '')
        .map((a) => [a.id, a.city as string]),
    );
    const cityByPracticeSiteId = new Map(
      practiceSites
        .map((ps): [string, string] | undefined =>
          ps.addressId === undefined
            ? undefined
            : cityByAddressId.has(ps.addressId)
              ? [ps.id, cityByAddressId.get(ps.addressId) as string]
              : undefined,
        )
        .filter((par): par is [string, string] => par !== undefined),
    );

    const conceptById = new Map(
      concepts.map((concept) => [concept.id, concept]),
    );
    const unitBySite = new Map(
      sites.map((site) => [site.id, site.diagnosticUnitId]),
    );
    const unitBySchedule = new Map(
      schedules.map((schedule) => [schedule.id, schedule.diagnosticUnitId]),
    );
    const currencyBySchedule = new Map(
      schedules.map((schedule) => [schedule.id, schedule.currencyConceptId]),
    );

    const sitesByUnit = countBy(sites, (s) => s.diagnosticUnitId);
    const studiesByUnit = countBy(offers, (o) => o.diagnosticUnitId);
    const teamsByUnit = countBy(teams, (e) =>
      unitBySite.get(e.diagnosticUnitSiteId),
    );

    const citiesByUnit = new Map<string, Set<string>>();
    for (const site of sites) {
      const city = cityByPracticeSiteId.get(site.practiceSiteId);
      if (city === undefined) continue;
      const set = citiesByUnit.get(site.diagnosticUnitId) ?? new Set();
      set.add(city);
      citiesByUnit.set(site.diagnosticUnitId, set);
    }

    const minimumByUnit = new Map<string, number>();
    const minimumCurrencyByUnit = new Map<string, string | undefined>();
    for (const price of prices) {
      const unitId = unitBySchedule.get(price.priceScheduleId);
      if (unitId === undefined) continue;
      // Se compara el importe **base publicado**, que es el que el centro
      // muestra en su tarifa. `patient_amount` puede no estar fijado y usar uno
      // u otro según la fila haría comparar peras con manzanas entre centros.
      const amount = parseAmount(price.baseAmount);
      if (amount === undefined) continue;
      const previous = minimumByUnit.get(unitId);
      if (previous === undefined || amount < previous) {
        minimumByUnit.set(unitId, amount);
        minimumCurrencyByUnit.set(
          unitId,
          currencyBySchedule.get(price.priceScheduleId),
        );
      }
    }
    const currencyConcepts = await this.readRepo.findConcepts(em, [
      ...new Set(
        [...minimumCurrencyByUnit.values()].filter(
          (id): id is string => id !== undefined,
        ),
      ),
    ]);
    const conceptCurrencyById = new Map(currencyConcepts.map((c) => [c.id, c]));

    return units.map((unit) => {
      const note =
        unit.publicProfileId === undefined
          ? undefined
          : notes.get(unit.publicProfileId);
      const conceptCurrencyId = minimumCurrencyByUnit.get(unit.id);
      return {
        id: unit.id,
        tenantId: unit.tenantId,
        code: unit.code,
        name: unit.name,
        type: concept(conceptById.get(unit.diagnosticUnitTypeConceptId)),
        siteCount: sitesByUnit.get(unit.id) ?? 0,
        equipmentCount: teamsByUnit.get(unit.id) ?? 0,
        studyCount: studiesByUnit.get(unit.id) ?? 0,
        acceptsExternalOrders: unit.acceptsExternalOrders ?? null,
        walkInAvailable: unit.walkInAvailable ?? null,
        homeCollectionAvailable: unit.homeCollectionAvailable ?? null,
        rating: note?.average ?? null,
        ratingCount: note?.count ?? 0,
        minAmount: minimumByUnit.get(unit.id) ?? null,
        minAmountCurrency:
          conceptCurrencyId === undefined
            ? null
            : (conceptCurrencyById.get(conceptCurrencyId)?.code ?? null),
        cities: [...(citiesByUnit.get(unit.id) ?? [])].sort(),
      };
    });
  }
}

/**
 * El concepto legible, o su forma vacía.
 *
 * Nunca devuelve el uuid: un identificador en pantalla no le dice nada a nadie.
 */
function concept(entry: CatalogConcepts | undefined): {
  /** Código del concepto. */
  code: string;
  /** Etiqueta legible. */
  display: string;
} {
  return {
    code: entry?.code ?? '',
    display: entry?.display ?? '',
  };
}

/** Cuenta elementos por la clave que devuelve `key`, salteando las vacías. */
function countBy<T>(
  items: readonly T[],
  key: (item: T) => string | undefined,
): Map<string, number> {
  const count = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (k === undefined) continue;
    count.set(k, (count.get(k) ?? 0) + 1);
  }
  return count;
}

/** Dónde queda la sede principal de un centro. */
interface Place {
  /** La dirección en una línea, o `null` si no tiene ninguna parte. */
  readonly addressText: string | null;
  /** Latitud, o `null`. */
  readonly latitude: number | null;
  /** Longitud, o `null`. */
  readonly longitude: number | null;
}

/**
 * La dirección como lugar: una línea legible y sus coordenadas.
 *
 * @param address - La dirección de `common`.
 * @returns El lugar.
 */
function placeOf(address: Addresses): Place {
  const parts = [address.lines, address.city, address.postalCode]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return {
    addressText: parts.length === 0 ? null : parts.join(', '),
    latitude: coordinateOf(address.latitude),
    longitude: coordinateOf(address.longitude),
  };
}

/**
 * El origen pedido: `lat` y `lng` van juntos o no van.
 *
 * El rango ya lo valida el DTO; acá solo falta lo que un validador de campo no
 * ve, que es la pareja.
 *
 * @param lat - Latitud pedida.
 * @param lng - Longitud pedida.
 * @returns El punto, o nada si no se pidió.
 * @throws BadRequestException si llega uno solo.
 */
function originOf(
  lat: number | undefined,
  lng: number | undefined,
): GeoPoint | undefined {
  if (lat === undefined && lng === undefined) return undefined;
  if (lat === undefined || lng === undefined) {
    throw new BadRequestException(
      'lat y lng van juntos: mande ambos para ordenar por distancia, o ninguno',
    );
  }
  return { lat, lng };
}

/**
 * Orden de la cobertura: completos primero, después el más cercano (sin
 * distancia al final) y, a igual distancia, por nombre.
 */
function byCoverage(
  a: DiagnosticUnitCoverageItem,
  b: DiagnosticUnitCoverageItem,
): number {
  if (a.complete !== b.complete) return a.complete ? -1 : 1;
  if (a.distanceKm !== b.distanceKm) {
    if (a.distanceKm === null) return 1;
    if (b.distanceKm === null) return -1;
    return a.distanceKm - b.distanceKm;
  }
  return a.name.localeCompare(b.name, 'es');
}

/** Los filtros del buscador como criterio del repositorio. */
function criteriaFor(
  query: SearchDiagnosticUnitsQueryDto,
  restrictToUnitIds: string[] | undefined,
): SearchDiagnosticUnitsCriteria {
  return {
    q: query.q,
    tenantId: query.tenantId,
    diagnosticUnitTypeConceptId:
      query.kind === undefined ? undefined : KIND_CONCEPT[query.kind],
    homeCollection: booleanValue(query.homeCollection),
    walkIn: booleanValue(query.walkIn),
    acceptsExternalOrders: booleanValue(query.acceptsExternalOrders),
    restrictToUnitIds,
  };
}

/**
 * Las tarjetas que respetan el precio máximo y la nota mínima.
 *
 * Precio y calificación se filtran **después** de proyectar porque los dos son
 * agregados de otras tablas —el mínimo de una tarifa, la media de unas
 * reseñas—: expresarlos como criterio del `find` obligaría a un subquery por
 * fila, que es peor que recortar una página ya traída.
 */
function withinPriceAndRating<T extends DiagnosticUnitSearchItemDto>(
  items: readonly T[],
  query: SearchDiagnosticUnitsQueryDto,
): T[] {
  return items.filter(
    (item) =>
      (query.maxAmount === undefined ||
        (item.minAmount !== null && item.minAmount <= query.maxAmount)) &&
      (query.minRating === undefined ||
        (item.rating !== null && item.rating >= query.minRating)),
  );
}

/** La intersección de las listas, o nada si no hubo ninguna. */
function intersect(lists: readonly string[][]): string[] | undefined {
  if (lists.length === 0) return undefined;
  return lists.reduce((accumulated, list) => {
    const set = new Set(list);
    return accumulated.filter((id) => set.has(id));
  });
}

/** El texto de la query como booleano, o nada si no vino. */
function booleanValue(value: string | undefined): boolean | undefined {
  return value === undefined ? undefined : value === 'true';
}

/**
 * El `numeric` de la base como número, o nada.
 *
 * La columna llega como texto —`numeric` no cabe en un `number` sin perder
 * precisión en el caso general— y para un importe de tarifa la conversión es
 * segura. Se hace en la frontera y no en la pantalla: cada consumidor
 * convirtiendo por su cuenta es cómo se cuela un `NaN` en un precio.
 */
function parseAmount(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
