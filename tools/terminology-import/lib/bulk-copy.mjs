// =============================================================================
// Cargador masivo de relaciones con evidencia (TAREA-41 F1.3).
//
// Un lote = una fuente (`terminology_sources` + su `code_system_versions`).
// Todo pasa en UNA transacción, así que el lote entra entero o no entra
// (mismo criterio «todo o nada» y «dry-run» que el motor de carga del PR #463):
//
//   1. COPY … FROM STDIN (pg-copy-streams) hacia una tabla de staging sin WAL.
//   2. Valida en SQL los códigos de nivel de evidencia y de frecuencia contra
//      sus value sets (`VS_EVIDENCE_TIER`, `VS_RELATIONSHIP_FREQUENCY`): los
//      ids se buscan por código en la base, nunca se escriben a mano.
//   3. INSERT … SELECT … ON CONFLICT (clave natural) DO UPDATE hacia
//      `concept_relationships` y `concept_relationship_evidence`. Las
//      actualizaciones sólo tocan la fila si algo cambió, así que re-correr el
//      mismo lote inserta 0 y actualiza 0.
//   4. Recalcula las 4 columnas derivadas de cada relación tocada
//      (`strength_score`, `evidence_count`, `best_evidence_tier_concept_id`,
//      `frequency_concept_id`) con un único UPDATE … FROM (agregado). El
//      agregado es la traducción a SQL de `strengthOf()` (strength.mjs); la
//      paridad la prueba `test/bulk-copy.test.mjs`.
//   5. Registra el lote en `terminology.catalog_import_batches`.
//
// Staging: `CREATE TEMP TABLE … ON COMMIT DROP`. Una tabla temporal de
// Postgres no escribe WAL (es UNLOGGED por naturaleza), es privada de la
// sesión y desaparece con la transacción; así el cargador no deja DDL en el
// esquema `terminology` (ADR-0021: la API no declara tablas). Es el mismo
// recurso que ya usa `clinical-pharmacology/load-clinical-pharmacology.mjs`.
// =============================================================================

import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import copyStreams from 'pg-copy-streams';

import {
  EVIDENCE_TIERS,
  EXCLUDED,
  FREQUENCY_SCORE,
  INDEPENDENT_SOURCE_BONUS,
  T1_FLOOR,
  T2_WITHOUT_FREQUENCY,
  T3_SCORE,
  T4_CEILING,
} from './glossary-es/strength.mjs';
import { md5uuid } from './glossary-es/load-plan.mjs';

export const EVIDENCE_TIER_VALUE_SET = 'VS_EVIDENCE_TIER';
export const FREQUENCY_VALUE_SET = 'VS_RELATIONSHIP_FREQUENCY';

/**
 * Código del value set de frecuencia → clave de `FREQUENCY_SCORE`. Sólo
 * difiere «obligatorio»: el vault lo llama `OBLIGATE` (HP:0040280) y la
 * fórmula `OBLIGATORY`.
 */
export const FREQUENCY_CODE_TO_STRENGTH_KEY = Object.freeze({
  OBLIGATE: 'OBLIGATORY',
  VERY_FREQUENT: 'VERY_FREQUENT',
  FREQUENT: 'FREQUENT',
  OCCASIONAL: 'OCCASIONAL',
  VERY_RARE: 'VERY_RARE',
  EXCLUDED,
});

const STAGING_TABLE = 'bulk_copy_relationship_stage';
const COPY_CHUNK_BYTES = 1 << 16;

