// Pruebas del parseo y la normalización de los diccionarios médicos generales.
// Fixtures: recortes REALES (stanzas copiadas tal cual) de los archivos que baja
// fetch-dictionaries.mjs el 2026-10-24: Uberon v2026-10-01, CL v2026-06-08,
// SO 2026-08-07, Mondo v2026-10-06 (mondo-edit + imports/ncbitaxon_import),
// doid-merged.json v2026-09-30, HGNC complete set, Metainventory v1.0.0,
// ogms-edit.owl (OWL funcional) e ido.owl (RDF/XML).
// Correr: node --test tools/terminology-import/dictionaries/test/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseObo, typedefIndex } from '../lib/obo.mjs';
import { oboCurie, parseOfn, parseRdfXml } from '../lib/owl.mjs';
import { corpusCode } from '../lib/wikidata-es.mjs';
import { canonicalPredicate, humanLineage, oboSourceRows, splitXrefs } from '../lib/terms.mjs';
import { doidAgentEdges, mergeTaxa, mondoAgentEdges, parentsMap, selectTaxa, taxaFromObo, taxaFromObographs } from '../lib/organisms.mjs';
import { hgncRows } from '../lib/hgnc.mjs';
import { abbreviationRows, parseMetainventory } from '../lib/abbreviations.mjs';
import { ABBREVIATION_SOURCE, HGNC_SOURCE, OBO_SOURCES } from '../lib/sources.mjs';
import { CONCEPT, RELATION_TYPE, conceptId, designationTuples, isDefaultLoaded, lookupKeys, propertyTuples, relationshipTuples } from '../lib/load-plan.mjs';
import { deterministicId } from '../../lib/glossary-es/common.mjs';

const FX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const fx = (f) => readFileSync(join(FX, f), 'utf8');
const FILE = { url: 'https://raw.githubusercontent.com/fixture', sha256: '0'.repeat(64), retrievedAt: '2026-10-24T00:38:00.000Z' };
const src = (id) => OBO_SOURCES.find((s) => s.id === id);
const lineage = () => humanLineage(parentsMap(taxaFromObo(parseObo(fx('ncbitaxon-import-excerpt.obo')), 'mondoTaxa')));

test('parseObo: def con xrefs, sinónimos con alcance, xrefs con calificadores y relaciones', () => {
  const o = parseObo(fx('mondo-excerpt.obo'));
  const ebola = o.terms.find((t) => t.id === 'MONDO:0005737');
  assert.equal(ebola.name, 'Ebola hemorrhagic fever');
  assert.match(ebola.def, /^A viral hemorrhagic fever that is caused by the Ebola virus/);
  const ehf = ebola.synonyms.find((s) => s.value === 'EHF');
  assert.deepEqual([ehf.scope, ehf.type, ehf.xrefs], ['EXACT', 'ABBREVIATION', ['Orphanet:319218']]);
  const mesh = ebola.xrefs.find((x) => x.id === 'MESH:D019142');
  assert.deepEqual(mesh.qualifiers.source, ['DOID:4325', 'MONDO:equivalentTo', 'EFO:0007243']);
  assert.ok(ebola.relationships.some((r) => r.predicate === 'disease_has_infectious_agent' && r.target === 'NCBITaxon:186538'));
  assert.ok(ebola.intersectionOf.some((x) => x[0] === 'MONDO:0100332' && x[1] === 'NCBITaxon:3044781'));
});

test('typedefs: nombre corto → id RO/BFO canónico; SO sin xref usa el mapa de nombres cortos', () => {
  const mondo = typedefIndex(parseObo(fx('mondo-excerpt.obo')).typedefs);
  assert.equal(canonicalPredicate('disease_has_infectious_agent', mondo).canonical, 'RO:0014001');
  assert.equal(canonicalPredicate('transmitted_by', mondo).canonical, 'RO:0002451');
  const so = typedefIndex(parseObo(fx('so-excerpt.obo')).typedefs);
  assert.equal(canonicalPredicate('part_of', so).canonical, 'BFO:0000050');
  const cl = typedefIndex(parseObo(fx('cl-excerpt.obo')).typedefs);
  assert.equal(canonicalPredicate('BFO:0000050', cl).label, 'part of');
});

test('un typedef con nombre inesperado aborta (id equivocado = relaciones falsas)', () => {
  const bad = fx('so-excerpt.obo').replace('name: part_of', 'name: has_part');
  assert.throws(() => oboSourceRows(parseObo(bad), src('so'), FILE), /predicados con nombre inesperado/);
});

