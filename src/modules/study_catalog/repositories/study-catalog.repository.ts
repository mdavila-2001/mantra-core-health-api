import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common/constants/concepts';
import {
  containsPattern,
  sqlSearchKey,
  sqlSortKey,
} from '../../terminology/repositories/glossary-search.sql';
import {
  LEGACY_FAMILY_BY_KEY,
  type CatalogCursor,
  type StudyFamily,
} from '../study-catalog.logic';

/** Código de los value sets que el catálogo lee. */
export const STUDY_VALUE_SET_CODE = 'service-request-code';
export const SPECIMEN_VALUE_SET_CODE = 'specimen-type';
export const CONTRAST_VALUE_SET_CODE = 'imaging-contrast';
export const LATERALITY_VALUE_SET_CODE = 'condition-laterality';

/** Propiedades del concepto que el catálogo necesita (el resto no viaja). */
const LIST_PROPERTIES = [
  'study_family',
  'study_catalog_code',
  'legacy_code',
  'is_panel',
  'specimen',
  'loinc_code',
  'catalog_version',
  'source_file',
  'source_ids',
  'section',
  'region_code',
  'requires_laterality',
];

/** Fila cruda de un estudio, con sus propiedades pivotadas. */
export interface StudyRow {
  id: string;
  code: string;
  display: string;
  name: string;
  family: StudyFamily | null;
  sort_key: string;
  props: Record<string, unknown> | null;
}

/** Fila cruda de un componente del árbol. */
export interface ComponentRow {
  id: string;
  parent_id: string;
  ordinal: number | null;
  depth: number;
  code: string;
  name: string;
  props: Record<string, unknown> | null;
}

/** Fila cruda de una región. */
export interface BodySiteRow {
  id: string;
  parent_id: string | null;
  code: string;
  display: string;
  props: Record<string, unknown> | null;
}

/** Fila cruda de una opción de value set. */
export interface OptionRow {
  id: string;
  code: string;
  display: string;
}

/**
 * Lectura del catálogo de estudios sobre `terminology.*` (SQL directo: son
 * agregaciones sobre propiedades y relaciones que el ORM no expresa bien, y
 * `terminology` no tiene RLS por tenant). Todo valor del usuario viaja como
 * parámetro; lo único que se interpola son expresiones SQL fijas.
 */
@Injectable()
export class StudyCatalogRepository {
  /**
   * Una página de estudios del value set `service-request-code`, por orden
   * alfabético sin tildes (clave + id como desempate).
   */
  async findPage(
    em: EntityManager,
    filter: {
      family?: StudyFamily;
      tokens: string[];
      after?: CatalogCursor;
      limit: number;
    },
  ): Promise<StudyRow[]> {
    // Orden de los `?` del WITH: familia (json), value set, idioma, propiedades; luego los filtros.
    const params: unknown[] = [
      JSON.stringify(LEGACY_FAMILY_BY_KEY),
      STUDY_VALUE_SET_CODE,
      CONCEPTS.LANG_ES,
      LIST_PROPERTIES,
    ];
    const where: string[] = [];
    if (filter.family) {
      where.push('b.family = ?');
      params.push(filter.family);
    }
    for (const token of filter.tokens) {
      const pattern = containsPattern(token);
      where.push(`(
        ${sqlSearchKey('b.name')} LIKE ? ESCAPE '\\'
        OR ${sqlSearchKey("coalesce(b.props->>'study_catalog_code', '')")} LIKE ? ESCAPE '\\'
        OR ${sqlSearchKey("coalesce(b.props->>'legacy_code', '')")} LIKE ? ESCAPE '\\'
        OR ${sqlSearchKey("coalesce(b.props->>'loinc_code', '')")} LIKE ? ESCAPE '\\'
        OR EXISTS (SELECT 1 FROM terminology.concept_designations d
                    WHERE d.concept_id = b.id AND ${sqlSearchKey('d.value')} LIKE ? ESCAPE '\\')
        OR EXISTS (SELECT 1 FROM terminology.concept_relationships r
                     JOIN terminology.concept_designations d2 ON d2.concept_id = r.source_concept_id
                    WHERE r.target_concept_id = b.id
                      AND r.relationship_type_concept_id = ?
                      AND ${sqlSearchKey('d2.value')} LIKE ? ESCAPE '\\')
      )`);
      params.push(
        pattern,
        pattern,
        pattern,
        pattern,
        pattern,
        CONCEPTS.REL_PART_OF,
        pattern,
      );
    }
    if (filter.after) {
      where.push('(b.sort_key, b.id) > (?, ?::uuid)');
      params.push(filter.after.key, filter.after.id);
    }
    params.push(filter.limit);
    const sql = `
      WITH base AS (
        SELECT cc.id, cc.code, cc.display,
               coalesce(es.value, cc.display) AS name,
               pr.props,
               coalesce(pr.props->>'study_family', (?::jsonb)->>cc.code) AS family,
               ${sqlSortKey('coalesce(es.value, cc.display)')} AS sort_key
          FROM terminology.value_set_members m
          JOIN terminology.value_set_versions v ON v.id = m.value_set_version_id AND v.is_default IS TRUE
          JOIN terminology.value_sets vs ON vs.id = v.value_set_id AND vs.internal_code = ?
          JOIN terminology.catalog_concepts cc ON cc.id = m.concept_id
          LEFT JOIN LATERAL (
            SELECT d.value FROM terminology.concept_designations d
             WHERE d.concept_id = cc.id AND d.language_concept_id = ? AND d.preferred IS TRUE
             ORDER BY d.created_at, d.id LIMIT 1) es ON TRUE
          LEFT JOIN LATERAL (
            SELECT jsonb_object_agg(p.property_code, p.value_json) AS props
              FROM terminology.concept_properties p
             WHERE p.concept_id = cc.id AND p.property_code = ANY(ARRAY[?]::text[])) pr ON TRUE
         WHERE m.included IS TRUE)
      SELECT b.* FROM base b
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY b.sort_key, b.id
       LIMIT ?`;
    return em.getConnection().execute<StudyRow[]>(sql, params, 'all');
  }

