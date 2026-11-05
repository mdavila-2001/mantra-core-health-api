#!/usr/bin/env node
// =============================================================================
// TAREA-41 F3.2/F3.3 — carga de HPO (`phenotype.hpoa`) y Orphanet (product4)
// como relaciones enfermedad → fenotipo con evidencia, vía `bulkLoadRelationships`.
//
// Sin `--load` sólo arma las filas y escribe el resumen (no abre la base).
// Con `--load` abre una conexión y carga cada fuente en su propio lote;
// `--dry-run` hace todo y termina en ROLLBACK.
//
//   node tools/terminology-import/import-f3-relations.mjs [--only hpo|orphanet]
//        [--sources-dir <dir>] [--load [--dry-run]]
//
// Entradas (las baja `measure-sources.mjs` a `--sources-dir`, por defecto
// `<glossary-data-build>/f3-sources`): phenotype.hpoa, hp.obo, hp-es.babelon.tsv
// (no se usa para cargar: las etiquetas ES son otra tarea), mondo.obo,
// mondo.sssom.tsv, en_product4.xml.
// Salida: `<glossary-data-build>/f3-out/f3-relations.summary.json`.
// =============================================================================

import 'dotenv/config';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import pg from 'pg';

import { BUILD_DIR, ensureDir } from './lib/glossary-es/common.mjs';
import { bulkLoadRelationships } from './lib/bulk-copy.mjs';
import { CONCEPT, md5uuid } from './lib/glossary-es/load-plan.mjs';
import { loadF3Identity, onlyExistingDiseases } from './lib/glossary-es/f3-identity-inputs.mjs';
import { hpoPhenotypeConceptId, hpoaToRelationshipRows } from './lib/glossary-es/hpo.mjs';
import { ORPHANET_SOURCE_TAG, orphanetToRelationshipRows, parseOrphanetProduct4, parseOrphanetReleaseDate } from './lib/glossary-es/orphanet.mjs';
import { parseHpoa } from './symptoms/lib/annotations.mjs';
import { readObo } from './symptoms/lib/obo.mjs';
import { DB_CONFIG, ensureCodeSystem } from './symptoms/lib/db.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, fallback) => (flag(name) ? args[args.indexOf(name) + 1] : fallback);
const SOURCES_DIR = resolve(opt('--sources-dir', join(BUILD_DIR, 'f3-sources')));
const OUT_DIR = ensureDir(resolve(opt('--out', join(BUILD_DIR, 'f3-out'))));
const ONLY = opt('--only', null);
const LOAD = flag('--load');
const DRY_RUN = flag('--dry-run');

const HPO_LICENSE = 'HPO license (uso libre con cita, sin modificar términos) — https://hpo.jax.org/license';

/** Una fuente = su propio `terminology_sources` + code system + versión por release. */
const sourcePlan = ({ key, code, name, owner, officialUrl, license, canonicalUrl, version }) => ({
  source: { id: md5uuid(`mantra:f3:source:${key}`), code, name, owner, officialUrl, license },
  codeSystem: { id: md5uuid(`mantra:f3:code-system:${key}`), internalCode: code, name, canonicalUrl, caseSensitive: true },
  version: { id: md5uuid(`mantra:f3:version:${key}:${version}`), version },
});

const hpoPlan = (version) =>
  sourcePlan({
    key: 'hpo-annotations', code: 'hpo-annotations', name: 'Human Phenotype Ontology — anotaciones enfermedad-fenotipo',
    owner: 'Monarch Initiative / HPO', officialUrl: 'https://hpo.jax.org/', license: HPO_LICENSE,
    canonicalUrl: 'urn:mantra:hpo-annotations', version,
  });

const orphanetPlan = (version) =>
  sourcePlan({
    key: ORPHANET_SOURCE_TAG, code: ORPHANET_SOURCE_TAG, name: 'Orphadata — product4, fenotipos HPO por enfermedad rara',
    owner: 'Orphanet (INSERM)', officialUrl: 'https://www.orphadata.com/', license: 'CC BY 4.0',
    canonicalUrl: 'urn:mantra:orphadata-product4', version,
  });

const read = (name) => {
  const path = join(SOURCES_DIR, name);
  if (!existsSync(path)) throw new Error(`Falta ${path}. Bajalo con: node tools/terminology-import/measure-sources.mjs`);
  return path;
};

async function liveHpoTerms() {
  const live = new Set();
  await readObo(read('hp.obo'), (t) => {
    if (t.id.startsWith('HP:') && !t.obsolete) live.add(t.id);
  });
  return live;
}

function buildBatches(identity, liveHp) {
  const resolvePhenotype = (hp) => (liveHp.has(hp) ? hpoPhenotypeConceptId(hp) : null);
  const batches = [];
  if (!ONLY || ONLY === 'hpo') {
    const hpoa = parseHpoa(readFileSync(read('phenotype.hpoa'), 'utf8'), { retrievedAt: new Date().toISOString(), license: HPO_LICENSE });
    const { rows, stats, unresolvedDiseases } = hpoaToRelationshipRows(hpoa.rows, {
      resolveDisease: identity.resolve, resolvePhenotype, validFrom: hpoa.header.version,
    });
    batches.push({ key: 'hpo', plan: hpoPlan(hpoa.header.version), rows, stats, unresolvedDiseases });
  }
  if (!ONLY || ONLY === 'orphanet') {
    const xml = readFileSync(read('en_product4.xml'), 'utf8');
    const validFrom = parseOrphanetReleaseDate(xml);
    const { rows, stats, unresolvedDiseases } = orphanetToRelationshipRows(parseOrphanetProduct4(xml), {
      resolveDisease: identity.resolve, resolvePhenotype, validFrom,
    });
    batches.push({ key: 'orphanet', plan: orphanetPlan(validFrom), rows, stats, unresolvedDiseases });
  }
  return batches;
}

async function main() {
  if (ONLY && !['hpo', 'orphanet'].includes(ONLY)) throw new Error(`--only acepta hpo u orphanet, no "${ONLY}".`);
  const client = LOAD ? new pg.Client(DB_CONFIG) : null;
  if (client) await client.connect();
  try {
    await run(client);
  } finally {
    if (client) await client.end();
  }
}

async function run(client) {
  const rawIdentity = await loadF3Identity({ sourcesDir: SOURCES_DIR, buildDir: BUILD_DIR });
  const identity = client ? await onlyExistingDiseases(client, rawIdentity) : rawIdentity;
  const batches = buildBatches(identity, await liveHpoTerms());
  const summary = {
    generatedAt: new Date().toISOString(),
    loaded: LOAD,
    dryRun: LOAD && DRY_RUN,
    batches: batches.map((b) => ({ key: b.key, version: b.plan.version.version, rows: b.rows.length, stats: b.stats, unresolvedDiseases: b.unresolvedDiseases })),
  };
  writeFileSync(join(OUT_DIR, 'f3-relations.summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
  if (!LOAD) return;

  for (const b of batches) {
    const ids = await ensureCodeSystem(client, b.plan, CONCEPT.TERM_ACTIVE);
    const result = await bulkLoadRelationships(client, {
      terminologySourceId: ids.sourceId, codeSystemVersionId: ids.versionId, rows: b.rows, dryRun: DRY_RUN, log: console.log,
    });
    console.log(`[f3 ${b.key}]`, JSON.stringify(result));
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
