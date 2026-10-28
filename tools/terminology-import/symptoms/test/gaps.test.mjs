// Pruebas de los huecos cerrados el 2026-10-27: Orphadata producto 4, MeSH C23,
// Wikidata P3841 y el plan de relaciones contra el modelo real v4.2.50.
// Fixtures: recortes REALES de en_product4.xml / es_product4.xml (Orphadata
// 2026-06-23), desc2026.xml (MeSH 2026) y de la respuesta SPARQL de Wikidata
// (consulta del 2026-10-27). Correr: node --test tools/terminology-import/symptoms/test/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

import { parseHpoa } from '../lib/annotations.mjs';
import { hpoIdResolver } from '../lib/hpo.mjs';
import { branchOf, meshC23Rows, readC23Descriptors } from '../lib/mesh.mjs';
import { ORPHA_FREQUENCY_TO_HPO, crossCheckWithHpoa, orphadataRows, parseProduct4, parseSources, unescapeXml } from '../lib/orphadata.mjs';
import { EVIDENCE_VALUE_SETS, HPO_FREQUENCY_TO_VS, REL, citationText, evidenceTierCode, phenotypeResolver, relationsPlan, validFromOf } from '../lib/relations-plan.mjs';
import { wikidataHpoRows } from '../lib/wikidata.mjs';
import { firstZipEntry, zipEntryStream } from '../lib/zip.mjs';
import { groupByHpo, mapTuple, propertyTuple } from '../load-wikidata-crosswalk.mjs';
import { EVIDENCE_COLUMNS, evidenceTuple } from '../load-disease-phenotypes.mjs';
import { termOverlaps } from '../lib/crosswalk.mjs';
import { medgenLinks, xrefDeclaredPairs } from '../lib/medgen.mjs';
import { mapTupleFor } from '../load-medgen-crosswalk.mjs';

const FX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const fx = (f) => readFileSync(join(FX, f), 'utf8');
const PROV = { retrievedAt: '2026-10-27T23:09:00.000Z', license: 'CC-BY-4.0 (test)' };
const hp = JSON.parse(fx('hp-excerpt.json'));

// El resolutor real de HPO sobre el recorte (HP:0001250 y sus alt_id); el resto de los ids del recorte de Orphadata pasa tal cual.
const passThrough = (id) => ({ id, via: null });

test('Orphadata: asociaciones EN+ES con frecuencia, criterio diagnóstico y fuentes, tal como se publican', () => {
  const { rows, header, stats } = orphadataRows(fx('orphadata-en-excerpt.xml'), fx('orphadata-es-excerpt.xml'), passThrough, PROV);
  assert.equal(header.date, '2026-06-23');
  assert.equal(header.licenseShort, 'CC-BY-4.0');
  assert.equal(stats.disorders, 4);
  assert.equal(rows.length, 6);
  const alexander = rows.find((r) => r.disease.id === '58' && r.phenotype === 'HP:0001250');
  assert.equal(alexander.diseaseName, 'Alexander disease');
  assert.equal(alexander.diseaseNameEs, 'Enfermedad de Alexander', 'el nombre en castellano es el que publica Orphanet, no una traducción nuestra');
  assert.equal(alexander.frequency.raw, 'Very frequent (99-80%)');
  assert.equal(alexander.frequency.rawEs, 'Muy frecuente (99-80%)');
  assert.equal(alexander.frequency.hpo, 'HP:0040281');
  assert.equal(alexander.phenotypeTermAsPublished, 'Seizure', 'el término HPO va en inglés también en el archivo ES');
  assert.equal(alexander.negated, false);
  assert.equal(alexander.orphanetAssociationId, '554368');
  assert.equal(alexander.version, '2026-06-23');
  // Excluded (0%) es una NEGACIÓN publicada: nunca una asociación positiva.
  const excluded = rows.find((r) => r.disease.id === '261');
  assert.equal(excluded.negated, true);
  assert.equal(excluded.frequency.hpo, 'HP:0040285');
  assert.equal(stats.excluded, 1);
  // Marca de criterio diagnóstico y de signo patognomónico.
  assert.equal(rows.find((r) => r.disease.id === '558').diagnosticCriteria.en, 'Diagnostic criterion');
  assert.equal(rows.find((r) => r.disease.id === '116').diagnosticCriteria.en, 'Pathognomonic sign');
  assert.equal(rows.find((r) => r.disease.id === '116').diagnosticCriteria.es, 'Signo patognomónico');
  // Fuentes de la enfermedad (PMID) y fecha de validación.
  assert.deepEqual(rows.find((r) => r.disease.id === '558').references, ['PMID:30726024', 'PMID:30573797', 'PMID:26621648', 'PMID:25323262']);
  assert.equal(rows.find((r) => r.disease.id === '58').references.length, 0, '<Source/> vacío = sin referencias, no se inventan');
  assert.equal(rows.find((r) => r.disease.id === '558').validationDate, '2023-09-20');
});