  /** Un estudio del value set por concepto, o `null` si no pertenece. */
  async findOne(
    em: EntityManager,
    conceptId: string,
  ): Promise<StudyRow | null> {
    const params = [
      JSON.stringify(LEGACY_FAMILY_BY_KEY),
      STUDY_VALUE_SET_CODE,
      CONCEPTS.LANG_ES,
      [
        ...LIST_PROPERTIES,
        'fasting',
        'turnaround_hours',
        'projections',
        'contrast',
        'contrast_route',
        'preparation',
        'requires_laterality',
        'loinc_name',
        'radlex_rpid',
        'region_code',
        'modality_code',
        'section',
      ],
      conceptId,
    ];
    const rows = await em.getConnection().execute<StudyRow[]>(
      `SELECT cc.id, cc.code, cc.display,
              coalesce(es.value, cc.display) AS name,
              pr.props,
              coalesce(pr.props->>'study_family', (?::jsonb)->>cc.code) AS family,
              '' AS sort_key
         FROM terminology.value_set_members m
         JOIN terminology.value_set_versions v ON v.id = m.value_set_version_id AND v.is_default IS TRUE
         JOIN terminology.value_sets vs ON vs.id = v.value_set_id AND vs.internal_code = ?
         JOIN terminology.catalog_concepts cc ON cc.id = m.concept_id
         LEFT JOIN LATERAL (
           SELECT d.value FROM terminology.concept_designations d
            WHERE d.concept_id = cc.id AND d.language_concept_id = ? AND d.preferred IS TRUE
            ORDER BY d.created_at, d.id LIMIT 1) es ON TRUE
         LEFT JOIN LATERAL (
           SELECT jsonb_object_agg(p.property_code, p.value_json) AS props
             FROM terminology.concept_properties p
            WHERE p.concept_id = cc.id AND p.property_code = ANY(ARRAY[?]::text[])) pr ON TRUE
        WHERE m.included IS TRUE AND cc.id = ?::uuid
        LIMIT 1`,
      params,
      'all',
    );
    return rows[0] ?? null;
  }

  /** Cuántos componentes directos tiene cada panel. */
  async countComponents(
    em: EntityManager,
    panelIds: string[],
  ): Promise<Map<string, number>> {
    if (panelIds.length === 0) return new Map();
    const rows = await em.getConnection().execute<{ id: string; n: string }[]>(
      `SELECT r.target_concept_id AS id, count(*)::text AS n
         FROM terminology.concept_relationships r
        WHERE r.relationship_type_concept_id = ? AND r.target_concept_id = ANY(ARRAY[?]::uuid[])
        GROUP BY 1`,
      [CONCEPTS.REL_PART_OF, panelIds],
      'all',
    );
    return new Map(rows.map((r) => [r.id, Number(r.n)]));
  }

