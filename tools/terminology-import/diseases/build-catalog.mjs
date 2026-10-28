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

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { BUILD_DIR, nowIso, writeJson, writeNdjson } from '../lib/glossary-es/common.mjs';
import { KEY_VERSION, SYSTEMS } from './lib/code-systems.mjs';
import { buildDoid, buildEfo, buildIcd11Mms, buildMondo, buildOrphanet, readOrphanet } from './lib/records.mjs';
import { buildGard, buildMesh, buildNando, buildNcitFlat, buildOncotree, parseGardCsv, parseNcitCuiMap, parseNcitFlat } from './lib/records-extra.mjs';
import { citeHpoAnnotations, citeHpoCommonDiseases, citePhenopackets, icd10KeysFromWhoMap, icd10MultipleTargets, resolveDoidCode } from './lib/citations.mjs';
import { attachMedlineplus, medlineplusMeshPairs } from './lib/medlineplus.mjs';
import { buildMedlineplusGenetics, parseGhrConditions } from './lib/medlineplus-genetics.mjs';
import { readDescriptors, readSupplementals } from './lib/mesh.mjs';
import { resolveXrefs } from './lib/resolve.mjs';
import { SNAPSHOT_DIR, writeSnapshot } from './lib/snapshot.mjs';
import { GARD, NDJSON_DIR, SOURCES_DIR } from './lib/sources.mjs';

// Fuentes cuya licencia NO está verificada por texto (o que el propietario dejó sin aprobar): se construyen sólo con
// el flag explícito, nunca por defecto (ver SOURCES.md, «Condicionadas»).
const WITH_GARD = process.argv.includes('--with-gard');
const WITH_ICD11_ES = process.argv.includes('--with-icd11-es');

function loadManifest() {
  const path = join(SOURCES_DIR, 'manifest.json');
  if (!existsSync(path)) throw new Error(`Falta ${path}. Corré primero fetch-sources.mjs.`);
  const byKey = Object.fromEntries(JSON.parse(readFileSync(path, 'utf8')).sources.map((s) => [s.key, s]));
  // GARD lo baja `fetch-gard.mjs` (≈ 6 300 pedidos) y deja su propio manifiesto. Sólo con `--with-gard`.
  if (!WITH_GARD) return byKey;
  const gardManifest = join(GARD.dir, 'manifest.json');
  if (!existsSync(gardManifest)) throw new Error(`Falta ${gardManifest}. Corré primero fetch-gard.mjs.`);
  const g = JSON.parse(readFileSync(gardManifest, 'utf8'));
  if (g.singles.files !== g.trimmed.diseases) throw new Error(`GARD incompleto: ${g.singles.files} fichas de ${g.trimmed.diseases}. Terminá fetch-gard.mjs.`);
  const base = { publisher: 'GARD (NCATS/NIH)', version: GARD.version, license: GARD.license, retrievedAt: g.generatedAt };
  byKey['gard-list'] = { key: 'gard-list', ...base, url: GARD.listUrl, officialUrl: GARD.aboutUrl, sha256: g.list.sha256, bytes: g.list.bytes, path: join(GARD.dir, 'gard-disease-list.csv') };
  byKey['gard-trimmed'] = { key: 'gard-trimmed', ...base, url: GARD.trimmedUrl, sha256: g.trimmed.sha256, bytes: g.trimmed.bytes, path: join(GARD.dir, 'diseases.trimmed.json') };
  byKey['gard-singles'] = { key: 'gard-singles', ...base, url: `${GARD.singlesUrl}<id>.json`, sha256: g.singles.combinedSha256, files: g.singles.files, path: join(GARD.dir, 'singles') };
  return byKey;
}

