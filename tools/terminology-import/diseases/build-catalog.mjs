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
import { KEY_VERSION, SYSTEMS } from './lib/code-systems.mjs';
import { buildDoid, buildEfo, buildIcd11Mms, buildMondo, buildNcit, buildOrphanet, readOrphanet } from './lib/records.mjs';
import { citeHpoAnnotations, citePhenopackets, icd10KeysFromWhoMap } from './lib/citations.mjs';
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

  const icd11 = buildIcd11Mms(
    { tabulation: join(m['icd11-mms'].unzippedTo, 'SimpleTabulation-ICD-11-MMS-en.txt'), map11To10: m['icd11-to-icd10'].path },
    m['icd11-mms'],
  );
  console.log(`[icd11-mms] ${icd11.records.length} (tabulación ${icd11.tabulationVersion}; 11→10 ${icd11.map11To10Version})`);
  const efo = await buildEfo(m.efo, m.efo);
  console.log(`[efo-disease] ${efo.records.length}`);

  // MMS → Fundación sólo para las entidades que otra fuente cita: es el puente
  // entre los xref `icd11.foundation` de MONDO y el código MMS. Las demás 30 000
  // claves de Fundación no enlazarían nada.
  const citedFoundation = new Set(
    [...mondo.records, ...orphanet.records].flatMap((r) => r.xrefs.filter((x) => x.cs === 'icd11-foundation').map((x) => x.code)),
  );
  for (const r of icd11.records) r.xrefs = r.xrefs.filter((x) => x.cs !== 'icd11-foundation' || citedFoundation.has(x.code));

  const records = [...mondo.records, ...orphanet.records, ...doid.records, ...ncit.records, ...icd11.records, ...efo.records];
  const citations = {
    'hpo-annotations': citeHpoAnnotations(m['hpo-annotations'].path),
    'phenopacket-store': citePhenopackets(m['phenopacket-store'].unzippedTo),
  };
  const who10 = icd10KeysFromWhoMap(m['icd10-to-icd11'].path);
  const seeded = who10.keys.map((k) => ({
    cs: 'icd10-who',
    code: k.code,
    citer: 'who-icd10-to-icd11',
    xrefs: k.targets.map((t) => ({ cs: 'icd11-mms', code: t, equivalence: null, context: `who:10To11MapToOneCategory ${who10.version}` })),
  }));
  const { keyRecords, unresolved, citationStats } = resolveXrefs(records, citations, seeded);
  citationStats['who-icd10-to-icd11'] = { cited: who10.keys.length, postcoordinatedTargetsSkipped: who10.postcoordinated };
  writeJson(join(BUILD_DIR, 'diseases-citations.json'), { generatedAt: nowIso(), citations }, false);
  const all = [...records, ...keyRecords];
  const byCs = new Map();
  for (const r of all) (byCs.get(r.cs) ?? byCs.set(r.cs, []).get(r.cs)).push(r);
  for (const [cs, rows] of byCs) await writeNdjson(join(NDJSON_DIR, `${cs}.ndjson`), rows);
  // Archivo(s) de origen de cada sistema: el cargador los deja en `code_system_versions.checksum`.
  const fileOf = (...keys) => keys.map((k) => ({ key: k, url: m[k].url, officialUrl: m[k].officialUrl ?? null, sha256: m[k].sha256, retrievedAt: m[k].retrievedAt }));
  const keyFiles = fileOf('mondo', 'orphanet-es-product1', 'doid', 'ncit', 'hpo-annotations', 'phenopacket-store', 'icd10-to-icd11');
  writeJson(join(NDJSON_DIR, '_systems.json'), {
    mondo: fileOf('mondo'),
    orphanet: fileOf('orphanet-es-product1', 'orphanet-en-product1', 'orphanet-en-product7'),
    doid: fileOf('doid'),
    'ncit-disease': fileOf('ncit'),
    'icd11-mms': fileOf('icd11-mms', 'icd11-to-icd10'),
    'efo-disease': fileOf('efo'),
    ...Object.fromEntries([...byCs.keys()].filter((cs) => SYSTEMS[cs]?.keyOnly).map((cs) => [cs, keyFiles])),
  }, true);

  const stats = {
    generatedAt: nowIso(),
    versions: { mondo: mondo.version, orphanet: orphanet.version, doid: doid.version, 'ncit-disease': ncit.version, 'icd11-mms': icd11.version, 'efo-disease': efo.version, keys: KEY_VERSION },
    excluded: { mondo: mondo.excluded, 'ncit-disease': ncit.excluded, 'efo-disease': efo.excluded },
    bySystem: statsFor(all),
    unresolvedXrefs: unresolved,
    citations: citationStats,
    seconds: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(join(BUILD_DIR, 'diseases-build-stats.json'), stats, true);
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en build-catalog:', err);
  process.exitCode = 1;
});
