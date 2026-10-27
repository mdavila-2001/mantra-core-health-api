import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common';
import type {
  ServiceRepositoryFacetsResponseDto,
  ServiceRepositoryItemDto,
  ServiceRepositorySearchResponseDto,
} from '../dto';

/**
 * Los conjuntos de valores que forman el repositorio de servicios importables.
 *
 * - `VS_BO_MEDICAL_PROCEDURE`: aranceles bolivianos que la API ya siembra.
 * - `VS_SPECIALTY_SERVICES_<ESPECIALIDAD>`: servicios por especialidad
 *   (`tools/terminology-import/specialty-services/`).
 * - `VS_SERVICE_REPOSITORY…`: el repositorio universal, que carga todas las
 *   fuentes aunque no digan especialidad
 *   (`tools/terminology-import/service-repository/`).
 *
 * Es una lista cerrada a propósito: lo que no está en uno de estos conjuntos
 * no se puede importar al catálogo de una práctica, y así nadie «cataloga»
 * por su cuenta.
 */
export const SERVICE_REPOSITORY_VALUE_SETS = {
  exact: ['VS_BO_MEDICAL_PROCEDURE'],
  prefixes: ['VS_SPECIALTY_SERVICES_', 'VS_SERVICE_REPOSITORY'],
} as const;

/** Propiedades de precio que publican las fuentes, en orden de preferencia. */
const PRICE_PROPS = {
  price: ['procedure:reference-price', 'service-repository:reference-price'],
  unit: ['procedure:price-unit', 'service-repository:price-unit'],
} as const;

/** Entradas por página cuando el cliente no pide otra cosa. */
const DEFAULT_LIMIT = 25;
/** Tope de entradas por página. */
export const SERVICE_REPOSITORY_MAX_LIMIT = 100;
/** Palabras de búsqueda que se toman en cuenta (el resto se ignora). */
const MAX_TOKENS = 8;

/** Letras con tilde → sin tilde, para comparar sin acentos ni mayúsculas. */
const ACCENTED = 'ÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑÇáàäâéèëêíìïîóòöôúùüûñç';
const PLAIN = 'AAAAEEEEIIIIOOOOUUUUNCaaaaeeeeiiiioooouuuunc';

/**
 * Normaliza un texto de búsqueda igual que la consulta normaliza la columna.
 *
 * @param text - Texto libre.
 * @returns Minúsculas, sin acentos.
 */
export function normalizeSearchText(text: string): string {
  let out = '';
  for (const ch of text) {
    const i = ACCENTED.indexOf(ch);
    out += i >= 0 ? PLAIN[i] : ch;
  }
  return out.toLowerCase();
}

/**
 * Parte la búsqueda en palabras útiles.
 *
 * Se descartan las de una letra y los comodines de `LIKE`: «%» o «_» dentro
 * de un patrón cambian qué casa, y el texto viene del usuario.
 *
 * @param query - Texto libre.
 * @returns Palabras normalizadas, sin repetir.
 */
export function searchTokens(query: string | undefined): string[] {
  if (query === undefined) return [];
  const words = normalizeSearchText(query)
    .replace(/[%_\\]/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 2);
  return [...new Set(words)].slice(0, MAX_TOKENS);
}

/** Expresión SQL que normaliza una columna como `normalizeSearchText`. */
const norm = (column: string) =>
  `lower(translate(${column}, '${ACCENTED}', '${PLAIN}'))`;

/** CTE con los conceptos importables. */
const REPOSITORY_CTE = `repo AS (
  SELECT DISTINCT m.concept_id
    FROM terminology.value_sets vs
    JOIN terminology.value_set_versions v ON v.value_set_id = vs.id
    JOIN terminology.value_set_members m
      ON m.value_set_version_id = v.id AND m.included = true
   WHERE vs.internal_code = ANY(?::text[])
      OR vs.internal_code LIKE ANY(?::text[])
)`;