test('linaje humano real: 9606 llega a la raíz por is_a', () => {
  const l = lineage();
  for (const t of ['NCBITaxon:9606', 'NCBITaxon:7742', 'NCBITaxon:32524', 'NCBITaxon:1']) assert.ok(l.has(t), t);
  assert.ok(!l.has('NCBITaxon:1313'));
});

test('Uberon: corazón entra, branquia (never_in_taxon Amniota) queda afuera; SNOMED/UMLS no se copian', () => {
  const { rows, stats } = oboSourceRows(parseObo(fx('uberon-excerpt.obo')), src('uberon'), FILE, { lineage: lineage() });
  const ids = rows.map((r) => r.code);
  assert.ok(ids.includes('UBERON:0000948'));
  assert.ok(!ids.includes('UBERON:0002535'), 'gill');
  assert.ok(stats.nonHuman >= 1);
  const heart = rows.find((r) => r.code === 'UBERON:0000948');
  assert.equal(heart.display, 'heart');
  assert.equal(heart.lang, 'en');
  assert.ok(heart.relations.some((x) => x.type === 'PART_OF' && x.target === 'UBERON:0015410'));
  assert.ok(heart.xrefs.every((x) => !/^(SCTID|UMLS):/.test(x.id)));
  assert.ok(heart.xrefs.some((x) => x.id.startsWith('FMA:')));
  assert.ok((stats.droppedXrefs.SCTID ?? 0) + (stats.droppedXrefs.UMLS ?? 0) > 0);
  assert.equal(heart.provenance.uri, 'http://purl.obolibrary.org/obo/UBERON_0000948');
  assert.equal(heart.provenance.version, 'v2026-10-01');
  // Sólo EXACT pasa a designación.
  const raw = parseObo(fx('uberon-excerpt.obo')).terms.find((t) => t.id === 'UBERON:0000948');
  const nonExact = raw.synonyms.filter((s) => s.scope !== 'EXACT').map((s) => s.value);
  assert.ok(nonExact.every((v) => !heart.synonymsExact.includes(v)));
});

test('CL: sólo términos CL propios (no los GO/UBERON importados)', () => {
  const { rows } = oboSourceRows(parseObo(fx('cl-excerpt.obo')), src('cl'), FILE, { lineage: lineage() });
  assert.ok(rows.length > 0);
  assert.ok(rows.every((r) => r.code.startsWith('CL:')));
  const t = rows.find((r) => r.code === 'CL:0000084');
  assert.equal(t.display, 'T cell');
});

test('Mondo: aristas enfermedad → agente infeccioso con sus xrefs de identidad', () => {
  const edges = mondoAgentEdges(parseObo(fx('mondo-excerpt.obo')));
  const targets = edges.map((e) => e.target).sort();
  assert.deepEqual(targets, ['NCBITaxon:186538', 'NCBITaxon:186540', 'NCBITaxon:3044781', 'NCBITaxon:565995']);
  assert.ok(edges.every((e) => e.type === 'INFECTIOUS_AGENT' && e.diseaseId === 'MONDO:0005737'));
  const x = edges[0].diseaseXrefs;
  assert.ok(x.some((y) => y.id === 'ICD10CM:A98.4' && y.equivalent));
  assert.ok(x.some((y) => y.id === 'MESH:D019142' && y.equivalent));
});

test('DOID: has material basis in + taxón = agente; transmitted by = vector', () => {
  const doid = JSON.parse(fx('doid-merged-excerpt.json'));
  const edges = doidAgentEdges(doid);
  const pneumo = edges.find((e) => e.diseaseId === 'DOID:0040084');
  assert.deepEqual([pneumo.type, pneumo.target, pneumo.predicate], ['INFECTIOUS_AGENT', 'NCBITaxon:1313', 'IDO:0000664']);
  assert.deepEqual(pneumo.diseaseXrefs.map((x) => x.id), ['ICD10CM:J13']);
  assert.ok(edges.some((e) => e.diseaseId === 'DOID:0050035' && e.type === 'TRANSMITTED_BY' && e.target === 'NCBITaxon:34608'));
  // El objeto TRANS:… (vía de transmisión) no es un organismo: no entra.
  assert.ok(edges.every((e) => e.target.startsWith('NCBITaxon:')));
});