test('Orphadata: id HPO sin resolver se cuenta y se descarta; alt_id se remapea y se anota', () => {
  const resolve = hpoIdResolver(hp);
  const { rows, stats } = orphadataRows(fx('orphadata-en-excerpt.xml'), fx('orphadata-es-excerpt.xml'), (id) => (id === 'HP:0001249' ? null : resolve(id) ?? passThrough(id)), PROV);
  assert.equal(stats.unresolvedHpo, 2, 'HP:0001249 aparece 2 veces en el recorte');
  assert.equal(rows.length, 4);
  assert.deepEqual(parseSources('1[PMID]_x[OTHER]_ 2 [PMID]'), ['PMID:1', 'x[OTHER]', 'PMID:2']);
  assert.equal(unescapeXml('Very rare (&lt;4-1%)'), 'Very rare (<4-1%)');
});

test('Orphadata: la tabla clase→HPO coincide con HPOA en el par compartido (control cruzado)', () => {
  const { rows } = orphadataRows(fx('orphadata-en-excerpt.xml'), fx('orphadata-es-excerpt.xml'), passThrough, PROV);
  for (const r of rows) r.aspect = 'P';
  const hpoa = parseHpoa(fx('phenotype-excerpt.hpoa'), PROV).rows;
  const check = crossCheckWithHpoa(rows, hpoa);
  assert.equal(check.sharedPairs, 1, 'ORPHA:558 / HP:0000768 está en las dos fuentes');
  assert.deepEqual(check.frequencyCrossTab, { 'Very frequent (99-80%) => HP:0040281': 1 });
  assert.deepEqual(Object.values(ORPHA_FREQUENCY_TO_HPO).sort(), ['HP:0040280', 'HP:0040281', 'HP:0040282', 'HP:0040283', 'HP:0040284', 'HP:0040285']);
  assert.equal(parseProduct4(fx('orphadata-en-excerpt.xml')).disorders[0].typeName, 'Disease');
});

test('MeSH C23: sólo descriptores con árbol C23, jerarquía por número de árbol, sinónimos por alcance', async () => {
  const { descriptors, scanned } = await readC23Descriptors(Readable.from([fx('mesh-c23-excerpt.xml')]));
  assert.equal(scanned, 6);
  assert.equal(descriptors.length, 5, 'Calcimycin (D000001) no es C23');
  const { rows, stats } = meshC23Rows(descriptors, { version: '2026', retrievedAt: PROV.retrievedAt, license: PROV.license });
  const diarrhea = rows.find((r) => r.code === 'D003967');
  assert.equal(diarrhea.enName, 'Diarrhea');
  assert.equal(diarrhea.esName, null, 'MeSH no se traduce');
  assert.match(diarrhea.definition, /^An increased liquidity or decreased consistency of FECES/);
  assert.deepEqual(diarrhea.treeNumbers, ['C23.888.821.214']);
  assert.deepEqual(diarrhea.parents, ['D012817'], 'C23.888.821.214 cuelga de C23.888.821 (Signs and Symptoms, Digestive)');
  assert.equal(diarrhea.subontology, 'C23.888');
  assert.equal(rows.find((r) => r.code === 'D012816').parents[0], 'D013568');
  assert.deepEqual(rows.find((r) => r.code === 'D013568').parents, [], 'la cabeza C23 no tiene padre');
  assert.equal(rows.find((r) => r.code === 'D006470').subontology, 'C23.550');
  assert.equal(branchOf(['C23.550.414', 'C14.907.137']), 'C23.550');
  assert.ok(stats.permutedTermsSkipped > 0, 'los términos permutados no se cargan como sinónimos');
  const allSynonyms = rows.flatMap((r) => r.synonyms);
  assert.ok(allSynonyms.every((s) => ['EXACT', 'NARROW', 'BROAD', 'RELATED', 'UNSPECIFIED'].includes(s.scope)));
  const sourceDates = rows[0].sourceDates;
  assert.ok(sourceDates.introduced);
});

