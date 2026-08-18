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
  /**
   * Ajustes del índice (analizadores). Se aplican **sólo al crearlo**: en
   * OpenSearch un analizador no se puede cambiar sobre un índice vivo, así que
   * tocar esto obliga a reindexar desde cero (`search:reindex`).
   */
  readonly settings?: Record<string, unknown>;
  /** Mappings del índice; incluye siempre `tenantId` como `keyword`. */
  readonly mappings: Record<string, unknown>;
  /** Campos full-text usados en el `multi_match` de la búsqueda por texto. */
  readonly textFields: readonly string[];
  /** Campos permitidos como filtro exacto (`term`/`terms`). */
  readonly filterFields: readonly string[];
  /** Campos permitidos como faceta (agregación `terms`). */
  readonly facetFields: readonly string[];
  /** Campos `geo_point` sobre los que se acepta `geo_distance`. */
  readonly geoFields?: readonly string[];
  /** Campos permitidos como criterio de orden explícito. */
  readonly sortFields?: readonly string[];
  /**
   * Claves que el documento indexado puede tener, además de `tenantId`.
   *
   * No es documentación: `assertIndexableDocument` la aplica antes de escribir
   * y el spec de fuga (tarea 40 de P10) compara contra ella. Un índice público
   * que gana un campo sin pasar por acá **no se indexa**, en vez de publicar en
   * silencio un identificador interno que después no se puede volver a esconder.
   */
  readonly documentKeys?: readonly string[];
}

/** Propiedades comunes a todos los índices (aislamiento por tenant). */
const tenantMapping = {
  [TENANT_FIELD]: { type: 'keyword' },
} as const;

/**
 * Analizador español compartido por los índices de directorio y contenido.
 *
 * Tres piezas, y las tres hacen falta para que el buscador sirva en Bolivia:
 *
 *  - `asciifolding`: «cardiologo» tiene que encontrar «Cardiología». Nadie
 *    escribe tildes en una caja de búsqueda, y un buscador que las exige
 *    devuelve cero resultados sobre datos que sí existen.
 *  - `spanish_stop` + `spanish_stemmer`: «pediatras» encuentra «Pediatra», y
 *    «de la clínica» no puntúa por las preposiciones.
 *  - `normalizer` para los `keyword` de ciudad: «La Paz» y «la paz» son la
 *    misma ciudad a la hora de filtrar, aunque se muestren distinto.
 *
 * `spanish_stemmer` va **después** de `asciifolding` a propósito: el stemmer
 * de Snowball para español ya tolera la forma sin tilde, y al revés el
 * plegado destruiría marcas que el stemmer usa.
 */
export const SPANISH_ANALYSIS_SETTINGS: Record<string, unknown> = {
  analysis: {
    filter: {
      spanish_stop: { type: 'stop', stopwords: '_spanish_' },
      spanish_stemmer: { type: 'stemmer', language: 'light_spanish' },
    },
    normalizer: {
      es_keyword: {
        type: 'custom',
        filter: ['lowercase', 'asciifolding'],
      },
    },
    analyzer: {
      es_text: {
        type: 'custom',
        tokenizer: 'standard',
        filter: [
          'lowercase',
          'asciifolding',
          'spanish_stop',
          'spanish_stemmer',
        ],
      },
      /**
       * Para autocompletar y para el prefijo: sin stemming, porque «cardi»
       * stemmizado no es prefijo de nada. Sólo plegado y minúsculas.
       */
      es_prefix: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'asciifolding'],
      },
    },
  },
};

/** Texto analizado en español, con subcampo exacto para orden alfabético. */
const esText = {
  type: 'text',
  analyzer: 'es_text',
  search_analyzer: 'es_text',
} as const;

/** `keyword` normalizado: filtra sin distinguir tildes ni mayúsculas. */
const esKeyword = { type: 'keyword', normalizer: 'es_keyword' } as const;

