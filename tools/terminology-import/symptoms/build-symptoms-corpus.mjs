#!/usr/bin/env node
// =============================================================================
// ETL de síntomas, etapa 1 (build): fuentes ya descargadas → corpus NDJSON
// normalizado + reporte de cobertura y de saturación. Sin red, sin base.
//
// Entrada:  <GLOSSARY_BUILD_DIR>/symptoms-sources/ (ver fetch-symptom-sources.mjs)
// Salida:   <GLOSSARY_BUILD_DIR>/symptoms/
//             ndjson/terms-<hpo|symp|ncit>.ndjson
//             ndjson/relations-<hpoa|mondo|doid|hpo-common-disease>.ndjson
//             ndjson/disease-equivalences.ndjson  código → MONDO id (Mondo equivalentTo)
//             coverage.json   términos por sistema, relaciones por fuente,
//                             enfermedades con/sin fenotipos (contra Mondo)
//             saturation.json aporte NUEVO de cada pasada tras deduplicar
//                             por código y por cruce publicado
//
// Uso: node tools/terminology-import/symptoms/build-symptoms-corpus.mjs
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDir, nowIso, writeJson, writeNdjson } from '../lib/glossary-es/common.mjs';
import { commonDiseaseRows, doidIds, doidNormalizer, doidSymptomAxioms, mondoFeatureRows, parseHpoa } from './lib/annotations.mjs';
import { coverageReport } from './lib/coverage.mjs';
import { diseaseIdentity, mondoEquivalences, normalizeDiseaseCurie, termOverlaps } from './lib/crosswalk.mjs';
import { hpoIdResolver, hpoRows } from './lib/hpo.mjs';
import { readObo } from './lib/obo.mjs';
import { ncitRows, sympRows } from './lib/obo-sources.mjs';
import { isPhenotypeRelation } from './lib/relations-plan.mjs';
import { OUT_DIR, SOURCES_DIR, sourceByKey, sourcePath } from './lib/sources.mjs';

function provenanceFor(key) {
  const s = sourceByKey(key);
  const path = sourcePath(s.file);
  if (!existsSync(path)) return null;
  const manifestPath = join(SOURCES_DIR, 'manifest.json');
  const m = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')).files.find((f) => f.key === key) : null;
  return { retrievedAt: m?.retrievedAt ?? statSync(path).mtime.toISOString(), license: s.license, sha256: m?.sha256 ?? null, url: s.url };
}

async function oboTerms(path) {
  const terms = new Map();
  const header = await readObo(path, (t) => terms.set(t.id, t));
  return { terms, header };
}

function needSource(key) {
  const p = provenanceFor(key);
  if (!p) throw new Error(`Falta la fuente ${key} (${sourceByKey(key).file}); corré fetch-symptom-sources.mjs`);
  return p;
}