/** Columnas del staging, en el orden en que viaja cada línea del COPY. */
export const STAGE_COLUMNS = Object.freeze([
  ['source_concept_id', 'uuid', (r) => r.sourceConceptId],
  ['target_concept_id', 'uuid', (r) => r.targetConceptId],
  ['relationship_type_concept_id', 'uuid', (r) => r.relationshipTypeConceptId],
  ['ordinal', 'integer', (r) => r.ordinal],
  ['evidence_tier_code', 'text', (r) => r.evidenceTier],
  ['source_reference', 'text', (r) => r.sourceReference],
  ['citation_text', 'text', (r) => r.citationText],
  ['citation_locator', 'text', (r) => r.citationLocator],
  ['frequency_code', 'text', (r) => r.frequency],
  ['frequency_numerator', 'integer', (r) => r.frequencyNumerator],
  ['frequency_denominator', 'integer', (r) => r.frequencyDenominator],
  ['statistic_value', 'numeric', (r) => r.statisticValue],
  ['sex_concept_id', 'uuid', (r) => r.sexConceptId],
  ['age_min_days', 'integer', (r) => r.ageMinDays],
  ['age_max_days', 'integer', (r) => r.ageMaxDays],
  ['pregnancy_applicability_concept_id', 'uuid', (r) => r.pregnancyApplicabilityConceptId],
  ['care_level_concept_id', 'uuid', (r) => r.careLevelConceptId],
  ['line_of_therapy_concept_id', 'uuid', (r) => r.lineOfTherapyConceptId],
  ['valid_from', 'date', (r) => r.validFrom],
  ['valid_to', 'date', (r) => r.validTo],
]);

/** Columnas de evidencia que el upsert compara y reescribe. */
const EVIDENCE_MUTABLE_COLUMNS = Object.freeze([
  'code_system_version_id',
  'evidence_tier_concept_id',
  'citation_text',
  'citation_locator',
  'frequency_concept_id',
  'frequency_numerator',
  'frequency_denominator',
  'statistic_value',
  'sex_concept_id',
  'age_min_days',
  'age_max_days',
  'pregnancy_applicability_concept_id',
  'care_level_concept_id',
  'line_of_therapy_concept_id',
  'valid_from',
  'valid_to',
]);

// --- COPY en formato texto ---------------------------------------------------

/** Un valor en formato texto de COPY: `\N` para null y escapes de control. */
export function copyField(value) {
  if (value === null || value === undefined) return '\\N';
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  return text.replace(/[\\\t\n\r]/g, (ch) => ({ '\\': '\\\\', '\t': '\\t', '\n': '\\n', '\r': '\\r' })[ch]);
}

/** Una línea del COPY a partir de una fila de evidencia. */
export function copyLine(row) {
  return `${STAGE_COLUMNS.map(([, , pick]) => copyField(pick(row))).join('\t')}\n`;
}

/**
 * Convierte las filas (iterable síncrono o asíncrono) en trozos de texto para
 * el COPY, contando filas y acumulando el checksum del lote por el camino.
 */
async function* copyChunks(rows, tally) {
  let buffer = '';
  for await (const row of rows) {
    const line = copyLine(row);
    tally.read += 1;
    tally.hash.update(line);
    buffer += line;
    if (buffer.length >= COPY_CHUNK_BYTES) {
      yield buffer;
      buffer = '';
    }
  }
  if (buffer.length > 0) yield buffer;
}

// --- SQL ---------------------------------------------------------------------

const stageDdl = () =>
  `CREATE TEMP TABLE ${STAGING_TABLE} (${STAGE_COLUMNS.map(([name, type]) => `${name} ${type}`).join(', ')}) ON COMMIT DROP`;

/**
 * Ids de los conceptos de un value set, por código. Lee la versión más nueva
 * del value set (la que siembra `gen_seeds.py`).
 */
export async function valueSetConceptIds(client, valueSetCode) {
  const { rows } = await client.query(
    `SELECT DISTINCT ON (c.code) c.code, c.id
       FROM terminology.value_sets vs
       JOIN terminology.value_set_versions v ON v.value_set_id = vs.id
       JOIN terminology.value_set_members m ON m.value_set_version_id = v.id
       JOIN terminology.catalog_concepts c ON c.id = m.concept_id
      WHERE vs.internal_code = $1
      ORDER BY c.code, v.created_at DESC`,
    [valueSetCode],
  );
  if (rows.length === 0) throw new Error(`El value set ${valueSetCode} no tiene conceptos en la base.`);
  return new Map(rows.map((r) => [r.code, r.id]));
}

/**
 * Tablas de referencia de la fórmula como `VALUES` parametrizados: nivel →
 * rango (T1 = 1) y frecuencia → puntaje. Los puntajes salen de las constantes
 * de strength.mjs, no se repiten acá.
 *
 * @returns {{ tierRows: Array<[string, string, number]>, frequencyRows: Array<[string, string, number|null, boolean]> }}
 */
