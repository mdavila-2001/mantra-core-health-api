// Pruebas del carril C7 (2026-10-27): ChEBI, PRO, NCIt, MeSH, EMDN, AbreMES-DB,
// NCBI Taxonomy (taxdump) y los nombres en castellano de Wikidata. Fixtures:
// recortes REALES de los archivos que baja fetch-dictionaries.mjs (stanzas
// copiadas tal cual; el .xlsx y el .zip se recomprimieron con las mismas filas).
// Correr: node --test tools/terminology-import/dictionaries/test/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseObo, parseOboFile } from '../lib/obo.mjs';
import { assignBranches, humanLineage, oboSourceRows } from '../lib/terms.mjs';
import { parentsMap, taxaFromObo } from '../lib/organisms.mjs';
import { listZip, readZipEntry, zipEntryLines } from '../lib/zip-mini.mjs';
import { emdnRows, readXlsxFirstSheet, sharedStrings, sheetRows } from '../lib/emdn.mjs';
import { crossCheckLabels, readDeleted, readMerged, readNames, readNodes, taxaFromTaxdump, taxdumpWanted } from '../lib/taxdump.mjs';
import { descriptorRecords, meshRows, parentTreeNumber, parseDescriptor } from '../lib/mesh.mjs';
import { abremesRows, parsePairs } from '../lib/abremes.mjs';
import { ABREMES_SOURCE, CHEBI_SOURCE, EMDN_SOURCE, MESH_SOURCE, NCIT_SOURCE, PRO_SOURCE, corpusKey } from '../lib/sources.mjs';
import { CONCEPT, designationTuples, isDefaultLoaded } from '../lib/load-plan.mjs';
import { ID_PROPERTIES, NO_ENRICH, corpusCode, entitiesUrl, esLabelRows, labelPairs, labelsSparql, labelsSparqlFor } from '../lib/wikidata-es.mjs';
import { combineCoverage, layerCoverage } from '../lib/coverage.mjs';

const FX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const fx = (f) => readFileSync(join(FX, f), 'utf8');
const FILE = { url: 'https://fixture.invalid/real-excerpt', sha256: '0'.repeat(64), retrievedAt: '2026-10-27T00:00:00.000Z' };
const lineage = () => humanLineage(parentsMap(taxaFromObo(parseObo(fx('ncbitaxon-import-excerpt.obo')), 'mondoTaxa')));
const streamed = (source, file) => parseOboFile(join(FX, file), { keepProperty: source.keepProperty ?? (() => false), keepId: (id) => source.idPrefixes.includes(id.split(':')[0]) });

// ---------------------------------------------------------------- parser OBO en streaming
test('parseOboFile (streaming) lee los mismos términos que parseObo y compacta los arreglos vacíos', async () => {
  const text = fx('chebi-excerpt.obo');
  const a = parseObo(text);
  const b = await parseOboFile(join(FX, 'chebi-excerpt.obo'));
  assert.equal(b.terms.length, a.terms.length);
  assert.deepEqual(b.terms.map((t) => [t.id, t.name, t.isA.length, t.synonyms.length, t.xrefs.length]), a.terms.map((t) => [t.id, t.name, t.isA.length, t.synonyms.length, t.xrefs.length]));
  const role = b.terms.find((t) => t.id === 'CHEBI:50906');
  assert.equal(role.synonyms.length, 0);
  assert.ok(Object.isFrozen(role.synonyms), 'los arreglos vacíos son uno solo compartido y de sólo lectura');
});

test('keepProperty descarta los property_value de estructura pero conserva los pedidos', async () => {
  const p = await streamed(CHEBI_SOURCE, 'chebi-excerpt.obo');
  const water = p.terms.find((t) => t.id === 'CHEBI:15377');
  assert.deepEqual(water.propertyValues.map((x) => x.property).sort(), ['chemrof:charge', 'chemrof:generalized_empirical_formula', 'chemrof:inchi_key_string', 'chemrof:mass', 'chemrof:monoisotopic_mass']);
  assert.ok(!water.propertyValues.some((x) => /smiles|inchi_string/.test(x.property)));
});

