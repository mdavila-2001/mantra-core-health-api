// Pruebas de los parsers, cruces y plan de carga de tratamientos farmacológicos,
// con filas reales de cada fuente (ver fixtures/README.md). Sin red ni base.
//   node --test tools/terminology-import/drug-treatments/test/*.test.mjs

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { assertionId, code, curie, makeAssertion } from '../lib/common.mjs';
import { drugCentralIndex, mondoIndex, withCrosswalk } from '../lib/crosswalk.mjs';
import { assertionsPlan, relationshipsFor, typeConceptId, typesPlan } from '../lib/load-plan.mjs';
import { drugCentralIdentifiers, parseDrugCentral2016, parseDrugMechDb, parseLabeledIn, parseMaxo, parsePharmacotherapyDb } from '../lib/parsers.mjs';
import { coverage } from '../lib/report.mjs';
import { RELATION_TYPES, SOURCES } from '../lib/sources.mjs';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const read = (name) => readFileSync(join(FIX, name), 'utf8');
const prov = (file) => ({ version: 'v-test', retrievedAt: '2026-10-24T00:00:00.000Z', commit: 'c0ffee', file, fileSha256: 'abc' });
const keys = (codes) => codes.map((c) => `${c.system}:${c.code}`);

test('cada fuente declara versión y licencia; las de GitHub, repo y commit fijado; las de HTTP, URL y versión etiquetada', () => {
  for (const [key, def] of Object.entries(SOURCES)) {
    for (const k of ['name', 'owner', 'version', 'license']) assert.ok(def[k], `${key}.${k}`);
    assert.ok(Object.keys(def.files).length > 0, key);
    if (def.transport === 'http') {
      assert.ok(def.versionTag, `${key}.versionTag`);
      assert.ok(def.licenseUrl, `${key}.licenseUrl`);
      assert.ok(Object.keys(def.urls ?? {}).length > 0, `${key}.urls`);
      for (const url of Object.values(def.urls)) assert.match(url, /^https:\/\//, key);
    } else {
      assert.match(def.repo, /^https:\/\/github\.com\/.+\.git$/, key);
      assert.match(def.commit, /^[0-9a-f]{40}$/, key);
    }
  }
  for (const [key, def] of Object.entries(RELATION_TYPES)) {
    assert.ok(SOURCES[def.source], key);
    assert.ok(['positive', 'negative', 'investigational', 'diagnostic', 'conditional'].includes(def.polarity), key);
    assert.ok(key.startsWith(`${def.source}:`), key);
    assert.ok(def.definitionEn && def.labelEs, key);
  }
});

test('códigos: forma exacta o null, nunca se arreglan', () => {
  assert.deepEqual(code('UMLS', 'C0267055'), { system: 'UMLS', code: 'C0267055' });
  assert.equal(code('UMLS', 'C026705'), null);
  assert.equal(code('RXCUI', '40790 x'), null);
  assert.deepEqual(curie('MESH:D015464'), { system: 'MESH', code: 'D015464' });
  assert.deepEqual(curie('mesh:D000544'), { system: 'MESH', code: 'D000544' });
  assert.deepEqual(curie('DB:DB00619'), { system: 'DRUGBANK', code: 'DB00619' });
  assert.deepEqual(curie('Orphanet:558'), { system: 'ORPHA', code: '558' });
  assert.equal(curie('SCTID:14760008'), null);
});

test('makeAssertion rechaza tipos ajenos a la fuente y procedencia incompleta', () => {
  const base = { source: 'labeledin', recordId: 'x', uri: 'u', drug: { codes: [code('RXCUI', '1')] }, condition: { codes: [code('UMLS', 'C0000001')] }, provenance: prov('f') };
  assert.throws(() => makeAssertion({ ...base, type: 'pharmacotherapydb:DM' }), /no declarado/);
  assert.throws(() => makeAssertion({ ...base, type: 'labeledin:expert-label-indication', provenance: { ...prov('f'), commit: '' } }), /procedencia «commit»/);
  assert.throws(() => makeAssertion({ ...base, type: 'labeledin:expert-label-indication', uri: '' }), /sin URI/);
  assert.equal(makeAssertion({ ...base, type: 'labeledin:expert-label-indication' }).id, assertionId('labeledin', 'x'));
});

test('LabeledIn experto: un par (RxCUI, CUI) por indicación; dos fichas del mismo par se agrupan', () => {
  const { assertions, stats } = parseLabeledIn(read('labeledin-expert.txt'), prov('expert'));
  assert.equal(stats.rows, 3);
  // 10004 y 3113 son el mismo ingrediente 40790 con las mismas 3 CUI → 3 afirmaciones con 2 fichas cada una.
  const ivermectin = assertions.filter((a) => a.drug.codes[0].code === '40790');
  assert.equal(ivermectin.length, 3);
  for (const a of ivermectin) {
    assert.equal(a.relation.type, 'labeledin:expert-label-indication');
    assert.deepEqual(a.evidence.dailyMedSetIds, ['3cde88e6-28f2-4cbe-8c3f-770b05cc0e1b', '9c983da1-a8e0-479e-8816-5d5668ea242e']);
    assert.equal(a.evidence.labelCount, 2);
  }
  assert.equal(assertions.length, 3 + 4);
  assert.ok(assertions.every((a) => a.source.uri.startsWith('https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=')));
});

test('LabeledIn crowd: sólo «yes» es relación; el resto se cuenta como excluido; una combinación queda como conjunto', () => {
  const { assertions, stats } = parseLabeledIn(read('labeledin-crowd.txt'), prov('crowd'), { crowd: true });
  assert.equal(stats['excluded:answer=no-contra'], 1);
  assert.equal(stats['excluded:answer=uncertain'], 1);
  assert.ok(assertions.every((a) => a.relation.type === 'labeledin:crowd-label-indication' && a.evidence.crowdMajorityAnswer === 'yes'));
  const combo = assertions.find((a) => a.drug.codes.length === 2);
  assert.deepEqual(keys(combo.drug.codes), ['RXCUI:2019', 'RXCUI:6375']);
  assert.equal(combo.drug.combination, true);
  assert.equal(combo.source.recordId, 'crowd:2019+6375|C0030567');
});

test('PharmacotherapyDB conserva DM, SYM y NOT con su polaridad', () => {
  const { assertions } = parsePharmacotherapyDb(read('pharmacotherapydb.tsv'), prov('pdb'));
  assert.deepEqual(
    assertions.map((a) => [a.drug.label, a.relation.type, a.relation.polarity]),
    [
      ['Donepezil', 'pharmacotherapydb:DM', 'positive'],
      ['Galantamine', 'pharmacotherapydb:DM', 'positive'],
      ['Benzatropine', 'pharmacotherapydb:SYM', 'positive'],
      ['Biperiden', 'pharmacotherapydb:NOT', 'negative'],
    ],
  );
  assert.deepEqual(keys(assertions[0].condition.codes), ['DOID:10652']);
  assert.deepEqual(assertions[1].evidence, { category: 'DM', nCurators: 1, nResources: 4 });
});

test('DrugCentral 2016: descarta SNOMED, conserva CUI y DOID, y su texto de indicación literal', () => {
  const { assertions, stats } = parseDrugCentral2016(read('drugcentral-indications.tsv'), prov('dc'));
  assert.equal(assertions.length, 3);
  assert.equal(stats['dropped:SNOMEDCT_CUI (Bolivia no es miembro de SNOMED International)'], 3);
  const ced = assertions.find((a) => a.drug.label === 'cediranib');
  assert.deepEqual(keys(ced.condition.codes), ['UMLS:C1140680', 'DOID:2394']);
  assert.deepEqual(ced.evidence.indicationText, ['Ovarian Carcinoma']);
  assert.ok(!JSON.stringify(assertions).includes('363443007'));
  assert.deepEqual(keys(assertions.find((a) => a.drug.label === 'edaravone').condition.codes), ['UMLS:C0948008']);
});

test('DrugMechDB: un par por (fármaco, enfermedad) con todos sus caminos; sin MeSH del fármaco usa DrugBank', () => {
  const { assertions, stats } = parseDrugMechDb(read('drugmechdb.yaml'), prov('dmdb'));
  assert.equal(stats.paths, 5);
  assert.equal(assertions.length, 4);
  const two = assertions.find((a) => a.evidence.pathIds.length === 2);
  assert.deepEqual(two.evidence.pathIds, ['DB00760_MESH_D016920_1', 'DB00760_MESH_D016920_2']);
  const noMesh = assertions.find((a) => !a.drug.codes.some((c) => c.system === 'MESH'));
  assert.deepEqual(keys(noMesh.drug.codes), ['DRUGBANK:DB01527']);
});

test('MAxO: sólo filas con CHEBI; la relación es la literal de la fuente', () => {
  const { assertions, stats } = parseMaxo(read('maxo.tsv'), prov('maxo'));
  assert.equal(assertions.length, 2);
  assert.equal(stats['excluded:sin extensión CHEBI (acción no farmacológica o sin sustancia)'], 1);
  assert.deepEqual(assertions.map((a) => [a.relation.type, a.relation.polarity]).sort(), [
    ['maxo:contraindicated', 'negative'],
    ['maxo:treats', 'positive'],
  ]);
  assert.ok(assertions.every((a) => a.source.uri.startsWith('https://pubmed.ncbi.nlm.nih.gov/') || a.evidence.citation));
});

test('cruces: MONDO por exactMatch y DrugCentral por sus identificadores, con via y predicado', () => {
  const mondo = mondoIndex(read('mondo.sssom.tsv'));
  const dc = drugCentralIndex(drugCentralIdentifiers(read('drugcentral-identifiers.tsv')));
  const [donepezil] = parsePharmacotherapyDb(read('pharmacotherapydb.tsv'), prov('pdb')).assertions;
  const x = withCrosswalk(donepezil, { mondo, drugCentral: dc });
  assert.ok(x.crosswalk.condition.some((c) => c.system === 'MONDO' && c.code === '0004975' && c.via === 'mondo-sssom' && c.predicate === 'skos:exactMatch'));
  assert.ok(x.crosswalk.condition.some((c) => c.system === 'ICD10WHO' && c.code === 'G30'));
  assert.ok(x.pairKey.endsWith('|MONDO:0004975'));
  const oxy = parseDrugCentral2016(read('drugcentral-indications.tsv'), prov('dc')).assertions.find((a) => a.drug.label === 'oxyphenisatine');
  const y = withCrosswalk(oxy, { mondo, drugCentral: dc });
  assert.ok(y.crosswalk.drug.some((c) => c.system === 'RXCUI' && c.code === '8136' && c.via === 'drugcentral-identifiers'));
  assert.ok(y.pairKey.startsWith('DRUGCENTRAL:2038|MONDO:0002203'));
  // MeSH D015464 no tiene exactMatch en el fixture de MONDO: queda con su código de origen.
  const cml = withCrosswalk(parseDrugMechDb(read('drugmechdb.yaml'), prov('dmdb')).assertions[0], { mondo, drugCentral: dc });
  assert.ok(cml.pairKey.endsWith('|MESH:D015464'));
});

test('plan de carga: ids deterministas, procedencia completa en propiedades y aristas sólo hacia conceptos existentes', () => {
  const mondo = mondoIndex(read('mondo.sssom.tsv'));
  const dc = drugCentralIndex(drugCentralIdentifiers(read('drugcentral-identifiers.tsv')));
  const as = parsePharmacotherapyDb(read('pharmacotherapydb.tsv'), prov('pdb')).assertions.map((a) => withCrosswalk(a, { mondo, drugCentral: dc }));
  const p1 = assertionsPlan('pharmacotherapydb', as);
  const p2 = assertionsPlan('pharmacotherapydb', as);
  assert.deepEqual(p1.concepts, p2.concepts);
  assert.deepEqual(p1.properties, p2.properties);
  const codes = new Set(p1.properties.filter((p) => p[1] === as[0].id).map((p) => p[2]));
  for (const c of ['assertion_relation_type', 'source_record_id', 'source_url', 'source_version', 'source_retrieved_at', 'source_license', 'source_commit', 'source_file_sha256']) assert.ok(codes.has(c), c);
  const targets = new Map([['ICD10CM:G30', ['11111111-1111-1111-1111-111111111111']]]);
  const rels = relationshipsFor(as[0], targets);
  assert.deepEqual(rels.map((r) => [r[2], r[3]]), [['11111111-1111-1111-1111-111111111111', typeConceptId('assertion:condition')]]);
  assert.deepEqual(relationshipsFor(as[0], new Map()), []);
  assert.equal(new Set(typesPlan().concepts.map((c) => c[0])).size, typesPlan().concepts.length);
});

test('cobertura: un par sólo cuenta como nuevo en la primera pasada que lo aporta', () => {
  const mondo = mondoIndex(read('mondo.sssom.tsv'));
  const dc = drugCentralIndex(drugCentralIdentifiers(read('drugcentral-identifiers.tsv')));
  const as = parsePharmacotherapyDb(read('pharmacotherapydb.tsv'), prov('pdb')).assertions.map((a) => withCrosswalk(a, { mondo, drugCentral: dc }));
  const r = coverage(as);
  assert.equal(r.assertions, 4);
  assert.equal(r.passes[0].newPairs, 3); // NOT no cuenta como par de tratamiento
  assert.equal(r.byPolarity.negative, 1);
});

test('data/ versionado: hashes de SHA256SUMS y afirmaciones con id único y procedencia', async () => {
  const { createHash } = await import('node:crypto');
  const { gunzipSync } = await import('node:zlib');
  const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
  const sums = readFileSync(join(DATA, 'SHA256SUMS'), 'utf8').trim().split('\n').map((l) => l.split(/\s+/));
  for (const [hash, file] of sums) assert.equal(createHash('sha256').update(readFileSync(join(DATA, file))).digest('hex'), hash, file);
  const parts = sums.map(([, f]) => f).filter((f) => /^drug-treatments-\d{3}\.ndjson\.gz$/.test(f));
  const meta = JSON.parse(readFileSync(join(DATA, 'drug-treatments.meta.json'), 'utf8'));
  // Una parte a la vez: el corpus completo (~340 000 filas) no entra en un heap de 2 500 MB si se junta entero.
  const ids = new Set();
  let total = 0;
  for (const f of parts) {
    for (const l of gunzipSync(readFileSync(join(DATA, f))).toString('utf8').split('\n')) {
      if (l.trim() === '') continue;
      const r = JSON.parse(l);
      total += 1;
      ids.add(r.id);
      assert.ok(RELATION_TYPES[r.relation.type], r.relation.type);
      for (const k of ['recordId', 'uri', 'version', 'retrievedAt', 'license', 'fileSha256']) assert.ok(r.source[k], `${r.id} ${k}`);
      // GitHub: commit fijado. HTTP: sin commit, pero con release y URL del archivo de origen.
      if (r.source.repo) assert.ok(r.source.commit, `${r.id} commit`);
      else for (const k of ['release', 'fileUrl']) assert.ok(r.source[k], `${r.id} ${k}`);
    }
  }
  assert.equal(total, meta.assertions);
  assert.equal(ids.size, total);
});