test('selección de taxones: destino + linaje; los destinos sin etiqueta se reportan', () => {
  const { taxa } = mergeTaxa(taxaFromObographs(JSON.parse(fx('doid-merged-excerpt.json')), 'doidMerged'), taxaFromObo(parseObo(fx('ncbitaxon-import-excerpt.obo')), 'mondoTaxa'));
  const { selected, missingLabels } = selectTaxa(taxa, [{ target: 'NCBITaxon:1313' }, { target: 'NCBITaxon:999999999' }]);
  assert.ok(selected.has('NCBITaxon:1313') && selected.has('NCBITaxon:1301'));
  assert.deepEqual(missingLabels, ['NCBITaxon:999999999']);
});

test('HGNC: símbolo como display, alias como designación, símbolos previos aparte', () => {
  const { rows } = hgncRows(JSON.parse(fx('hgnc-excerpt.json')), HGNC_SOURCE, FILE);
  const brca1 = rows.find((r) => r.display === 'BRCA1');
  assert.equal(brca1.code, 'HGNC:1100');
  assert.ok(brca1.synonymsExact.includes('BRCA1 DNA repair associated'));
  assert.ok(brca1.xrefs.some((x) => x.id === 'NCBIGene:672'));
  assert.ok(brca1.synonymsOther.every((s) => s.scope === 'PREVIOUS'));
  assert.equal(brca1.provenance.version, '2026-10-24');
});

test('Metainventario: un concepto por sentido; lo de literatura no entra por defecto', () => {
  const recs = parseMetainventory(fx('metainventory-excerpt.csv'));
  const { rows } = abbreviationRows(recs, ABBREVIATION_SOURCE, FILE);
  assert.equal(new Set(rows.map((r) => r.code)).size, rows.length);
  const aa = rows.find((r) => r.code === 'G002755');
  assert.equal(aa.display, 'aortic arch');
  assert.ok(aa.synonymsExact.includes('AA'));
  const literature = rows.filter((r) => r.namespace === 'literature');
  assert.ok(literature.length > 0);
  assert.ok(literature.every((r) => !isDefaultLoaded(ABBREVIATION_SOURCE, r)));
  assert.ok(literature.every((r) => isDefaultLoaded(ABBREVIATION_SOURCE, r, new Set(['abbreviations-literature']))));
});

test('plan de carga: ids deterministas, conceptos del backend reusados, relaciones sólo hacia lo cargado', () => {
  assert.equal(RELATION_TYPE.IS_A, deterministicId('terminology:relationship:is-a'));
  assert.equal(CONCEPT.LANG_EN, deterministicId('terminology:language:en'));
  const { rows } = oboSourceRows(parseObo(fx('uberon-excerpt.obo')), src('uberon'), FILE, { lineage: lineage() });
  const heart = rows.find((r) => r.code === 'UBERON:0000948');
  for (const r of heart.relations) r.targetKey = `uberon|${r.target}`;
  assert.equal(conceptId(heart.key), conceptId('uberon|UBERON:0000948'));
  const d = designationTuples(heart);
  assert.equal(d[0][4], 'heart');
  assert.equal(d[0][5], true);
  assert.ok(d.slice(1).every((t) => t[5] === false && t[2] === CONCEPT.LANG_EN));
  const props = propertyTuples(heart);
  assert.deepEqual(props.map((p) => p[2]), ['dictionary-provenance', 'dictionary-entry']);
  assert.equal(JSON.parse(props[0][4]).sourceTermId, 'UBERON:0000948');
  const loaded = new Set(['uberon|UBERON:0015410']);
  const rels = relationshipTuples(heart, loaded);
  assert.ok(rels.length >= 1);
  assert.ok(rels.every((t) => t[2] === conceptId('uberon|UBERON:0015410')));
});

test('lookupKeys: sólo códigos idénticos hacia lo que ya cargó el glosario', () => {
  assert.deepEqual(lookupKeys('ICD10CM:a98.4'), [{ kind: 'code', codeSystems: ['icd10cm', 'cie10es-diagnosticos-2026'], code: 'A98.4' }]);
  assert.deepEqual(lookupKeys('MESH:D019142'), [{ kind: 'mesh', code: 'D019142' }]);
  assert.deepEqual(lookupKeys('FMA:7088'), []);
});