test('MeSH: el XML se lee directo del .zip (deflate) sin unzip', async () => {
  const e = firstZipEntry(join(FX, 'mesh-c23-excerpt.zip'));
  assert.equal(e.name, 'desc2026.xml');
  assert.equal(e.method, 8);
  const { stream } = zipEntryStream(join(FX, 'mesh-c23-excerpt.zip'));
  const { scanned, descriptors } = await readC23Descriptors(stream);
  assert.equal(scanned, 6);
  assert.equal(descriptors.length, 5);
});

test('MeSH ↔ otros sistemas: sólo por xref publicado (MESH:Dxxxxx), nunca por nombre', () => {
  const mesh = [{ codeSystem: 'mesh-c23', code: 'D003967', xrefs: [] }];
  const symp = [{ codeSystem: 'symp', code: 'SYMP:1', xrefs: [{ system: 'MESH', code: 'D003967' }] }];
  assert.equal(termOverlaps(mesh, symp).get('D003967'), 'symp:SYMP:1 xref MESH:D003967');
  assert.equal(termOverlaps(mesh, [{ codeSystem: 'symp', code: 'SYMP:2', xrefs: [], enName: 'Diarrhea' }]).size, 0);
});

test('Wikidata P3841: cruce publicado; un id mal escrito en Wikidata no se corrige', () => {
  const json = JSON.parse(fx('wikidata-p3841-excerpt.json'));
  const resolve = hpoIdResolver(hp);
  const { rows, stats } = wikidataHpoRows(json, resolve, { retrievedAt: PROV.retrievedAt, license: PROV.license, queryUrl: 'q' });
  assert.equal(stats.bindings, 7);
  assert.equal(stats.malformed, 1);
  const bad = rows.find((r) => r.qid === 'Q1640998');
  assert.equal(bad.hpoAsPublished, 'HP:000962');
  assert.equal(bad.hpo, null, 'no se completa con ceros');
  const seizure = rows.find((r) => r.hpo === 'HP:0001250');
  assert.match(seizure.qid, /^Q\d+$/);
  assert.equal(seizure.labelEs ?? null, seizure.labelEs, 'etiquetas sólo de ayuda');
  // Remapeo por alt_id que HPO declara (entrada sintética: sólo ejercita la rama).
  const synthetic = { results: { bindings: [{ item: { value: 'http://www.wikidata.org/entity/Q1' }, hpo: { value: 'HP:0001275' } }] } };
  const r2 = wikidataHpoRows(synthetic, resolve, { retrievedAt: PROV.retrievedAt, license: PROV.license, queryUrl: 'q' });
  assert.equal(r2.rows[0].hpo, 'HP:0001250');
  assert.equal(r2.rows[0].hpoRemap, 'alt_id');
  const grouped = groupByHpo(rows);
  assert.ok(grouped.has('HP:0001250'));
  assert.equal(propertyTuple('c1', 'HP:0001250', grouped.get('HP:0001250'))[2], 'wikidata_items');
  const m = mapTuple('c1', 'HP:0001250', grouped.get('HP:0001250')[0], 'g1', 'v');
  assert.equal(m[3], null, 'sin equivalencia declarada');
  assert.match(m[4], /^Wikidata P3841: el ítem Q\d+ declara el id de HPO HP:0001250$/);
});

// --- Plan de relaciones contra el modelo REAL v4.2.50 -----------------------------------------

const ctxFor = (extra = {}) => ({
  resolveDisease: (curie) => ({ conceptId: `d:${curie}`, via: null }),
  resolvePhenotype: phenotypeResolver({ hpo: new Set(['HP:0430043', 'HP:0000768', 'HP:0001263', 'HP:0008305', 'HP:0040281', 'HP:0001250']) }),
  sourceIdOf: (s) => `src:${s}`,
  versionIdOf: (s) => `ver:${s}`,
  tierIdOf: (c) => `tier:${c}`,
  frequencyIdOf: (c) => `freq:${c}`,
  excludedTypeAvailable: true,
  ...extra,
});

