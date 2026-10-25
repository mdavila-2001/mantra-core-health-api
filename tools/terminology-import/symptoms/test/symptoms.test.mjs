// Pruebas del corpus de síntomas, signos y fenotipos. Fixtures: recortes REALES
// de las fuentes descargadas el 2026-10-24 (hp.json 2026-09-01, hp-es.babelon,
// phenotype.hpoa 2026-09-02, symp.obo 2026-07-30, mondo.obo 2026-10-06,
// doid.owl 2026-09-30, anotaciones de enfermedades comunes de HPO).
// Correr: node --test tools/terminology-import/symptoms/test/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { commonDiseaseRows, doidNormalizer, doidSymptomAxioms, mondoFeatureRows, parseFrequency, parseHpoa } from '../lib/annotations.mjs';
import { mondoEquivalences, normalizeDiseaseCurie, termOverlaps } from '../lib/crosswalk.mjs';
import { hpoIdResolver, hpoRows, parseBabelon } from '../lib/hpo.mjs';
import { conceptId, designationsFor, displayOf, glossaryEnabled, glossaryFor, isGlossaryTerm, propertiesFor } from '../lib/load-plan.mjs';
import { applyTag, readObo } from '../lib/obo.mjs';
import { ncitRows, sympRows } from '../lib/obo-sources.mjs';
import { REL, phenotypeResolver, relationsPlan } from '../lib/relations-plan.mjs';
import { crosswalkRows, dedupeMap, duplicatesAgainst, glossaryEquivalents, wikidataSintomaConceptId, wikidataSintomaSlug } from '../lib/glossary-dedupe.mjs';
import { buildPlan } from '../load-symptoms.mjs';
import { CROSSWALK_FILE, CROSSWALK_MANIFEST } from '../lib/sources.mjs';

const FX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const fx = (f) => readFileSync(join(FX, f), 'utf8');
const PROV = { retrievedAt: '2026-10-24T00:34:00.000Z', license: 'test-license' };

const hp = JSON.parse(fx('hp-excerpt.json'));
const babelon = fx('hp-es-excerpt.babelon.tsv');

test('HPO: nombre ES sólo de la traducción OFFICIAL; definición y sinónimos EN verbatim', () => {
  const { rows, version } = hpoRows(hp, babelon, PROV);
  assert.equal(version, '2026-09-01');
  const seizure = rows.find((r) => r.code === 'HP:0001250');
  assert.equal(seizure.enName, 'Seizure');
  assert.equal(seizure.esName, 'Convulsiones');
  assert.equal(seizure.esNameKind, 'official-translation');
  assert.match(seizure.definition, /^A seizure is an intermittent abnormality/);
  assert.equal(seizure.definitionLang, 'en');
  assert.ok(seizure.synonyms.some((s) => s.text === 'Epileptic seizure' && s.scope === 'EXACT'));
  assert.ok(seizure.altIds.includes('HP:0001275'));
  // Jerarquía sistema → tipo → término: Seizure cuelga de «Abnormality of the nervous system».
  assert.deepEqual(seizure.systems, ['HP:0000707']);
  assert.equal(seizure.subontology, 'HP:0000118');
  // Las clases obsoletas no son filas.
  assert.equal(rows.find((r) => r.code === 'HP:0000057'), undefined);
});

test('babelon: ignora estados distintos de OFFICIAL', () => {
  const tsv = babelon.trimEnd() + '\nen\tes\tHP:9999999\tX\trdfs:label\tCandidata\tCANDIDATE\n';
  const { labels, stats } = parseBabelon(tsv);
  assert.equal(labels.has('HP:9999999'), false);
  assert.equal(stats.otherStatus, 1);
});

test('HPO: resolutor de ids viejos sólo por alt_id/replaced_by declarados', () => {
  const resolve = hpoIdResolver(hp);
  assert.deepEqual(resolve('HP:0001275'), { id: 'HP:0001250', via: 'alt_id' });
  assert.deepEqual(resolve('HP:0001250'), { id: 'HP:0001250', via: null });
  assert.equal(resolve('HP:1234567'), null);
});

test('OBO: sinónimo con alcance, xref con calificadores, is_a sin comentario', () => {
  const t = { synonyms: [], xrefs: [], isA: [], relationships: [], propertyValues: [], altIds: [], subsets: [], replacedBy: [], consider: [] };
  applyTag(t, 'synonym', '"pyrexia" EXACT []');
  applyTag(t, 'xref', 'DOID:0111297 {source="MONDO:equivalentTo"}');
  applyTag(t, 'is_a', 'SYMP:0000410 ! neurological and physiological symptom');
  assert.deepEqual(t.synonyms[0], { text: 'pyrexia', scope: 'EXACT', type: null, refs: [] });
  assert.deepEqual(t.xrefs[0], { id: 'DOID:0111297', qualifiers: 'source="MONDO:equivalentTo"' });
  assert.deepEqual(t.isA, ['SYMP:0000410']);
});