/** Parámetros del CTE, en el orden en que aparecen sus `?`. */
function repositoryParams(): unknown[] {
  return [
    `{${SERVICE_REPOSITORY_VALUE_SETS.exact.join(',')}}`,
    `{${SERVICE_REPOSITORY_VALUE_SETS.prefixes.map((p) => `${p}%`).join(',')}}`,
  ];
}

/*
 * El código de la especialidad se devuelve sin prefijo (`CARDIOLOGIA`, no
 * `clinical-forms:specialty:CARDIOLOGIA`): según qué siembra llegó primero, el
 * mismo concepto del modelo puede tener uno u otro, y el cliente filtra por id.
 */

/** Fila base de un servicio del repositorio. */
interface ConceptRow {
  id: string;
  code: string;
  display: string;
  code_system: string | null;
  code_system_name: string | null;
  publisher: string | null;
}

/**
 * El repositorio de servicios: lo único desde donde una práctica puede sumar
 * un servicio a su catálogo.
 *
 * ## Por qué un buscador y no un formulario de alta
 *
 * Si cada profesional escribe su propio «Eco cardio», «ecocardiograma TT» y
 * «ECOCARDIOGRAMA», el catálogo deja de servir para comparar, cotizar o
 * reportar. El repositorio junta los nomencladores oficiales con su código y
 * su fuente; la práctica elige y pone el precio.
 *
 * ## Por qué vive en `billing`
 *
 * Mismo criterio que `ProcedureNomenclatureService`: el caso de uso es
 * importar al catálogo (`billing.service_catalog`). Terminología sigue siendo
 * la dueña del dato.
 */
