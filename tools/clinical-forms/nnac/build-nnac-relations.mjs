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
//   - unmapped-options.csv  cola de revisión clínica humana (F2.2 paso 3)
//   - coverage.json         porcentaje mapeado por campo y bloqueantes por ficha
// La carga usa `bulkLoadRelationships`: re-correr inserta 0 y actualiza 0.
// =============================================================================

import 'dotenv/config';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

import { bulkLoadRelationships } from '../../terminology-import/lib/bulk-copy.mjs';
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
    `SELECT d.concept_id AS "conceptId", d.value AS text,
            (SELECT substr(vs.internal_code, $2)
               FROM terminology.value_set_members m
               JOIN terminology.value_set_versions vv ON vv.id = m.value_set_version_id AND vv.is_default = true
               JOIN terminology.value_sets vs ON vs.id = vv.value_set_id
              WHERE m.concept_id = d.concept_id AND m.included = true AND vs.internal_code LIKE $3
              LIMIT 1) AS "categoryKey"
       FROM terminology.concept_designations d
       JOIN terminology.catalog_concepts c ON c.id = d.concept_id AND c.state_concept_id = $1`,
    [CONCEPT.TERM_ACTIVE, CATEGORY_PREFIX.length + 1, `${CATEGORY_PREFIX}%`],
  );
  return rows;
}

async function main() {
  const forms = readForms();
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    const index = buildDesignationIndex(await readDesignations(client));
    const results = forms.map((form) => ({ form, ...nnacRelations(form, index) }));

    mkdirSync(OUT_DIR, { recursive: true });
    const csv = [csvLine(['form', 'field', 'option', 'reason', 'candidates', 'suggested_by'])];
    for (const r of results) for (const u of r.unmapped) csv.push(csvLine([u.form, u.field, u.option, u.reason, u.candidates.join('|'), '']));
    writeFileSync(join(OUT_DIR, 'unmapped-options.csv'), `${csv.join('\n')}\n`);
    const blockers = results.filter((r) => r.blocker).map((r) => ({ form: r.form.code, blocker: r.blocker }));
    const coverage = { forms: forms.length, rows: results.reduce((n, r) => n + r.rows.length, 0), byField: coverageByField(results), blockers };
    writeFileSync(join(OUT_DIR, 'coverage.json'), `${JSON.stringify(coverage, null, 2)}\n`);
    console.log(JSON.stringify({ forms: coverage.forms, rows: coverage.rows, blockers: blockers.length, byField: coverage.byField }, null, 2));

    if (!args.has('--load')) return;
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
      const result = await bulkLoadRelationships(client, {
        terminologySourceId: ids.sourceId,
        codeSystemVersionId: ids.versionId,
        rows,
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
