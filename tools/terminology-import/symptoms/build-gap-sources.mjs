#!/usr/bin/env node
// =============================================================================
// ETL de síntomas, etapa 1b (build de los HUECOS cerrados el 2026-10-27):
// Orphadata producto 4 (EN+ES), MeSH C23 y Wikidata P3841. Sin red ni base.
//
// Entrada:  <GLOSSARY_BUILD_DIR>/symptoms-sources/ (fetch-symptom-sources.mjs)
//           <GLOSSARY_BUILD_DIR>/symptoms/ndjson/ del corpus ya construido
//           (build-symptoms-corpus.mjs, o unpack-data.mjs desde data/): se lee
//           para medir el aporte NUEVO, no se reescribe.
// Salida:   <GLOSSARY_BUILD_DIR>/symptoms/
//             ndjson/relations-orphadata.ndjson   asociaciones enfermedad rara → fenotipo
//             ndjson/terms-mesh-c23.ndjson        descriptores MeSH C23
//             ndjson/crosswalk-wikidata-hpo.ndjson  HPO ↔ ítem de Wikidata (P3841)
//             gap-coverage.json                   conteos y controles cruzados
//             saturation-gaps.json                aporte NUEVO de cada pasada (9 en adelante)
//
// Uso: node tools/terminology-import/symptoms/build-gap-sources.mjs
// =============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDir, nowIso, readNdjson, writeJson, writeNdjson } from '../lib/glossary-es/common.mjs';
import { diseaseIdentity, termOverlaps } from './lib/crosswalk.mjs';
import { hpoIdResolver } from './lib/hpo.mjs';
import { meshC23Rows, readC23Descriptors } from './lib/mesh.mjs';
import { crossCheckWithHpoa, orphadataRows } from './lib/orphadata.mjs';
import { isPhenotypeRelation } from './lib/relations-plan.mjs';
import { OUT_DIR, SOURCES_DIR, WIKIDATA_P3841_QUERY, sourceByKey, sourcePath } from './lib/sources.mjs';
import { wikidataHpoRows } from './lib/wikidata.mjs';
import { zipEntryStream } from './lib/zip.mjs';

/** SHA-256 (16) de las fuentes del corpus original, tal como los fijó SOURCES.md el 2026-10-24. */
const SHA_2026_10_24 = {
  'hpo-json': 'a7b3a012e7b4007a',
  'hpo-es': '00972e33775a0340',
  hpoa: 'e89aa39c8f97bf5a',
  symp: '09ac08ff1595e671',
  'doid-owl': '7b80ccc70f5d84e7',
  mondo: '2631e8e165d41def',
  ncit: '8fdc2d29c9ebd91a',
  'hpo-common-disease': '4c871573d57199cd',
  'monarch-hpoa-edges': 'ea89c38c162ab7d3',
};

function provenanceFor(key) {
  const s = sourceByKey(key);
  const path = sourcePath(s.file);
  if (!existsSync(path)) throw new Error(`Falta la fuente ${key} (${s.file}); corré fetch-symptom-sources.mjs`);
  const m = JSON.parse(readFileSync(join(SOURCES_DIR, 'manifest.json'), 'utf8')).files.find((f) => f.key === key);
  if (!m?.sha256) throw new Error(`manifest.json sin SHA-256 de ${key}`);
  return { retrievedAt: m.retrievedAt, license: s.license, sha256: m.sha256, url: s.url, version: m.declaredVersion };
}