test('SYMP: términos vigentes con su sistema de primer nivel; obsoletos fuera', async () => {
  const terms = new Map();
  const header = await readObo(join(FX, 'symp-excerpt.obo'), (t) => terms.set(t.id, t));
  const { rows } = sympRows(terms, header, PROV);
  assert.deepEqual(rows.map((r) => r.code), ['SYMP:0000410', 'SYMP:0000462', 'SYMP:0000567', 'SYMP:0000613']);
  const fever = rows.find((r) => r.code === 'SYMP:0000613');
  assert.equal(fever.version, '2026-07-30');
  assert.deepEqual(fever.systems, ['SYMP:0000410']);
  assert.ok(fever.xrefs.some((x) => x.system === 'UMLS_CUI' && x.code === 'C0015967'));
  assert.equal(fever.esName, null);
});

test('HPOA: frecuencia, evidencia y referencias tal como vienen; NOT queda negado', () => {
  const { header, rows } = parseHpoa(fx('phenotype-excerpt.hpoa'), PROV);
  assert.equal(header.version, '2026-09-02');
  const [omim, orpha, not, inheritance, pct] = rows;
  assert.deepEqual(omim.frequency, { raw: '16/21', kind: 'ratio', numerator: 16, denominator: 21 });
  assert.equal(omim.evidence, 'PCS');
  assert.deepEqual(omim.references, ['PMID:31772430']);
  assert.deepEqual(orpha.frequency, { raw: 'HP:0040281', kind: 'hpo-term', hpo: 'HP:0040281' });
  assert.equal(orpha.sourceLabel, 'HPO annotations (Orphanet)');
  assert.equal(not.negated, true);
  assert.equal(inheritance.aspect, 'I');
  assert.deepEqual(pct.frequency, { raw: '25%', kind: 'percent', percent: 25 });
  assert.equal(new Set(rows.map((r) => r.key)).size, rows.length);
});

test('parseFrequency: vacío → null; formato desconocido se conserva sin interpretar', () => {
  assert.equal(parseFrequency(''), null);
  assert.deepEqual(parseFrequency('rare'), { raw: 'rare', kind: 'other' });
});

test('DOID OWL: has symptom (RO:0002452) también dentro de equivalentClass anidado', () => {
  const rows = doidSymptomAxioms(fx('doid-excerpt.owl'), PROV);
  assert.equal(rows.length, 6);
  assert.ok(rows.every((r) => r.disease.curie === 'DOID:0050242' && r.phenotypeSystem === 'symp'));
  assert.equal(rows[0].diseaseName, 'primary amebic meningoencephalitis');
  assert.equal(rows[0].version, '2026-09-30');
  assert.deepEqual(rows.map((r) => r.phenotype).sort(), ['SYMP:0000021', 'SYMP:0000124', 'SYMP:0000458', 'SYMP:0000504', 'SYMP:0000605', 'SYMP:0019145']);
});

test('Mondo: rasgos HP declarados y equivalencias equivalentTo', async () => {
  const terms = new Map();
  const header = await readObo(join(FX, 'mondo-excerpt.obo'), (t) => terms.set(t.id, t));
  const rows = mondoFeatureRows(terms, header, PROV);
  assert.deepEqual(rows.map((r) => [r.disease.curie, r.predicate, r.phenotype]), [
    ['MONDO:0000023', 'has_characteristic', 'HP:0003593'],
    ['MONDO:0000032', 'disease_has_feature', 'HP:0002373'],
  ]);
  const { toMondo } = mondoEquivalences(terms);
  assert.equal(toMondo.get('ORPHA:464724'), 'MONDO:0000023');
  assert.equal(toMondo.get('DOID:0111297'), 'MONDO:0000032');
  // MEDGEN no se usa como identidad de enfermedad.
  assert.equal(toMondo.get('MEDGEN:1813021'), undefined);
});

