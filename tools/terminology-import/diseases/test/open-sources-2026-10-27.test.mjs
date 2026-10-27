// Fuentes abiertas de la pasada del 2026-10-27 (MeSH oficial, NCIt de NCI EVS, GARD, NANDO,
// OncoTree, CIE-11 oficial en castellano y tablas 2026-01) con extractos REALES (fixtures/;
// ver fixtures/README.md). Sin red y sin base.
//
//   node --test "tools/terminology-import/diseases/test/*.test.mjs"

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { icd10KeysFromWhoMap, icd10MultipleTargets } from '../lib/citations.mjs';
import { EXTERNAL_TARGETS } from '../lib/code-systems.mjs';
import { parseSimpleTabulation } from '../lib/icd11.mjs';
import { attachMedlineplus, medlineplusMeshPairs } from '../lib/medlineplus.mjs';
import { md5uuid } from '../../lib/glossary-es/load-plan.mjs';
import { planFor } from '../lib/plan.mjs';
import { isDiseaseDescriptor, parentTree, readDescriptors, readSupplementals } from '../lib/mesh.mjs';
import { buildIcd11Mms, gardCode, iriToCurie, normalizeCurie } from '../lib/records.mjs';
import { buildGard, buildMesh, buildNando, buildNcitFlat, buildOncotree, gardXrefs, parseGardCsv, parseNcitCuiMap, parseNcitFlat, parseTurtleBlocks } from '../lib/records-extra.mjs';
import { resolveXrefs } from '../lib/resolve.mjs';

const FX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const meta = { url: 'fixture', retrievedAt: '2026-10-27T00:00:00.000Z' };
const json = (f) => JSON.parse(readFileSync(join(FX, f), 'utf8'));

// --- MeSH ------------------------------------------------------------------------

test('MeSH: números de árbol, términos sin permutados y nota de alcance del concepto preferido', async () => {
  const ds = await readDescriptors(join(FX, 'mesh_desc2026.sample.xml'));
  const ach = ds.find((d) => d.ui === 'D000130');
  assert.equal(ach.name, 'Achondroplasia');
  assert.deepEqual(ach.treeNumbers, ['C05.116.099.343.110', 'C05.116.099.708.017', 'C16.320.240.500']);
  assert.match(ach.scopeNote, /^An autosomal dominant disorder that is the most frequent form of short-limb dwarfism/);
  assert.equal(parentTree('C05.116.099.343.110'), 'C05.116.099.343');
  assert.equal(parentTree('C05'), null);
  // «Achondroplasias» es una variante léxica permutada (IsPermutedTermYN="Y") con el mismo TermUI.
  const terms = ach.concepts.flatMap((c) => c.terms);
  assert.ok(terms.some((t) => t.value === 'Achondroplasias' && t.permuted));
});

test('MeSH: entra C (menos C22 exclusivo) y F03; lo citado por otra fuente entra aunque esté fuera; los animales no', async () => {
  const ds = await readDescriptors(join(FX, 'mesh_desc2026.sample.xml'));
  const by = new Map(ds.map((d) => [d.ui, d]));
  assert.equal(isDiseaseDescriptor(by.get('D000130')).keep, true);
  assert.equal(isDiseaseDescriptor(by.get('D001523')).keep, true, 'F03 Trastornos mentales');
  assert.deepEqual(isDiseaseDescriptor(by.get('D000820')), { keep: false, onlyAnimal: true });
  assert.equal(isDiseaseDescriptor(by.get('D000001')).keep, false, 'calcimicina: árbol D');
  const sp = await readSupplementals(join(FX, 'mesh_supp2026.sample.xml'), [3], new Set());
  assert.equal(sp.total, 3);
  assert.deepEqual(sp.records.map((s) => s.ui), ['C531599', 'C531607'], 'sólo SCRClass 3 (enfermedades raras)');
  const { records, excluded, counts } = buildMesh({ descriptors: ds, supplementals: sp.records }, new Set(['D000001']), meta);
  const m = new Map(records.map((r) => [r.code, r]));
  assert.deepEqual([...m.keys()].sort(), ['C531599', 'C531607', 'D000001', 'D000130', 'D001523']);
  assert.match(m.get('D000001').properties.mesh_included_by, /citado por otra fuente/);
  assert.equal(excluded.animalOnly, 1);
  assert.equal(counts.descriptorsByCitationOnly, 1);
  const ach = m.get('D000130');
  assert.equal(ach.designations[0].value, 'Achondroplasia');
  assert.ok(!ach.designations.some((d) => d.value === 'Achondroplasias'), 'las permutadas no son sinónimos');
  assert.ok(ach.designations.some((d) => d.value === 'SADDAN'));
  assert.equal(ach.provenance.uri, 'http://id.nlm.nih.gov/mesh/D000130');
});