test('un sinónimo conserva sus calificadores {…} (NCIt: fuente y tipo)', () => {
  const o = parseObo('[Term]\nid: NCIT:C1\nname: x\nsynonym: "AR" EXACT [] {NCIT:P383="AB", NCIT:P384="NCI"}\nsynonym: "sin calificadores" EXACT []\n');
  assert.deepEqual(o.terms[0].synonyms[0].qualifiers, { 'NCIT:P383': 'AB', 'NCIT:P384': 'NCI' });
  assert.equal(o.terms[0].synonyms[1].qualifiers, undefined);
});

// ---------------------------------------------------------------- ChEBI
test('ChEBI: la rama de roles es farmacología por defecto; el resto, bioquímica; 1-2 estrellas son opt-in', async () => {
  const { rows, stats } = oboSourceRows(await streamed(CHEBI_SOURCE, 'chebi-excerpt.obo'), CHEBI_SOURCE, FILE, { lineage: lineage() });
  const by = new Map(rows.map((r) => [r.code, r]));
  assert.deepEqual([by.get('CHEBI:50906').domain, by.get('CHEBI:50908').domain, by.get('CHEBI:15377').domain], ['pharmacology', 'pharmacology', 'biochemistry']);
  assert.equal(by.get('CHEBI:50908').tier, 'default');
  assert.equal(by.get('CHEBI:10').tier, 'opt-in', 'CHEBI:10 es 2:STAR (anotada por terceros)');
  assert.equal(stats.byTier['opt-in'] >= 1, true);
  assert.equal(isDefaultLoaded(CHEBI_SOURCE, by.get('CHEBI:10')), false);
  assert.equal(isDefaultLoaded(CHEBI_SOURCE, by.get('CHEBI:10'), new Set(['chebi'])), true, '--include chebi carga todos los niveles');
  assert.equal(isDefaultLoaded(CHEBI_SOURCE, by.get('CHEBI:15377')), true);
});

test('ChEBI: fórmula, masa y clave InChI se conservan; los roles quedan como relaciones no tipadas', async () => {
  const { rows } = oboSourceRows(await streamed(CHEBI_SOURCE, 'chebi-excerpt.obo'), CHEBI_SOURCE, FILE, { lineage: lineage() });
  const water = rows.find((r) => r.code === 'CHEBI:15377');
  assert.equal(water.extra.formula, 'H2O');
  assert.equal(water.extra.inchiKey, 'XLYOFNOQVPJJNP-UHFFFAOYSA-N');
  assert.ok(water.otherRelations.some((x) => x.predicate === 'RO:0000087' && x.label === 'has role'));
  assert.ok(water.relations.every((x) => x.type === 'IS_A'));
});

test('ChEBI: no se cargan xrefs ni sinónimos de KEGG, DrugBank, HMDB ni ChEMBL (política de licencias del repo)', async () => {
  const parsed = await streamed(CHEBI_SOURCE, 'chebi-excerpt.obo');
  const t = parsed.terms.find((x) => x.id === 'CHEBI:100241');
  const restricted = t.synonyms.filter((s) => s.xrefs.some((x) => /^(kegg|drugbank|hmdb|chembl)/i.test(x)));
  assert.ok(restricted.length > 0, 'el fixture trae sinónimos de esos orígenes');
  const { rows, stats } = oboSourceRows(parsed, CHEBI_SOURCE, FILE, { lineage: lineage() });
  const row = rows.find((r) => r.code === 'CHEBI:100241');
  assert.ok(restricted.length > 0 && stats.droppedSynonyms.chebi >= restricted.length);
  for (const s of restricted) {
    const kept = [...row.synonymsExact, ...row.synonymsOther.map((o) => o.value)];
    const alsoFromOk = t.synonyms.some((o) => o.value === s.value && !o.xrefs.some((x) => /^(kegg|drugbank|hmdb|chembl)/i.test(x)));
    if (!alsoFromOk) assert.ok(!kept.includes(s.value), `«${s.value}» viene sólo de un origen restringido`);
  }
  for (const r of rows) for (const x of r.xrefs) assert.ok(!/^(kegg|drugbank|hmdb|pubmed|patent)/.test(x.id), x.id);
  assert.ok(stats.droppedXrefs['kegg.compound'] > 0 && stats.droppedXrefs.pubmed > 0);
});

