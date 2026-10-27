#!/usr/bin/env node
// =============================================================================
// Fichas NNAC → relaciones normativas T1 del glosario (TAREA-41 F2).
//
//   node tools/clinical-forms/nnac/build-nnac-relations.mjs            # informe + cola, sin escribir en la base
//   node tools/clinical-forms/nnac/build-nnac-relations.mjs --load     # además carga (una transacción por edición)
//   node tools/clinical-forms/nnac/build-nnac-relations.mjs --load --dry-run
//
// Lee las fichas `nnac*.json` de `src/common/seed/data/clinical-forms/`, arma
// el índice de designaciones del glosario desde la base (sólo lectura) y
// escribe en `tools/clinical-forms/nnac/out/`:
//   - unmapped-options.csv  lo que no se pudo enlazar (con --no-literals, todo lo sin término exacto)
//   - literal-findings.csv  viñetas cargadas como término literal, para revisión clínica
//   - homonyms.csv          opciones enlazadas eligiendo entre homónimos, con los descartados
//   - coverage.json         porcentaje mapeado por campo y bloqueantes por ficha
// La carga usa `bulkLoadRelationships`: re-correr inserta 0 y actualiza 0.
// =============================================================================

import 'dotenv/config';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

import { bulkLoadRelationships, valueSetConceptIds } from '../../terminology-import/lib/bulk-copy.mjs';
import { CONCEPT, md5uuid } from '../../terminology-import/lib/glossary-es/load-plan.mjs';
import { DB_CONFIG, ensureCodeSystem } from '../../terminology-import/symptoms/lib/db.mjs';
import { buildDesignationIndex, coverageByField, csvLine, editionOf, nnacRelations } from './lib/nnac-relations.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FORMS_DIR = join(HERE, '../../../src/common/seed/data/clinical-forms');
const OUT_DIR = join(HERE, 'out');
const SOURCE_CODE = 'NNAC_BO';
const CATEGORY_PREFIX = 'glossary-category-';

const args = new Set(process.argv.slice(2));

/** Fuente + code system + una versión por edición de la norma. */
function nnacPlan(edition, resolution) {
  return {
    source: {
      id: md5uuid(`mantra:nnac:source:${SOURCE_CODE}`),
      code: SOURCE_CODE,
      name: 'Normas Nacionales de Atención Clínica (Bolivia)',
      owner: 'Ministerio de Salud y Deportes del Estado Plurinacional de Bolivia',
      officialUrl: 'https://www.minsalud.gob.bo/',
      license: 'Documento técnico-normativo estatal de acceso público',
    },
    codeSystem: {
      id: md5uuid(`mantra:nnac:code-system:${SOURCE_CODE}`),
      internalCode: SOURCE_CODE,
      name: 'NNAC Bolivia',
      canonicalUrl: 'urn:mantra:nnac-bo',
      caseSensitive: true,
    },
    version: { id: md5uuid(`mantra:nnac:version:${edition}`), version: resolution ? `${edition} (${resolution})` : edition },
  };
}

function readForms() {
  const forms = [];
  for (const dir of readdirSync(FORMS_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const file of readdirSync(join(FORMS_DIR, dir.name))) {
      if (file.startsWith('nnac') && file.endsWith('.json')) forms.push(JSON.parse(readFileSync(join(FORMS_DIR, dir.name, file), 'utf8')));
    }
  }
  return forms.sort((a, b) => a.code.localeCompare(b.code));
}

/** Designaciones de los conceptos activos con su categoría del glosario. */
async function readDesignations(client) {
  const { rows } = await client.query(
    `SELECT d.concept_id AS "conceptId", d.value AS text, cs.internal_code AS "codeSystem",
            (SELECT count(*)::int FROM terminology.concept_relationships r
              WHERE r.source_concept_id = d.concept_id OR r.target_concept_id = d.concept_id) AS "relationCount",
            (SELECT substr(vs.internal_code, $2)
               FROM terminology.value_set_members m
               JOIN terminology.value_set_versions vv ON vv.id = m.value_set_version_id AND vv.is_default = true
               JOIN terminology.value_sets vs ON vs.id = vv.value_set_id
              WHERE m.concept_id = d.concept_id AND m.included = true AND vs.internal_code LIKE $3
              LIMIT 1) AS "categoryKey"
       FROM terminology.concept_designations d
       JOIN terminology.catalog_concepts c ON c.id = d.concept_id AND c.state_concept_id = $1
       JOIN terminology.code_system_versions csv ON csv.id = c.code_system_version_id
       JOIN terminology.code_systems cs ON cs.id = csv.code_system_id`,
    [CONCEPT.TERM_ACTIVE, CATEGORY_PREFIX.length + 1, `${CATEGORY_PREFIX}%`],
  );
  return rows;
}

/**
 * Crea los términos literales (code system NNAC_BO, versión «hallazgos») con su
 * designación preferida en castellano. Idempotente: ON CONFLICT DO NOTHING.
 */
