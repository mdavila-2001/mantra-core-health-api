import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { Client } from '@opensearch-project/opensearch';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { OPENSEARCH_CLIENT } from '../providers';
import {
  MAX_FACET_BUCKETS,
  SEARCH_INDEX_REGISTRY,
  TENANT_FIELD,
  type SearchIndexDefinition,
} from '../constants';

/** Punto y radio de una búsqueda «lo más cercano». */
export interface GeoParams {
  /** Campo `geo_point` del índice sobre el que se mide. */
  readonly field: string;
  /** Latitud del observador. */
  readonly lat: number;
  /** Longitud del observador. */
  readonly lng: number;
  /** Radio máximo en kilómetros. */
  readonly radiusKm: number;
  /** Ordenar por distancia ascendente (si no, manda la relevancia). */
  readonly sortByDistance?: boolean;
}

/** Criterio de orden explícito sobre un campo declarado en `sortFields`. */
export interface SortParams {
  /** Campo por el que ordenar. */
  readonly field: string;
  /** Sentido. */
  readonly direction: 'asc' | 'desc';
}

/** Parámetros de una búsqueda tipada (el query DSL nunca lo aporta el cliente). */
export interface SearchParams {
  /**
   * Identificador asociado a tenant.
   */
  readonly tenantId: string;
  /**
   * Valor de query mantenido por la instancia.
   */
  readonly query?: string;
  /**
   * Valor de filters mantenido por la instancia.
   */
  readonly filters?: ReadonlyArray<{
    /**
     * Valor de field mantenido por la instancia.
     */
    field: string; /**
     * Valor de values mantenido por la instancia.
     */
    values: string[];
  }>;
  /**
   * Valor de facets mantenido por la instancia.
   */
  readonly facets?: readonly string[];
  /**
   * Valor de from mantenido por la instancia.
   */
  readonly from?: number;
  /**
   * Valor de size mantenido por la instancia.
   */
  readonly size?: number;
  /** Acotar y ordenar por cercanía a un punto (`geo_distance`). */
  readonly geo?: GeoParams;
  /** Orden explícito; sin él manda la relevancia (`_score`). */
  readonly sort?: readonly SortParams[];
  /**
   * Campo `search_after` de OpenSearch para paginar sin `from` profundo.
   * Se pasa tal cual lo devolvió el acierto anterior.
   */
  readonly searchAfter?: readonly unknown[];
}

/** Un acierto normalizado. */
export interface SearchHit {
  /**
   * Identificador único de la instancia.
   */
  id: string;
  /**
   * Valor de score mantenido por la instancia.
   */
  score: number | null;
  /**
   * Valor de source mantenido por la instancia.
   */
  source: Record<string, unknown>;
  /**
   * Claves de orden del acierto (`sort` de OpenSearch), para `search_after`.
   * Cuando la búsqueda es geográfica, su primer valor es la distancia en km.
   */
  sort?: unknown[];
  /** Distancia en kilómetros al punto pedido, si la búsqueda fue geográfica. */
  distanceKm?: number;
}

/** Resultado de una búsqueda: aciertos + facetas. */
export interface SearchResult {
  /**
   * Valor de total mantenido por la instancia.
   */
  total: number;
  /**
   * Valor de hits mantenido por la instancia.
   */
  hits: SearchHit[];
  /**
   * Valor de facets mantenido por la instancia.
   */
  facets: Record<
    string,
    Array<{
      /**
       * Valor de key mantenido por la instancia.
       */
      key: string; /**
       * Valor de count mantenido por la instancia.
       */
      count: number;
    }>
  >;
}

/** Documento para `bulkIndex` (el `id` es la clave en el índice). */
export interface BulkDocument {
  /**
   * Identificador único de la instancia.
   */
  id: string;
  /**
   * Valor de document mantenido por la instancia.
   */
  document: Record<string, unknown>;
}