test('una data-version distinta de la fijada aborta (el archivo no es el que describe el registro)', async () => {
  const parsed = parseObo(fx('chebi-excerpt.obo').replace('data-version: 256', 'data-version: 255'));
  assert.throws(() => oboSourceRows(parsed, CHEBI_SOURCE, FILE, { lineage: lineage() }), /data-version «255» distinta de la fijada «256»/);
});

// ---------------------------------------------------------------- PRO
test('PRO: sólo ids PR: humanos o sin taxón; los de ratón y los genes externos se descartan', async () => {
  const p = await streamed(PRO_SOURCE, 'pro-excerpt.obo');
  assert.ok(p.terms.every((t) => t.id.startsWith('PR:')), 'keepId descarta Araport: desde el parseo');
  const { rows, stats } = oboSourceRows(p, PRO_SOURCE, FILE, { lineage: lineage() });
  assert.ok(stats.nonHuman >= 1);
  assert.ok(!rows.some((r) => r.code === 'PR:000000441'), 'PR:000000441 es de ratón (in_taxon 10090)');
  const p53 = rows.find((r) => r.code === 'PR:000003035');
  assert.equal(p53.display, 'cellular tumor antigen p53');
  assert.ok(p53.synonymsExact.includes('TP53'));
  assert.deepEqual(p53.relations.map((x) => x.targetKey ?? corpusKey(x.target)), ['protein-ontology|PR:000000001']);
  assert.equal(p53.provenance.version, 'release 73.1');
});

// ---------------------------------------------------------------- NCIt
test('NCIt: código sin prefijo (C1000), dominio por rama raíz y la rama de enfermedades queda afuera', async () => {
  const p = await streamed(NCIT_SOURCE, 'ncit-excerpt.obo');
  const { rows, stats } = oboSourceRows(p, NCIT_SOURCE, FILE, { lineage: lineage() });
  const by = new Map(rows.map((r) => [r.code, r]));
  const c1000 = by.get('C1000');
  assert.equal(c1000.key, 'ncit-general|C1000');
  assert.equal(c1000.provenance.sourceTermId, 'NCIT:C1000');
  assert.deepEqual([c1000.domain, c1000.tier], ['pharmacology', 'default']);
  assert.deepEqual(c1000.extra.semanticTypes, ['Amino Acid, Peptide, or Protein', 'Pharmacologic Substance']);
  assert.equal(c1000.extra.fdaUniiCode[0], '7MGE0HPM2H');
  assert.equal(corpusKey(c1000.relations[0].target), 'ncit-general|C1504');
  assert.ok(!by.has('C2991') && !by.has('C26684'), 'Disease or Disorder y sus hijos son de la sesión de enfermedades');
  assert.ok(stats.excludedBranch >= 2);
  assert.equal(by.get('C16612').tier, 'opt-in', 'los genes son opt-in');
  assert.equal(by.get('C97325').domain, 'devices');
});

test('NCIt: los sinónimos que NCIt atribuye a KEGG no se cargan', async () => {
  const p = await streamed(NCIT_SOURCE, 'ncit-excerpt.obo');
  const t = p.terms.find((x) => x.id === 'NCIT:C18611');
  const kegg = t.synonyms.filter((s) => [].concat(s.qualifiers?.['NCIT:P384'] ?? []).includes('KEGG'));
  assert.ok(kegg.length >= 1);
  const { rows, stats } = oboSourceRows(p, NCIT_SOURCE, FILE, { lineage: lineage() });
  const row = rows.find((r) => r.code === 'C18611');
  for (const s of kegg) assert.ok(!row.synonymsExact.includes(s.value) || t.synonyms.some((o) => o.value === s.value && ![].concat(o.qualifiers?.['NCIT:P384'] ?? []).includes('KEGG')));
  assert.equal(stats.droppedSynonyms['ncit-general'], kegg.length);
});