test('splitXrefs: MedDRA, SNOMED y UMLS se descartan y se cuentan', () => {
  const dropped = {};
  const kept = splitXrefs([{ id: 'MedDRA:10014071', qualifiers: {} }, { id: 'SCTID:37109004', qualifiers: {} }, { id: 'NCIT:C36171', qualifiers: { source: ['MONDO:equivalentTo'] } }], dropped);
  assert.deepEqual(kept, [{ id: 'NCIT:C36171', sources: ['MONDO:equivalentTo'], equivalent: true }]);
  assert.deepEqual(dropped, { MedDRA: 1, SCTID: 1 });
});

test('OWL funcional (OGMS): etiqueta, definición e is_a; mismas filas que un .obo', () => {
  const o = parseOfn(fx('ogms-edit-excerpt.owl'));
  const disease = o.terms.find((t) => t.id === 'OGMS:0000031');
  assert.equal(disease.name, 'disease');
  assert.match(disease.def, /^A disposition \(i\) to undergo pathological processes/);
  assert.ok(disease.isA.some((x) => x.target === 'BFO:0000016'));
  const { rows } = oboSourceRows(o, src('ogms'), FILE);
  assert.ok(rows.some((r) => r.code === 'OGMS:0000031' && r.provenance.uri === 'http://purl.obolibrary.org/obo/OGMS_0000031'));
});

test('RDF/XML (IDO): clase con definición IAO e is_a; declaraciones de una línea no se tragan el archivo', () => {
  const o = parseRdfXml(fx('ido-excerpt.owl'));
  const pathogen = o.terms.find((t) => t.id === 'IDO:0000528');
  assert.equal(pathogen.name, 'pathogen');
  assert.equal(pathogen.def, 'A material entity with a pathogenic disposition.');
  assert.ok(pathogen.isA.some((x) => x.target === 'BFO:0000040'));
  assert.equal(oboCurie('http://purl.obolibrary.org/obo/BFO_0000050'), 'BFO:0000050');
});

test('Wikidata ES: el valor del identificador se lleva al código del corpus', () => {
  // Forma del identificador; los valores con guion bajo salen de la corrida real.
  assert.equal(corpusCode('P1554', '0000948'), 'UBERON:0000948');
  assert.equal(corpusCode('P1402', '7088'), 'FMA:7088');
  assert.equal(corpusCode('P354', 'HGNC:1100'), 'HGNC:1100');
  assert.equal(corpusCode('P685', '9606'), 'NCBITaxon:9606');
  assert.equal(corpusCode('P686', 'GO:0008150'), 'GO:0008150');
  // Wikidata guarda P7963 con guion bajo (valor real de Q-ítems de la corrida 2026-10-24).
  assert.equal(corpusCode('P7963', 'CL_0000738'), 'CL:0000738');
  assert.equal(corpusCode('P7963', 'CL:0000738'), 'CL:0000738');
});

test('registro: cada fuente tiene prefijo → code system (las aristas y xrefs entre fuentes se resuelven por ahí)', async () => {
  const S = await import('../lib/sources.mjs');
  const systems = new Set([...S.OBO_SOURCES.map((s) => s.codeSystem), S.FMA_SOURCE.codeSystem, S.HGNC_SOURCE.codeSystem, S.ORGANISM_SOURCES.codeSystem]);
  assert.deepEqual([...systems].filter((cs) => !Object.values(S.PREFIX_CODE_SYSTEM).includes(cs)), []);
  for (const s of [...S.OBO_SOURCES, S.FMA_SOURCE, S.HGNC_SOURCE, S.ABBREVIATION_SOURCE]) {
    assert.ok(s.license && s.licenseUrl && s.productQuery && ['default', 'opt-in'].includes(s.load), s.id);
    for (const f of s.files) assert.ok(!/\/(master|main)\//.test(f.url), `${s.id}: URL a una rama, no a una versión fija`);
  }
});

test('Wikidata ES: la consulta de taxones va acotada a los ids del corpus', async () => {
  const { labelsSparql, wikidataValue, RESTRICT_TO_CORPUS } = await import('../lib/wikidata-es.mjs');
  assert.equal(RESTRICT_TO_CORPUS.P685, 'ncbitaxon-medical');
  assert.equal(wikidataValue('NCBITaxon:1313'), '1313');
  const q = labelsSparql('P685', ['1313', '9606']);
  assert.match(q, /VALUES \?id \{ "1313" "9606" \}/);
  assert.match(q, /\?item wdt:P685 \?id/);
  assert.doesNotMatch(labelsSparql('P1554'), /VALUES/);
});