test('MeSH SCR: el «mapped to» queda como alineamiento publicado sin equivalencia declarada; sin jerarquía inventada', async () => {
  const ds = await readDescriptors(join(FX, 'mesh_desc2026.sample.xml'));
  const sp = await readSupplementals(join(FX, 'mesh_supp2026.sample.xml'), [3], new Set());
  const { records } = buildMesh({ descriptors: ds, supplementals: sp.records }, new Set(), meta);
  const scr = records.find((r) => r.code === 'C531599');
  assert.equal(scr.properties.mesh_record_kind, 'supplemental-concept-record');
  assert.deepEqual(scr.parents, []);
  assert.deepEqual(scr.xrefs.map((x) => [x.cs, x.code, x.equivalence]), [['mesh', 'D000130', null]]);
  assert.match(scr.xrefs[0].context, /^mesh:HeadingMappedTo/);
  const { keyRecords, unresolved } = resolveXrefs(records);
  assert.equal(scr.xrefs[0].resolution, 'internal');
  // El otro SCR se mapea a D038261, que no está en el extracto: queda como clave (código sin nombre), no se inventa.
  assert.deepEqual(keyRecords.map((k) => [k.cs, k.code]), [['mesh', 'D038261']]);
  assert.deepEqual(unresolved, {});
});

test('resolve: MeSH admite claves de respaldo (UI que MeSH 2026 ya no tiene) y NCIt cae a ncit-xref', () => {
  const real = [
    { cs: 'mesh', code: 'D000130', xrefs: [], properties: {} },
    { cs: 'ncit-xref', code: 'C3367', xrefs: [], properties: {} },
    {
      cs: 'mondo',
      code: 'MONDO:1',
      xrefs: [
        { cs: 'mesh', code: 'D000130' },
        { cs: 'mesh', code: 'D999999' },
        { cs: 'ncit-disease', code: 'C3367' },
        { cs: 'ncit-disease', code: 'C1' },
        { cs: 'efo-disease', code: 'EFO:0004270' },
      ],
      properties: {},
    },
  ];
  const notes = { 'efo-disease|EFO:0004270': { reason: 'obsoleta en EFO 3.95.0', replacedBy: ['MONDO:0005391'] } };
  const { keyRecords, unresolved } = resolveXrefs(real, {}, [], notes);
  const x = real[2].xrefs;
  assert.deepEqual(x.map((y) => [y.cs, y.resolution]), [['mesh', 'internal'], ['mesh', 'key'], ['ncit-xref', 'internal'], ['ncit-disease', 'unresolved'], ['efo-disease', 'unresolved']]);
  assert.deepEqual(keyRecords.map((k) => [k.cs, k.code]), [['mesh', 'D999999']]);
  assert.deepEqual(unresolved, { 'mondo→ncit-disease': 1, 'mondo→efo-disease': 1 });
  const efo = real[2].properties.disease_unresolved_xrefs.find((u) => u.cs === 'efo-disease');
  assert.deepEqual(efo.sourceSays, { reason: 'obsoleta en EFO 3.95.0', replacedBy: ['MONDO:0005391'] });
  assert.equal(iriToCurie('http://purl.obolibrary.org/obo/MONDO_0005391'), 'MONDO:0005391');
});

// --- NCIt (NCI EVS, archivo plano) ----------------------------------------------------

