import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  straightLineKm,
  type GeoPoint,
} from '../../../common/geo/straight-line-distance';
import { ProcedureReferenceReader } from '../../billing/services/procedure-reference.reader';
import {
  MEDICAL_CENTER_DEFAULT_LIMIT,
  MEDICAL_CENTER_MAX_LIMIT,
  type MedicalCenterItemDto,
  type MedicalCenterOfferDto,
  type MedicalCenterPageDto,
  type MedicalCenterSearchQueryDto,
} from '../dto/medical-center-search.dto';
import {
  MedicalCenterOffersPort,
  type SiteOfferRow,
} from '../ports/medical-center.ports';
import { compareMedicalCenters } from './medical-center-ranking';

/** Cómo se arma el resultado, sea del buscador o de las órdenes de un paciente. */
export interface MedicalCenterSearchOptions {
  /** Origen de la distancia. */
  origin?: GeoPoint;
  /** Incluir también los centros que no ofrecen todo. */
  includePartial: boolean;
  /** Solo sedes con algún procedimiento pedido de esta especialidad. */
  specialty?: string;
  /** Solo sedes de esta ciudad. */
  city?: string;
}

/**
 * Búsqueda de centros médicos por cobertura de procedimientos.
 *
 * Una sede entra si ofrece **con precio** al menos uno de los procedimientos
 * pedidos. Cada una dice si los ofrece todos y cuáles le faltan. El orden lo
 * decide {@link compareMedicalCenters} y es el mismo para todos; la página se
 * corta después de ordenar.
 */
@Injectable()
export class MedicalCentersSearchService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param offers - Lo que ofrecen las sedes.
   * @param references - Referencias del nomenclador.
   * @param logger - Logger.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly offers: MedicalCenterOffersPort,
    private readonly references: ProcedureReferenceReader,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MedicalCentersSearchService.name);
  }

  /**
   * `GET /medical-centers/search`.
   *
   * @param query - Filtros ya validados.
   * @returns La página, con `total` antes de paginar.
   * @throws BadRequestException si llega `lat` sin `lng` o al revés.
   */
  async search(
    query: MedicalCenterSearchQueryDto,
  ): Promise<MedicalCenterPageDto> {
    const origin = originOf(query.lat, query.lng);
    const limit = Math.min(
      query.limit ?? MEDICAL_CENTER_DEFAULT_LIMIT,
      MEDICAL_CENTER_MAX_LIMIT,
    );
    const offset = query.offset ?? 0;
    const em = this.em.fork();

    this.logger.info(
      {
        operation: 'medical_centers.search',
        procedimientos: query.procedureConceptIds.length,
        conOrigen: origin !== undefined,
        limit,
        offset,
      },
      'Buscando centros médicos por cobertura',
    );

    const items = await this.searchAll(em, query.procedureConceptIds, {
      origin,
      includePartial: query.includePartial === 'true',
      specialty: query.specialty,
      city: query.city,
    });
    return {
      items: items.slice(offset, offset + limit),
      total: items.length,
      limit,
      offset,
    };
  }

  /**
   * Todas las sedes que cumplen, ya ordenadas y sin paginar.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param requested - Procedimientos pedidos, sin repetidos y en el orden pedido.
   * @param options - Origen y filtros.
   * @returns Las sedes en el orden de la API.
   */
  async searchAll(
    em: EntityManager,
    requested: readonly string[],
    options: MedicalCenterSearchOptions,
  ): Promise<MedicalCenterItemDto[]> {
    if (requested.length === 0) return [];
    const rows = await this.offers.findSiteOffers(em, requested);
    if (rows.length === 0) return [];

    const references = await this.references.referencesFor(
      em,
      rows.map((row) => row.procedureConceptId),
    );

    const items: MedicalCenterItemDto[] = [];
    for (const siteRows of groupBySite(rows).values()) {
      if (!matchesFilters(siteRows, options)) continue;
      const item = toItem(siteRows, requested, references, options.origin);
      if (item.complete || options.includePartial) items.push(item);
    }
    return items.sort(compareMedicalCenters);
  }
}