test('assignBranches aborta si una raíz de rama no está en el archivo (formato o versión distintos)', () => {
  const o = parseObo('[Term]\nid: NCIT:C1\nname: a\n');
  assert.throws(() => assignBranches(o.terms, { id: 'x', branches: [{ root: 'NCIT:C999', domain: 'anatomy', tier: 'default' }] }), /la raíz de rama NCIT:C999 no está/);
});

// ---------------------------------------------------------------- MeSH
test('MeSH: parseDescriptor lee nombre, árbol, alcance, términos y acciones farmacológicas', async () => {
  const recs = [];
  for await (const x of descriptorRecords(join(FX, 'mesh-excerpt.xml'))) recs.push(parseDescriptor(x));
  const d = recs.find((r) => r.ui === 'D000082');
  assert.equal(d.name, 'Acetaminophen');
  assert.deepEqual(d.treeNumbers, ['D02.065.199.092.040', 'D02.092.146.113.092.040']);
  assert.deepEqual(d.pharmacologicalActions.map((x) => x.ui), ['D018712', 'D058633']);
  const pref = d.concepts.find((c) => c.preferred);
  assert.match(pref.scopeNote, /^Analgesic antipyretic derivative of acetanilide/);
  assert.ok(pref.terms.some((t) => t.value === 'APAP'));
  assert.equal(parentTreeNumber('D27.505.954.427.040.100'), 'D27.505.954.427.040');
  assert.equal(parentTreeNumber('D27'), null);
});

test('MeSH: sólo las ramas D27 y E05.318; jerarquía por número de árbol y relación sustancia → clase', async () => {
  const recs = [];
  for await (const x of descriptorRecords(join(FX, 'mesh-excerpt.xml'))) recs.push(parseDescriptor(x));
  const { rows, stats } = meshRows(recs, MESH_SOURCE, FILE);
  const by = new Map(rows.map((r) => [r.code, r]));
  assert.ok(!by.has('D000082'), 'acetaminofén es un químico (D02), no una acción farmacológica');
  const a = by.get('D018712');
  assert.equal(a.display, 'Analgesics, Non-Narcotic');
  assert.equal(a.domain, 'pharmacology');
  assert.ok(a.relations.length === 1 && a.relations[0].target === 'D000700' && a.relations[0].targetKey === 'mesh|D000700' && a.relations[0].type === 'IS_A');
  assert.ok(a.extra.declaredAsPharmacologicalActionBy.some((x) => x.ui === 'D000082' && x.name === 'Acetaminophen'));
  assert.equal(by.get('D004812').domain, 'public-health');
  assert.equal(by.get('D004812').display, 'Epidemiologic Methods');
  assert.equal(by.get('D020164').relations.length, 0, 'D27 es raíz');
  assert.ok(stats.byBranch['chemical-actions-and-uses'] > 0 && stats.byBranch['epidemiologic-methods'] > 0);
});

test('MeSH: un número de árbol sin padre en el archivo aborta', async () => {
  const recs = [];
  for await (const x of descriptorRecords(join(FX, 'mesh-excerpt.xml'))) recs.push(parseDescriptor(x));
  const broken = recs.filter((r) => r.ui !== 'D020228'); // sin «Pharmacologic Actions» D27.505
  assert.throws(() => meshRows(broken, MESH_SOURCE, FILE), /no tiene padre D27\.505/);
});