test('plan v4.2.50: columnas reales, nivel de evidencia, frecuencia del value set, n/m y vigencia', () => {
  const { rows } = parseHpoa(fx('phenotype-excerpt.hpoa'), { retrievedAt: '2026-10-24T00:34:00.000Z', license: 'L' });
  const plan = relationsPlan(rows, ctxFor());
  assert.equal(plan.stats.notPhenotype, 1, 'aspecto I fuera');
  assert.equal(plan.relationships.length, 4);
  assert.equal(plan.relationships.find((r) => r[1] === 'd:ORPHA:199310')[3], REL.SYMPTOM_EXCLUDED, 'NOT → EXCLUDED');
  const orpha = plan.evidence.find((e) => /database_id=ORPHA:558/.test(e.citationText));
  assert.equal(orpha.frequencyConceptId, 'freq:VERY_FREQUENT', 'HP:0040281 → miembro del value set');
  assert.equal(orpha.evidenceTierConceptId, 'tier:CURATED_REFERENCE');
  assert.equal(orpha.validFrom, '2026-09-02');
  assert.equal(orpha.codeSystemVersionId, 'ver:hpo');
  const marfan = plan.evidence.find((e) => /database_id=OMIM:154700/.test(e.citationText));
  assert.equal(marfan.frequencyNumerator, 16);
  assert.equal(marfan.frequencyDenominator, 21);
  assert.match(marfan.citationText, /evidence=PCS/, 'el código de evidencia viaja en la cita publicada');
  assert.match(marfan.sourceReference, /^hpoa:[0-9a-f]{32}$/);
  const pct = plan.evidence.find((e) => /database_id=OMIM:607155/.test(e.citationText));
  assert.equal(pct.statisticValue, 25);
  assert.equal(pct.frequencyNumerator, null);
  // Tupla en el orden de las columnas reales
  assert.equal(evidenceTuple(marfan).length, EVIDENCE_COLUMNS.length);
  assert.equal(evidenceTuple(marfan, 'otra')[1], 'otra');
  // Sin REL_SYMPTOM_EXCLUDED sembrado, la negación se omite y se cuenta
  const sin = relationsPlan(rows, ctxFor({ excludedTypeAvailable: false }));
  assert.equal(sin.stats.negatedSkipped, 1);
  assert.ok(sin.relationships.every((r) => r[3] === REL.SYMPTOM));
});

test('plan v4.2.50: Orphadata y HPOA afirman la misma arista con evidencias distintas (1:N), sin duplicar', () => {
  const o = orphadataRows(fx('orphadata-en-excerpt.xml'), fx('orphadata-es-excerpt.xml'), passThrough, PROV).rows;
  for (const r of o) r.aspect = 'P';
  const h = parseHpoa(fx('phenotype-excerpt.hpoa'), { retrievedAt: '2026-10-24T00:34:00.000Z', license: 'L' }).rows;
  const codes = { hpo: new Set(['HP:0000768', 'HP:0001250', 'HP:0001249', 'HP:0000256', 'HP:0008186', 'HP:0430043', 'HP:0001263', 'HP:0008305']) };
  const plan = relationsPlan([...h, ...o], ctxFor({ resolvePhenotype: phenotypeResolver(codes) }));
  const edge = plan.relationships.filter((r) => r[1] === 'd:ORPHA:558' && r[2].length > 0);
  const evForEdge = plan.evidence.filter((e) => edge.some((r) => r[0] === e.relationshipId) && /ORPHA:558|OrphaCode=558/.test(e.citationText));
  assert.ok(evForEdge.some((e) => e.sourceReference.startsWith('hpoa:')));
  assert.ok(evForEdge.some((e) => e.sourceReference.startsWith('orphadata:HPODisorderAssociation/')));
  assert.ok(evForEdge.every((e, _, a) => a.filter((x) => x.relationshipId === e.relationshipId).length >= 1));
  // La marca de criterio diagnóstico llega a la cita
  assert.ok(plan.evidence.some((e) => /DiagnosticCriteria=Diagnostic criterion/.test(e.citationText)));
  // Mismo plan dos veces = mismos ids (idempotencia de la carga)
  const again = relationsPlan([...h, ...o], ctxFor({ resolvePhenotype: phenotypeResolver(codes) }));
  assert.deepEqual(again.evidence.map((e) => e.id), plan.evidence.map((e) => e.id));
});