/**
 * El origen pedido: `lat` y `lng` van juntos o no van.
 *
 * @param lat - Latitud pedida.
 * @param lng - Longitud pedida.
 * @returns El punto, o nada si no se pidió.
 * @throws BadRequestException si llega uno solo.
 */
export function originOf(
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

/** Las ofertas agrupadas por sede, en el orden en que llegaron. */
function groupBySite(
  rows: readonly SiteOfferRow[],
): Map<string, SiteOfferRow[]> {
  const bySite = new Map<string, SiteOfferRow[]>();
  for (const row of rows) {
    const list = bySite.get(row.practiceSiteId) ?? [];
    list.push(row);
    bySite.set(row.practiceSiteId, list);
  }
  return bySite;
}

/** ¿La sede pasa los filtros de especialidad y ciudad? La cobertura no se recorta. */
function matchesFilters(
  siteRows: readonly SiteOfferRow[],
  options: MedicalCenterSearchOptions,
): boolean {
  if (options.city !== undefined) {
    const wanted = normalized(options.city);
    if (normalized(siteRows[0].city ?? '') !== wanted) return false;
  }
  if (options.specialty !== undefined) {
    const wanted = normalized(options.specialty);
    if (
      !siteRows.some((r) => normalized(r.procedureSpecialty ?? '') === wanted)
    )
      return false;
  }
  return true;
}

/** Texto comparable: sin mayúsculas, sin tildes, sin espacios de más. */
function normalized(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

/** Arma la tarjeta de una sede a partir de lo que ofrece de lo pedido. */
function toItem(
  siteRows: readonly SiteOfferRow[],
  requested: readonly string[],
  references: ReadonlyMap<
    string,
    { referencePrice: number | null; referenceUnit: 'UMA' | 'USD' | null }
  >,
  origin: GeoPoint | undefined,
): MedicalCenterItemDto {
  const site = siteRows[0];

  // Un procedimiento no se repite en una sede (índice único); si llegara
  // repetido, vale el precio más bajo, que es el que el paciente pagaría.
  const cheapest = new Map<string, SiteOfferRow>();
  for (const row of siteRows) {
    const current = cheapest.get(row.procedureConceptId);
    if (current === undefined || row.price < current.price) {
      cheapest.set(row.procedureConceptId, row);
    }
  }

  const offers: MedicalCenterOfferDto[] = [];
  const missing: string[] = [];
  for (const conceptId of requested) {
    const row = cheapest.get(conceptId);
    if (row === undefined) {
      missing.push(conceptId);
      continue;
    }
    const reference = references.get(conceptId);
    offers.push({
      procedureConceptId: conceptId,
      procedureDisplay: row.procedureDisplay,
      price: row.price,
      currencyConceptId: row.currencyConceptId,
      referencePrice: reference?.referencePrice ?? null,
      referenceUnit: reference?.referenceUnit ?? null,
      overMargin: null,
    });
  }

  return {
    practiceId: site.practiceId,
    practiceSiteId: site.practiceSiteId,
    name: site.siteName,
    addressText: site.addressText,
    latitude: site.latitude,
    longitude: site.longitude,
    distanceKm:
      origin === undefined || site.latitude === null || site.longitude === null
        ? null
        : straightLineKm(origin, { lat: site.latitude, lng: site.longitude }),
    complete: missing.length === 0,
    missingProcedureConceptIds: missing,
    offers,
    totalPrice: totalOf(offers),
  };
}

/**
 * La suma de lo que la sede cobra por lo pedido.
 *
 * Con más de una moneda no hay suma: sumar bolivianos y dólares pondría un
 * número falso en el precio que ve el paciente, así que el total queda en `null`.
 */
function totalOf(offers: readonly MedicalCenterOfferDto[]): number | null {
  if (offers.length === 0) return null;
  const currencies = new Set(offers.map((offer) => offer.currencyConceptId));
  if (currencies.size > 1) return null;
  const sum = offers.reduce((total, offer) => total + offer.price, 0);
  return Math.round(sum * 100) / 100;
}