async function main() {
  const t0 = Date.now();
  const nd = (name) => join(OUT_DIR, 'ndjson', `${name}.ndjson`);
  ensureDir(join(OUT_DIR, 'ndjson'));

  // --- Términos -------------------------------------------------------------
  const hpoJson = JSON.parse(readFileSync(sourcePath(sourceByKey('hpo-json').file), 'utf8'));
  const hpoProv = needSource('hpo-json');
  needSource('hpo-es');
  const hpo = hpoRows(hpoJson, readFileSync(sourcePath(sourceByKey('hpo-es').file), 'utf8'), hpoProv);
  const resolveHp = hpoIdResolver(hpoJson);
  // Mondo y las anotaciones de enfermedades comunes no traen «aspecto» como
  // HPOA: se toma de la subontología HPO del destino. Sólo HP:0000118
  // (anomalía fenotípica) es síntoma/signo; inicio, herencia o modificador no.
  const subontologyOf = new Map(hpo.rows.map((r) => [r.code, r.subontology]));
  const withAspect = (rows) => {
    for (const r of rows) {
      const sub = subontologyOf.get(r.phenotype) ?? null;
      r.aspect = sub === 'HP:0000118' ? 'P' : `not-phenotype:${sub}`;
    }
    return rows;
  };
  await writeNdjson(nd('terms-hpo'), hpo.rows);

  const sympSrc = await oboTerms(sourcePath(sourceByKey('symp').file));
  const symp = sympRows(sympSrc.terms, sympSrc.header, needSource('symp'));
  await writeNdjson(nd('terms-symp'), symp.rows);

  const ncitSrc = await oboTerms(sourcePath(sourceByKey('ncit').file));
  const ncit = ncitRows(ncitSrc.terms, ncitSrc.header, needSource('ncit'));
  ncitSrc.terms.clear();
  await writeNdjson(nd('terms-ncit'), ncit.rows);

  // --- Relaciones -----------------------------------------------------------
  const hpoa = parseHpoa(readFileSync(sourcePath(sourceByKey('hpoa').file), 'utf8'), needSource('hpoa'));
  await writeNdjson(nd('relations-hpoa'), hpoa.rows);

  const mondoSrc = await oboTerms(sourcePath(sourceByKey('mondo').file));
  const mondoRel = withAspect(mondoFeatureRows(mondoSrc.terms, mondoSrc.header, needSource('mondo')));
  const { toMondo, mondoXrefs } = mondoEquivalences(mondoSrc.terms);
  await writeNdjson(nd('relations-mondo'), mondoRel);
  // Equivalencias declaradas por Mondo (código → MONDO id): las usa el cargador
  // de relaciones cuando la enfermedad sólo está cargada como MONDO.
  await writeNdjson(nd('disease-equivalences'), [...toMondo].filter(([c, m]) => c !== m).map(([curie, mondo]) => ({ curie, mondo, via: 'MONDO:equivalentTo', version: mondoSrc.header.dataVersion })));

  const doidOwl = readFileSync(sourcePath(sourceByKey('doid-owl').file), 'utf8');
  const doid = doidSymptomAxioms(doidOwl, needSource('doid-owl'));
  const normalizeDoid = doidNormalizer(doidIds(doidOwl));
  await writeNdjson(nd('relations-doid'), doid);

  const cdProv = needSource('hpo-common-disease');
  const cdDir = join(SOURCES_DIR, 'monarch', 'common-diseases');
  if (!existsSync(cdDir)) execFileSync('tar', ['xzf', sourcePath(sourceByKey('hpo-common-disease').file), '-C', join(SOURCES_DIR, 'monarch')]);
  const cdStats = { files: 0, read: 0, unresolvedHpo: 0, remapped: 0 };
  const common = [];
  for (const f of readdirSync(cdDir).filter((x) => x.endsWith('.tab')).sort()) {
    cdStats.files++;
    common.push(...commonDiseaseRows(readFileSync(join(cdDir, f), 'utf8'), f, resolveHp, cdProv, cdStats, normalizeDoid));
  }
  withAspect(common);
  await writeNdjson(nd('relations-hpo-common-disease'), common);

  // Validación: todo fenotipo destino tiene que existir en el corpus de términos.
  const termCodes = { hpo: new Set(hpo.rows.map((r) => r.code)), symp: new Set(symp.rows.map((r) => r.code)) };
  const dangling = {};
  for (const r of [...hpoa.rows, ...mondoRel, ...doid, ...common]) {
    if (!termCodes[r.phenotypeSystem].has(r.phenotype)) dangling[r.source] = (dangling[r.source] ?? 0) + 1;
  }

  // --- Saturación: aporte NUEVO por pasada ------------------------------------
  const passes = [];
  const relKey = (r) => `${diseaseIdentity(r.disease.curie, toMondo)}|${r.phenotypeSystem}:${r.phenotype}|${r.negated ? 'NOT' : ''}`;
  const seenRel = new Set();
  const addRelPass = (rows) => {
    let nuevas = 0;
    for (const r of rows) {
      // Sólo cuenta lo que se cargaría como síntoma: aspecto P, no negado.
      if (!isPhenotypeRelation(r) || r.negated) continue;
      const k = relKey(r);
      if (!seenRel.has(k)) {
        seenRel.add(k);
        nuevas++;
      }
    }
    return nuevas;
  };
  const termPass = (rows, previous) => rows.length - termOverlaps(rows, previous).size;
  passes.push({ pass: 1, sources: ['HPO hp.json', 'HPO hp-es.babelon.tsv', 'phenotype.hpoa'], newTerms: hpo.rows.length, newRelations: addRelPass(hpoa.rows) });
  passes.push({ pass: 2, sources: ['Symptom Ontology', 'Human Disease Ontology (RO:0002452)'], newTerms: termPass(symp.rows, hpo.rows), newRelations: addRelPass(doid) });
  const ncitSigns = ncit.rows.filter((r) => r.scopeRule === 'sign-symptom');
  const ncitFindings = ncit.rows.filter((r) => r.scopeRule === 'finding-by-site-or-system');
  passes.push({ pass: 3, sources: ['NCI Thesaurus (signos y síntomas)', 'Mondo disease_has_feature'], newTerms: termPass(ncitSigns, [...hpo.rows, ...symp.rows]), overlapsByPublishedXref: termOverlaps(ncitSigns, [...hpo.rows, ...symp.rows]).size, newRelations: addRelPass(mondoRel) });
  passes.push({ pass: 4, sources: ['HPO common disease annotations (Groza 2015)'], newTerms: 0, newRelations: addRelPass(common) });

  // Pasada 5 (opcional): las aristas del KG de Monarch derivadas de HPOA. Se
  // espera 0: es la misma fuente re-transformada; sirve para comprobarlo.
  const monarchPath = sourcePath(sourceByKey('monarch-hpoa-edges').file);
  if (existsSync(monarchPath)) {
    const lines = readFileSync(monarchPath, 'utf8').split('\n').filter(Boolean);
    const head = lines[0].split('\t');
    const [cS, cO, cN] = ['subject', 'object', 'negated'].map((c) => head.indexOf(c));
    const edges = lines.slice(1).map((l) => l.split('\t')).map((f) => ({ disease: { curie: normalizeDiseaseCurie(f[cS]) }, phenotypeSystem: 'hpo', phenotype: f[cO], negated: f[cN] === 'True' || f[cN] === 'true' }));
    passes.push({ pass: 5, sources: ['Monarch KG hpoa_disease_to_phenotype_edges.tsv'], newTerms: 0, read: edges.length, newRelations: addRelPass(edges.filter((e) => e.phenotype?.startsWith('HP:'))) });
  }

  passes.push({ pass: 6, sources: ['NCI Thesaurus — hallazgos clínicos por sitio o sistema (C36278, tipo semántico Finding)'], newTerms: termPass(ncitFindings, [...hpo.rows, ...symp.rows, ...ncitSigns]), newRelations: 0 });

  const coverage = coverageReport({ hpo, symp, ncit, relations: { hpoa: hpoa.rows, mondo: mondoRel, doid, 'hpo-common-disease': common }, toMondo, mondoXrefs, mondoTerms: mondoSrc.terms, hpoTerms: hpo.rows });
  writeJson(join(OUT_DIR, 'coverage.json'), { generatedAt: nowIso(), ...coverage, dangling, commonDisease: cdStats, hpoaHeader: hpoa.header }, true);
  writeJson(join(OUT_DIR, 'saturation.json'), { generatedAt: nowIso(), passes }, true);
  console.log(JSON.stringify({ terms: { hpo: hpo.stats, symp: symp.stats, ncit: ncit.stats }, relations: { hpoa: hpoa.rows.length, mondo: mondoRel.length, doid: doid.length, common: common.length, commonStats: cdStats }, dangling, passes, segundos: Math.round((Date.now() - t0) / 1000) }, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en build-symptoms-corpus:', err);
  process.exitCode = 1;
});