export function strengthReferenceRows(tierIds, frequencyIds) {
  const tierRows = Object.entries(EVIDENCE_TIERS).map(([code, tier]) => {
    const id = tierIds.get(code);
    if (!id) throw new Error(`Falta el nivel de evidencia ${code} en ${EVIDENCE_TIER_VALUE_SET}.`);
    return [id, code, Number(tier.slice(1))];
  });
  const frequencyRows = Object.entries(FREQUENCY_CODE_TO_STRENGTH_KEY).map(([code, key]) => {
    const id = frequencyIds.get(code);
    if (!id) throw new Error(`Falta la frecuencia ${code} en ${FREQUENCY_VALUE_SET}.`);
    return [id, code, key === EXCLUDED ? null : FREQUENCY_SCORE[key], key === EXCLUDED];
  });
  return { tierRows, frequencyRows };
}

/**
 * El agregado de `strengthOf()` en SQL. Devuelve una consulta con
 * `concept_relationship_id, strength_score, evidence_count,
 * best_evidence_tier_concept_id, frequency_concept_id` por relación.
 *
 * `evidenceRelation` es la tabla (o subconsulta entre paréntesis con alias)
 * que expone `concept_relationship_id, terminology_source_id,
 * evidence_tier_concept_id, frequency_concept_id, statistic_value`.
 * Los parámetros `$<p>` y `$<p+1>` son los arreglos de `strengthReferenceRows`
 * serializados por `strengthReferenceParams`.
 *
 * Aritmética en `double precision` y redondeo `floor(x·1000 + 0,5)/1000` para
 * reproducir `Math.round` de JS (el `round()` de Postgres sobre float redondea
 * al par).
 */
export function strengthAggregateSql(evidenceRelation, firstParam = 1) {
  const p = firstParam;
  return `
    WITH tier_ref AS (
      SELECT (t->>0)::uuid AS concept_id, (t->>2)::int AS tier_rank
        FROM jsonb_array_elements($${p}::jsonb) t
    ),
    frequency_ref AS (
      SELECT (f->>0)::uuid AS concept_id, (f->>2)::float8 AS score, (f->>3)::boolean AS is_excluded
        FROM jsonb_array_elements($${p + 1}::jsonb) f
    ),
    scored AS (
      SELECT e.concept_relationship_id,
             e.terminology_source_id,
             e.evidence_tier_concept_id,
             e.frequency_concept_id,
             t.tier_rank,
             t.tier_rank <= 2 AS curated,
             coalesce(f.is_excluded, false) AS is_excluded,
             f.score AS frequency_score,
             CASE
               WHEN coalesce(f.is_excluded, false) THEN NULL
               WHEN t.tier_rank = 1 THEN greatest(${T1_FLOOR}::float8, coalesce(f.score, 0))
               WHEN t.tier_rank = 2 THEN coalesce(f.score, ${T2_WITHOUT_FREQUENCY}::float8)
               WHEN t.tier_rank = 3 THEN ${T3_SCORE}::float8
               WHEN e.statistic_value IS NULL OR e.statistic_value <= 1 THEN 0::float8
               ELSE least(${T4_CEILING}::float8, ${T4_CEILING}::float8 * (1 - 1 / e.statistic_value::float8))
             END AS evidence_score
        FROM ${evidenceRelation}
        JOIN tier_ref t ON t.concept_id = e.evidence_tier_concept_id
        LEFT JOIN frequency_ref f ON f.concept_id = e.frequency_concept_id
    ),
    per_relationship AS (
      SELECT s.concept_relationship_id,
             count(*)::int AS evidence_count,
             bool_or(s.curated AND s.is_excluded) AND NOT bool_or(s.curated AND NOT s.is_excluded) AS excluded,
             (array_agg(s.evidence_tier_concept_id ORDER BY s.tier_rank))[1] AS best_tier_id,
             max(s.evidence_score) FILTER (WHERE s.evidence_score > 0) AS max_score,
             count(DISTINCT s.terminology_source_id) FILTER (WHERE s.evidence_score > 0) AS positive_sources,
             (array_agg(s.frequency_concept_id ORDER BY s.frequency_score DESC)
                FILTER (WHERE s.curated AND s.frequency_score IS NOT NULL))[1] AS strongest_frequency_id,
             (array_agg(s.frequency_concept_id) FILTER (WHERE s.is_excluded))[1] AS excluded_frequency_id
        FROM scored s
       GROUP BY s.concept_relationship_id
    )
    SELECT concept_relationship_id,
           evidence_count,
           best_tier_id AS best_evidence_tier_concept_id,
           CASE WHEN excluded OR max_score IS NULL THEN 0::numeric
                ELSE (floor(least(1::float8, max_score + ${INDEPENDENT_SOURCE_BONUS}::float8 * (positive_sources - 1)) * 1000 + 0.5) / 1000)::numeric
           END AS strength_score,
           CASE WHEN excluded THEN excluded_frequency_id ELSE strongest_frequency_id END AS frequency_concept_id
      FROM per_relationship`;
}