test('enfermedades comunes: DOID con ceros a la izquierda sólo se normaliza si el id existe', () => {
  const normalize = doidNormalizer(new Set(['DOID:13550']));
  const stats = { read: 0, unresolvedHpo: 0, remapped: 0 };
  const resolveHp = (id) => ({ id, via: null });
  const rows = commonDiseaseRows(fx('common-disease-DO-DOID_0013550.tab'), 'DO-DOID_0013550.tab', resolveHp, PROV, stats, normalize);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].disease.curie, 'DOID:13550');
  assert.equal(rows[0].diseaseAsPublished, 'DOID:0013550');
  assert.equal(rows[0].diseaseIdNormalized, 'zero-padding');
  assert.equal(rows[0].evidence, 'ITM');
  assert.equal(stats.doidNormalized, 2);
  assert.deepEqual(doidNormalizer(new Set(['DOID:0050242']))('DOID:0050242'), { curie: 'DOID:0050242', normalized: null });
  assert.deepEqual(doidNormalizer(new Set())('DOID:0013550'), { curie: 'DOID:0013550', normalized: null });
  // DO declara DOID:324 como alt_id de DOID:178 (doid.owl 2026-09-30).
  assert.deepEqual(doidNormalizer(new Set(['DOID:178']), new Map([['DOID:324', 'DOID:178']]))('DOID:0000324'), { curie: 'DOID:178', normalized: 'zero-padding+alt_id' });
});

test('cruces: prefijo Orphanet de Monarch = ORPHA de HPOA; CUI compartido marca solapamiento', () => {
  assert.equal(normalizeDiseaseCurie('Orphanet:558'), 'ORPHA:558');
  assert.equal(normalizeDiseaseCurie('OMIM:154700'), 'OMIM:154700');
  const prev = [{ codeSystem: 'symp', code: 'SYMP:0000613', xrefs: [{ system: 'UMLS_CUI', code: 'C0015967' }] }];
  const next = [{ codeSystem: 'ncit', code: 'C3038', xrefs: [{ system: 'UMLS', code: 'C0015967' }] }, { codeSystem: 'ncit', code: 'C1', xrefs: [] }];
  assert.deepEqual([...termOverlaps(next, prev).keys()], ['C3038']);
});

test('plan de términos: display ES oficial, sólo sinónimos EXACT como designación, ids deterministas', () => {
  const { rows } = hpoRows(hp, babelon, PROV);
  const seizure = rows.find((r) => r.code === 'HP:0001250');
  assert.equal(displayOf(seizure), 'Convulsiones');
  const d = designationsFor(seizure);
  assert.ok(d.some((x) => x.value === 'Convulsiones' && x.preferred));
  assert.ok(d.some((x) => x.value === 'Seizure' && x.preferred));
  assert.equal(d.some((x) => x.value === 'Epilepsy'), false, 'un sinónimo RELATED no es designación');
  assert.equal(conceptId('hpo', 'HP:0001250'), conceptId('hpo', 'HP:0001250'));
  const props = propertiesFor(seizure, () => ({ en: 'Abnormality of the nervous system', es: 'Anomalía del sistema nervioso' }));
  const def = props.find((p) => p.code === 'source_definition');
  assert.equal(def.value.lang, 'en');
  assert.ok(props.some((p) => p.code === 'source_license' && p.value === 'test-license'));
  assert.ok(isGlossaryTerm(seizure));
  assert.equal(isGlossaryTerm(rows.find((r) => r.code === 'HP:0040281')), false, 'frecuencia no es glosario');
  assert.equal(glossaryFor(seizure).properties.find((p) => p.code === 'glossary-slug').value, 'hpo-hp-0001250');
});

test('plan de relaciones: NOT → SYMPTOM_EXCLUDED, aspecto I fuera, frecuencia HPO resuelta', () => {
  const { rows } = parseHpoa(fx('phenotype-excerpt.hpoa'), PROV);
  const codes = { hpo: new Set(['HP:0430043', 'HP:0000768', 'HP:0001263', 'HP:0008305', 'HP:0040281']) };
  const plan = relationsPlan(rows, {
    resolveDisease: (curie) => ({ conceptId: `d:${curie}`, via: null }),
    resolvePhenotype: phenotypeResolver(codes),
    sourceIdOf: () => 'src',
    excludedTypeAvailable: true,
  });
  assert.equal(plan.stats.notPhenotype, 1);
  assert.equal(plan.relationships.length, 4);
  assert.equal(plan.relationships.find((r) => r[1] === 'd:ORPHA:199310')[3], REL.SYMPTOM_EXCLUDED);
  const orpha = plan.evidence.find((e) => JSON.parse(e[17]).diseaseAsPublished === 'ORPHA:558');
  assert.equal(orpha[8], 'HP:0040281');
  assert.equal(orpha[9], conceptId('hpo', 'HP:0040281'));
  const withoutExcluded = relationsPlan(rows, { resolveDisease: (c) => ({ conceptId: c, via: null }), resolvePhenotype: phenotypeResolver(codes), sourceIdOf: () => 's', excludedTypeAvailable: false });
  assert.equal(withoutExcluded.stats.negatedSkipped, 1);
  assert.ok(withoutExcluded.relationships.every((r) => r[3] === REL.SYMPTOM));
});