/** Códigos que citan las fuentes cargadas hacia un sistema (para saber qué UI de MeSH / NCIt hay que traer). */
function citedCodes(records, citations, cs) {
  const out = new Set();
  for (const r of records) for (const x of r.xrefs) if (x.cs === cs) out.add(x.code);
  for (const list of Object.values(citations)) for (const c of list) if (c.cs === cs) out.add(c.code);
  return out;
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

  const mapping = (name) => join(m['icd11-mapping'].unzippedTo, name);
  const icd11 = buildIcd11Mms(
    {
      tabulation: join(m['icd11-mms'].unzippedTo, 'SimpleTabulation-ICD-11-MMS-en.txt'),
      tabulationEs: WITH_ICD11_ES ? join(m['icd11-mms-es'].unzippedTo, 'SimpleTabulation-ICD-11-MMS-es.txt') : null,
      map11To10: mapping('11To10MapToOneCategory.txt'),
    },
    m['icd11-mms'],
  );
  console.log(`[icd11-mms] ${icd11.records.length} (tabulación ${icd11.tabulationVersion}; ES ${icd11.tabulationEsVersion} ${JSON.stringify(icd11.spanish)}; 11→10 ${icd11.map11To10Version})`);
  if (icd11.spanish && (icd11.spanish.missingInSpanishFile || icd11.spanish.titleEnDiffersFromEnglishFile)) throw new Error(`CIE-11: el archivo en castellano no calza con el inglés: ${JSON.stringify(icd11.spanish)}`);
  const efo = await buildEfo(m.efo, m.efo);
  console.log(`[efo-disease] ${efo.records.length}`);

  // Fuentes de la pasada del 2026-10-27 que no dependen de qué citen las demás.
  let gard = { records: [], counts: {}, version: null };
  if (WITH_GARD) {
    const gardDir = join(GARD.dir, 'singles');
    const singles = new Map(readdirSync(gardDir).map((f) => [f.replace(/\.json$/, ''), JSON.parse(readFileSync(join(gardDir, f), 'utf8'))]));
    gard = buildGard(
      { csv: parseGardCsv(m['gard-list'].path), trimmed: JSON.parse(readFileSync(m['gard-trimmed'].path, 'utf8')), singles },
      m['gard-list'],
      GARD.version,
    );
  }
  console.log(`[gard] ${gard.records.length} (${WITH_GARD ? JSON.stringify(gard.counts) : 'omitido: licencia sin verificar, ver SOURCES.md'})`);
  const ghr = buildMedlineplusGenetics(parseGhrConditions(m['medlineplus-genetics'].path), m['medlineplus-genetics'], '2026-10-27');
  console.log(`[medlineplus-genetics] ${ghr.records.length}`);
  const nando = buildNando(readFileSync(m.nando.path, 'utf8'), m.nando);
  console.log(`[nando] ${nando.records.length} (versión ${nando.version}; licencia declarada en el archivo: ${nando.header?.license})`);
  const oncotree = buildOncotree(JSON.parse(readFileSync(m.oncotree.path, 'utf8')), m.oncotree, '2025-10-03');
  console.log(`[oncotree] ${oncotree.records.length}`);

  const citations = {
    'hpo-annotations': citeHpoAnnotations(m['hpo-annotations'].path),
    'phenopacket-store': citePhenopackets(m['phenopacket-store'].unzippedTo),
  };
  const doidCodes = new Set(doid.records.map((r) => r.code));
  const doidAlt = new Map(doid.records.flatMap((r) => (r.properties.disease_alt_ids ?? []).map((a) => [a, r.code])));
  citations['hpo-common-diseases'] = citeHpoCommonDiseases(m['hpo-common-diseases'].unzippedTo).map((c) =>
    c.cs === 'doid' ? { cs: 'doid', code: resolveDoidCode(c.code, doidCodes, doidAlt) } : c,
  );

  // MeSH y NCIt traen, además de su nomenclatura propia, los UI/códigos que citan las demás fuentes.
  const citers = [...mondo.records, ...orphanet.records, ...doid.records, ...icd11.records, ...efo.records, ...gard.records, ...ghr.records, ...nando.records, ...oncotree.records];
  const citedMesh = citedCodes(citers, citations, 'mesh');
  const citedNcit = citedCodes(citers, citations, 'ncit-disease');
  const descriptors = await readDescriptors(join(m['mesh-desc'].unzippedTo, 'desc2026.xml'));
  const supp = await readSupplementals(join(m['mesh-supp'].unzippedTo, 'supp2026.xml'), [3], citedMesh);
  const mesh = buildMesh({ descriptors, supplementals: supp.records }, citedMesh, m['mesh-desc'], m['mesh-supp']);
  const mplusAttached = attachMedlineplus(mesh.records, medlineplusMeshPairs(m['medlineplus-topics'].path));
  console.log(`[mesh] ${mesh.records.length} (alineamientos MedlinePlus ES: ${mplusAttached}; ${JSON.stringify(mesh.counts)}; excluidos ${JSON.stringify(mesh.excluded)}; SCR leídos ${supp.total})`);
  const ncitVersion = readFileSync(m['ncit-evs-readme'].path, 'utf8').split('\n')[0].trim();
  const ncit = buildNcitFlat(
    { rows: parseNcitFlat(join(m['ncit-evs-flat'].unzippedTo, 'Thesaurus.txt')), cuiMap: parseNcitCuiMap(m['ncit-evs-cui-map'].path) },
    citedNcit,
    m['ncit-evs-flat'],
    ncitVersion,
  );
  console.log(`[ncit-disease] ${ncit.records.length}; [ncit-xref] ${ncit.xrefRecords.length} (versión ${ncit.version}; ${JSON.stringify(ncit.excluded)})`);

  // MMS → Fundación sólo para las entidades que otra fuente cita: es el puente
  // entre los xref `icd11.foundation` de MONDO y el código MMS. Las demás 30 000
  // claves de Fundación no enlazarían nada.
  const citedFoundation = new Set(
    [...mondo.records, ...orphanet.records].flatMap((r) => r.xrefs.filter((x) => x.cs === 'icd11-foundation').map((x) => x.code)),
  );
  for (const r of icd11.records) r.xrefs = r.xrefs.filter((x) => x.cs !== 'icd11-foundation' || citedFoundation.has(x.code));

  const records = [...mondo.records, ...orphanet.records, ...doid.records, ...ncit.records, ...ncit.xrefRecords, ...icd11.records, ...efo.records, ...mesh.records, ...gard.records, ...ghr.records, ...nando.records, ...oncotree.records];
  const who10 = icd10KeysFromWhoMap(mapping('10To11MapToOneCategory.txt'));
  const multiple = icd10MultipleTargets(mapping('10To11MapToMultipleCategories.txt'));
  const mmsCodes = new Set(icd11.records.map((r) => r.code));
  const seeded = who10.keys.map((k) => ({
    cs: 'icd10-who',
    code: k.code,
    citer: 'who-icd10-to-icd11',
    xrefs: k.targets.map((t) => ({ cs: 'icd11-mms', code: t, equivalence: null, context: `who:10To11MapToOneCategory ${who10.version}` })),
    // Destinos poscoordinados («stem&extensión», «a/b»): textuales, con cada parte comprobada contra la MMS (código exacto).
    properties: {
      ...(k.postcoordinated.length
        ? { icd11_postcoordinated_targets: k.postcoordinated.map((expression) => ({ expression, parts: expression.split(/[&/]/).map((code) => ({ code, inMms: mmsCodes.has(code) })) })) }
        : {}),
      ...(multiple.has(k.code) ? { icd11_multiple_category_targets: multiple.get(k.code) } : {}),
    },
  }));
  citations['hpo-annotations'] ??= [];
  const { keyRecords, unresolved, citationStats } = resolveXrefs(records, citations, seeded, efo.notes);
  citationStats['who-icd10-to-icd11'] = { cited: who10.keys.length, postcoordinatedTargets: who10.postcoordinated, withMultipleCategoryTargets: multiple.size };
  writeJson(join(BUILD_DIR, 'diseases-citations.json'), { generatedAt: nowIso(), citations }, false);
  const all = [...records, ...keyRecords];
  const byCs = new Map();
  for (const r of all) (byCs.get(r.cs) ?? byCs.set(r.cs, []).get(r.cs)).push(r);
  for (const [cs, rows] of byCs) await writeNdjson(join(NDJSON_DIR, `${cs}.ndjson`), rows);
  // Archivo(s) de origen de cada sistema: el cargador los deja en `code_system_versions.checksum`.
  const fileOf = (...keys) => keys.map((k) => ({ key: k, url: m[k].url, officialUrl: m[k].officialUrl ?? null, sha256: m[k].sha256, retrievedAt: m[k].retrievedAt }));
  const keyFiles = fileOf('mondo', 'orphanet-es-product1', 'doid', 'ncit-evs-flat', 'hpo-annotations', 'phenopacket-store', 'icd11-mapping');
  writeJson(join(NDJSON_DIR, '_systems.json'), {
    mondo: fileOf('mondo'),
    orphanet: fileOf('orphanet-es-product1', 'orphanet-en-product1', 'orphanet-en-product7'),
    doid: fileOf('doid'),
    'ncit-disease': fileOf('ncit-evs-flat', 'ncit-evs-cui-map'),
    'ncit-xref': fileOf('ncit-evs-flat', 'ncit-evs-cui-map'),
    'icd11-mms': fileOf('icd11-mms', 'icd11-mms-es', 'icd11-mapping'),
    'efo-disease': fileOf('efo'),
    mesh: [...fileOf('mesh-desc', 'mesh-supp', 'medlineplus-topics'), ...keyFiles.filter((k) => ['mondo', 'orphanet-es-product1', 'doid', 'hpo-annotations'].includes(k.key))],
    ...(WITH_GARD ? { gard: fileOf('gard-list', 'gard-trimmed', 'gard-singles') } : {}),
    'medlineplus-genetics': fileOf('medlineplus-genetics'),
    nando: fileOf('nando'),
    oncotree: fileOf('oncotree'),
    ...Object.fromEntries([...byCs.keys()].filter((cs) => SYSTEMS[cs]?.keyOnly).map((cs) => [cs, keyFiles])),
  }, true);

  const stats = {
    generatedAt: nowIso(),
    versions: {
      mondo: mondo.version,
      orphanet: orphanet.version,
      doid: doid.version,
      'ncit-disease': ncit.version,
      'ncit-xref': ncit.version,
      'icd11-mms': icd11.version,
      'efo-disease': efo.version,
      mesh: mesh.version,
      gard: gard.version,
      'medlineplus-genetics': ghr.version,
      nando: nando.version,
      oncotree: oncotree.version,
      keys: KEY_VERSION,
    },
    excluded: { mondo: mondo.excluded, 'ncit-disease': ncit.excluded, 'efo-disease': efo.excluded, mesh: mesh.excluded },
    icd11Spanish: icd11.spanish,
    bySystem: statsFor(all),
    unresolvedXrefs: unresolved,
    citations: citationStats,
    seconds: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(join(BUILD_DIR, 'diseases-build-stats.json'), stats, true);
  // Instantánea versionada en git (gzip, partes < 45 MB): ver lib/snapshot.mjs.
  // El manifiesto de fuentes va sin las rutas locales de esta máquina.
  const sourcesManifest = JSON.parse(readFileSync(join(SOURCES_DIR, 'manifest.json'), 'utf8'));
  sourcesManifest.sources = [...sourcesManifest.sources, ...(WITH_GARD ? ['gard-list', 'gard-trimmed', 'gard-singles'] : []).map((k) => m[k])].map(({ path: _path, unzippedTo: _unzipped, ...rest }) => rest);
  writeJson(join(BUILD_DIR, 'diseases-sources-manifest.json'), sourcesManifest, true);
  const snapshot = writeSnapshot(
    byCs,
    {
      '_systems.json': join(NDJSON_DIR, '_systems.json'),
      'diseases-build-stats.json': join(BUILD_DIR, 'diseases-build-stats.json'),
      'diseases-citations.json': join(BUILD_DIR, 'diseases-citations.json'),
      'sources-manifest.json': join(BUILD_DIR, 'diseases-sources-manifest.json'),
    },
    stats.versions,
  );
  console.log(JSON.stringify(stats, null, 2));
  console.log(`[snapshot] ${snapshot.length} archivos en ${SNAPSHOT_DIR}`);
}

main().catch((err) => {
  console.error('ERROR FATAL en build-catalog:', err);
  process.exitCode = 1;
});