/**
 * Índice del directorio público (P10).
 *
 * ## Por qué es un índice aparte y no `directory_profiles`
 *
 * `directory_profiles` es el índice *interno* de un tenant: se consulta con
 * sesión y su filtro de tenant separa organizaciones. Esta superficie es la
 * contraria — el buscador público de P4 atraviesa todos los tenants sin sesión,
 * porque nadie busca «un cardiólogo dentro de la clínica X» sin saber que X
 * existe. Mezclar ambas cosas en un índice obligaría a relajar el filtro de
 * tenant que protege al índice interno, y esa es exactamente la barrera que no
 * se toca. Por eso: índice propio, sellado con el tenant sentinela
 * `PUBLIC_DIRECTORY_TENANT`, y **sin el `tenantId` real de ningún perfil**.
 *
 * ## Lo que puede contener
 *
 * Sólo los campos que el DTO público ya sirve hoy en SQL (`documentKeys`), más
 * los que existen para ordenar y filtrar y que nunca se proyectan al cliente.
 * Un uuid interno acá es una fuga irreversible: el índice es la copia que se
 * consulta sin sesión.
 */
const COMMUNITY_PUBLIC_PROFILES: SearchIndexDefinition = {
  name: 'community_public_profiles',
  settings: SPANISH_ANALYSIS_SETTINGS,
  mappings: {
    properties: {
      ...tenantMapping,
      kind: { type: 'keyword' },
      slug: { type: 'keyword' },
      displayName: {
        ...esText,
        fields: {
          // `search_as_you_type` para el autocompletado de la caja de búsqueda
          // y `raw` para el desempate alfabético estable del cursor.
          autocomplete: { type: 'search_as_you_type', analyzer: 'es_prefix' },
          raw: { type: 'keyword' },
        },
      },
      headline: esText,
      biography: esText,
      specialties: esKeyword,
      city: esKeyword,
      avatarUrl: { type: 'keyword', index: false },
      verified: { type: 'boolean' },
      hasPublishedAgenda: { type: 'boolean' },
      ratingAverage: { type: 'half_float' },
      ratingCount: { type: 'integer' },
      location: { type: 'geo_point' },
      updatedAt: { type: 'date' },
    },
  },
  textFields: [
    // Los pesos son la jerarquía de la tarjeta: quien escribe «Quispe» busca a
    // la persona, no a quien la menciona en su biografía.
    'displayName^4',
    'displayName.autocomplete^2',
    'specialties^3',
    'headline^2',
    'city',
    'biography',
  ],
  filterFields: [
    'kind',
    'specialties',
    'city',
    'verified',
    'hasPublishedAgenda',
  ],
  facetFields: ['kind', 'specialties', 'city', 'verified'],
  geoFields: ['location'],
  sortFields: ['displayName.raw', 'ratingAverage', 'updatedAt', 'verified'],
  documentKeys: [
    'kind',
    'slug',
    'displayName',
    'headline',
    'biography',
    'specialties',
    'city',
    'avatarUrl',
    'verified',
    'hasPublishedAgenda',
    'ratingAverage',
    'ratingCount',
    'location',
    'updatedAt',
  ],
};

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
  [COMMUNITY_PUBLIC_PROFILES.name]: COMMUNITY_PUBLIC_PROFILES,
  [DIRECTORY_PROFILES.name]: DIRECTORY_PROFILES,
  [SERVICE_CATALOG.name]: SERVICE_CATALOG,
  [PUBLICATIONS.name]: PUBLICATIONS,
});

/** Nombre del índice del directorio público (P10). */
export const COMMUNITY_PUBLIC_PROFILES_INDEX = COMMUNITY_PUBLIC_PROFILES.name;

/**
 * Tenant sentinela del directorio público.
 *
 * El aislamiento por tenant de `SearchIndexService` es obligatorio y no admite
 * excepciones — es lo que impide que un tenant lea otro—, pero el directorio
 * público no pertenece a ningún tenant: es la vitrina que P4 sirve sin sesión.
 * En vez de agujerear la invariante con un «si es público, no filtres», el
 * directorio vive bajo un tenant propio que **no existe como organización**.
 * Resultado: la consulta pública sigue llevando su `term { tenantId }` y ningún
 * documento de un tenant real puede caer en esta superficie por accidente.
 */
export const PUBLIC_DIRECTORY_TENANT = 'public-directory';

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