@Injectable()
export class ServiceRepositoryService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Busca en el repositorio.
   *
   * Cada palabra tiene que aparecer en el nombre, en un sinónimo o en el
   * código, sin importar acentos ni mayúsculas. Orden: coincidencia exacta,
   * luego el nombre que empieza por la búsqueda, luego el más corto.
   *
   * @param options - Filtros y paginación.
   * @returns La página de servicios.
   */
  async search(options: {
    query?: string;
    specialtyConceptId?: string;
    codeSystem?: string;
    practiceId?: string;
    cursor?: string;
    limit?: number;
  }): Promise<ServiceRepositorySearchResponseDto> {
    const limit = Math.min(
      options.limit ?? DEFAULT_LIMIT,
      SERVICE_REPOSITORY_MAX_LIMIT,
    );
    const decoded = options.cursor
      ? decodeKeysetCursor(options.cursor)
      : undefined;
    const offset =
      typeof decoded?.offset === 'number' && decoded.offset > 0
        ? Math.floor(decoded.offset)
        : 0;

    const tokens = searchTokens(options.query);
    const conditions: string[] = [];
    const params: unknown[] = [...repositoryParams()];

    for (const token of tokens) {
      conditions.push(`(
        ${norm('c.display')} LIKE ?
        OR lower(c.code) LIKE ?
        OR EXISTS (SELECT 1 FROM terminology.concept_designations d
                    WHERE d.concept_id = c.id AND ${norm('d.value')} LIKE ?)
      )`);
      params.push(`%${token}%`, `%${token}%`, `%${token}%`);
    }
    if (options.specialtyConceptId) {
      conditions.push(`EXISTS (SELECT 1 FROM terminology.concept_relationships r
                        WHERE r.source_concept_id = c.id
                          AND r.relationship_type_concept_id = ?
                          AND r.target_concept_id = ?)`);
      params.push(CONCEPTS.REL_SPECIALTY, options.specialtyConceptId);
    }
    if (options.codeSystem) {
      conditions.push('cs.internal_code = ?');
      params.push(options.codeSystem);
    }

    const phrase = tokens.join(' ');
    const order = phrase
      ? `CASE WHEN ${norm('c.display')} = ? THEN 0
              WHEN ${norm('c.display')} LIKE ? THEN 1
              ELSE 2 END, length(c.display), c.display, c.id`
      : 'c.display, c.id';
    if (phrase) params.push(phrase, `${phrase}%`);
    params.push(limit + 1, offset);

    const rows = await this.em.getConnection().execute<ConceptRow[]>(
      `WITH ${REPOSITORY_CTE}
       SELECT c.id, c.code, c.display,
              cs.internal_code AS code_system, cs.name AS code_system_name,
              ts.name AS publisher
         FROM repo
         JOIN terminology.catalog_concepts c ON c.id = repo.concept_id
         LEFT JOIN terminology.code_system_versions csv ON csv.id = c.code_system_version_id
         LEFT JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
         LEFT JOIN terminology.terminology_sources ts ON ts.id = cs.source_id
        ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
        ORDER BY ${order}
        LIMIT ? OFFSET ?`,
      params,
    );

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: await this.enrich(page, options.practiceId),
      nextCursor: hasMore
        ? encodeKeysetCursor({ offset: offset + limit })
        : null,
    };
  }

  /**
   * Recuentos por fuente y por especialidad, para dibujar los filtros sin
   * traer el repositorio entero.
   *
   * @returns Total y facetas.
   */
  async facets(): Promise<ServiceRepositoryFacetsResponseDto> {
    const conn = this.em.getConnection();
    const [total] = await conn.execute<{ total: string }[]>(
      `WITH ${REPOSITORY_CTE} SELECT COUNT(*)::text AS total FROM repo`,
      repositoryParams(),
    );
    const sources = await conn.execute<
      { code: string | null; display: string | null; count: string }[]
    >(
      `WITH ${REPOSITORY_CTE}
       SELECT cs.internal_code AS code, cs.name AS display, COUNT(*)::text AS count
         FROM repo
         JOIN terminology.catalog_concepts c ON c.id = repo.concept_id
         LEFT JOIN terminology.code_system_versions csv ON csv.id = c.code_system_version_id
         LEFT JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
        GROUP BY 1, 2
        ORDER BY COUNT(*) DESC`,
      repositoryParams(),
    );
    const specialties = await conn.execute<
      { id: string; code: string; display: string; count: string }[]
    >(
      `WITH ${REPOSITORY_CTE}
       SELECT s.id, regexp_replace(s.code, '^.*:', '') AS code, s.display, COUNT(DISTINCT r.source_concept_id)::text AS count
         FROM repo
         JOIN terminology.concept_relationships r
           ON r.source_concept_id = repo.concept_id AND r.relationship_type_concept_id = ?
         JOIN terminology.catalog_concepts s ON s.id = r.target_concept_id
        GROUP BY 1, 2, 3
        ORDER BY s.display`,
      [...repositoryParams(), CONCEPTS.REL_SPECIALTY],
    );

    return {
      total: Number(total?.total ?? 0),
      sources: sources
        .filter((s) => s.code !== null)
        .map((s) => ({
          key: s.code as string,
          code: s.code as string,
          display: s.display ?? (s.code as string),
          count: Number(s.count),
        })),
      specialties: specialties.map((s) => ({
        key: s.id,
        code: s.code,
        display: s.display,
        count: Number(s.count),
      })),
    };
  }

  /**
   * Los conceptos del lote que pertenecen al repositorio, con lo necesario
   * para darlos de alta en un catálogo.
   *
   * @param conceptIds - Conceptos pedidos.
   * @returns Mapa id → concepto; los que no son del repositorio no aparecen.
   */
  async resolveImportable(
    conceptIds: readonly string[],
  ): Promise<Map<string, ConceptRow>> {
    if (conceptIds.length === 0) return new Map();
    const rows = await this.em.getConnection().execute<ConceptRow[]>(
      `WITH ${REPOSITORY_CTE}
       SELECT c.id, c.code, c.display,
              cs.internal_code AS code_system, cs.name AS code_system_name,
              ts.name AS publisher
         FROM repo
         JOIN terminology.catalog_concepts c ON c.id = repo.concept_id
         LEFT JOIN terminology.code_system_versions csv ON csv.id = c.code_system_version_id
         LEFT JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
         LEFT JOIN terminology.terminology_sources ts ON ts.id = cs.source_id
        WHERE c.id = ANY(?::uuid[])`,
      [...repositoryParams(), `{${conceptIds.join(',')}}`],
    );
    return new Map(rows.map((r) => [r.id, r]));
  }

  /**
   * Completa una página con especialidades, precio de referencia y si la
   * práctica ya lo importó. Tres consultas por página, no una por fila.
   */
  private async enrich(
    page: ConceptRow[],
    practiceId: string | undefined,
  ): Promise<ServiceRepositoryItemDto[]> {
    if (page.length === 0) return [];
    const ids = `{${page.map((r) => r.id).join(',')}}`;
    const conn = this.em.getConnection();

    const specialtyRows = await conn.execute<
      { source_id: string; id: string; code: string; display: string }[]
    >(
      `SELECT r.source_concept_id AS source_id, s.id, regexp_replace(s.code, '^.*:', '') AS code, s.display
         FROM terminology.concept_relationships r
         JOIN terminology.catalog_concepts s ON s.id = r.target_concept_id
        WHERE r.source_concept_id = ANY(?::uuid[])
          AND r.relationship_type_concept_id = ?
        ORDER BY s.display`,
      [ids, CONCEPTS.REL_SPECIALTY],
    );
    const priceCodes = [...PRICE_PROPS.price, ...PRICE_PROPS.unit];
    const priceRows = await conn.execute<
      { concept_id: string; property_code: string; valor: string | null }[]
    >(
      `SELECT p.concept_id, p.property_code, p.value_json #>> '{}' AS valor
         FROM terminology.concept_properties p
        WHERE p.concept_id = ANY(?::uuid[])
          AND p.property_code = ANY(?::text[])`,
      [ids, `{${priceCodes.join(',')}}`],
    );
    const imported = practiceId
      ? await conn.execute<{ id: string; service_concept_id: string }[]>(
          `SELECT id, service_concept_id FROM billing.service_catalog
            WHERE practice_id = ? AND service_concept_id = ANY(?::uuid[])`,
          [practiceId, ids],
        )
      : [];

    const specialties = new Map<
      string,
      ServiceRepositoryItemDto['specialties']
    >();
    for (const row of specialtyRows) {
      const list = specialties.get(row.source_id) ?? [];
      if (!list.some((s) => s.conceptId === row.id)) {
        list.push({ conceptId: row.id, code: row.code, display: row.display });
      }
      specialties.set(row.source_id, list);
    }
    const props = new Map<string, Map<string, string>>();
    for (const row of priceRows) {
      if (row.valor === null) continue;
      const their = props.get(row.concept_id) ?? new Map<string, string>();
      their.set(row.property_code, row.valor);
      props.set(row.concept_id, their);
    }
    const importedBy = new Map(
      imported.map((r) => [r.service_concept_id, r.id]),
    );
    const first = (
      their: Map<string, string> | undefined,
      codes: readonly string[],
    ) => codes.map((c) => their?.get(c)).find((v) => v !== undefined) ?? null;

    return page.map((row) => ({
      conceptId: row.id,
      code: row.code,
      display: row.display,
      source: {
        codeSystem: row.code_system ?? 'desconocido',
        name:
          row.code_system_name ?? row.code_system ?? 'Sin fuente registrada',
        publisher: row.publisher,
      },
      specialties: specialties.get(row.id) ?? [],
      referencePrice: first(props.get(row.id), PRICE_PROPS.price),
      priceUnit: first(props.get(row.id), PRICE_PROPS.unit),
      importedServiceCatalogId: importedBy.get(row.id) ?? null,
    }));
  }
}

/** Concepto importable tal como lo resuelve el repositorio. */
export type ImportableConcept = ConceptRow;

/**
 * El código que lleva en el catálogo un servicio importado.
 *
 * `<sistema>:<código>` para que dos fuentes con el mismo código no choquen
 * dentro de una práctica; si el código ya trae prefijo (el arancel boliviano
 * usa `procedure:…`) se respeta tal cual.
 *
 * @param concept - Concepto importado.
 * @returns Código estable del servicio en el catálogo.
 */
export function importedServiceCode(concept: ImportableConcept): string {
  if (concept.code.includes(':') || !concept.code_system) return concept.code;
  return `${concept.code_system}:${concept.code}`;
}