/**
 * Servicio de indexación y búsqueda sobre OpenSearch.
 *
 * Dos invariantes de aislamiento, ambas aplicadas aquí (no en el controlador):
 *  1. Cada documento se persiste con `tenantId` fijado por el servidor.
 *  2. Toda búsqueda inyecta un filtro `term { tenantId }` en el `bool` query, de
 *     modo que un tenant jamás ve documentos de otro aunque el índice sea común.
 *
 * Fail-closed: si falta `tenantId` se lanza antes de tocar el cliente.
 */
@Injectable()
export class SearchIndexService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param client - Valor de client requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    @Inject(OPENSEARCH_CLIENT) private readonly client: Client,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SearchIndexService.name);
  }

  /** Comprueba que el cluster responde y no está en estado rojo. */
  async ping(): Promise<void> {
    const response = await this.client.cluster.health({ timeout: '2s' });
    if (response.body.status === 'red') {
      throw new Error('OpenSearch está en estado red');
    }
  }

  /**
   * Crea el índice con sus mappings si aún no existe. Idempotente: si ya existe
   * no lo recrea (y no reescribe mappings, que en OpenSearch no se reducen).
   */
  async ensureIndex(name: string): Promise<{
    /**
     * Valor de created mantenido por la instancia.
     */
    created: boolean;
  }> {
    const def = this.resolveIndex(name);
    const exists = await this.client.indices.exists({ index: def.name });
    if (exists.body === true) {
      return { created: false };
    }
    await this.client.indices.create({
      index: def.name,
      body: {
        // Los `settings` sólo se pueden fijar al crear: OpenSearch no cambia el
        // analizador de un índice vivo. Cambiar el analizador es, por tanto,
        // borrar y reindexar — que es justo lo que `search:reindex` hace.
        ...(def.settings ? { settings: def.settings } : {}),
        mappings: def.mappings,
      },
    });
    this.logger.info({ index: def.name }, 'Índice de búsqueda creado');
    return { created: true };
  }

  /**
   * Borra el índice y lo vuelve a crear con sus `settings` y `mappings` al día.
   *
   * Es la única forma de que un cambio de analizador o de mapping tenga efecto:
   * OpenSearch no reduce mappings ni cambia analizadores sobre un índice vivo.
   * Se usa desde el reindexado completo, nunca desde el camino de escritura
   * normal, porque entre el borrado y el primer lote el índice queda vacío.
   */
  async recreateIndex(name: string): Promise<{
    /** Si existía un índice previo que hubo que borrar. */
    dropped: boolean;
  }> {
    const def = this.resolveIndex(name);
    const exists = await this.client.indices.exists({ index: def.name });
    const dropped = exists.body === true;
    if (dropped) {
      await this.client.indices.delete({ index: def.name });
    }
    await this.ensureIndex(def.name);
    this.logger.info(
      { index: def.name, dropped },
      'Índice de búsqueda recreado',
    );
    return { dropped };
  }

  /** Cuántos documentos tiene el índice para ese tenant (verificación del reindex). */
  async countDocuments(index: string, tenantId: string): Promise<number> {
    this.assertTenant(tenantId);
    const def = this.resolveIndex(index);
    const response = await this.client.count({
      index: def.name,
      body: { query: { term: { [TENANT_FIELD]: tenantId } } },
    });
    return this.asNumber((response.body as { count?: unknown }).count) ?? 0;
  }

  /**
   * Indexa (upsert) un documento. El `tenantId` lo fija el servidor: cualquier
   * `tenantId` presente en `doc` se descarta y se sustituye por el del contexto.
   */
  async indexDocument(
    index: string,
    tenantId: string,
    id: string,
    doc: Record<string, unknown>,
  ): Promise<{
    /**
     * Identificador único de la instancia.
     */
    id: string; /**
     * Valor de result mantenido por la instancia.
     */
    result: string;
  }> {
    this.assertTenant(tenantId);
    const def = this.resolveIndex(index);
    await this.ensureIndex(def.name);

    this.assertIndexableDocument(def, doc);
    const body = { ...doc, [TENANT_FIELD]: tenantId };
    const response = await this.client.index({
      index: def.name,
      id,
      body,
      refresh: true,
    });
    return { id, result: String(response.body.result) };
  }

  /** Indexación por lotes; todos los documentos quedan sellados con `tenantId`. */
  async bulkIndex(
    index: string,
    tenantId: string,
    documents: readonly BulkDocument[],
  ): Promise<{
    /**
     * Valor de indexed mantenido por la instancia.
     */
    indexed: number; /**
     * Valor de errors mantenido por la instancia.
     */
    errors: boolean;
  }> {
    this.assertTenant(tenantId);
    const def = this.resolveIndex(index);
    if (documents.length === 0) {
      return { indexed: 0, errors: false };
    }
    await this.ensureIndex(def.name);

    for (const entry of documents) {
      this.assertIndexableDocument(def, entry.document);
    }
    const operations = documents.flatMap((entry) => [
      { index: { _index: def.name, _id: entry.id } },
      { ...entry.document, [TENANT_FIELD]: tenantId },
    ]);
    const response = await this.client.bulk({
      body: operations,
      refresh: true,
    });
    const errors = response.body.errors === true;
    if (errors) {
      this.logger.warn(
        { index: def.name },
        'La indexación por lotes reportó errores parciales',
      );
    }
    return { indexed: documents.length, errors };
  }

  /**
   * Busca en el índice. Construye el `bool` query desde campos tipados y añade
   * SIEMPRE el filtro de tenant. Los filtros y facetas se validan contra la
   * allowlist del índice; un campo no declarado es un 422 (no un filtro ignorado).
   */
  async search(index: string, params: SearchParams): Promise<SearchResult> {
    this.assertTenant(params.tenantId);
    const def = this.resolveIndex(index);

    const filter: Array<Record<string, unknown>> = [
      { term: { [TENANT_FIELD]: params.tenantId } },
    ];
    for (const clause of params.filters ?? []) {
      this.assertAllowedField(def, clause.field, def.filterFields, 'filtro');
      filter.push({ terms: { [clause.field]: clause.values } });
    }

    const must: Array<Record<string, unknown>> = params.query
      ? [
          {
            multi_match: {
              query: params.query,
              fields: [...def.textFields],
              type: 'best_fields',
            },
          },
        ]
      : [{ match_all: {} }];

    const aggregations: Record<
      string,
      { terms: { field: string; size: number } }
    > = {};
    for (const field of params.facets ?? []) {
      this.assertAllowedField(def, field, def.facetFields, 'faceta');
      aggregations[field] = {
        terms: { field, size: MAX_FACET_BUCKETS },
      };
    }

    // «Más cercana» de verdad: el radio acota en el `filter` (no puntúa) y el
    // orden por distancia se pide aparte, para que un resultado lejano con
    // mejor texto no se cuele por encima del de la esquina.
    const sort: Array<Record<string, unknown> | string> = [];
    if (params.geo) {
      this.assertAllowedField(
        def,
        params.geo.field,
        def.geoFields ?? [],
        'geo',
      );
      filter.push({
        geo_distance: {
          distance: `${params.geo.radiusKm}km`,
          [params.geo.field]: {
            lat: params.geo.lat,
            lon: params.geo.lng,
          },
        },
      });
      if (params.geo.sortByDistance !== false) {
        sort.push({
          _geo_distance: {
            [params.geo.field]: {
              lat: params.geo.lat,
              lon: params.geo.lng,
            },
            order: 'asc',
            unit: 'km',
          },
        });
      }
    }
    for (const clause of params.sort ?? []) {
      this.assertAllowedField(def, clause.field, def.sortFields ?? [], 'orden');
      sort.push({ [clause.field]: { order: clause.direction } });
    }
    // Desempate estable: sin él, dos perfiles con el mismo puntaje pueden
    // alternar de página en página y el cursor se salta filas.
    if (sort.length > 0) {
      sort.push({ _id: { order: 'asc' } });
    }

    const body: Record<string, unknown> = {
      // `search_after` y `from` son excluyentes en OpenSearch: con cursor, el
      // desplazamiento lo marca la clave del último acierto, no un offset.
      ...(params.searchAfter ? {} : { from: params.from ?? 0 }),
      size: params.size ?? 20,
      query: { bool: { must, filter } },
      ...(sort.length > 0 ? { sort } : {}),
      ...(params.searchAfter ? { search_after: [...params.searchAfter] } : {}),
      ...(Object.keys(aggregations).length > 0 ? { aggs: aggregations } : {}),
    };
    const response = await this.client.search({ index: def.name, body });

    return this.normalizeResult(response.body, params.geo !== undefined);
  }

  /** Elimina un documento por id (acotado al índice). */
  async deleteDocument(
    index: string,
    tenantId: string,
    id: string,
  ): Promise<{
    /**
     * Valor de deleted mantenido por la instancia.
     */
    deleted: boolean;
  }> {
    this.assertTenant(tenantId);
    const def = this.resolveIndex(index);
    try {
      const response = await this.client.delete({
        index: def.name,
        id,
        refresh: true,
      });
      return { deleted: response.body.result === 'deleted' };
    } catch (error) {
      if (this.isNotFound(error)) {
        return { deleted: false };
      }
      throw error;
    }
  }

  /**
   * Borra por consulta acotada al tenant (base de un reindex): nunca puede
   * arrastrar documentos de otro tenant porque el filtro de tenant es obligatorio.
   */
  async deleteByQuery(
    index: string,
    tenantId: string,
    filters?: ReadonlyArray<{
      /**
       * Valor de field mantenido por la instancia.
       */
      field: string; /**
       * Valor de values mantenido por la instancia.
       */
      values: string[];
    }>,
  ): Promise<{
    /**
     * Valor de deleted mantenido por la instancia.
     */
    deleted: number;
  }> {
    this.assertTenant(tenantId);
    const def = this.resolveIndex(index);

    const filter: Array<Record<string, unknown>> = [
      { term: { [TENANT_FIELD]: tenantId } },
    ];
    for (const clause of filters ?? []) {
      this.assertAllowedField(def, clause.field, def.filterFields, 'filtro');
      filter.push({ terms: { [clause.field]: clause.values } });
    }

    const response = await this.client.deleteByQuery({
      index: def.name,
      refresh: true,
      body: { query: { bool: { filter } } },
    });
    const deleted =
      (
        response.body as {
          /**
           * Valor de deleted mantenido por la instancia.
           */
          deleted?: number;
        }
      ).deleted ?? 0;
    return { deleted: Number(deleted) };
  }

  // --- Internos -------------------------------------------------------------

  /** Traduce el cuerpo de OpenSearch a la forma normalizada del dominio. */
  private normalizeResult(body: unknown, geo = false): SearchResult {
    const root = this.asRecord(body);
    const hitContainer = this.asRecord(root.hits);
    const rawHits = this.asUnknownArray(hitContainer.hits);
    const totalRecord = this.asRecord(hitContainer.total);
    const totalValue =
      this.asNumber(totalRecord.value) ??
      this.asNumber(hitContainer.total) ??
      0;

    const hits: SearchHit[] = rawHits.map((rawHit) => {
      const hit = this.asRecord(rawHit);
      const sort = this.asUnknownArray(hit.sort);
      // Con orden geográfico, la primera clave de `sort` ES la distancia en km
      // que devolvió OpenSearch: no se recalcula en memoria, que era el defecto
      // que P10 vino a cerrar.
      const distanceKm = geo && sort.length > 0 ? this.asNumber(sort[0]) : null;
      return {
        id: this.asString(hit._id),
        score: this.asNumber(hit._score),
        source: this.asRecord(hit._source),
        ...(sort.length > 0 ? { sort } : {}),
        ...(distanceKm !== null
          ? { distanceKm: Math.round(distanceKm * 10) / 10 }
          : {}),
      };
    });

    const facets: Record<
      string,
      Array<{
        /**
         * Valor de key mantenido por la instancia.
         */
        key: string; /**
         * Valor de count mantenido por la instancia.
         */
        count: number;
      }>
    > = {};
    const aggregations = this.asRecord(root.aggregations);
    for (const [field, rawAggregation] of Object.entries(aggregations)) {
      const aggregation = this.asRecord(rawAggregation);
      const buckets = this.asUnknownArray(aggregation.buckets);
      facets[field] = buckets.map((rawBucket) => {
        const bucket = this.asRecord(rawBucket);
        return {
          key: this.asString(bucket.key),
          count: this.asNumber(bucket.doc_count) ?? 0,
        };
      });
    }

    return { total: totalValue, hits, facets };
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private asUnknownArray(value: unknown): unknown[] {
    return Array.isArray(value) ? (value as unknown[]) : [];
  }

  private asNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private asString(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'bigint') {
      return `${value}`;
    }
    return '';
  }

  /** Resuelve el índice por la whitelist o lanza 404. */
  private resolveIndex(name: string): SearchIndexDefinition {
    const def = SEARCH_INDEX_REGISTRY[name];
    if (!def) {
      throw new ResourceNotFoundException('Índice de búsqueda no reconocido', {
        index: name,
      });
    }
    return def;
  }

  /** Fail-closed: sin tenant no se toca el cliente. */
  private assertTenant(tenantId: string | undefined): void {
    if (!tenantId) {
      throw new PreconditionFailedException(
        'Falta el tenant de contexto para la operación de búsqueda',
      );
    }
  }

  /**
   * Un índice con `documentKeys` declarados sólo acepta esas claves.
   *
   * Es la tarea 40 de P10 aplicada donde no se puede saltear: en la escritura.
   * Un índice público que gana un campo —porque alguien amplió una proyección
   * río arriba— deja de indexarse en vez de publicar en silencio un dato
   * interno. Falla ruidoso y temprano; un 422 en el reindexado se ve, una fuga
   * en un índice consultado sin sesión no.
   */
  private assertIndexableDocument(
    def: SearchIndexDefinition,
    doc: Record<string, unknown>,
  ): void {
    if (!def.documentKeys) return;
    const extra = Object.keys(doc).filter(
      (key) => key !== TENANT_FIELD && !def.documentKeys!.includes(key),
    );
    if (extra.length > 0) {
      throw new PreconditionFailedException(
        'El documento trae campos no declarados para este índice',
        { index: def.name, extra, allowed: [...def.documentKeys] },
      );
    }
  }

  /** Valida que un campo esté en la allowlist correspondiente del índice. */
  private assertAllowedField(
    def: SearchIndexDefinition,
    field: string,
    allowed: readonly string[],
    kind: 'filtro' | 'faceta' | 'geo' | 'orden',
  ): void {
    if (!allowed.includes(field)) {
      throw new PreconditionFailedException(
        `Campo de ${kind} no permitido para el índice`,
        { index: def.name, field, allowed },
      );
    }
  }

  /** Detecta un 404 del cliente OpenSearch sin acoplarse a su clase de error. */
  private isNotFound(error: unknown): boolean {
    const status = (
      error as {
        /**
         * Valor de status code mantenido por la instancia.
         */
        statusCode?: number; /**
         * Valor de meta mantenido por la instancia.
         */
        meta?: {
          /**
           * Valor de status code mantenido por la instancia.
           */
          statusCode?: number;
        };
      }
    )?.statusCode;
    const metaStatus = (
      error as {
        /**
         * Valor de meta mantenido por la instancia.
         */
        meta?: {
          /**
           * Valor de status code mantenido por la instancia.
           */
          statusCode?: number;
        };
      }
    )?.meta?.statusCode;
    return status === 404 || metaStatus === 404;
  }
}