// ---------------------------------------------------------------- zip, xlsx y EMDN
test('zip-mini: directorio central, lectura completa y por líneas en streaming', async () => {
  const entries = listZip(join(FX, 'taxdmp-excerpt.zip'));
  assert.deepEqual(entries.map((e) => e.name).sort(), ['delnodes.dmp', 'merged.dmp', 'names.dmp', 'nodes.dmp']);
  assert.equal(readZipEntry(join(FX, 'taxdmp-excerpt.zip'), 'delnodes.dmp').toString(), '93349\t|\n');
  const lines = [];
  for await (const l of zipEntryLines(join(FX, 'taxdmp-excerpt.zip'), 'nodes.dmp')) lines.push(l);
  assert.ok(lines.length > 10 && lines.some((l) => l.startsWith('1\t|\t1\t|\tno rank')));
  assert.throws(() => readZipEntry(join(FX, 'taxdmp-excerpt.zip'), 'no-existe.txt'), /no tiene la entrada/);
});

test('EMDN: filas de la planilla oficial → conceptos con su padre por nivel', () => {
  const sheet = readXlsxFirstSheet(join(FX, 'emdn-excerpt.xlsx'));
  const { rows, stats } = emdnRows(sheet, EMDN_SOURCE, FILE);
  const by = new Map(rows.map((r) => [r.code, r]));
  assert.equal(by.get('A').display, 'DEVICES FOR ADMINISTRATION, WITHDRAWAL AND COLLECTION');
  assert.equal(by.get('A').relations.length, 0);
  const leaf = by.get('A0101010101');
  assert.equal(leaf.display, 'HYPODERMIC SYRINGE NEEDLES, WITH SAFETY SYSTEMS');
  assert.deepEqual([leaf.extra.level, leaf.extra.terminalLevel, leaf.relations[0].target, leaf.relations[0].targetKey], [6, true, 'A01010101', 'emdn|A01010101']);
  assert.equal(stats.rows, rows.length);
  assert.equal(corpusKey('A01'), null, 'los códigos sin prefijo no se resuelven por prefijo: la fila declara su targetKey');
});

test('EMDN: una cabecera o un nivel inesperados abortan', () => {
  const sheet = readXlsxFirstSheet(join(FX, 'emdn-excerpt.xlsx'));
  const bad = sheet.map((r) => (r.C === 'CODE' ? { ...r, E: 'NIVEL' } : r));
  assert.throws(() => emdnRows(bad, EMDN_SOURCE, FILE), /cabecera inesperada en la columna E/);
  const wrongLevel = sheet.map((r) => (r.C === 'A01' ? { ...r, E: '3' } : r));
  assert.throws(() => emdnRows(wrongLevel, EMDN_SOURCE, FILE), /el nivel 3 exige 5 caracteres/);
  const orphan = sheet.filter((r) => r.C !== 'A01');
  assert.throws(() => emdnRows(orphan, EMDN_SOURCE, FILE), /su padre A01 no está/);
});

test('sharedStrings y sheetRows: cadenas compartidas, entidades XML, runs y celdas vacías', () => {
  assert.deepEqual(sharedStrings('<sst><si><t>x &lt; y</t></si><si><r><t>a</t></r><r><t xml:space="preserve"> b</t></r></si></sst>'), ['x < y', 'a b']);
  const rows = sheetRows('<sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"/><c r="C1" t="inlineStr"><is><t>a &amp; b</t></is></c><c r="D1"><v>7</v></c></row></sheetData>', ['x < y']);
  assert.deepEqual(rows, [{ A: 'x < y', C: 'a & b', D: '7' }]);
});