test('sistemas de enfermedad por defecto = formatos confirmados por seed-diseases (#688)', async () => {
  const { DEFAULT_DISEASE_SYSTEMS: D } = await import('../lib/relations-plan.mjs');
  assert.deepEqual([D.OMIM.internalCodes, D.OMIM.codes('616331')], [['omim'], ['616331']]);
  assert.deepEqual([D.ORPHA.internalCodes, D.ORPHA.codes('558')], [['orphanet'], ['558']]);
  assert.deepEqual([D.DECIPHER.internalCodes, D.DECIPHER.codes('16')], [['decipher'], ['16']]);
  assert.deepEqual(D.MONDO.codes('0007739'), ['MONDO:0007739']);
  assert.deepEqual(D.DOID.codes('9351'), ['DOID:9351']);
  assert.deepEqual([D.MESH.internalCodes, D.MESH.codes('D003920')], [['mesh'], ['D003920']]);
});

test('NCIt: signos por tipo semántico, sin los descendientes de C2991 (recorte real de 24.04e, donde Colic cuelga de C2991)', async () => {
  const terms = new Map();
  const header = await readObo(join(FX, 'ncit-excerpt.obo'), (t) => terms.set(t.id, t));
  const { rows, stats } = ncitRows(terms, header, PROV);
  const codes = rows.map((r) => r.code);
  assert.ok(codes.includes('C3038'), 'Fever (Sign) entra');
  assert.equal(codes.includes('C34494'), false, 'Colic cuelga de C2991: no se duplica');
  assert.deepEqual(stats.excludedAsDiseaseCodes, ['C34494']);
  assert.equal(rows.find((r) => r.code === 'C3038').version, '24.04e');
  assert.deepEqual(rows.find((r) => r.code === 'C3038').parents, ['C53458']);
});

test('pack-data: partición por líneas en gzip válidos que reconstruyen el original', async () => {
  const { gunzipSync } = await import('node:zlib');
  const { splitByLines } = await import('../pack-data.mjs');
  const text = fx('phenotype-excerpt.hpoa').repeat(40);
  const lines = text.split('\n').filter((l) => l !== '');
  const parts = splitByLines(text, 600);
  assert.ok(parts.length > 1, 'con un límite chico se parte');
  assert.ok(parts.every((p) => p.gz.length <= 600));
  assert.equal(Buffer.concat(parts.map((p) => gunzipSync(p.gz))).toString('utf8'), lines.join('\n') + '\n');
  assert.equal(splitByLines(text).length, 1, 'bajo el límite real queda en un archivo');
});

test('glosario activado por defecto; --no-glossary lo apaga', () => {
  assert.equal(glossaryEnabled([]), true);
  assert.equal(glossaryEnabled(['--apply']), true);
  assert.equal(glossaryEnabled(['--apply', '--glossary']), true);
  assert.equal(glossaryEnabled(['--apply', '--no-glossary']), false);
});

// --- Duplicados glosario: HPO ↔ wikidata-sintoma-* (#831) ----------------------

// Pares REALES de query.wikidata.org (P3841, 2026-10-24): Q6279182 = convulsión, Q38933 = fiebre.
const SPARQL_P3841 = {
  results: {
    bindings: [
      { x: { value: 'http://www.wikidata.org/entity/Q6279182' }, hpo: { value: 'HP:0001250' } },
      { x: { value: 'http://www.wikidata.org/entity/Q38933' }, hpo: { value: 'HP:0001945' } },
      { x: { value: 'http://www.wikidata.org/entity/Q6279182' }, hpo: { value: 'HP:0001250' } },
      { x: { value: 'http://www.wikidata.org/entity/Q1' }, hpo: { value: 'no-es-un-id' } },
    ],
  },
};

test('cruce P3841: filas únicas ordenadas; lo que no parece Q-id o HP:n se descarta y se cuenta', () => {
  const { rows, invalid } = crosswalkRows(SPARQL_P3841);
  assert.deepEqual(rows, [{ q: 'Q38933', hpo: 'HP:0001945' }, { q: 'Q6279182', hpo: 'HP:0001250' }]);
  assert.equal(invalid, 1);
});

