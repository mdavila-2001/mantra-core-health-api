import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CommunityRatingsService } from '../../community/services';
import {
  DiagnosticUnitsReadRepository,
  type SearchDiagnosticUnitsCriteria,
} from '../repositories';
import { DUNIT } from '../diagnostic_units.concepts';
import {
  CATALOG_MAX_LIMIT,
  type DiagnosticUnitKind,
  type DiagnosticUnitSearchItemDto,
  type SearchDiagnosticUnitsQueryDto,
  type SearchDiagnosticUnitsResponseDto,
} from '../dto';
import type { CatalogConcepts } from '../../terminology/entities';
import type { DiagnosticUnits } from '../entities';

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
    const restrictToUnitIds = intersect(restrictions);
    if (restrictToUnitIds !== undefined && restrictToUnitIds.length === 0) {
      return { items: [], total: 0, limit, offset };
    }

    const criteria: SearchDiagnosticUnitsCriteria = {
      q: query.q,
      tenantId: query.tenantId,
      diagnosticUnitTypeConceptId:
        query.kind === undefined ? undefined : KIND_CONCEPT[query.kind],
      homeCollection: booleanValue(query.homeCollection),
      walkIn: booleanValue(query.walkIn),
      acceptsExternalOrders: booleanValue(query.acceptsExternalOrders),
      restrictToUnitIds,
    };

    const [unidades, total] = await Promise.all([
      this.readRepo.searchVisible(em, criteria, limit, offset),
      this.readRepo.countVisible(em, criteria),
    ]);
    if (unidades.length === 0) {
      return { items: [], total, limit, offset };
    }

    const items = await this.project(em, unidades);

    // Precio y calificación se filtran **después** de proyectar porque los dos
    // son agregados de otras tablas —el mínimo de una tarifa, la media de unas
    // reseñas—: expresarlos como criterio del `find` obligaría a un subquery
    // por fila, que es peor que recortar una página ya traída.
    const filtered = items.filter(
      (item) =>
        (query.maxAmount === undefined ||
          (item.minAmount !== null && item.minAmount <= query.maxAmount)) &&
        (query.minRating === undefined ||
          (item.rating !== null && item.rating >= query.minRating)),
    );

    // El total se corrige cuando esos filtros recortaron: decir «hay 40» y
    // devolver 3 haría paginar hacia páginas vacías.
    const totalReal =
      filtered.length === items.length ? total : offset + filtered.length;

    return { items: filtered, total: totalReal, limit, offset };
  }

  /** Proyecta las unidades a tarjetas, con sus contadores, nota y precio. */
  private async project(
    em: EntityManager,
    units: readonly DiagnosticUnits[],
  ): Promise<DiagnosticUnitSearchItemDto[]> {
    const ids = units.map((unit) => unit.id);
    const ahora = new Date();

    const [sitios, ofertas, conceptos, cronogramas, notas] = await Promise.all([
      this.readRepo.findActiveSites(em, ids),
      this.readRepo.findActiveOfferings(em, ids),
      this.readRepo.findConcepts(em, [
        ...new Set(units.map((u) => u.diagnosticUnitTypeConceptId)),
      ]),
      this.readRepo.findCurrentPublicSchedulesFor(em, ids, ahora),
      this.ratings.ratingsByProfiles(
        em,
        units
          .map((unit) => unit.publicProfileId)
          .filter((profile): profile is string => profile !== undefined),
      ),
    ]);

    const teams = await this.readRepo.findEquipment(
      em,
      sitios.map((sitio) => sitio.id),
    );
    const prices = await this.readRepo.findCurrentPricesForSchedules(
      em,
      cronogramas.map((schedule) => schedule.id),
      ahora,
    );

    // CL-45/CL-51: ciudad de cada sede, siguiendo el mismo salto que ya usa la
    // consola de administración (C16): sede del centro → sede de `practice` →
    // dirección de `common`.
    const practiceSites = await this.readRepo.findPracticeSites(
      em,
      sitios.map((sitio) => sitio.practiceSiteId),
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
      conceptos.map((concept) => [concept.id, concept]),
    );
    const unitBySite = new Map(
      sitios.map((sitio) => [sitio.id, sitio.diagnosticUnitId]),
    );
    const unitBySchedule = new Map(
      cronogramas.map((schedule) => [schedule.id, schedule.diagnosticUnitId]),
    );
    const currencyBySchedule = new Map(
      cronogramas.map((schedule) => [schedule.id, schedule.currencyConceptId]),
    );

    const sitesByUnit = countBy(sitios, (s) => s.diagnosticUnitId);
    const studiesByUnit = countBy(ofertas, (o) => o.diagnosticUnitId);
    const teamsByUnit = countBy(teams, (e) =>
      unitBySite.get(e.diagnosticUnitSiteId),
    );

    const citiesByUnit = new Map<string, Set<string>>();
    for (const sitio of sitios) {
      const city = cityByPracticeSiteId.get(sitio.practiceSiteId);
      if (city === undefined) continue;
      const set = citiesByUnit.get(sitio.diagnosticUnitId) ?? new Set();
      set.add(city);
      citiesByUnit.set(sitio.diagnosticUnitId, set);
    }

    const minimumByUnit = new Map<string, number>();
    const minimumCurrencyByUnit = new Map<string, string | undefined>();
    for (const price of prices) {
      const unitId = unitBySchedule.get(price.priceScheduleId);
      if (unitId === undefined) continue;
      // Se compara el importe **base publicado**, que es el que el centro
      // muestra en su tarifa. `patient_amount` puede no estar fijado y usar uno
      // u otro según la fila haría comparar peras con manzanas entre centros.
      const amount = numero(price.baseAmount);
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
          : notas.get(unit.publicProfileId);
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
function numero(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