async function ensureLiteralFindings(client, literals, dryRun) {
  const ids = await ensureCodeSystem(client, nnacPlan('hallazgos'), CONCEPT.TERM_ACTIVE);
  await client.query('BEGIN');
  try {
    const { rowCount } = await client.query(
      `INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, selectable, state_concept_id, created_at, updated_at, row_version)
       SELECT x.id, $1::uuid, x.code, x.display, true, $2::uuid, now(), now(), 1
         FROM jsonb_to_recordset($3::jsonb) AS x(id uuid, code text, display text)
       ON CONFLICT (id) DO NOTHING`,
      [ids.versionId, CONCEPT.TERM_ACTIVE, JSON.stringify(literals.map((l) => ({ id: l.conceptId, code: l.code, display: l.display })))],
    );
    const { rowCount: designations } = await client.query(
      `INSERT INTO terminology.concept_designations (id, concept_id, language_concept_id, designation_type_concept_id, value, preferred, created_at, updated_at, row_version)
       SELECT x.did, x.id, $1::uuid, $2::uuid, x.display, true, now(), now(), 1
         FROM jsonb_to_recordset($3::jsonb) AS x(did uuid, id uuid, display text)
       ON CONFLICT (id) DO NOTHING`,
      [CONCEPT.LANG_ES, CONCEPT.DESIG_PREFERRED, JSON.stringify(literals.map((l) => ({ did: md5uuid(`mantra:nnac:finding-designation:${l.conceptId}`), id: l.conceptId, display: l.display })))],
    );
    await client.query(dryRun ? 'ROLLBACK' : 'COMMIT');
    console.log(`[nnac hallazgos] conceptos nuevos: ${rowCount} · designaciones nuevas: ${designations}${dryRun ? ' (dry-run)' : ''}`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  }
}

async function main() {
  const forms = readForms();
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    const index = buildDesignationIndex(await readDesignations(client));
    const careLevelIds = await valueSetConceptIds(client, 'VS_CARE_LEVEL');
    const literalFindings = !args.has('--no-literals');
    const results = forms.map((form) => ({ form, ...nnacRelations(form, index, { literalFindings, careLevelIds }) }));
    const literals = new Map();
    for (const r of results) for (const [id, l] of r.literals) if (!literals.has(id)) literals.set(id, l);

    mkdirSync(OUT_DIR, { recursive: true });
    const csv = [csvLine(['form', 'field', 'option', 'reason', 'candidates', 'suggested_by'])];
    for (const r of results) for (const u of r.unmapped) csv.push(csvLine([u.form, u.field, u.option, u.reason, u.candidates.join('|'), '']));
    writeFileSync(join(OUT_DIR, 'unmapped-options.csv'), `${csv.join('\n')}\n`);
    const literalCsv = [csvLine(['concept_id', 'code', 'text', 'forms'])];
    const formsOf = new Map();
    for (const r of results) for (const row of r.rows) if (row.matchedBy === 'literal') {
      const id = r.form.code;
      const key = literals.has(row.targetConceptId) ? row.targetConceptId : row.sourceConceptId;
      (formsOf.get(key) ?? formsOf.set(key, new Set()).get(key)).add(id);
    }
    for (const l of [...literals.values()].sort((a, b) => a.display.localeCompare(b.display, 'es'))) {
      literalCsv.push(csvLine([l.conceptId, l.code, l.display, [...(formsOf.get(l.conceptId) ?? [])].join('|')]));
    }
    writeFileSync(join(OUT_DIR, 'literal-findings.csv'), `${literalCsv.join('\n')}\n`);
    const homonymCsv = [csvLine(['form', 'option', 'chosen', 'candidates'])];
    for (const r of results) for (const row of r.rows) if (row.matchedBy === 'best-of-homonyms') {
      homonymCsv.push(csvLine([r.form.code, row.citationText, row.targetConceptId === r.diseaseConceptId ? row.sourceConceptId : row.targetConceptId, '']));
    }
    writeFileSync(join(OUT_DIR, 'homonyms.csv'), `${homonymCsv.join('\n')}\n`);
    const blockers = results.filter((r) => r.blocker).map((r) => ({ form: r.form.code, blocker: r.blocker }));
    const matchedBy = {};
    for (const r of results) for (const row of r.rows) matchedBy[row.matchedBy] = (matchedBy[row.matchedBy] ?? 0) + 1;
    const coverage = { forms: forms.length, rows: results.reduce((n, r) => n + r.rows.length, 0), literals: literals.size, matchedBy, byField: coverageByField(results), blockers };
    writeFileSync(join(OUT_DIR, 'coverage.json'), `${JSON.stringify(coverage, null, 2)}\n`);
    console.log(JSON.stringify({ forms: coverage.forms, rows: coverage.rows, literals: coverage.literals, matchedBy, blockers: blockers.length, byField: coverage.byField }, null, 2));

    if (!args.has('--load')) return;
    if (literals.size > 0) await ensureLiteralFindings(client, [...literals.values()], args.has('--dry-run'));
    const byEdition = new Map();
    for (const r of results) {
      if (r.blocker) continue;
      const { edition, resolution } = editionOf(r.form);
      const entry = byEdition.get(edition) ?? { resolution, rows: [] };
      entry.rows.push(...r.rows);
      byEdition.set(edition, entry);
    }
    for (const [edition, { resolution, rows }] of byEdition) {
      const ids = await ensureCodeSystem(client, nnacPlan(edition, resolution), CONCEPT.TERM_ACTIVE);
      // En dry-run los términos literales no se crearon (ROLLBACK): sus filas
      // romperían la FK, así que el ensayo carga sólo las que van a términos existentes.
      const loadable = args.has('--dry-run') ? rows.filter((r) => r.matchedBy !== 'literal') : rows;
      const result = await bulkLoadRelationships(client, {
        terminologySourceId: ids.sourceId,
        codeSystemVersionId: ids.versionId,
        rows: loadable,
        dryRun: args.has('--dry-run'),
        log: console.log,
      });
      console.log(`[nnac ${edition}]`, JSON.stringify(result));
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
