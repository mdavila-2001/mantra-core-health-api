#!/usr/bin/env node
// =============================================================================
// Catálogo de alergias · etapa 1 (descargas → NDJSON común). Sin red.
//
// Lee `glossary-data-build/allergy-sources/` (lo baja fetch-allergy-sources.mjs),
// corre las pasadas de `lib/catalog.mjs` y escribe:
//   glossary-data-build/ndjson/allergy-catalog.ndjson     un registro por concepto
//   glossary-data-build/ndjson/allergy-catalog.meta.json  informe de pasadas,
//                                                          descartes, totales
//
// Uso: node tools/terminology-import/allergies/build-allergy-catalog.mjs
// =============================================================================

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { ensureDir, nowIso } from '../lib/glossary-es/common.mjs';
import { runPasses } from './lib/catalog.mjs';
import { owlVersionIri, parseObo, parseOffTaxonomy, parseOwlClasses, parseTsv } from './lib/parse.mjs';
import { NDJSON_DIR, SOURCES_DIR } from './lib/sources.mjs';

const manifest = JSON.parse(readFileSync(join(SOURCES_DIR, 'manifest.json'), 'utf8'));
const artifactFile = (key) => {
  const a = manifest.artifacts[key];
  if (!a) throw new Error(`Falta «${key}» en manifest.json: corré fetch-allergy-sources.mjs.`);
  return a;
};

const cache = new Map();
const memo = (k, fn) => {
  if (!cache.has(k)) cache.set(k, fn());
  return cache.get(k);
};

const ctx = {
  manifest,
  discarded: [],
  notes: {},
  readPackageJson: (key, file) => JSON.parse(readFileSync(join(artifactFile(key).extractedTo, file), 'utf8')),
  listPackageValueSets: (key) =>
    memo(`vs:${key}`, () => {
      const dir = artifactFile(key).extractedTo;
      return readdirSync(dir)
        .filter((f) => f.startsWith('ValueSet-') && f.endsWith('.json'))
        .sort()
        .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
    }),
  readObo: (key) => memo(`obo:${key}`, () => parseObo(readFileSync(artifactFile(key).file, 'utf8'))),
  readTsv: (key) => memo(`tsv:${key}`, () => parseTsv(readFileSync(artifactFile(key).file, 'utf8'))),
  readOff: (key) => memo(`off:${key}`, () => parseOffTaxonomy(readFileSync(artifactFile(key).file, 'utf8'))),
  readOwl: (key) =>
    memo(`owl:${key}`, () => {
      const text = readFileSync(artifactFile(key).file, 'utf8');
      return { classes: parseOwlClasses(text), version: owlVersionIri(text) };
    }),
  listPackageResources: (key, pattern) => {
    const dir = artifactFile(key).extractedTo;
    return readdirSync(dir)
      .filter((f) => pattern.test(f) && f.endsWith('.json'))
      .sort()
      .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
  },
};

const t0 = Date.now();
const { records, report } = runPasses(ctx);

const byCodeSystem = {};
const byValueSet = {};
let spanish = 0;
for (const r of records) {
  byCodeSystem[r.codeSystem] = (byCodeSystem[r.codeSystem] ?? 0) + 1;
  for (const vs of r.valueSets) byValueSet[vs] = (byValueSet[vs] ?? 0) + 1;
  if (r.displayLanguage === 'es') spanish += 1;
}

ensureDir(NDJSON_DIR);
const out = join(NDJSON_DIR, 'allergy-catalog.ndjson');
writeFileSync(out, records.map((r) => JSON.stringify(r)).join('\n') + '\n');
const meta = {
  generatedAt: nowIso(),
  artifacts: Object.fromEntries(Object.entries(manifest.artifacts).map(([k, a]) => [k, { spec: a.spec, version: a.version, url: a.url, sha256: a.sha256, retrievedAt: a.retrievedAt, license: a.license }])),
  passes: report,
  discarded: ctx.discarded,
  notes: ctx.notes,
  totals: { concepts: records.length, withSpanishDisplay: spanish, byCodeSystem, byValueSet },
  seconds: Math.round((Date.now() - t0) / 1000),
};
writeFileSync(join(NDJSON_DIR, 'allergy-catalog.meta.json'), JSON.stringify(meta, null, 2) + '\n');

console.table(report.map(({ n, key, read, added, duplicates }) => ({ n, key, read, added, duplicates })));
console.log(JSON.stringify({ totals: meta.totals, discarded: ctx.discarded, hpoStaleTranslations: ctx.notes.hpoStaleTranslations, lexicalSweep: ctx.notes.lexicalSweep?.length }, null, 2));
console.log(`→ ${out}`);
