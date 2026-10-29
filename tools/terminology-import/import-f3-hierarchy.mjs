#!/usr/bin/env node
// =============================================================================
// TAREA-41 F3.4 — jerarquía de enfermedades (`REL_IS_A`, la «SUBCLASS_OF» de la
// ficha) llevada a los conceptos del glosario con la identidad MONDO de F3.1.
//
// Fuentes de aristas: `parents` de MONDO y DOID (snapshot `diseases/data/`,
// SHA-256 verificado) y la ruta declarada de CIE-10-ES. MeSH no aporta: su
// snapshot no trae padres. Ver `lib/glossary-es/hierarchy.mjs`.
//
// Sin `--load` sólo arma las filas y escribe el resumen. Con `--load` inserta
// en `terminology.concept_relationships` (ON CONFLICT DO NOTHING por id
// determinista: la segunda corrida da 0 filas nuevas); `--dry-run` termina en
// ROLLBACK.
//
//   node tools/terminology-import/import-f3-hierarchy.mjs [--sources-dir <dir>]
//        [--out <dir>] [--load [--dry-run]]
// =============================================================================

import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import pg from 'pg';

import { BUILD_DIR, ensureDir } from './lib/glossary-es/common.mjs';
import { existingConceptIds, loadF3Identity, readGlossaryDiagnoses } from './lib/glossary-es/f3-identity-inputs.mjs';
import { catalogParentEdges, cie10ParentEdges, hierarchyToRelationshipRows } from './lib/glossary-es/hierarchy.mjs';
import { readSnapshot } from './diseases/lib/snapshot.mjs';
import { DB_CONFIG } from './symptoms/lib/db.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, fallback) => (flag(name) ? args[args.indexOf(name) + 1] : fallback);
const SOURCES_DIR = resolve(opt('--sources-dir', join(BUILD_DIR, 'f3-sources')));
const OUT_DIR = ensureDir(resolve(opt('--out', join(BUILD_DIR, 'f3-out'))));
const LOAD = flag('--load');
const DRY_RUN = flag('--dry-run');

const HIERARCHY_SYSTEMS = new Set(['mondo', 'doid']);
const COLUMNS = ['id', 'source_concept_id', 'target_concept_id', 'relationship_type_concept_id', 'ordinal'];
const CASTS = ['uuid', 'uuid', 'uuid', 'uuid', 'int'];

/** Con base: una arista cuyo extremo no existe en `catalog_concepts` no se carga (no se crean conceptos). */
async function dropMissingConcepts(client, { rows, stats }) {
  const present = await existingConceptIds(client, rows.flatMap((r) => [r[1], r[2]]));
  const kept = rows.filter((r) => present.has(r[1]) && present.has(r[2]));
  return { rows: kept, stats: { ...stats, unresolved: { ...stats.unresolved, 'concept-not-in-database': rows.length - kept.length }, rows: kept.length } };
}

async function run(client) {
  const identity = await loadF3Identity({ sourcesDir: SOURCES_DIR, buildDir: BUILD_DIR });
  const { byCs } = readSnapshot(HIERARCHY_SYSTEMS);
  const edges = [
    ...catalogParentEdges([...HIERARCHY_SYSTEMS].flatMap((cs) => byCs.get(cs) ?? [])),
    ...cie10ParentEdges(readGlossaryDiagnoses(BUILD_DIR)),
  ];
  const built = hierarchyToRelationshipRows(edges, identity.resolve);
  const { rows, stats } = client ? await dropMissingConcepts(client, built) : built;
  const summary = { generatedAt: new Date().toISOString(), loaded: LOAD, dryRun: LOAD && DRY_RUN, edgesRead: edges.length, stats };
  writeFileSync(join(OUT_DIR, 'f3-hierarchy.summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
  if (!LOAD) return;

  await client.query('BEGIN');
  try {
    const inserted = await insertManyInTransaction(client, rows);
    console.log(`[f3 hierarchy] relaciones nuevas: ${inserted}${DRY_RUN ? ' (dry-run: se revierte)' : ''}`);
    await client.query(DRY_RUN ? 'ROLLBACK' : 'COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  }
}

/** Todos los lotes en la transacción del llamador (así `--dry-run` revierte todo). */
async function insertManyInTransaction(client, rows) {
  const BATCH = 1000;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const params = [];
    const values = chunk.map((t) => {
      const ph = t.map((v, j) => {
        params.push(v);
        return `$${params.length}::${CASTS[j]}`;
      });
      return `(${ph.join(', ')}, now(), now(), 1)`;
    });
    const res = await client.query(
      `INSERT INTO terminology.concept_relationships (${[...COLUMNS, 'created_at', 'updated_at', 'row_version'].join(', ')}) VALUES ${values.join(',\n')} ON CONFLICT DO NOTHING`,
      params,
    );
    inserted += res.rowCount;
  }
  return inserted;
}

async function main() {
  const client = LOAD ? new pg.Client(DB_CONFIG) : null;
  if (client) await client.connect();
  try {
    await run(client);
  } finally {
    if (client) await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