  /**
   * Nombres (castellano) de los componentes directos de cada panel, en el orden
   * del panel y hasta `perPanel` por panel (la lista no trae el detalle).
   */
  async findComponentNames(
    em: EntityManager,
    panelIds: string[],
    perPanel: number,
  ): Promise<Map<string, string[]>> {
    if (panelIds.length === 0) return new Map();
    const rows = await em
      .getConnection()
      .execute<{ panel: string; name: string }[]>(
        `SELECT t.panel, t.name FROM (
           SELECT r.target_concept_id AS panel,
                  coalesce(es.value, cc.display) AS name,
                  row_number() OVER (PARTITION BY r.target_concept_id
                                     ORDER BY r.ordinal NULLS LAST, cc.code) AS rn,
                  r.ordinal, cc.code
             FROM terminology.concept_relationships r
             JOIN terminology.catalog_concepts cc ON cc.id = r.source_concept_id
             LEFT JOIN LATERAL (
               SELECT d.value FROM terminology.concept_designations d
                WHERE d.concept_id = cc.id AND d.language_concept_id = ? AND d.preferred IS TRUE
                ORDER BY d.created_at, d.id LIMIT 1) es ON TRUE
            WHERE r.relationship_type_concept_id = ? AND r.target_concept_id = ANY(ARRAY[?]::uuid[])) t
          WHERE t.rn <= ?
          ORDER BY t.panel, t.rn`,
        [CONCEPTS.LANG_ES, CONCEPTS.REL_PART_OF, panelIds, perPanel],
        'all',
      );
    const out = new Map<string, string[]>();
    for (const r of rows)
      out.set(r.panel, [...(out.get(r.panel) ?? []), r.name]);
    return out;
  }

  /** Destino de una relación de catálogo (modalidad, región, muestra) por estudio. */
  async findTargets(
    em: EntityManager,
    typeConceptId: string,
    studyIds: string[],
  ): Promise<Map<string, string>> {
    if (studyIds.length === 0) return new Map();
    const rows = await em
      .getConnection()
      .execute<{ source: string; target: string }[]>(
        `SELECT r.source_concept_id AS source, r.target_concept_id AS target
           FROM terminology.concept_relationships r
          WHERE r.relationship_type_concept_id = ? AND r.source_concept_id = ANY(ARRAY[?]::uuid[])`,
        [typeConceptId, studyIds],
        'all',
      );
    return new Map(rows.map((r) => [r.source, r.target]));
  }

  /** Árbol de componentes de un panel (hasta 4 niveles), en orden. */
  async findComponents(
    em: EntityManager,
    panelId: string,
  ): Promise<ComponentRow[]> {
    return em.getConnection().execute<ComponentRow[]>(
      `WITH RECURSIVE parts AS (
         SELECT r.source_concept_id AS id, r.target_concept_id AS parent_id, r.ordinal, 1 AS depth
           FROM terminology.concept_relationships r
          WHERE r.target_concept_id = ?::uuid AND r.relationship_type_concept_id = ?
         UNION ALL
         SELECT r.source_concept_id, r.target_concept_id, r.ordinal, p.depth + 1
           FROM terminology.concept_relationships r
           JOIN parts p ON r.target_concept_id = p.id
          WHERE r.relationship_type_concept_id = ? AND p.depth < 4)
       SELECT parts.id, parts.parent_id, parts.ordinal, parts.depth, cc.code,
              coalesce(es.value, cc.display) AS name,
              pr.props
         FROM parts
         JOIN terminology.catalog_concepts cc ON cc.id = parts.id
         LEFT JOIN LATERAL (
           SELECT d.value FROM terminology.concept_designations d
            WHERE d.concept_id = cc.id AND d.language_concept_id = ? AND d.preferred IS TRUE
            ORDER BY d.created_at, d.id LIMIT 1) es ON TRUE
         LEFT JOIN LATERAL (
           SELECT jsonb_object_agg(p.property_code, p.value_json) AS props
             FROM terminology.concept_properties p
            WHERE p.concept_id = cc.id
              AND p.property_code = ANY(ARRAY['unit_ucum','selected_by_default','loinc_code','loinc_name','is_panel'])) pr ON TRUE
        ORDER BY parts.depth, parts.parent_id, parts.ordinal NULLS LAST, cc.code`,
      [panelId, CONCEPTS.REL_PART_OF, CONCEPTS.REL_PART_OF, CONCEPTS.LANG_ES],
      'all',
    );
  }

