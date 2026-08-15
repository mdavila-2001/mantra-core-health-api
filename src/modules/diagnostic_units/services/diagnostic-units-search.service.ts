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
    const restricciones: string[][] = [];
    if (query.studyCode !== undefined && query.studyCode !== '') {
      restricciones.push(
        await this.readRepo.findUnitIdsOfferingStudy(em, query.studyCode),
      );
    }
    if (query.insurerTenantId !== undefined) {
      restricciones.push(
        await this.readRepo.findUnitIdsWithInsurerAgreement(
          em,
          query.insurerTenantId,
        ),
      );
    }
    const restrictToUnitIds = intersectar(restricciones);
    if (restrictToUnitIds !== undefined && restrictToUnitIds.length === 0) {
      return { items: [], total: 0, limit, offset };
    }

    const criteria: SearchDiagnosticUnitsCriteria = {
      q: query.q,
      tenantId: query.tenantId,
      diagnosticUnitTypeConceptId:
        query.kind === undefined ? undefined : KIND_CONCEPT[query.kind],
      homeCollection: booleano(query.homeCollection),
      walkIn: booleano(query.walkIn),
      acceptsExternalOrders: booleano(query.acceptsExternalOrders),
      restrictToUnitIds,
    };

    const [unidades, total] = await Promise.all([
      this.readRepo.searchVisible(em, criteria, limit, offset),
      this.readRepo.countVisible(em, criteria),
    ]);
    if (unidades.length === 0) {
      return { items: [], total, limit, offset };
    }

    const items = await this.proyectar(em, unidades);

    // Precio y calificación se filtran **después** de proyectar porque los dos
    // son agregados de otras tablas —el mínimo de una tarifa, la media de unas
    // reseñas—: expresarlos como criterio del `find` obligaría a un subquery
    // por fila, que es peor que recortar una página ya traída.
    const filtrados = items.filter(
      (item) =>
        (query.maxAmount === undefined ||
          (item.minAmount !== null && item.minAmount <= query.maxAmount)) &&
        (query.minRating === undefined ||
          (item.rating !== null && item.rating >= query.minRating)),
    );

    // El total se corrige cuando esos filtros recortaron: decir «hay 40» y
    // devolver 3 haría paginar hacia páginas vacías.
    const totalReal =
      filtrados.length === items.length ? total : offset + filtrados.length;

    return { items: filtrados, total: totalReal, limit, offset };
  }

  /** Proyecta las unidades a tarjetas, con sus contadores, nota y precio. */
  private async proyectar(
    em: EntityManager,
    unidades: readonly DiagnosticUnits[],
  ): Promise<DiagnosticUnitSearchItemDto[]> {
    const ids = unidades.map((unidad) => unidad.id);
    const ahora = new Date();

    const [sitios, ofertas, conceptos, cronogramas, notas] = await Promise.all([
      this.readRepo.findActiveSites(em, ids),
      this.readRepo.findActiveOfferings(em, ids),
      this.readRepo.findConcepts(em, [
        ...new Set(unidades.map((u) => u.diagnosticUnitTypeConceptId)),
      ]),
      this.readRepo.findCurrentPublicSchedulesFor(em, ids, ahora),
      this.ratings.ratingsByProfiles(
        em,
        unidades
          .map((unidad) => unidad.publicProfileId)
          .filter((perfil): perfil is string => perfil !== undefined),
      ),
    ]);

    const equipos = await this.readRepo.findEquipment(
      em,
      sitios.map((sitio) => sitio.id),
    );
    const precios = await this.readRepo.findCurrentPricesForSchedules(
      em,
      cronogramas.map((cronograma) => cronograma.id),
      ahora,
    );

    const conceptoPorId = new Map(
      conceptos.map((concepto) => [concepto.id, concepto]),
    );
    const unidadPorSitio = new Map(
      sitios.map((sitio) => [sitio.id, sitio.diagnosticUnitId]),
    );
    const unidadPorCronograma = new Map(
      cronogramas.map((cronograma) => [
        cronograma.id,
        cronograma.diagnosticUnitId,
      ]),
    );

    const sitiosPorUnidad = contarPor(sitios, (s) => s.diagnosticUnitId);
    const estudiosPorUnidad = contarPor(ofertas, (o) => o.diagnosticUnitId);
    const equiposPorUnidad = contarPor(equipos, (e) =>
      unidadPorSitio.get(e.diagnosticUnitSiteId),
    );

    const minimoPorUnidad = new Map<string, number>();
    for (const precio of precios) {
      const unidadId = unidadPorCronograma.get(precio.priceScheduleId);
      if (unidadId === undefined) continue;
      // Se compara el importe **base publicado**, que es el que el centro
      // muestra en su tarifa. `patient_amount` puede no estar fijado y usar uno
      // u otro según la fila haría comparar peras con manzanas entre centros.
      const importe = numero(precio.baseAmount);
      if (importe === undefined) continue;
      const previo = minimoPorUnidad.get(unidadId);
      if (previo === undefined || importe < previo) {
        minimoPorUnidad.set(unidadId, importe);
      }
    }

    return unidades.map((unidad) => {
      const nota =
        unidad.publicProfileId === undefined
          ? undefined
          : notas.get(unidad.publicProfileId);
      return {
        id: unidad.id,
        tenantId: unidad.tenantId,
        code: unidad.code,
        name: unidad.name,
        type: concepto(conceptoPorId.get(unidad.diagnosticUnitTypeConceptId)),
        siteCount: sitiosPorUnidad.get(unidad.id) ?? 0,
        equipmentCount: equiposPorUnidad.get(unidad.id) ?? 0,
        studyCount: estudiosPorUnidad.get(unidad.id) ?? 0,
        acceptsExternalOrders: unidad.acceptsExternalOrders ?? null,
        walkInAvailable: unidad.walkInAvailable ?? null,
        homeCollectionAvailable: unidad.homeCollectionAvailable ?? null,
        rating: nota?.average ?? null,
        ratingCount: nota?.count ?? 0,
        minAmount: minimoPorUnidad.get(unidad.id) ?? null,
      };
    });
  }
}

/**
 * El concepto legible, o su forma vacía.
 *
 * Nunca devuelve el uuid: un identificador en pantalla no le dice nada a nadie.
 */
function concepto(entrada: CatalogConcepts | undefined): {
  /** Código del concepto. */
  code: string;
  /** Etiqueta legible. */
  display: string;
} {
  return {
    code: entrada?.code ?? '',
    display: entrada?.display ?? '',
  };
}

/** Cuenta elementos por la clave que devuelve `key`, salteando las vacías. */
function contarPor<T>(
  items: readonly T[],
  key: (item: T) => string | undefined,
): Map<string, number> {
  const conteo = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (k === undefined) continue;
    conteo.set(k, (conteo.get(k) ?? 0) + 1);
  }
  return conteo;
}

/** La intersección de las listas, o nada si no hubo ninguna. */
function intersectar(listas: readonly string[][]): string[] | undefined {
  if (listas.length === 0) return undefined;
  return listas.reduce((acumulado, lista) => {
    const conjunto = new Set(lista);
    return acumulado.filter((id) => conjunto.has(id));
  });
}

/** El texto de la query como booleano, o nada si no vino. */
function booleano(value: string | undefined): boolean | undefined {
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