/** Los dos parámetros jsonb que espera `strengthAggregateSql`. */
export function strengthReferenceParams({ tierRows, frequencyRows }) {
  return [JSON.stringify(tierRows), JSON.stringify(frequencyRows)];
}

const deterministicUuid = (expression) => `md5(${expression})::uuid`;

const upsertRelationshipsSql = () => `
  WITH candidates AS (
    SELECT DISTINCT ON (source_concept_id, target_concept_id, relationship_type_concept_id)
           source_concept_id, target_concept_id, relationship_type_concept_id, ordinal
      FROM ${STAGING_TABLE}
     ORDER BY source_concept_id, target_concept_id, relationship_type_concept_id, ordinal NULLS LAST
  ),
  written AS (
    INSERT INTO terminology.concept_relationships AS r
           (id, source_concept_id, target_concept_id, relationship_type_concept_id, ordinal, created_at, updated_at, row_version)
    SELECT ${deterministicUuid(`'mantra:concept-relationship:' || source_concept_id || ':' || target_concept_id || ':' || relationship_type_concept_id`)},
           source_concept_id, target_concept_id, relationship_type_concept_id, ordinal, now(), now(), 1
      FROM candidates
    ON CONFLICT (source_concept_id, target_concept_id, relationship_type_concept_id) DO UPDATE
       SET ordinal = EXCLUDED.ordinal, updated_at = now(), row_version = r.row_version + 1
     WHERE EXCLUDED.ordinal IS NOT NULL AND r.ordinal IS DISTINCT FROM EXCLUDED.ordinal
    RETURNING (xmax = 0) AS inserted
  )
  SELECT count(*) FILTER (WHERE inserted)::int AS inserted,
         count(*) FILTER (WHERE NOT inserted)::int AS updated
    FROM written`;

const upsertEvidenceSql = () => {
  const columns = EVIDENCE_MUTABLE_COLUMNS;
  return `
  WITH candidates AS (
    SELECT DISTINCT ON (r.id, s.source_reference)
           r.id AS concept_relationship_id,
           $1::uuid AS terminology_source_id,
           $2::uuid AS code_system_version_id,
           t.concept_id AS evidence_tier_concept_id,
           s.source_reference, s.citation_text, s.citation_locator,
           f.concept_id AS frequency_concept_id,
           s.frequency_numerator, s.frequency_denominator, s.statistic_value,
           s.sex_concept_id, s.age_min_days, s.age_max_days,
           s.pregnancy_applicability_concept_id, s.care_level_concept_id, s.line_of_therapy_concept_id,
           s.valid_from, s.valid_to
      FROM ${STAGING_TABLE} s
      JOIN terminology.concept_relationships r
        ON r.source_concept_id = s.source_concept_id
       AND r.target_concept_id = s.target_concept_id
       AND r.relationship_type_concept_id = s.relationship_type_concept_id
      JOIN jsonb_to_recordset($3::jsonb) AS t(code text, concept_id uuid) ON t.code = s.evidence_tier_code
      LEFT JOIN jsonb_to_recordset($4::jsonb) AS f(code text, concept_id uuid) ON f.code = s.frequency_code
     ORDER BY r.id, s.source_reference
  ),
  written AS (
    INSERT INTO terminology.concept_relationship_evidence AS e
           (id, concept_relationship_id, terminology_source_id, source_reference, ${columns.join(', ')}, created_at, updated_at, row_version)
    SELECT ${deterministicUuid(`'mantra:concept-relationship-evidence:' || concept_relationship_id || ':' || terminology_source_id || ':' || source_reference`)},
           concept_relationship_id, terminology_source_id, source_reference, ${columns.join(', ')}, now(), now(), 1
      FROM candidates
    ON CONFLICT (concept_relationship_id, terminology_source_id, source_reference) DO UPDATE
       SET ${columns.map((c) => `${c} = EXCLUDED.${c}`).join(', ')}, updated_at = now(), row_version = e.row_version + 1
     WHERE (${columns.map((c) => `e.${c}`).join(', ')}) IS DISTINCT FROM (${columns.map((c) => `EXCLUDED.${c}`).join(', ')})
    RETURNING (xmax = 0) AS inserted
  )
  SELECT count(*) FILTER (WHERE inserted)::int AS inserted,
         count(*) FILTER (WHERE NOT inserted)::int AS updated
    FROM written`;
};

