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
      body: { mappings: def.mappings },
    });
    this.logger.info({ index: def.name }, 'Índice de búsqueda creado');
    return { created: true };
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

    const aggregations: Record<string, any> = {};
    for (const field of params.facets ?? []) {
      this.assertAllowedField(def, field, def.facetFields, 'faceta');
      aggregations[field] = {
        terms: { field, size: MAX_FACET_BUCKETS },
      };
    }

    const body: Record<string, unknown> = {
      from: params.from ?? 0,
      size: params.size ?? 20,
      query: { bool: { must, filter } },
      ...(Object.keys(aggregations).length > 0 ? { aggs: aggregations } : {}),
    };
    const response = await this.client.search({ index: def.name, body });

    return this.normalizeResult(response.body);
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
  private normalizeResult(body: any): SearchResult {
    const rawHits: any[] = body?.hits?.hits ?? [];
    const totalValue = body?.hits?.total?.value ?? body?.hits?.total ?? 0;

    const hits: SearchHit[] = rawHits.map((hit) => ({
      id: String(hit._id),
      score: hit._score ?? null,
      source: (hit._source ?? {}) as Record<string, unknown>,
    }));

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
    const aggregations = body?.aggregations ?? {};
    for (const [field, agg] of Object.entries<any>(aggregations)) {
      const buckets: any[] = agg?.buckets ?? [];
      facets[field] = buckets.map((bucket) => ({
        key: String(bucket.key),
        count: Number(bucket.doc_count ?? 0),
      }));
    }

    return { total: Number(totalValue), hits, facets };
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

  /** Valida que un campo esté en la allowlist correspondiente del índice. */
  private assertAllowedField(
    def: SearchIndexDefinition,
    field: string,
    allowed: readonly string[],
    kind: 'filtro' | 'faceta',
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
