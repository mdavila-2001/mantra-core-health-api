#!/usr/bin/env node
// =============================================================================
// Catálogo de enfermedades · etapa 1 (sin red): fuentes descargadas → NDJSON.
//
// Lee `<BUILD_DIR>/diseases-sources/manifest.json` (lo escribe
// `fetch-sources.mjs`), arma un registro común por concepto (`lib/records.mjs`)
// y escribe `<BUILD_DIR>/ndjson/diseases/<codeSystem>.ndjson`, más
// `diseases-build-stats.json` con los conteos que cita docs/seed-research/diseases.md.
//
// Las claves cruzadas (OMIM, CIE-10 OMS, CIE-11, MeSH, UMLS) se crean acá: un
// concepto por código que alguna fuente cita en un alineamiento publicado.
//
// Uso: node tools/terminology-import/diseases/build-catalog.mjs
// =============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { BUILD_DIR, nowIso, writeJson, writeNdjson } from '../lib/glossary-es/common.mjs';
import { KEY_VERSION } from './lib/code-systems.mjs';
import { buildDoid, buildMondo, buildNcit, buildOrphanet, readOrphanet } from './lib/records.mjs';
import { resolveXrefs } from './lib/resolve.mjs';
import { NDJSON_DIR, SOURCES_DIR } from './lib/sources.mjs';

function loadManifest() {
  const path = join(SOURCES_DIR, 'manifest.json');
  if (!existsSync(path)) throw new Error(`Falta ${path}. Corré primero fetch-sources.mjs.`);
  const byKey = Object.fromEntries(JSON.parse(readFileSync(path, 'utf8')).sources.map((s) => [s.key, s]));
  return byKey;
}

function statsFor(records) {
  const by = {};
  for (const r of records) {
    const s = (by[r.cs] ??= { concepts: 0, active: 0, deprecated: 0, withDefinition: 0, designations: 0, designationsEs: 0, isA: 0, maps: 0 });
    s.concepts += 1;
    s[r.status] += 1;
    if (r.definition) s.withDefinition += 1;
    s.designations += r.designations.length;
    s.designationsEs += r.designations.filter((d) => d.lang === 'es').length;
    s.isA += r.parents.length;
    s.maps += r.xrefs.filter((x) => x.resolution !== 'unresolved').length;
  }
  return by;
}

async function main() {
  const t0 = Date.now();
  const m = loadManifest();
  const mondo = await buildMondo(m.mondo, m.mondo);
  console.log(`[mondo] ${mondo.records.length} (excluidos: ${JSON.stringify(mondo.excluded)})`);
  const doid = await buildDoid(m.doid, m.doid);
  console.log(`[doid] ${doid.records.length}`);
  const ncit = await buildNcit(m.ncit, m.ncit);
  console.log(`[ncit] ${ncit.records.length} (fuera de C2991: ${ncit.excluded.outsideDiseaseOrDisorder})`);
  const orphaInput = readOrphanet({
    es: m['orphanet-es-product1'].path,
    en: m['orphanet-en-product1'].path,
    product7: m['orphanet-en-product7'].path,
    product3: Object.values(m)
      .filter((s) => s.key.startsWith('orphanet-en-product3-'))
      .map((s) => s.path),
  });
  const orphanet = buildOrphanet(orphaInput, m['orphanet-es-product1']);
  console.log(`[orphanet] ${orphanet.records.length}`);

  const records = [...mondo.records, ...orphanet.records, ...doid.records, ...ncit.records];
  const { keyRecords, unresolved } = resolveXrefs(records);
  const all = [...records, ...keyRecords];
  const byCs = new Map();
  for (const r of all) (byCs.get(r.cs) ?? byCs.set(r.cs, []).get(r.cs)).push(r);
  for (const [cs, rows] of byCs) await writeNdjson(join(NDJSON_DIR, `${cs}.ndjson`), rows);

  const stats = {
    generatedAt: nowIso(),
    versions: { mondo: mondo.version, orphanet: orphanet.version, doid: doid.version, 'ncit-disease': ncit.version, keys: KEY_VERSION },
    excluded: { mondo: mondo.excluded, 'ncit-disease': ncit.excluded },
    bySystem: statsFor(all),
    unresolvedXrefs: unresolved,
    seconds: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(join(BUILD_DIR, 'diseases-build-stats.json'), stats, true);
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en build-catalog:', err);
  process.exitCode = 1;
});