const recomputeDerivedSql = () => `
  WITH touched AS (
    SELECT DISTINCT r.id
      FROM ${STAGING_TABLE} s
      JOIN terminology.concept_relationships r
        ON r.source_concept_id = s.source_concept_id
       AND r.target_concept_id = s.target_concept_id
       AND r.relationship_type_concept_id = s.relationship_type_concept_id
  ),
  derived AS (${strengthAggregateSql(
    `(SELECT ev.* FROM terminology.concept_relationship_evidence ev JOIN touched ON touched.id = ev.concept_relationship_id) e`,
  )})
  UPDATE terminology.concept_relationships r
     SET strength_score = a.strength_score,
         evidence_count = a.evidence_count,
         best_evidence_tier_concept_id = a.best_evidence_tier_concept_id,
         frequency_concept_id = a.frequency_concept_id,
         updated_at = now(),
         row_version = r.row_version + 1
    FROM derived a
   WHERE r.id = a.concept_relationship_id
     AND (r.strength_score, r.evidence_count, r.best_evidence_tier_concept_id, r.frequency_concept_id)
         IS DISTINCT FROM (a.strength_score, a.evidence_count, a.best_evidence_tier_concept_id, a.frequency_concept_id)`;

/** Códigos del staging que no existen en sus value sets: el lote se rechaza. */
async function assertKnownCodes(client, tierIds, frequencyIds) {
  const { rows } = await client.query(
    `SELECT 'nivel de evidencia' AS kind, evidence_tier_code AS code, count(*)::int AS n
       FROM ${STAGING_TABLE} WHERE evidence_tier_code IS NULL OR NOT (evidence_tier_code = ANY($1::text[]))
      GROUP BY evidence_tier_code
     UNION ALL
     SELECT 'frecuencia', frequency_code, count(*)::int
       FROM ${STAGING_TABLE} WHERE frequency_code IS NOT NULL AND NOT (frequency_code = ANY($2::text[]))
      GROUP BY frequency_code
     UNION ALL
     SELECT 'referencia de origen vacía', NULL, count(*)::int
       FROM ${STAGING_TABLE} WHERE source_reference IS NULL OR source_reference = ''
     HAVING count(*) > 0
     UNION ALL
     SELECT 'vigencia sin valid_from', NULL, count(*)::int
       FROM ${STAGING_TABLE} WHERE valid_from IS NULL
     HAVING count(*) > 0`,
    [[...tierIds.keys()], [...frequencyIds.keys()]],
  );
  if (rows.length > 0) {
    const detail = rows.map((r) => `${r.kind}${r.code == null ? '' : ` «${r.code}»`}: ${r.n}`).join('; ');
    throw new Error(`Lote rechazado, nada se cargó: ${detail}`);
  }
}

const asIdRecords = (ids) => JSON.stringify([...ids].map(([code, concept_id]) => ({ code, concept_id })));