test('NCIt EVS: subárbol C2991 por los padres que declara NCI; retirados y fuera de C2991 sólo si alguien los cita', () => {
  const rows = parseNcitFlat(join(FX, 'ncit_evs_flat_26.09d.sample.txt'));
  const cuiMap = parseNcitCuiMap(join(FX, 'ncit_code_cui_map_202402.sample.dat'));
  const r = buildNcitFlat({ rows, cuiMap }, new Set(['C100067', 'C3367', 'C123']), meta, '26.09d');
  const by = new Map(r.records.map((x) => [x.code, x]));
  assert.deepEqual([...by.keys()].sort(), ['C2991', 'C3058', 'C3262', 'C36025', 'C7062', 'C9305']);
  assert.deepEqual(by.get('C3058').parents, ['C36025'], 'sólo los padres que están en el subárbol');
  assert.deepEqual(by.get('C2991').parents, []);
  assert.equal(by.get('C3058').display, 'Glioblastoma');
  assert.equal(by.get('C3058').designations[0].preferred, true);
  assert.deepEqual(by.get('C3058').xrefs.map((x) => [x.cs, x.code]), [['umls', 'C0017636']]);
  assert.deepEqual(by.get('C7062').properties.ncit_concept_status, ['Header_Concept']);
  const xr = new Map(r.xrefRecords.map((x) => [x.code, x]));
  assert.equal(xr.get('C100067').status, 'deprecated', 'Retired_Concept');
  assert.equal(xr.get('C3367').status, 'active');
  assert.equal(xr.get('C3367').cs, 'ncit-xref');
  assert.deepEqual(r.citedMissing, ['C123'], 'un código que NCIt no tiene no se inventa');
  assert.ok(!xr.has('C3058'));
});

// --- NANDO ---------------------------------------------------------------------------

test('NANDO: sólo clases; inglés en designaciones, japonés en propiedades; closeMatch a MONDO = inexacto; licencia del propio archivo', () => {
  const ttl = readFileSync(join(FX, 'nando.sample.ttl'), 'utf8');
  const { records, header, version } = buildNando(ttl, meta);
  assert.equal(header.license, 'https://creativecommons.org/licenses/by/4.0/');
  assert.equal(version, '1.0.0 (2023-11-27)');
  const by = new Map(records.map((r) => [r.code, r]));
  assert.ok(!by.has('NANDO:2201386'), 'sujeto con sólo rdfs:seeAlso: no es una clase');
  assert.equal(by.get('NANDO:0000002').status, 'deprecated');
  const sbma = by.get('NANDO:1200001');
  assert.equal(sbma.display, 'Spinal and bulbar muscular atrophy');
  assert.deepEqual(sbma.designations.map((d) => d.value), ['Spinal and bulbar muscular atrophy', 'Kennedy disease', 'SBMA']);
  assert.equal(sbma.definition, null, 'la descripción es japonesa: va en la propiedad, no como definición');
  assert.equal(sbma.properties.nando_ja.prefLabel, '球脊髄性筋萎縮症');
  assert.deepEqual(sbma.parents, ['NANDO:1100001']);
  assert.deepEqual(sbma.xrefs.map((x) => [x.cs, x.code, x.equivalence]), [['mondo', 'MONDO:0010735', 'inexact'], ['mondo', 'MONDO:0016113', 'inexact']]);
  assert.equal(parseTurtleBlocks(ttl).size >= 7, true);
});

// --- OncoTree ---------------------------------------------------------------------------

test('OncoTree: jerarquía por `parent`, NCI/UMLS publicados como alineamientos sin equivalencia', () => {
  const { records } = buildOncotree(json('oncotree_2025_10_03.sample.json'), meta, '2025-10-03');
  const by = new Map(records.map((r) => [r.code, r]));
  assert.deepEqual([...by.keys()], ['TISSUE', 'LUNG', 'NSCLC', 'LUAD']);
  assert.deepEqual(by.get('LUAD').parents, ['NSCLC']);
  assert.deepEqual(by.get('TISSUE').parents, []);
  assert.deepEqual(by.get('LUAD').xrefs.map((x) => [x.cs, x.code, x.equivalence]), [['ncit-disease', 'C3512', null], ['umls', 'C0152013', null]]);
  assert.equal(by.get('LUAD').properties.oncotree_main_type, 'Non-Small Cell Lung Cancer');
  assert.equal(normalizeCurie('ONCOTREE:GINET').cs, 'oncotree');
});

// --- GARD --------------------------------------------------------------------------------

