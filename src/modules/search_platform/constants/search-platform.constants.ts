/**
 * Constantes del módulo 57 (`search_platform`).
 *
 * El catálogo de índices es una *whitelist*: sólo los nombres declarados aquí se
 * aceptan como índice físico de OpenSearch, y cada uno acota qué campos son
 * consultables por texto (`textFields`), filtrables (`filterFields`) y agregables
 * como faceta (`facetFields`). Esto impide que el cliente construya consultas
 * sobre campos arbitrarios y, con ello, que exfiltre estructura o evada el
 * aislamiento por tenant.
 */

/** Campo reservado que materializa el aislamiento por tenant en cada documento. */
export const TENANT_FIELD = 'tenantId';

/** Definición de un índice de búsqueda gobernado. */
export interface SearchIndexDefinition {
  /** Nombre físico del índice en OpenSearch (y valor aceptado en la ruta). */
  readonly name: string;
  /** Mappings del índice; incluye siempre `tenantId` como `keyword`. */
  readonly mappings: Record<string, unknown>;
  /** Campos full-text usados en el `multi_match` de la búsqueda por texto. */
  readonly textFields: readonly string[];
  /** Campos permitidos como filtro exacto (`term`/`terms`). */
  readonly filterFields: readonly string[];
  /** Campos permitidos como faceta (agregación `terms`). */
  readonly facetFields: readonly string[];
}

/** Propiedades comunes a todos los índices (aislamiento por tenant). */
const tenantMapping = {
  [TENANT_FIELD]: { type: 'keyword' },
} as const;

/**
 * Directorio de profesionales y organizaciones. Un mismo índice cubre ambos
 * (`kind`) porque la búsqueda de directorio es transversal a los dos.
 */
const DIRECTORY_PROFILES: SearchIndexDefinition = {
  name: 'directory_profiles',
  mappings: {
    properties: {
      ...tenantMapping,
      kind: { type: 'keyword' },
      displayName: { type: 'text' },
      specialties: { type: 'keyword' },
      city: { type: 'keyword' },
      bio: { type: 'text' },
      status: { type: 'keyword' },
    },
  },
  textFields: ['displayName', 'bio'],
  filterFields: ['kind', 'specialties', 'city', 'status'],
  facetFields: ['kind', 'specialties', 'city', 'status'],
};

/** Catálogo de servicios ofertados por las organizaciones. */
const SERVICE_CATALOG: SearchIndexDefinition = {
  name: 'service_catalog',
  mappings: {
    properties: {
      ...tenantMapping,
      name: { type: 'text' },
      description: { type: 'text' },
      category: { type: 'keyword' },
      priceTier: { type: 'keyword' },
      organizationId: { type: 'keyword' },
      active: { type: 'boolean' },
    },
  },
  textFields: ['name', 'description'],
  filterFields: ['category', 'priceTier', 'organizationId', 'active'],
  facetFields: ['category', 'priceTier'],
};

/** Publicaciones/contenidos del tenant. */
const PUBLICATIONS: SearchIndexDefinition = {
  name: 'publications',
  mappings: {
    properties: {
      ...tenantMapping,
      title: { type: 'text' },
      body: { type: 'text' },
      tags: { type: 'keyword' },
      authorId: { type: 'keyword' },
      status: { type: 'keyword' },
      publishedAt: { type: 'date' },
    },
  },
  textFields: ['title', 'body'],
  filterFields: ['tags', 'authorId', 'status'],
  facetFields: ['tags', 'status'],
};

/** Registro (whitelist) de índices reconocidos, indexado por nombre. */
export const SEARCH_INDEX_REGISTRY: Readonly<
  Record<string, SearchIndexDefinition>
> = Object.freeze({
  [DIRECTORY_PROFILES.name]: DIRECTORY_PROFILES,
  [SERVICE_CATALOG.name]: SERVICE_CATALOG,
  [PUBLICATIONS.name]: PUBLICATIONS,
});

/** Nombres de índice aceptados. */
export const SEARCH_INDEX_NAMES = Object.keys(
  SEARCH_INDEX_REGISTRY,
) as readonly string[];

/** Cota máxima de resultados por página (defensa ante `size` abusivos). */
export const MAX_SEARCH_SIZE = 100;

/** Tamaño de página por defecto. */
export const DEFAULT_SEARCH_SIZE = 20;

/** Máximo de cubos por faceta. */
export const MAX_FACET_BUCKETS = 50;
