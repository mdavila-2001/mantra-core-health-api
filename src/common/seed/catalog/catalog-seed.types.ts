/**
 * Tipos y tablas destino de la siembra del catálogo de datos (catalogación).
 *
 * La siembra escribe con SQL parametrizado por `jsonb_to_recordset` (una sentencia por lote, no una
 * por fila) y `ON CONFLICT DO NOTHING`: la idempotencia la dan el id determinista y los índices
 * únicos del modelo, no un `SELECT` previo. Cada tabla declara aquí sus columnas y su tipo.
 */

export type PgType =
  'uuid' | 'varchar' | 'text' | 'jsonb' | 'boolean' | 'int' | 'timestamptz';

export interface SeedTableSpec {
  /** `schema.tabla`. */
  readonly table: string;
  readonly columns: readonly (readonly [string, PgType])[];
}

const AUDIT: SeedTableSpec['columns'] = [
  ['created_at', 'timestamptz'],
  ['updated_at', 'timestamptz'],
  ['created_by_user_id', 'uuid'],
  ['updated_by_user_id', 'uuid'],
  ['row_version', 'int'],
];

export const DATA_DOMAINS: SeedTableSpec = {
  table: 'system_ops.data_domains',
  columns: [
    ['id', 'uuid'],
    ['code', 'varchar'],
    ['name', 'varchar'],
    ['description', 'text'],
    ['owner_team', 'varchar'],
    ...AUDIT,
  ],
};

export const DATA_CLASSIFICATIONS: SeedTableSpec = {
  table: 'system_ops.data_classifications',
  columns: [
    ['id', 'uuid'],
    ['code', 'varchar'],
    ['name', 'varchar'],
    ['rank', 'int'],
    ['is_pii', 'boolean'],
    ['is_phi', 'boolean'],
    ['handling_rules_json', 'jsonb'],
    ['state_concept_id', 'uuid'],
    ...AUDIT,
  ],
};

export const GLOSSARY_TERMS: SeedTableSpec = {
  table: 'data_catalog.catalog_glossary_terms',
  columns: [
    ['id', 'uuid'],
    ['term_code', 'varchar'],
    ['name', 'varchar'],
    ['definition', 'text'],
    ['domain_id', 'uuid'],
    ['synonyms', 'jsonb'],
    ['status', 'varchar'],
    ['current_revision_no', 'int'],
    ['approved_revision_no', 'int'],
    ['approved_by_user_id', 'uuid'],
    ['approved_at', 'timestamptz'],
    ...AUDIT,
  ],
};

export const GLOSSARY_REVISIONS: SeedTableSpec = {
  table: 'data_catalog.catalog_glossary_term_revisions',
  columns: [
    ['id', 'uuid'],
    ['term_id', 'uuid'],
    ['revision_no', 'int'],
    ['content_json', 'jsonb'],
    ['content_hash', 'varchar'],
    ['change_reason', 'text'],
    ['author_user_id', 'uuid'],
    ['created_at', 'timestamptz'],
  ],
};

export const LINEAGE_EDGES: SeedTableSpec = {
  table: 'data_catalog.catalog_lineage_edges',
  columns: [
    ['id', 'uuid'],
    ['source_kind', 'varchar'],
    ['source_ref', 'varchar'],
    ['target_kind', 'varchar'],
    ['target_ref', 'varchar'],
    ['edge_kind', 'varchar'],
    ['origin', 'varchar'],
    ['confidence', 'varchar'],
    ['is_official', 'boolean'],
    ['approved_by_user_id', 'uuid'],
    ['approved_at', 'timestamptz'],
    ['observation_status', 'varchar'],
    ['first_seen_at', 'timestamptz'],
    ['last_seen_at', 'timestamptz'],
    ...AUDIT,
  ],
};

export const ANNOTATIONS: SeedTableSpec = {
  table: 'data_catalog.catalog_annotations',
  columns: [
    ['id', 'uuid'],
    ['target_kind', 'varchar'],
    ['object_id', 'uuid'],
    ['column_id', 'uuid'],
    ['business_name', 'varchar'],
    ['definition', 'text'],
    ['purpose', 'text'],
    ['existence_rationale', 'text'],
    ['row_grain', 'text'],
    ['alternatives_rationale', 'text'],
    ['process_supported', 'text'],
    ['source_of_truth', 'text'],
    ['producers', 'jsonb'],
    ['consumers', 'jsonb'],
    ['deletion_impact', 'text'],
    ['business_owner', 'varchar'],
    ['data_steward', 'varchar'],
    ['technical_owner', 'varchar'],
    ['unit', 'varchar'],
    ['value_domain', 'text'],
    ['null_semantics', 'text'],
    ['sensitivity', 'varchar'],
    ['open_questions', 'jsonb'],
    ['review_status', 'varchar'],
    ['origin', 'varchar'],
    ['current_revision_no', 'int'],
    ['approved_revision_no', 'int'],
    ...AUDIT,
  ],
};

export const ANNOTATION_REVISIONS: SeedTableSpec = {
  table: 'data_catalog.catalog_annotation_revisions',
  columns: [
    ['id', 'uuid'],
    ['annotation_id', 'uuid'],
    ['revision_no', 'int'],
    ['content_json', 'jsonb'],
    ['content_hash', 'varchar'],
    ['origin', 'varchar'],
    ['submitted_status', 'varchar'],
    ['change_reason', 'text'],
    ['author_user_id', 'uuid'],
    ['created_at', 'timestamptz'],
  ],
};

export const EVIDENCE_ITEMS: SeedTableSpec = {
  table: 'data_catalog.catalog_evidence_items',
  columns: [
    ['id', 'uuid'],
    ['object_id', 'uuid'],
    ['column_id', 'uuid'],
    ['kind', 'varchar'],
    ['reference', 'text'],
    ['excerpt', 'text'],
    ['source_revision', 'varchar'],
    ['added_by_user_id', 'uuid'],
    ['created_at', 'timestamptz'],
  ],
};

export type SeedRow = Record<string, unknown>;

/** Los objetos que un escaneo ya observó: `schema.tabla` → su id y el de cada columna. */
export type ObjectIndex = ReadonlyMap<
  string,
  { id: string; columns: ReadonlyMap<string, string> }
>;

/** Una tabla destino que no existe en esta base (el parche del modelo no está aplicado). */
export interface MissingTable {
  table: string;
}

/**
 * Lo que la siembra necesita de la persistencia. Lo implementan `PgCatalogSeedStore` (base real) y
 * `InMemoryCatalogSeedStore` (pruebas; **no** prueba SQL ni índices: sólo la lógica del plan).
 */
export interface CatalogSeedStore {
  /** ¿Existe la tabla `schema.tabla` en esta base? */
  hasTable(qualified: string): Promise<boolean>;
  /** Inserta lo que falta; devuelve los `id` realmente insertados. Un conflicto no es un error. */
  insertMissing(
    spec: SeedTableSpec,
    rows: readonly SeedRow[],
  ): Promise<string[]>;
  /** Objetos observados por el escaneo (vacío si todavía no hubo uno). */
  loadObjects(): Promise<ObjectIndex>;
  /** `code` → `id` de `system_ops.data_domains`. */
  loadDomainIds(): Promise<ReadonlyMap<string, string>>;
  /** Asigna dominio a objetos que no tienen uno; devuelve cuántos cambió. */
  linkObjectDomains(
    links: readonly { objectId: string; domainId: string }[],
  ): Promise<number>;
}