test('GARD: lista oficial (CSV con comillas), fichas, castellano de la ficha y xrefs tipados sólo si no son ambiguos', () => {
  const csv = parseGardCsv(join(FX, 'gard_disease_list_2026-09.sample.csv'));
  assert.equal(csv.length, 4);
  const wagr = csv.find((r) => r.id === 'GARD:0005528');
  assert.equal(wagr.synonyms.length, 16);
  assert.ok(wagr.synonyms.includes('wagr (wilms tumor, aniridia, genitourinary anomalies and mental retardation) syndrome'), 'coma dentro de un sinónimo entrecomillado');
  const singles = new Map([['17890', json('gard_single_17890.json')], ['5528', json('gard_single_5528.json')]]);
  const { records, counts } = buildGard({ csv, trimmed: json('gard_diseases.trimmed.sample.json'), singles }, meta, '2026-09');
  assert.deepEqual(counts, { csv: 4, withFicha: 2 });
  const by = new Map(records.map((r) => [r.code, r]));
  const g = by.get('GARD:0017890');
  assert.equal(g.display, '14q32 duplication syndrome');
  assert.deepEqual(g.designations.filter((d) => d.lang === 'es').map((d) => d.value)[0], 'Síndrome de duplicación 14q32');
  assert.equal(g.properties.gard_spanish_source, 'ORPHA:488280');
  assert.deepEqual(g.xrefs.map((x) => `${x.cs}:${x.code}`), ['umls:C4225449', 'mondo:MONDO:0014707', 'omim:616604', 'orphanet:488280']);
  assert.ok(g.xrefs.every((x) => x.equivalence === null), 'GARD no declara equivalencia');
  const w = by.get('GARD:0005528');
  assert.ok(w.xrefs.some((x) => x.cs === 'mesh' && x.code === 'D017624'));
  assert.deepEqual(w.properties.gard_untyped_xrefs, ['C3718'], 'C3718 puede ser NCIt o un código de otro sistema: sin tipar');
  assert.deepEqual(w.properties.disease_external_xrefs.MEDGEN, ['MEDGEN:64512']);
  assert.deepEqual(w.properties.disease_external_xrefs.GeneReviews, ['NBK621298']);
  // SNOMED CT (4135001; 715215007) no se carga ni como referencia.
  assert.ok(!JSON.stringify(w).includes('715215007'));
  assert.equal(by.get('GARD:0027416').xrefs.length, 0, 'sin ficha pública: sólo nombre y sinónimos de la lista oficial');
});

test('GARD: el id se compara por número (Orphanet y DOID lo citan sin ceros) y C+6 dígitos queda sin tipar', () => {
  assert.equal(gardCode('5528'), 'GARD:0005528');
  assert.deepEqual(normalizeCurie('GARD:5528'), { cs: 'gard', code: 'GARD:0005528' });
  assert.deepEqual(normalizeCurie('GARD:0022702'), { cs: 'gard', code: 'GARD:0022702' });
  assert.deepEqual(normalizeCurie('NANDO:2200317'), { cs: 'nando', code: 'NANDO:2200317' });
  const g = gardXrefs({ Xref_IDs__c: '715215007; C538052; C0206115; D017624; HP:4000041; SNOMEDCT_US:733622000; NBK1360' });
  assert.deepEqual(g.untyped, ['C538052']);
  assert.deepEqual(g.xrefs.map((x) => x.cs), ['umls', 'mesh']);
  assert.deepEqual(g.external, { HP: ['HP:4000041'], GeneReviews: ['NBK1360'] });
});

// --- CIE-11 oficial: castellano y tablas 2026-01 ------------------------------------------------

test('CIE-11: la tabulación en castellano se ubica por encabezado (TitleEN + Title) y calza fila por fila con el inglés', () => {
  const en = parseSimpleTabulation(join(FX, 'icd11_simpletab_2026-01.sample.txt'));
  const es = parseSimpleTabulation(join(FX, 'icd11_simpletab_es_2026-01.sample.txt'));
  assert.equal(es.rows.length, en.rows.length);
  const esBy = new Map(es.rows.map((r) => [r.linearizationUri, r]));
  for (const r of en.rows) {
    const e = esBy.get(r.linearizationUri);
    assert.equal(e.titleEn, r.title, 'TitleEN del archivo en castellano = título del archivo en inglés');
    assert.equal(e.code, r.code);
    assert.equal(e.parentUri, r.parentUri);
    assert.equal(e.classKind, r.classKind);
  }
  assert.equal(esBy.get('http://id.who.int/icd/release/11/mms/257068234').title, 'Cólera');
});