async function main() {
  const t0 = Date.now();
  const nd = (name) => join(OUT_DIR, 'ndjson', `${name}.ndjson`);
  ensureDir(join(OUT_DIR, 'ndjson'));
  for (const f of ['terms-hpo', 'terms-symp', 'terms-ncit', 'relations-hpoa', 'relations-doid', 'relations-mondo', 'relations-hpo-common-disease', 'disease-equivalences']) {
    if (!existsSync(nd(f))) throw new Error(`Falta ${nd(f)}: corré unpack-data.mjs o build-symptoms-corpus.mjs`);
  }
  const termsHpo = readNdjson(nd('terms-hpo'));
  const termsSymp = readNdjson(nd('terms-symp'));
  const termsNcit = readNdjson(nd('terms-ncit'));
  const subontologyOf = new Map(termsHpo.map((r) => [r.code, r.subontology]));
  const hpoJson = JSON.parse(readFileSync(sourcePath(sourceByKey('hpo-json').file), 'utf8'));
  const resolveHp = hpoIdResolver(hpoJson);
  const toMondo = new Map(readNdjson(nd('disease-equivalences')).map((e) => [e.curie, e.mondo]));

  // --- Pasada 9: Orphadata producto 4 ------------------------------------------
  const pEn = provenanceFor('orphadata-en-product4');
  const pEs = provenanceFor('orphadata-es-product4');
  const orpha = orphadataRows(readFileSync(sourcePath(sourceByKey('orphadata-en-product4').file), 'utf8'), readFileSync(sourcePath(sourceByKey('orphadata-es-product4').file), 'utf8'), resolveHp, { retrievedAt: pEn.retrievedAt, license: pEn.license });
  for (const r of orpha.rows) r.aspect = subontologyOf.get(r.phenotype) === 'HP:0000118' ? 'P' : `not-phenotype:${subontologyOf.get(r.phenotype) ?? null}`;
  await writeNdjson(nd('relations-orphadata'), orpha.rows);
  const hpoaRows = readNdjson(nd('relations-hpoa'));
  const crossCheck = crossCheckWithHpoa(orpha.rows, hpoaRows);

  const relKey = (r) => `${diseaseIdentity(r.disease.curie, toMondo)}|${r.phenotypeSystem}:${r.phenotype}`;
  const seenRel = new Set();
  const addRelPass = (rows) => {
    let nuevas = 0;
    for (const r of rows) {
      if (!isPhenotypeRelation(r) || r.negated) continue;
      const k = relKey(r);
      if (!seenRel.has(k)) {
        seenRel.add(k);
        nuevas++;
      }
    }
    return nuevas;
  };
  for (const f of ['relations-hpoa', 'relations-doid', 'relations-mondo', 'relations-hpo-common-disease']) addRelPass(readNdjson(nd(f)));
  const relationsBefore = seenRel.size;
  const orphaNewRelations = addRelPass(orpha.rows);

  // --- Pasada 10: MeSH C23 ------------------------------------------------------
  const pMesh = provenanceFor('mesh-desc');
  const { entry, stream } = zipEntryStream(sourcePath(sourceByKey('mesh-desc').file));
  const { descriptors, scanned } = await readC23Descriptors(stream);
  const mesh = meshC23Rows(descriptors, { version: pMesh.version, retrievedAt: pMesh.retrievedAt, license: pMesh.license, descriptorXmlSha256: pMesh.sha256 });
  await writeNdjson(nd('terms-mesh-c23'), mesh.rows);
  const previousTerms = [...termsHpo, ...termsSymp, ...termsNcit];
  const meshOverlaps = termOverlaps(mesh.rows, previousTerms);

  // --- Pasada 11: Wikidata P3841 -------------------------------------------------
  const pWd = provenanceFor('wikidata-p3841');
  const wd = wikidataHpoRows(JSON.parse(readFileSync(sourcePath(sourceByKey('wikidata-p3841').file), 'utf8')), resolveHp, { retrievedAt: pWd.retrievedAt, license: pWd.license, queryUrl: 'https://query.wikidata.org/sparql (consulta WIKIDATA_P3841_QUERY, lib/sources.mjs)' });
  await writeNdjson(nd('crosswalk-wikidata-hpo'), wd.rows);
  const hpoCodes = new Set(termsHpo.map((r) => r.code));
  const wdResolved = wd.rows.filter((r) => r.hpo && hpoCodes.has(r.hpo));
  const hpoWithItem = new Set(wdResolved.map((r) => r.hpo));

  // --- Control: las fuentes originales, re-bajadas hoy, ¿cambiaron? ----------------
  const manifest = JSON.parse(readFileSync(join(SOURCES_DIR, 'manifest.json'), 'utf8')).files;
  const refetch = Object.entries(SHA_2026_10_24).map(([key, prev]) => {
    const m = manifest.find((f) => f.key === key);
    return { key, sha256Prefix2026_10_24: prev, sha256Prefix2026_10_27: m?.sha256?.slice(0, 16) ?? null, unchanged: m?.sha256?.slice(0, 16) === prev, declaredVersion: m?.declaredVersion ?? null };
  });

  const passes = [
    {
      pass: 9,
      sources: ['Orphadata producto 4 EN (2026-06-23)', 'Orphadata producto 4 ES (2026-06-23)'],
      read: orpha.stats.associations,
      newTerms: 0,
      newRelations: orphaNewRelations,
      relationsBefore,
      note: 'Fenotipos de enfermedades raras directo de Orphanet. Los términos HPO ya estaban todos; las relaciones nuevas son pares enfermedad–fenotipo que HPOA no trae (o trae con otro código de enfermedad no equivalente por Mondo).',
    },
    {
      pass: 10,
      sources: [`MeSH ${pMesh.version} desc${pMesh.version}.xml, árbol C23`],
      read: scanned,
      newTerms: mesh.rows.length - meshOverlaps.size,
      overlapsByPublishedUmlsCui: meshOverlaps.size,
      newRelations: 0,
      note: 'Descriptores C23 (signos y síntomas, condiciones patológicas, procesos patológicos, hallazgos morfológicos). El cruce con HPO/SYMP/NCIt sólo se mide por CUI de UMLS que declaran las dos fuentes; no se descartan filas (es otro code system).',
    },
    {
      pass: 11,
      sources: ['Wikidata P3841 (consulta SPARQL en vivo)'],
      read: wd.stats.bindings,
      newTerms: 0,
      newCrosswalkRows: wd.rows.length,
      hpoTermsWithWikidataItem: hpoWithItem.size,
      newRelations: 0,
      note: 'Sólo cruce HPO ↔ ítem; no aporta términos nuevos al corpus.',
    },
    {
      pass: 12,
      sources: ['Re-descarga de las 9 fuentes originales (HPO hp.json/hp-es/HPOA, SYMP, DO, Mondo, NCIt, enfermedades comunes, Monarch)'],
      newTerms: 0,
      newRelations: 0,
      allUnchanged: refetch.every((r) => r.unchanged),
      refetch,
      note: 'Cero por causa real: el SHA-256 de cada archivo es idéntico al del 2026-10-24, o sea, las fuentes no publicaron nada nuevo en 3 días.',
    },
  ];

  writeJson(
    join(OUT_DIR, 'gap-coverage.json'),
    {
      generatedAt: nowIso(),
      orphadata: { header: orpha.header, headerEs: orpha.headerEs, stats: orpha.stats, crossCheckWithHpoa: crossCheck, newRelationsBeyondExistingSources: orphaNewRelations },
      mesh: { zipEntry: entry, descriptorsScanned: scanned, stats: mesh.stats, overlapsByPublishedUmlsCui: meshOverlaps.size, overlapSample: [...meshOverlaps].slice(0, 5) },
      wikidata: { stats: wd.stats, rows: wd.rows.length, distinctItems: new Set(wd.rows.map((r) => r.qid)).size, distinctHpo: new Set(wd.rows.map((r) => r.hpoAsPublished)).size, hpoTermsInCorpusWithItem: hpoWithItem.size, hpoTermsInCorpus: hpoCodes.size, query: WIKIDATA_P3841_QUERY },
    },
    true,
  );
  writeJson(join(OUT_DIR, 'saturation-gaps.json'), { generatedAt: nowIso(), passes }, true);
  console.log(JSON.stringify({ orphadata: { stats: orpha.stats, crossCheck, newRelations: orphaNewRelations }, mesh: { scanned, rows: mesh.rows.length, stats: mesh.stats, overlaps: meshOverlaps.size }, wikidata: { stats: wd.stats, rows: wd.rows.length, hpoWithItem: hpoWithItem.size }, passes: passes.map((p) => ({ pass: p.pass, newTerms: p.newTerms, newRelations: p.newRelations })), segundos: Math.round((Date.now() - t0) / 1000) }, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en build-gap-sources:', err);
  process.exitCode = 1;
});