test('duplicados: sólo cuenta el cruce por código (principal o id alternativo del propio HPO), nunca el nombre', () => {
  const { rows } = hpoRows(hp, babelon, PROV);
  const seizure = rows.find((r) => r.code === 'HP:0001250');
  assert.ok(seizure.altIds.includes('HP:0001275'));
  const { rows: cw } = crosswalkRows(SPARQL_P3841);
  // Sintético sólo en el id alternativo: otro ítem declara el id viejo de «Seizure».
  const eq = glossaryEquivalents([...cw, { q: 'Q999999999', hpo: 'HP:0001275' }], rows, isGlossaryTerm);
  assert.deepEqual(eq.get('HP:0001250'), ['Q6279182', 'Q999999999']);
  // Un HP que no es del glosario (frecuencia) o que no está en el corpus no genera equivalente.
  assert.equal(glossaryEquivalents([{ q: 'Q5', hpo: 'HP:0040281' }, { q: 'Q6', hpo: 'HP:9999999' }], rows, isGlossaryTerm).size, 0);
  // Un nombre idéntico sin cruce publicado no es duplicado.
  assert.equal(glossaryEquivalents([], rows, isGlossaryTerm).size, 0);
});

test('duplicados: sin ficha wikidata-sintoma en el glosario no hay duplicado; con ella, el término HPO sale del glosario y se enlaza', () => {
  const { rows, version } = hpoRows(hp, babelon, PROV);
  const { rows: cw } = crosswalkRows(SPARQL_P3841);
  const eq = glossaryEquivalents(cw, rows, isGlossaryTerm);
  const bySystem = { hpo: rows };
  const base = buildPlan(bySystem, { glossary: true })[0];
  const glossaryOf = (p, code) => p.glossaryMemberships.filter((m) => m[2] === conceptId('hpo', code)).length;
  assert.equal(glossaryOf(base, 'HP:0001250'), 2, 'sin dedupe entra a los dos value sets');

  assert.equal(duplicatesAgainst(eq, new Set()).size, 0, 'sin ficha en el glosario no hay duplicado');

  const dups = duplicatesAgainst(eq, new Set([wikidataSintomaConceptId('Q6279182')]));
  assert.deepEqual([...dups.keys()], ['HP:0001250']);
  const plan = buildPlan(bySystem, { glossary: true, duplicates: dups })[0];
  assert.equal(glossaryOf(plan, 'HP:0001250'), 0, 'el duplicado no se suma al glosario');
  assert.equal(plan.glossaryProperties.some((x) => x[1] === conceptId('hpo', 'HP:0001250')), false);
  assert.equal(plan.concepts.length, base.concepts.length, 'el concepto sigue en el code system hpo');
  const map = plan.maps.find((m) => m[1] === conceptId('hpo', 'HP:0001250') && m[2] === wikidataSintomaConceptId('Q6279182'));
  assert.ok(map, 'queda enlazado a la ficha');
  assert.match(map[4], /Q6279182 declara P3841 \(Human Phenotype Ontology ID\) = HP:0001250/);
  assert.equal(map[3], null, 'no afirma equivalencia exacta');
  assert.equal(map[5], version);
  assert.equal(plan.glossaryMemberships.length, base.glossaryMemberships.length - 2);
});

test('duplicados: ids deterministas (slug de la ficha y fila de concept_maps)', () => {
  assert.equal(wikidataSintomaSlug('Q38933'), 'wikidata-sintoma-q38933');
  assert.equal(wikidataSintomaConceptId('Q38933'), wikidataSintomaConceptId('Q38933'));
  const row = { code: 'HP:0001945', version: '2026-09-01' };
  const dup = { q: 'Q38933', wikidataConceptId: wikidataSintomaConceptId('Q38933') };
  assert.equal(dedupeMap(row, dup, 'x').id, dedupeMap(row, dup, 'x').id);
});

test('cruce P3841 versionado: coincide con su MANIFEST (SHA-256, filas) y todas las filas son Q-id + HP:n', () => {
  const manifest = JSON.parse(readFileSync(CROSSWALK_MANIFEST, 'utf8'));
  const gz = readFileSync(CROSSWALK_FILE);
  assert.equal(createHash('sha256').update(gz).digest('hex'), manifest.gzSha256);
  const rows = gunzipSync(gz).toString('utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  assert.equal(rows.length, manifest.rows);
  assert.equal(new Set(rows.map((r) => `${r.q}|${r.hpo}`)).size, rows.length, 'sin pares repetidos');
  assert.ok(rows.every((r) => /^Q[1-9]\d*$/.test(r.q) && /^HP:\d{7}$/.test(r.hpo)));
  assert.equal(manifest.license, 'CC0 1.0');
});