test('buildIcd11Mms: designación ES oficial de la OMS además de la EN; display sigue en inglés', () => {
  const r = buildIcd11Mms(
    {
      tabulation: join(FX, 'icd11_simpletab_2026-01.sample.txt'),
      tabulationEs: join(FX, 'icd11_simpletab_es_2026-01.sample.txt'),
      map11To10: join(FX, 'icd11_map_11To10_2026-01.sample.txt'),
    },
    meta,
  );
  assert.deepEqual(r.spanish, { rows: 11, missingInSpanishFile: 0, titleEnDiffersFromEnglishFile: 0 });
  const by = new Map(r.records.map((x) => [x.code, x]));
  const cholera = by.get('1A00');
  assert.equal(cholera.display, 'Cholera');
  assert.deepEqual(cholera.designations.map((d) => [d.lang, d.value, d.preferred]), [['en', 'Cholera', true], ['es', 'Cólera', true]]);
  assert.equal(by.get('chapter-01').designations.find((d) => d.lang === 'es').value, 'Algunas enfermedades infecciosas o parasitarias');
});

test('OMS 10→11 (2026-01): destinos poscoordinados textuales y códigos repartidos en varias categorías', () => {
  const one = icd10KeysFromWhoMap(join(FX, 'icd11_map_10To11_2026-01.sample.txt'));
  assert.equal(one.version, '2026-Jan-17');
  const by = new Map(one.keys.map((k) => [k.code, k]));
  assert.deepEqual(by.get('A00').targets, ['1A00']);
  assert.deepEqual(by.get('A00.0').targets, []);
  assert.deepEqual(by.get('A00.0').postcoordinated, ['1A00&XN8P1']);
  assert.equal(one.postcoordinated, 2, 'A00.0 y A01');
  assert.deepEqual(by.get('A01').postcoordinated, ['1A0Z&XN0QE']);
  const multi = icd10MultipleTargets(join(FX, 'icd11_map_10To11_multiple_2026-01.sample.txt'));
  assert.deepEqual(multi.get('A01'), ['1A07.Z', '1A08']);
  assert.ok(!multi.has('A00'), 'un solo destino: no es «varias categorías»');
});

// --- MedlinePlus (pares MeSH → tema en español) -----------------------------------------------

test('MedlinePlus: el tema en español hereda los descriptores MeSH de su tema inglés; el mapeo apunta al concepto del glosario', async () => {
  const pairs = medlineplusMeshPairs(join(FX, 'mplus_topics_2026-10-27.sample.xml'));
  assert.deepEqual(pairs.get('D000740'), [{ esId: '1743', esTitle: 'Anemia', enId: '139', enTitle: 'Anemia' }]);
  assert.equal(pairs.get('D000028')[0].esTitle, 'Aborto');
  const ds = await readDescriptors(join(FX, 'mesh_desc2026.sample.xml'));
  const { records } = buildMesh({ descriptors: ds, supplementals: [] }, new Set(), meta);
  assert.equal(attachMedlineplus(records, pairs), 0, 'ningún descriptor del extracto tiene tema: no se agrega nada');
  const fake = { cs: 'mesh', code: 'D000740', xrefs: [], properties: {}, parents: [], designations: [], status: 'active', display: 'Anemia', provenance: { version: '2026' } };
  assert.equal(attachMedlineplus([fake], pairs), 1);
  assert.equal(fake.xrefs[0].external, true);
  assert.deepEqual(fake.properties.medlineplus_es_topics, [{ id: '1743', title: 'Anemia', englishTopic: { id: '139', title: 'Anemia' } }]);
  resolveXrefs([fake]);
  assert.equal(fake.xrefs[0].resolution, 'external');
  const plan = planFor('mesh', '2026', [fake]);
  assert.equal(plan.externalMaps.length, 1);
  assert.equal(plan.externalMaps[0][2], md5uuid('mantra:glossary-es:concept:medlineplus-es-1743'));
  assert.equal(EXTERNAL_TARGETS['medlineplus-es']('1743'), plan.externalMaps[0][2]);
});