test('nivel de evidencia: curado vs automático; un código desconocido es un error, no un valor por defecto', () => {
  assert.equal(evidenceTierCode({ source: 'hpoa', evidence: 'TAS' }), 'CURATED_REFERENCE');
  assert.equal(evidenceTierCode({ source: 'hpoa', evidence: 'PCS' }), 'CURATED_REFERENCE');
  assert.equal(evidenceTierCode({ source: 'hpoa', evidence: 'IEA' }), 'STATISTICAL_LITERATURE');
  assert.equal(evidenceTierCode({ source: 'hpo-common-disease', evidence: 'ITM' }), 'STATISTICAL_LITERATURE');
  assert.equal(evidenceTierCode({ source: 'mondo', evidence: null }), 'CURATED_REFERENCE');
  assert.equal(evidenceTierCode({ source: 'orphadata', evidence: null }), 'CURATED_REFERENCE');
  assert.throws(() => evidenceTierCode({ source: 'hpoa', evidence: 'XYZ', disease: { curie: 'X' }, phenotype: 'HP:1' }), /sin nivel asignado/);
  assert.deepEqual(validFromOf({ version: 'releases/2026-10-06', retrievedAt: '2026-10-24T00:00:00Z' }), { date: '2026-10-06', basis: 'release' });
  assert.deepEqual(validFromOf({ version: '2015 (Groza et al., AJHG 97:111-124)', retrievedAt: '2026-10-24T00:36:42.885Z' }), { date: '2026-10-24', basis: 'retrieved' });
  assert.deepEqual(Object.keys(HPO_FREQUENCY_TO_VS), Object.values(ORPHA_FREQUENCY_TO_HPO));
  assert.equal(EVIDENCE_VALUE_SETS.tier.codes.length, 4);
  assert.throws(() => citationText({ source: 'otra' }), /desconocida/);
});

test('MedGen: mismo CUI ⇒ cruce entre los sistemas del corpus; sólo identificadores, sólo fuentes aceptadas', () => {
  const codes = { hpo: new Set(['HP:0002027']), 'mesh-c23': new Set(['D015746']), ncit: new Set(['C26682']) };
  const sympByCui = new Map([['C0000737', 'SYMP:0000457'], ['C9999999', 'SYMP:9']]);
  const { rows, stats } = medgenLinks(fx('medgen-mgconso-excerpt.rrf'), codes, sympByCui, new Set(), { version: 'v', retrievedAt: PROV.retrievedAt, license: 'l' });
  assert.equal(stats.cuisWithAnyCorpusCode, 1, 'C9999999 de SYMP no está en MedGen: no genera cruce');
  assert.equal(rows.length, 6, 'HPO, MeSH, NCIt y SYMP bajo un CUI = 6 pares');
  assert.deepEqual(rows.map((r) => `${r.a.codeSystem}↔${r.b.codeSystem}`), ['hpo↔mesh-c23', 'hpo↔ncit', 'hpo↔symp', 'mesh-c23↔ncit', 'mesh-c23↔symp', 'ncit↔symp']);
  assert.ok(rows.every((r) => r.cui === 'C0000737' && /^[0-9a-f]{32}$/.test(r.key)));
  assert.equal(rows.find((r) => r.b.codeSystem === 'symp').via, 'medgen+symp-xref');
  assert.equal(JSON.stringify(rows).includes('Abdominal'), false, 'no se toma ningún texto de MGCONSO');
  // Un código de HPO que no está en el corpus no entra.
  const none = medgenLinks(fx('medgen-mgconso-excerpt.rrf'), { hpo: new Set(), 'mesh-c23': new Set(['D015746']), ncit: new Set() }, new Map(), new Set(), { version: 'v', retrievedAt: 'r', license: 'l' });
  assert.equal(none.rows.length, 0);
  // Pares que la fuente ya cruza por xref se marcan y el cargador no los repite.
  const declared = xrefDeclaredPairs({ hpo: [{ codeSystem: 'hpo', code: 'HP:0002027', xrefs: [{ system: 'NCIT', code: 'C26682' }] }] });
  const marked = medgenLinks(fx('medgen-mgconso-excerpt.rrf'), codes, sympByCui, declared, { version: 'v', retrievedAt: 'r', license: 'l' });
  assert.deepEqual(marked.rows.filter((r) => r.alsoDeclaredByXref).map((r) => `${r.a.code}|${r.b.code}`), ['HP:0002027|C26682']);
  const ids = { 'hpo|HP:0002027': 'h1', 'mesh-c23|D015746': 'm1' };
  const t = mapTupleFor(rows[0], (cs, c) => ids[`${cs}|${c}`], 'ver');
  assert.equal(t[1], 'h1');
  assert.equal(t[3], null, 'sin equivalencia declarada');
  assert.match(t[4], /^UMLS CUI C0000737 compartido \(NCBI MedGen\): HP:0002027 ↔ D015746$/);
  assert.equal(mapTupleFor(rows[1], (cs, c) => ids[`${cs}|${c}`], 'ver'), null, 'si falta un concepto en la base no se escribe');
});