  /** Una región y todas las que contiene (relación `is-a` hacia ella), con su padre directo. */
  async findBodySiteTree(
    em: EntityManager,
    rootId: string,
  ): Promise<BodySiteRow[]> {
    return em.getConnection().execute<BodySiteRow[]>(
      `WITH RECURSIVE tree AS (
         SELECT cc.id, NULL::uuid AS parent_id, 0 AS depth
           FROM terminology.catalog_concepts cc WHERE cc.id = ?::uuid
         UNION ALL
         SELECT r.source_concept_id, r.target_concept_id, t.depth + 1
           FROM terminology.concept_relationships r
           JOIN tree t ON r.target_concept_id = t.id
          WHERE r.relationship_type_concept_id = ? AND t.depth < 8)
       SELECT tree.id, tree.parent_id, cc.code, cc.display, pr.props
         FROM tree
         JOIN terminology.catalog_concepts cc ON cc.id = tree.id
         LEFT JOIN LATERAL (
           SELECT jsonb_object_agg(p.property_code, p.value_json) AS props
             FROM terminology.concept_properties p
            WHERE p.concept_id = cc.id
              AND p.property_code = ANY(ARRAY['study_catalog_code','region_type','laterality_admitted','uberon_region'])) pr ON TRUE
        ORDER BY tree.depth, cc.display`,
      [rootId, CONCEPTS.REL_IS_A],
      'all',
    );
  }

  /** Conceptos con su propiedad `study_catalog_code` y rótulo (modalidades). */
  async findConceptsWithCode(
    em: EntityManager,
    ids: string[],
  ): Promise<
    Map<string, { code: string; display: string; dicom: string | null }>
  > {
    if (ids.length === 0) return new Map();
    const rows = await em.getConnection().execute<
      {
        id: string;
        display: string;
        code: string | null;
        dicom: string | null;
      }[]
    >(
      `SELECT cc.id, cc.display,
              (SELECT p.value_json #>> '{}' FROM terminology.concept_properties p WHERE p.concept_id = cc.id AND p.property_code = 'study_catalog_code') AS code,
              (SELECT p.value_json #>> '{}' FROM terminology.concept_properties p WHERE p.concept_id = cc.id AND p.property_code = 'dicom_modality') AS dicom
         FROM terminology.catalog_concepts cc WHERE cc.id = ANY(ARRAY[?]::uuid[])`,
      [ids],
      'all',
    );
    return new Map(
      rows.map((r) => [
        r.id,
        { code: r.code ?? '', display: r.display, dicom: r.dicom },
      ]),
    );
  }

  /** Miembros vigentes de un value set, en su orden. */
  async findValueSetOptions(
    em: EntityManager,
    valueSetCode: string,
  ): Promise<OptionRow[]> {
    return em.getConnection().execute<OptionRow[]>(
      `SELECT cc.id, cc.code, coalesce(es.value, cc.display) AS display
         FROM terminology.value_sets vs
         JOIN terminology.value_set_versions v ON v.value_set_id = vs.id AND v.is_default IS TRUE
         JOIN terminology.value_set_members m ON m.value_set_version_id = v.id AND m.included IS TRUE
         JOIN terminology.catalog_concepts cc ON cc.id = m.concept_id
         LEFT JOIN LATERAL (
           SELECT d.value FROM terminology.concept_designations d
            WHERE d.concept_id = cc.id AND d.language_concept_id = ? AND d.preferred IS TRUE
            ORDER BY d.created_at, d.id LIMIT 1) es ON TRUE
        WHERE vs.internal_code = ?
        ORDER BY m.ordinal NULLS LAST, cc.id`,
      [CONCEPTS.LANG_ES, valueSetCode],
      'all',
    );
  }

  /** Rótulo en castellano de un concepto (para la muestra sugerida). */
  async findOption(
    em: EntityManager,
    conceptId: string,
  ): Promise<OptionRow | null> {
    const rows = await em.getConnection().execute<OptionRow[]>(
      `SELECT cc.id, cc.code, coalesce(es.value, cc.display) AS display
         FROM terminology.catalog_concepts cc
         LEFT JOIN LATERAL (
           SELECT d.value FROM terminology.concept_designations d
            WHERE d.concept_id = cc.id AND d.language_concept_id = ? AND d.preferred IS TRUE
            ORDER BY d.created_at, d.id LIMIT 1) es ON TRUE
        WHERE cc.id = ?::uuid`,
      [CONCEPTS.LANG_ES, conceptId],
      'all',
    );
    return rows[0] ?? null;
  }
}