// ---------------------------------------------------------------- NCBI Taxonomy
test('taxdump: completa los taxones sin etiqueta con su linaje y explica los que el NCBI ya no tiene', async () => {
  const zip = join(FX, 'taxdmp-excerpt.zip');
  const nodes = await readNodes(zip);
  const known = new Map([['NCBITaxon:131567', { name: 'cellular organisms' }]]);
  const missing = ['NCBITaxon:102285', 'NCBITaxon:10273', 'NCBITaxon:93349', 'NCBITaxon:12'];
  const wanted = taxdumpWanted(missing, known, nodes);
  assert.ok(wanted.has(102285) && !wanted.has(131567) && !wanted.has(93349));
  const names = await readNames(zip, wanted);
  const merged = await readMerged(zip);
  const { taxa, unresolved } = taxaFromTaxdump(missing, known, nodes, names, merged, await readDeleted(zip));
  const t = taxa.get('NCBITaxon:102285');
  assert.ok(t.name.length > 0 && t.origin === 'taxdump' && t.parents.length === 1);
  assert.equal(taxa.has('NCBITaxon:131567'), false, 'el ancestro con etiqueta en los módulos OBO no se repite');
  for (const [id, x] of taxa) if (x.parents[0] && x.parents[0] !== 'NCBITaxon:131567') assert.ok(taxa.has(x.parents[0]), `${id}: su padre ${x.parents[0]} tiene que estar (linaje completo)`);
  assert.deepEqual(unresolved.map((u) => [u.id, u.reason]).sort(), [['NCBITaxon:12', 'fusionado en NCBITaxon:74109 (merged.dmp)'], ['NCBITaxon:93349', 'eliminado del NCBI Taxonomy (delnodes.dmp)']]);
});

test('taxdump: el nombre científico es la etiqueta; genbank common name es sinónimo EXACT y el resto RELATED con su clase', async () => {
  const zip = join(FX, 'taxdmp-excerpt.zip');
  const nodes = await readNodes(zip);
  const names = await readNames(zip, new Set([2]));
  const { taxa } = taxaFromTaxdump(['NCBITaxon:2'], new Map(), nodes, names, new Map(), new Set());
  const bacteria = taxa.get('NCBITaxon:2');
  assert.equal(bacteria.name, 'Bacteria');
  assert.deepEqual(bacteria.exact, ['bacteria']);
  assert.ok(bacteria.other.some((o) => o.type === 'in-part' && o.value === 'Monera'));
  assert.equal(bacteria.rank, 'domain');
});

test('taxdump: el cruce contra las etiquetas OBO informa las que difieren', async () => {
  const names = await readNames(join(FX, 'taxdmp-excerpt.zip'), new Set([976, 2]));
  const r = crossCheckLabels(new Map([['NCBITaxon:976', { name: 'Bacteroidetes' }], ['NCBITaxon:2', { name: 'Bacteria' }], ['NCBITaxon:7', { name: 'sin datos' }]]), names);
  assert.deepEqual([r.compared, r.equal, r.absent], [2, 1, 1]);
  assert.deepEqual(r.differ, [{ id: 'NCBITaxon:976', obo: 'Bacteroidetes', ncbi: 'Bacteroidota' }]);
});

// ---------------------------------------------------------------- AbreMES-DB
test('AbreMES-DB: pares abreviatura → definición en castellano, nivel por frecuencia', () => {
  const pairs = parsePairs(fx('abremes-pairs-excerpt.tsv'));
  assert.ok(pairs.length >= 8);
  const { rows, stats } = abremesRows(pairs, ABREMES_SOURCE, FILE);
  const ddd = rows.find((r) => r.extra.abbreviation === 'DDD');
  assert.deepEqual([ddd.display, ddd.synonymsExact, ddd.lang, ddd.extra.frequency], ['diaria definida', ['DDD'], 'es', 31]);
  assert.equal(ddd.tier, 'default');
  assert.ok(rows.some((r) => r.extra.frequency === 1 && r.tier === 'opt-in'));
  assert.equal(isDefaultLoaded(ABREMES_SOURCE, rows.find((r) => r.tier === 'opt-in')), false);
  assert.equal(isDefaultLoaded(ABREMES_SOURCE, rows.find((r) => r.tier === 'opt-in'), new Set(['abremes'])), true);
  assert.equal(stats.pairs, pairs.length);
  const [pref] = designationTuples(ddd);
  assert.equal(pref[2], CONCEPT.LANG_ES, 'la designación preferida va en castellano porque la fuente es castellano');
});