// --- Procedencia por fila, aprobación de HPO y guarda de la base desechable ----------------------

test('procedencia por fila: SHA-256 de entrada y versión en Orphadata, Wikidata y MedGen', () => {
  const o = orphadataRows(fx('orphadata-en-excerpt.xml'), fx('orphadata-es-excerpt.xml'), passThrough, { ...PROV, sha256En: 'a'.repeat(64), sha256Es: 'b'.repeat(64) });
  assert.ok(o.rows.every((r) => r.inputSha256.en === 'a'.repeat(64) && r.inputSha256.es === 'b'.repeat(64) && r.version === '2026-06-23' && r.retrievedAt && r.license));
  const w = wikidataHpoRows(JSON.parse(fx('wikidata-p3841-excerpt.json')), hpoIdResolver(hp), { retrievedAt: PROV.retrievedAt, license: PROV.license, queryUrl: 'q', sha256: 'c'.repeat(64), version: 'consulta SPARQL del 2026-10-28' });
  assert.ok(w.rows.every((r) => r.inputSha256 === 'c'.repeat(64) && r.version === 'consulta SPARQL del 2026-10-28'));
  const m = medgenLinks(fx('medgen-mgconso-excerpt.rrf'), { hpo: new Set(['HP:0002027']), 'mesh-c23': new Set(['D015746']), ncit: new Set() }, new Map(), new Set(), { version: 'v', retrievedAt: PROV.retrievedAt, license: 'l', sha256: 'd'.repeat(64) });
  assert.ok(m.rows.length > 0 && m.rows.every((r) => r.inputSha256 === 'd'.repeat(64)));
});

test('la consulta SPARQL de Wikidata se normaliza: mismo contenido en otro orden = mismos bytes', async () => {
  const { normalizeSparqlJson } = await import('../fetch-symptom-sources.mjs');
  const j = JSON.parse(fx('wikidata-p3841-excerpt.json'));
  const shuffled = { head: j.head, results: { bindings: [...j.results.bindings].reverse() } };
  assert.equal(normalizeSparqlJson(JSON.stringify(j)), normalizeSparqlJson(JSON.stringify(shuffled)));
});

test('HPO: sin la aprobación del propietario los cargadores no escriben (código de salida 3)', async () => {
  const { hpoApproved } = await import('../lib/approvals.mjs');
  const before = process.exitCode;
  const silent = console.error;
  console.error = () => {};
  try {
    assert.equal(hpoApproved([], {}), false);
    assert.equal(process.exitCode, 3);
    process.exitCode = before;
    assert.equal(hpoApproved(['--apply'], {}), false);
    process.exitCode = before;
    assert.equal(hpoApproved(['--apply', '--accept-hpo-terms'], {}), true);
    assert.equal(hpoApproved([], { MANTRA_HPO_TERMS_ACCEPTED: '1' }), true);
    assert.equal(hpoApproved([], { MANTRA_HPO_TERMS_ACCEPTED: '0' }), false);
  } finally {
    console.error = silent;
    process.exitCode = before;
  }
});

test('fresh-db.sh se niega a borrar una base que no es desechable', async () => {
  const { spawnSync } = await import('node:child_process');
  const script = join(FX, '..', 'disposable-db', 'fresh-db.sh');
  const run = (env) => spawnSync('sh', [script], { env: { PATH: process.env.PATH, ...env }, encoding: 'utf8' });
  for (const env of [
    { DB_HOST: '/tmp', DB_PORT: '1', DB_USER: 'u', DB_NAME: 'x_test' }, // sin DISPOSABLE_DB=1
    { DISPOSABLE_DB: '1', DB_HOST: '/tmp', DB_PORT: '1', DB_USER: 'u', DB_NAME: 'mantra_prod' }, // nombre sin _test
    { DISPOSABLE_DB: '1', DB_HOST: 'db.example.com', DB_PORT: '1', DB_USER: 'u', DB_NAME: 'x_test' }, // servidor remoto
    { DISPOSABLE_DB: '1', DB_HOST: '/tmp', DB_PORT: '1', DB_USER: 'u', DB_NAME: 'postgres' },
  ]) {
    const r = run(env);
    assert.equal(r.status, 4, `debía negarse: ${JSON.stringify(env)} → ${r.stderr}`);
    assert.match(r.stderr, /se niega/);
  }
});
