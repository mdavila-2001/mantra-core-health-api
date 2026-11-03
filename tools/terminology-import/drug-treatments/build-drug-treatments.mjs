#!/usr/bin/env node
// =============================================================================
// Tratamientos farmacológicos · etapa 1 (caché → NDJSON común, sin red).
//
// Lee los clones de `fetch-sources.mjs` (manifiesto con commit y SHA-256),
// parsea cada fuente, agrega los códigos de los cruces publicados y escribe:
//   ndjson/drug-treatments.ndjson        una afirmación por línea
//   ndjson/drug-treatments.meta.json     procedencia, conteos y exclusiones
//   drug-treatments-coverage.json        cobertura por tipo/fuente y por pasada
//
// Deduplicación: dentro de una fuente, por id de origen (códigos); entre
// fuentes NO se fusionan afirmaciones (cada una conserva su tipo y su fuente),
// pero el reporte cuenta los PARES fármaco–enfermedad nuevos por pasada usando
// la clave canónica por código (`pairKey`).
//
// Uso: node tools/terminology-import/drug-treatments/build-drug-treatments.mjs
// =============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { BUILD_DIR, ndjsonPath, nowIso, writeJson, writeNdjson } from '../lib/glossary-es/common.mjs';
import { drugCentralIndex, mondoIndex, withCrosswalk } from './lib/crosswalk.mjs';
import { drugCentralIdentifiers, parseDrugCentral2016, parseDrugMechDb, parseLabeledIn, parseMaxo, parsePharmacotherapyDb } from './lib/parsers.mjs';
import { PASSES, coverage } from './lib/report.mjs';
import { CROSSWALKS, SOURCES, cloneDirName } from './lib/sources.mjs';
import { CACHE, MANIFEST } from './fetch-sources.mjs';

function sourceFile(manifest, key, fileKey) {
  const def = SOURCES[key] ?? CROSSWALKS[key];
  const dirName = cloneDirName(key);
  const entry = manifest.entries[dirName];
  if (!entry || entry.commit !== def.commit) throw new Error(`${key}: falta el clon ${dirName} en el manifiesto. Corré fetch-sources.mjs.`);
  const rel = def.files[fileKey];
  const meta = entry.files[rel];
  return {
    text: readFileSync(join(CACHE, dirName, rel), 'utf8'),
    provenance: { version: def.version, retrievedAt: entry.retrievedAt, commit: def.commit, file: rel, fileSha256: meta.sha256 },
  };
}

const PARSE = {
  labeledin: (m) => {
    const expert = sourceFile(m, 'labeledin', 'expert');
    const crowd = sourceFile(m, 'labeledin', 'crowd');
    const a = parseLabeledIn(expert.text, expert.provenance);
    const b = parseLabeledIn(crowd.text, crowd.provenance, { crowd: true });
    return { assertions: [...a.assertions, ...b.assertions], stats: { expert: a.stats, crowd: b.stats } };
  },
  pharmacotherapydb: (m) => {
    const f = sourceFile(m, 'pharmacotherapydb', 'indications');
    return parsePharmacotherapyDb(f.text, f.provenance);
  },
  'drugcentral-2016': (m) => {
    const f = sourceFile(m, 'drugcentral-2016', 'indications');
    return parseDrugCentral2016(f.text, f.provenance);
  },
  drugmechdb: (m) => {
    const f = sourceFile(m, 'drugmechdb', 'paths');
    return parseDrugMechDb(f.text, f.provenance);
  },
  maxo: (m) => {
    const f = sourceFile(m, 'maxo', 'annotations');
    return parseMaxo(f.text, f.provenance);
  },
};

async function main() {
  const t0 = Date.now();
  if (!existsSync(MANIFEST)) throw new Error(`Falta ${MANIFEST}. Corré fetch-sources.mjs.`);
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const mondo = mondoIndex(sourceFile(manifest, 'mondo', 'sssom').text);
  const drugCentral = drugCentralIndex(drugCentralIdentifiers(sourceFile(manifest, 'drugcentral-2016', 'identifiers').text));

  const all = [];
  const perSource = {};
  for (const pass of PASSES) {
    for (const key of pass.sources) {
      const { assertions, stats } = PARSE[key](manifest);
      perSource[key] = { pass: pass.number, stats };
      for (const a of assertions) all.push(withCrosswalk(a, { mondo, drugCentral }));
      console.log(`[build] pasada ${pass.number} · ${key}: ${assertions.length} afirmaciones`);
    }
  }
  const ids = new Set(all.map((a) => a.id));
  if (ids.size !== all.length) throw new Error(`ids de afirmación repetidos: ${all.length - ids.size}`);

  await writeNdjson(ndjsonPath('drug-treatments'), all);
  const report = coverage(all);
  const meta = {
    generatedAt: nowIso(),
    buildDir: BUILD_DIR,
    assertions: all.length,
    sources: Object.fromEntries(Object.entries(perSource).map(([k, v]) => [k, { ...v, ...SOURCES[k], files: undefined }])),
    crosswalks: Object.fromEntries(Object.entries(CROSSWALKS).map(([k, v]) => [k, { name: v.name, repo: v.repo, commit: v.commit, version: v.version, license: v.license }])),
    regla: 'Cada afirmación conserva el tipo que declara su fuente. Los códigos agregados por cruce van en crosswalk con via y predicate. Nada se deduce por nombre.',
    segundos: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(ndjsonPath('drug-treatments').replace(/\.ndjson$/, '.meta.json'), meta, true);
  writeJson(join(BUILD_DIR, 'drug-treatments-coverage.json'), report, true);
  console.log(JSON.stringify({ assertions: all.length, passes: report.passes, byType: report.byType }, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en build-drug-treatments:', err);
  process.exitCode = 1;
});