test('AbreMES-DB: cabecera o columnas distintas abortan', () => {
  assert.throws(() => parsePairs('# Pair ID\tOtra\n1\t2'), /cabecera inesperada/);
  const good = fx('abremes-pairs-excerpt.tsv').split('\n');
  assert.throws(() => parsePairs([good[0], '1\t2\t3'].join('\n')), /tiene 3 columnas/);
  assert.throws(() => parsePairs([good[0], '1\t2\t3\t0\tA\tB\t'].join('\n')), /frecuencia inválida/);
});

// ---------------------------------------------------------------- Wikidata (nombres en castellano)
test('Wikidata ES: propiedades nuevas, códigos del corpus y consultas mínimas', () => {
  assert.equal(corpusCode('P683', '15377'), 'CHEBI:15377');
  assert.equal(corpusCode('P1748', 'C1000'), 'C1000');
  assert.equal(corpusCode('P486', 'D018712'), 'D018712');
  assert.equal(corpusCode('P1554', '0000948'), 'UBERON:0000948');
  assert.equal(corpusCode('P7963', 'CL_0000234'), 'CL:0000234', 'Wikidata guarda los ids de CL con guion bajo');
  assert.equal(corpusCode('P354', 'HGNC:5'), 'HGNC:5');
  assert.equal(ID_PROPERTIES.P1748.codeSystem, 'ncit-general');
  assert.equal(labelsSparql('P7963'), 'SELECT ?item ?id ?esLabel WHERE { ?item wdt:P7963 ?id ; rdfs:label ?esLabel . FILTER(LANG(?esLabel) = "es") }');
  assert.match(labelsSparqlFor('P685', [9606, 562]), /VALUES \?id \{ "9606" "562" \}/);
  assert.ok(NO_ENRICH.has('P354'));
  assert.equal(entitiesUrl(['Q1', 'Q2']), 'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=labels%7Caliases%7Cdescriptions&languages=es&ids=Q1%7CQ2');
});

test('Wikidata ES: respuestas reales (mapeo SPARQL + wbgetentities) → filas con procedencia', () => {
  const map = JSON.parse(fx('wikidata-map-excerpt.json'));
  const ent = JSON.parse(fx('wikidata-entities-excerpt.json'));
  const pairs = mappingPairs(map, 'P7963');
  assert.ok(pairs.length >= 3 && pairs.every((p) => /^Q\d+$/.test(p.q) && /^CL:\d+$/.test(p.code)));
  const rows = esLabelRows(pairs, ent, 'P7963', '2026-10-27T00:00:00.000Z');
  assert.ok(rows.length >= 1);
  for (const r of rows) {
    assert.equal(r.codeSystem, 'cl');
    assert.ok(r.esLabel.length > 0);
    assert.ok(pairs.some((p) => p.q === r.q && p.code === r.code), 'el vínculo es el id declarado por el ítem, no el nombre');
  }
  assert.equal(esLabelRows(pairs, { entities: {} }, 'P7963', 'x').length, 0, 'sin etiqueta en castellano no hay fila');
});

// ---------------------------------------------------------------- cobertura incremental
test('cobertura: el acumulador por fuente reparte los conceptos entre dominios de fila', async () => {
  const { rows } = oboSourceRows(await streamed(CHEBI_SOURCE, 'chebi-excerpt.obo'), CHEBI_SOURCE, FILE, { lineage: lineage() });
  const cov = layerCoverage(CHEBI_SOURCE);
  rows.forEach((r) => cov.add(r));
  const s = cov.finish({ relations: { resolved: 3, unresolved: 1 } });
  assert.equal(s.concepts, rows.length);
  assert.equal(s.rowDomains.pharmacology.concepts + s.rowDomains.biochemistry.concepts, rows.length);
  const total = combineCoverage([s], [], {});
  assert.equal(total.perDomain.pharmacology.concepts, s.rowDomains.pharmacology.concepts);
  assert.equal(total.totals.concepts, rows.length);
});