/**
 * Carga un lote de relaciones con su evidencia.
 *
 * @param {import('pg').Client} client - Conexión dedicada (el lote usa su transacción).
 * @param {object} batch
 * @param {string} batch.terminologySourceId - `terminology.terminology_sources.id` de la fuente.
 * @param {string} batch.codeSystemVersionId - Versión/release de la fuente.
 * @param {Iterable<object>|AsyncIterable<object>} batch.rows - Una fila por evidencia
 *   (`sourceConceptId`, `targetConceptId`, `relationshipTypeConceptId`, `evidenceTier`
 *   = código de `VS_EVIDENCE_TIER`, `sourceReference`, `validFrom`, y opcionales:
 *   `ordinal`, `citationText`, `citationLocator`, `frequency` = código de
 *   `VS_RELATIONSHIP_FREQUENCY`, `frequencyNumerator`, `frequencyDenominator`,
 *   `statisticValue`, `sexConceptId`, `ageMinDays`, `ageMaxDays`,
 *   `pregnancyApplicabilityConceptId`, `careLevelConceptId`,
 *   `lineOfTherapyConceptId`, `validTo`).
 * @param {boolean} [batch.dryRun=false] - Hace todo y al final ROLLBACK.
 * @param {(msg: string) => void} [batch.log] - Bitácora de etapas con tiempos.
 * @returns {Promise<object>} Totales por etapa, id del lote y tiempos en ms.
 */
export async function bulkLoadRelationships(client, batch) {
  const { terminologySourceId, codeSystemVersionId, rows, dryRun = false, log = () => {} } = batch;
  const startedAt = new Date();
  const timings = {};
  const lap = async (stage, work) => {
    const t0 = Date.now();
    const result = await work();
    timings[stage] = Date.now() - t0;
    log(`[bulk-copy] ${stage}: ${timings[stage]} ms`);
    return result;
  };

  const tierIds = await valueSetConceptIds(client, EVIDENCE_TIER_VALUE_SET);
  const frequencyIds = await valueSetConceptIds(client, FREQUENCY_VALUE_SET);
  const reference = strengthReferenceRows(tierIds, frequencyIds);
  const tally = { read: 0, hash: createHash('sha256') };

  await client.query('BEGIN');
  try {
    await client.query(stageDdl());
    await lap('copy', () =>
      pipeline(
        Readable.from(copyChunks(rows, tally)),
        client.query(copyStreams.from(`COPY ${STAGING_TABLE} (${STAGE_COLUMNS.map(([n]) => n).join(', ')}) FROM STDIN`)),
      ),
    );
    await client.query(`ANALYZE ${STAGING_TABLE}`);
    await lap('validate', () => assertKnownCodes(client, tierIds, frequencyIds));
    const relationships = await lap('relationships', async () => (await client.query(upsertRelationshipsSql())).rows[0]);
    const evidence = await lap(
      'evidence',
      async () =>
        (await client.query(upsertEvidenceSql(), [terminologySourceId, codeSystemVersionId, asIdRecords(tierIds), asIdRecords(frequencyIds)]))
          .rows[0],
    );
    const derivedUpdated = await lap(
      'derived',
      async () => (await client.query(recomputeDerivedSql(), strengthReferenceParams(reference))).rowCount,
    );
    const checksum = tally.hash.digest('hex');
    const batchUuid = md5uuid(`mantra:bulk-copy:batch:${terminologySourceId}:${checksum}:${startedAt.toISOString()}`);
    await client.query(
      `INSERT INTO terminology.catalog_import_batches
              (id, source_id, code_system_version_id, started_at, finished_at, total_read, total_inserted, total_errors, checksum, recorded_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, now(), $5, $6, 0, $7, now())`,
      [batchUuid, terminologySourceId, codeSystemVersionId, startedAt, tally.read, relationships.inserted + evidence.inserted, checksum],
    );
    await client.query(dryRun ? 'ROLLBACK' : 'COMMIT');
    return {
      batchId: batchUuid,
      dryRun,
      read: tally.read,
      relationships,
      evidence,
      derivedUpdated,
      checksum,
      timingsMs: timings,
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  }
}
