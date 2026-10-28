// Pruebas del importador de genética contra EXTRACTOS REALES de los archivos
// descargados el 2026-10-28 (test/fixtures/, recortados con grep/head sobre los
// originales; ver fixtures/README.md). Sin red ni base.
//   node --test tools/terminology-import/genetics/test/*.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { splitFields, readDelimited, nullIf } from '../lib/delimited.mjs';
import { hgncRows, groupRows, readFamilies, readWithdrawn } from '../lib/hgnc.mjs';
import { ncbiGeneRows, splitDbXref } from '../lib/ncbi-gene.mjs';
import { medgenRows, OPEN_NAME_SABS } from '../lib/medgen.mjs';
import { soRows } from '../lib/so.mjs';
import { clinvarCategoryRows, clinvarFunctionalRows, clinvarTermRows, parseTermIdFile, templateLists, xsdEnumerations } from '../lib/clinvar-vocab.mjs';
import { readDiseaseNameCategories, readGeneConditions } from '../lib/clinvar-conditions.mjs';
import { clingenTermRows } from '../lib/clingen.mjs';
import { hgvsRows } from '../lib/hgvs.mjs';
import { vrsRows } from '../lib/vrs.mjs';
import { readWorkbook } from '../lib/xlsx.mjs';
import { readRrf } from '../lib/rrf.mjs';
import { readDeclaredVersion } from '../lib/versions.mjs';
import { designationList, cleanProps } from '../lib/rows.mjs';
import { CONCEPT, CODE_SYSTEMS, SYSTEM_ORDER, codeSystemPlan, conceptId, conceptTuple, designationTuples, mapTuples, propertyTuples, relationshipTuples, versionLabel } from '../lib/load-plan.mjs';
import { dbConfig } from '../lib/db.mjs';
import { splitByLines, PART_LIMIT } from '../pack-data.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const F = (name) => join(HERE, 'fixtures', name);
const PROV = { version: 'vTest', retrievedAt: '2026-10-28T00:00:00.000Z', sourceSha256: 'archivo=abc', license: 'LICENCIA DE PRUEBA', sourceUrl: 'https://example.test/archivo' };
const prop = (row, code) => row.properties.find((p) => p[0] === code)?.[2];

// --- lector delimitado --------------------------------------------------------

test('splitFields respeta comillas, comillas dobles escapadas y delimitadores dentro de comillas', () => {
  assert.deepEqual(splitFields('a\t"b\tc"\t"d""e"', '\t'), ['a', 'b\tc', 'd"e']);
  assert.deepEqual(splitFields('"3","FSCN","x, y"', ','), ['3', 'FSCN', 'x, y']);
  assert.deepEqual(splitFields("a\tb'c\td", '\t', null), ['a', "b'c", 'd']);
});

test('readDelimited une las líneas físicas de un campo entrecomillado y rechaza filas con otra cantidad de campos', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'gen-'));
  try {
    const ok = join(dir, 'ok.csv');
    writeFileSync(ok, '"a","b"\n"1","línea 1\nlínea 2"\n"2","x"\n');
    const rows = [];
    const r = await readDelimited(ok, (f) => rows.push(f), { delimiter: ',' });
    assert.equal(r.rows, 2);
    assert.equal(rows[0][1], 'línea 1\nlínea 2');
    const bad = join(dir, 'bad.tsv');
    writeFileSync(bad, 'a\tb\n1\t2\t3\n');
    await assert.rejects(readDelimited(bad, () => {}), /3 campos, el encabezado trae 2/);
    const open = join(dir, 'open.csv');
    writeFileSync(open, '"a"\n"sin cerrar\n');
    await assert.rejects(readDelimited(open, () => {}, { delimiter: ',' }), /comilla sin cerrar/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('nullIf trata «», «-» y «NULL» como vacío', () => {
  assert.equal(nullIf('-'), null);
  assert.equal(nullIf('NULL'), null);
  assert.equal(nullIf(''), null);
  assert.equal(nullIf('x'), 'x');
});

// --- HGNC -------------------------------------------------------------------------

test('HGNC: una fila por gen, verbatim, con grupos, cruce a NCBI Gene y procedencia', async () => {
  const { rows, header } = await hgncRows(F('hgnc_complete_set.sample.txt'), PROV);
  assert.equal(header.length, 53);
  assert.deepEqual(rows.map((r) => r.code), ['HGNC:5', 'HGNC:37133', 'HGNC:24086', 'HGNC:18149']);
  const a1bg = rows[0];
  assert.equal(a1bg.display, 'A1BG');
  assert.equal(prop(a1bg, 'approved_name'), 'alpha-1-B glycoprotein');
  assert.equal(prop(a1bg, 'cytogenetic_location'), '19q13.43');
  assert.equal(prop(a1bg, 'hgnc_status'), 'Approved');
  assert.deepEqual(a1bg.maps, [{ system: 'ncbi-gene-hs', code: '1', context: 'entrez_id declarado por HGNC HGNC:5 (hgnc_complete_set.txt)' }]);
  assert.ok(prop(a1bg, 'xrefs').includes('OMIM:138670'));
  assert.ok(prop(a1bg, 'xrefs').includes('ENSEMBL:ENSG00000121410'));
  assert.deepEqual(a1bg.relations, [{ type: 'part-of', system: 'hgnc-gene-group', code: '594' }]);
  assert.equal(a1bg.sourceRecordId, 'HGNC:5');
  assert.equal(a1bg.version, 'vTest');
  assert.equal(a1bg.license, 'LICENCIA DE PRUEBA');
  assert.equal(a1bg.definition, null);
  // alias y nombres previos de una fila con comillas y «|» (A1BG-AS1)
  const as1 = rows[1];
  assert.deepEqual(prop(as1, 'previous_symbols'), ['NCRNA00181', 'A1BGAS', 'A1BG-AS']);
  assert.equal(prop(as1, 'previous_names').length, 3);
  // designaciones: preferida = símbolo; sin repetir textos
  assert.equal(as1.designations[0].type, 'preferred');
  assert.equal(new Set(as1.designations.map((d) => d.value)).size, as1.designations.length);
});

test('HGNC: un gen en dos grupos conserva el orden y los nombres con coma', async () => {
  const { rows } = await hgncRows(F('hgnc_complete_set.sample.txt'), PROV);
  const a4 = rows.find((r) => r.code === 'HGNC:18149');
  assert.deepEqual(prop(a4, 'gene_groups'), [{ id: '442', name: 'Alpha 1,4-glycosyltransferases' }, { id: '454', name: 'Blood group antigens' }]);
  assert.equal(a4.relations.length, 2);
});

test('HGNC: grupos de genes con jerarquía (sólo padres que existen) y conteo de miembros', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'gen-'));
  try {
    for (const [from, to] of [['family.sample.csv', 'family.csv'], ['hierarchy.sample.csv', 'hierarchy.csv'], ['gene_has_family.sample.csv', 'gene_has_family.csv']]) copyFileSync(F(from), join(dir, to));
    const rows = groupRows(await readFamilies(dir), PROV);
    assert.equal(rows.length, 9);
    const g594 = rows.find((r) => r.code === '594');
    assert.equal(g594.display, 'Immunoglobulin like domain containing');
    assert.deepEqual(g594.parents, ['589']); // «589» → «594» está en hierarchy.csv
    assert.equal(rows.find((r) => r.code === '620').parents[0], '594');
    assert.equal(prop(g594, 'gene_count'), '1');
    assert.equal(prop(rows.find((r) => r.code === '454'), 'gene_count'), '1');
    // «NULL» de HGNC no es un valor
    assert.equal(prop(rows.find((r) => r.code === '4'), 'description_label'), undefined);
    assert.equal(rows.find((r) => r.code === '3').definition.lang, 'en');
    assert.match(rows.find((r) => r.code === '3').definition.text, /^Fascins are actin-binding proteins/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('HGNC: un archivo con otras columnas se rechaza (no se adivina)', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'gen-'));
  try {
    writeFileSync(join(dir, 'family.csv'), '"id","nombre"\n"1","x"\n');
    writeFileSync(join(dir, 'hierarchy.csv'), '"parent_fam_id","child_fam_id"\n');
    writeFileSync(join(dir, 'gene_has_family.csv'), '"hgnc_id","family_id"\n');
    await assert.rejects(readFamilies(dir), /columnas inesperadas/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- NCBI Gene ----------------------------------------------------------------------

test('NCBI Gene: GeneID como código, «-» como vacío, cruce a HGNC y tipos de gen conservados', async () => {
  const { rows } = await ncbiGeneRows(F('Homo_sapiens.gene_info.sample.gz'), PROV);
  assert.deepEqual(rows.map((r) => r.code), ['1', '2', '144568', '105180392', '11']);
  const a1bg = rows[0];
  assert.equal(a1bg.display, 'A1BG');
  assert.equal(prop(a1bg, 'type_of_gene'), 'protein-coding');
  assert.equal(prop(a1bg, 'map_location'), '19q13.43');
  assert.deepEqual(a1bg.maps, [{ system: 'hgnc', code: 'HGNC:5', context: 'dbXrefs declarado por NCBI Gene 1 (Homo_sapiens.gene_info)' }]);
  assert.equal(prop(a1bg, 'locus_tag'), undefined); // «-»
  assert.deepEqual(prop(a1bg, 'synonyms'), ['A1B', 'ABG', 'GAB', 'HYST2477']);
  assert.equal(a1bg.sourceUrl, 'https://www.ncbi.nlm.nih.gov/gene/1');
  const region = rows.find((r) => r.code === '105180392');
  assert.equal(prop(region, 'type_of_gene'), 'biological-region');
  assert.deepEqual(region.maps, []);
  assert.equal(rows.find((r) => r.code === '11').display, 'NATP');
});

test('NCBI Gene: dbXrefs «HGNC:HGNC:5» se parte en base y id', () => {
  assert.deepEqual(splitDbXref('HGNC:HGNC:5'), { db: 'HGNC', id: 'HGNC:5' });
  assert.deepEqual(splitDbXref('MIM:138670'), { db: 'MIM', id: '138670' });
});

test('NCBI Gene: rechaza un gene_info con columnas distintas', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'gen-'));
  try {
    const p = join(dir, 'gene_info.txt');
    writeFileSync(p, '#tax_id\tGeneID\n9606\t1\n');
    await assert.rejects(ncbiGeneRows(p, PROV), /columnas inesperadas/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('gene_condition_source_id: enlaces gen ↔ CUI sin el nombre de la condición', async () => {
  const { byGene, rows } = await readGeneConditions(F('gene_condition_source_id.sample'));
  assert.equal(rows, 5);
  assert.equal(byGene.get('144568')[0].concept, 'C1833692');
  assert.equal(byGene.get('144568')[0].source, 'MONDO');
  assert.equal(byGene.get('53947')[0].source_id, null);
  assert.equal(byGene.get('79719').length, 2);
  assert.ok(!JSON.stringify([...byGene.values()]).includes('Otitis media'), 'DiseaseName no se guarda');
  const { rows: genes } = await ncbiGeneRows(F('Homo_sapiens.gene_info.sample.gz'), PROV, byGene);
  assert.equal(prop(genes.find((r) => r.code === '144568'), 'medgen_condition_links')[0].concept, 'C1833692');
  assert.equal(prop(genes.find((r) => r.code === '1'), 'medgen_condition_links'), undefined);
});

// --- MedGen -------------------------------------------------------------------------

async function medgenFixture() {
  const dn = await readDiseaseNameCategories(F('disease_names.sample'));
  return medgenRows(
    { mgconso: F('MGCONSO.sample.RRF.gz'), mgsty: F('MGSTY.sample.RRF.gz'), mgdef: F('MGDEF.sample.RRF.gz'), idmappings: F('MedGenIDMappings.sample.txt.gz'), mgrel: F('MGREL.sample.RRF.gz'), merged: F('MERGED.sample.RRF.gz'), cuiHistory: F('MedGen_CUI_history.sample.txt'), clinvarHistory: F('ConceptID_history.sample.txt'), clinvarCategories: dn.byConcept },
    PROV,
  );
}

test('MedGen: sólo CUI con nombre de fuente abierta; los de SNOMED/OMIM solos se descartan y se cuentan', async () => {
  const { rows, dropped, stats } = await medgenFixture();
  assert.deepEqual(dropped, ['C0000848', 'C0005687', 'C0007645']); // SNOMED-only, OMIM+SNOMED, OMIM-only
  assert.equal(rows.length, 13);
  assert.equal(stats.cuis, 16);
  assert.equal(stats.cuisWithoutOpenName, 3);
  assert.ok(!OPEN_NAME_SABS.includes('HPO'), 'HPO no está entre las fuentes de nombres (decisión pendiente del propietario)');
  assert.ok(!OPEN_NAME_SABS.includes('SNOMEDCT_US') && !OPEN_NAME_SABS.includes('OMIM'));
});

test('MedGen: ningún texto sale de SNOMED CT, OMIM, GeneReviews ni HPO', async () => {
  const { rows } = await medgenFixture();
  const raw = readFileSync(F('MGCONSO.sample.RRF.gz'));
  assert.ok(raw.length > 0);
  const acute = rows.find((r) => r.code === 'C0000727'); // GTR + HPO + SNOMED en el archivo
  const sources = prop(acute, 'designation_sources').flatMap((d) => d.sources.map((s) => s.split(':')[0]));
  for (const s of sources) assert.ok(['GTR', 'MONDO', 'NCI', 'ORDO', 'MSH'].includes(s), `fuente no abierta en designaciones: ${s}`);
  for (const r of rows) for (const d of prop(r, 'source_definitions') ?? []) assert.ok(['NCI', 'MONDO', 'ORDO', 'ORPHANET', 'MSH', 'MedlinePlus Genetics', 'MEDLINEPLUS'].includes(d.source), `definición de ${d.source}`);
  // los ids de SNOMED CT no entran como xref
  for (const r of rows) assert.ok(!prop(r, 'xrefs')?.some((x) => /SNOMED/.test(x)), `xref SNOMED en ${r.code}`);
});

test('MedGen: nombre a mostrar = pref_name si coincide con un átomo abierto; la regla queda registrada', async () => {
  const { rows } = await medgenFixture();
  const abd = rows.find((r) => r.code === 'C0000735');
  assert.equal(abd.display, 'Abdominal Neoplasms');
  assert.equal(prop(abd, 'medgen_preferred_name'), 'Neoplasm of abdomen'); // el de MedGen viene de SNOMED: no es átomo abierto
  assert.equal(prop(abd, 'display_rule'), 'prioridad de fuente abierta');
  assert.equal(prop(rows.find((r) => r.code === 'C0000727'), 'display_rule'), 'pref_name coincide con un átomo abierto');
  assert.equal(prop(abd, 'medgen_uid'), '1676');
  assert.ok(abd.maps.some((m) => m.system === 'mesh' && m.code === 'D000008'));
});

test('MedGen: jerarquía de MGREL — CHD = CUI2 es hijo de CUI1; sólo NCI isa se vuelve is-a; PAR es espejo', async () => {
  const { rows, stats } = await medgenFixture();
  const cramp = rows.find((r) => r.code === 'C0344375');
  assert.deepEqual(cramp.parents, ['C0000729']);
  assert.deepEqual(prop(cramp, 'source_hierarchy_parents'), [{ parent: 'C0000729', sab: 'NCI', rela: 'isa' }]);
  const peri = rows.find((r) => r.code === 'C0031149');
  assert.deepEqual(peri.parents, []); // MeSH: jerarquía de la fuente, no afirma is-a
  assert.deepEqual(prop(peri, 'source_hierarchy_parents'), [{ parent: 'C0000735', sab: 'MSH', rela: null }]);
  // C0002959: NCI `isa` con CUI1 = CUI2 (dos códigos de NCI en un mismo CUI). No es una arista is-a hacia sí mismo.
  const self = rows.find((r) => r.code === 'C0002959');
  assert.deepEqual(self.parents, []);
  assert.deepEqual(prop(self, 'source_hierarchy_parents'), [{ parent: 'C0002959', sab: 'NCI', rela: 'isa' }]);
  assert.ok(rows.every((r) => !r.parents.includes(r.code)), 'ningún concepto es su propio padre');
  assert.deepEqual(stats.rel.parNoMirror, {});
  assert.equal(stats.rel.kept['NCI CHD'], 2);
  assert.ok(stats.rel.skippedSabs.OMIM > 0 && stats.rel.skippedSabs.HPO > 0, 'OMIM y HPO se saltean y se cuentan');
});

test('MedGen: CUI retirados (MERGED.RRF, MedGen_CUI_history y ConceptID_history de ClinVar) quedan en el CUI vigente, sin crear conceptos', async () => {
  const { rows, stats } = await medgenFixture();
  assert.deepEqual(stats.retired, { merged: 7, history: 2, clinvarHistory: 13, clinvarNoLongerReported: 1 });
  const myelo = rows.find((r) => r.code === 'C0001815');
  const ret = prop(myelo, 'retired_cuis');
  assert.deepEqual(ret.filter((x) => x.kind === 'MERGED.RRF').map((x) => x.cui), ['CN077340', 'CN970969', 'CN971959']);
  assert.ok(ret.filter((x) => x.kind === 'MERGED.RRF').every((x) => x.date === null));
  assert.deepEqual(ret.filter((x) => x.kind === 'ConceptID_history.txt (ClinVar)').map((x) => x.cui + ' ' + x.date), ['CN034362 16 Oct 2012', 'CN167700 18 Mar 2018']);
  assert.ok(!rows.some((r) => r.code === 'CN077340' || r.code === 'CN043601'), 'un CUI retirado no es un concepto');
  // el mismo retiro registrado en varias fechas se conserva con cada fecha (CN117757 → C0001202 tres veces)
  const acro = prop(rows.find((r) => r.code === 'C0001202'), 'retired_cuis').filter((x) => x.cui === 'CN117757');
  assert.deepEqual(acro.map((x) => x.date), ['02 Apr 2017', '27 Aug 2014', '28 Aug 2014']);
  // «No longer reported» no tiene reemplazo: no se asigna a nadie
  assert.ok(!rows.some((r) => (prop(r, 'retired_cuis') ?? []).some((x) => x.cui === 'CN043601')));
  const hist = rows.flatMap((r) => (prop(r, 'retired_cuis') ?? []).filter((x) => x.kind === 'MedGen_CUI_history.txt'));
  assert.ok(hist.length >= 1 && hist.every((x) => /^\d{2} \w{3} \d{4}$/.test(x.date)));
});

test('HGNC: withdrawn.txt — los fusionados en un gen aprobado van en retired_ids; los demás se cuentan', async () => {
  const { byTarget, stats } = await readWithdrawn(F('withdrawn.sample.txt'));
  assert.deepEqual(stats, { rows: 4, byStatus: { 'Merged/Split': 3, 'Entry Withdrawn': 1 }, mergedIntoApproved: 3, mergedIntoNotApproved: 1 });
  assert.deepEqual(byTarget.get('HGNC:12469'), [{ hgnc_id: 'HGNC:6', withdrawn_symbol: 'A1S9T', status: 'Merged/Split', target_symbol: 'UBA1' }]);
  assert.equal(byTarget.get('HGNC:4206')[0].hgnc_id, 'HGNC:1531');
  assert.equal(byTarget.get('HGNC:9936')[0].hgnc_id, 'HGNC:1531');
  assert.ok(!byTarget.has('HGNC:12797'), 'destino retirado: no se asigna');
  const { rows } = await hgncRows(F('hgnc_complete_set.sample.txt'), PROV, new Map([['HGNC:5', [{ hgnc_id: 'HGNC:x', withdrawn_symbol: 'X', status: 'Merged/Split', target_symbol: 'A1BG' }]]]));
  assert.equal(prop(rows[0], 'retired_ids')[0].withdrawn_symbol, 'X');
  assert.equal(prop(rows[1], 'retired_ids'), undefined);
});

test('MedGen: categoría de ClinVar por CUI exacto; separadores \\r de MGDEF pasan a salto de línea', async () => {
  const { rows } = await medgenFixture();
  assert.deepEqual(prop(rows.find((r) => r.code === 'C0002395') ?? {}, 'clinvar_condition_categories') ?? null, null); // no está en disease_names.sample
  assert.equal(prop(rows.find((r) => r.code === 'C0000744'), 'clinvar_condition_categories'), undefined);
  for (const r of rows) for (const d of prop(r, 'source_definitions') ?? []) assert.ok(!d.text.includes('\r'), `\\r en definición de ${r.code}`);
});

test('RRF: no corta registros en \\r sueltos y rechaza un registro con campos de más', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'gen-'));
  try {
    const p = join(dir, 'x.RRF');
    writeFileSync(p, '#CUI|DEF|source|SUPPRESS|\nC1|línea 1\rlínea 2|NCI|N|\n');
    const got = [];
    const r = await readRrf(p, (o) => got.push(o));
    assert.equal(r.rows, 1);
    assert.equal(got[0].DEF, 'línea 1\rlínea 2');
    const bad = join(dir, 'bad.RRF');
    writeFileSync(bad, '#A|B|\n1|2|3|\n');
    await assert.rejects(readRrf(bad, () => {}), /3 campos, el encabezado trae 2/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- Sequence Ontology ------------------------------------------------------------

test('SO: las obsoletas no son filas; padres sólo si existen; definición y sinónimos verbatim', async () => {
  const { rows, stats } = await soRows(F('so.sample.obo'), PROV);
  assert.deepEqual(rows.map((r) => r.code), ['SO:0000001', 'SO:0001059', 'SO:0001060', 'SO:0001410', 'SO:0001483']);
  assert.deepEqual(stats, { terms: 6, obsolete: 1, rows: 5, dataVersion: '2026-08-07' });
  const snv = rows.find((r) => r.code === 'SO:0001483');
  assert.equal(snv.display, 'SNV');
  assert.equal(snv.definition.lang, 'en');
  assert.match(snv.definition.text, /^SNVs are single nucleotide positions/);
  assert.equal(rows.find((r) => r.code === 'SO:0001410').parents[0], 'SO:0000001');
  assert.equal(snv.sourceUrl, 'http://purl.obolibrary.org/obo/SO_0001483');
});

// --- ClinVar -----------------------------------------------------------------------

test('xlsx: la plantilla oficial trae la hoja oculta controlled_list', () => {
  const sheets = readWorkbook(F('SubmissionTemplate.xlsx'));
  const cl = sheets.find((s) => s.name === 'controlled_list');
  assert.ok(cl, 'falta controlled_list');
  assert.equal(cl.state, 'hidden');
  assert.equal(cl.rows.get(1).get(1), '##sheetname');
});

test('ClinVar: listas controladas de la plantilla y enumeraciones del XSD; códigos = <lista>:<valor> verbatim, sin repetidos', () => {
  const lists = templateLists(F('SubmissionTemplate.xlsx'));
  assert.equal(lists.length, 26);
  const submitter = lists.find((l) => l.field === 'SubmitterIDType');
  assert.deepEqual(submitter.values, ['Handle', 'PersonID']);
  const TEMPLATES = [['SubmissionTemplate', 'SubmissionTemplate.xlsx'], ['SubmissionTemplateLite', 'SubmissionTemplateLite.xlsx'], ['SubmissionTemplateSomatic', 'SubmissionTemplateSomatic.xlsx']].map(([name, f]) => ({ name, path: F(f), prov: { ...PROV, sourceSha256: `${f}=hash`, version: `v-${name}` } }));
  const rows = clinvarTermRows({ templates: TEMPLATES, xsdPath: F('ClinVar_VCV.sample.xsd') }, PROV);
  assert.ok(rows.some((r) => r.code === 'template:SubmissionInfo:SubmitterIDType:Handle'));
  assert.ok(rows.some((r) => r.code === 'xsd:typeSeverity:severe'));
  assert.equal(new Set(rows.map((r) => r.code)).size, rows.length);
  assert.ok(rows.every((r) => r.definition === null), 'ClinVar no publica definición de estos valores: no se redacta');
  // la lista horizontal de la plantilla Lite
  const lite = rows.find((r) => r.code === 'template:clinsig terms:Likely pathogenic, low penetrance');
  assert.ok(lite, 'falta la lista «clinsig terms» de SubmissionTemplateLite');
  assert.deepEqual(prop(lite, 'templates').map((t) => t.template), ['SubmissionTemplateLite']);
  // un valor que está en varias plantillas es UN concepto con todas sus procedencias
  const shared = rows.filter((r) => new Set(prop(r, 'templates')?.map((t) => t.template)).size >= 2);
  assert.ok(shared.length > 0, 'se esperaban valores compartidos entre plantillas');
  const s0 = shared[0];
  const names = [...new Set(prop(s0, 'templates').map((t) => t.template))];
  assert.ok(names.every((n) => s0.sourceSha256.includes(`${n}.xlsx=hash`)), 'el SHA-256 de entrada lista todos los archivos que lo traen');
  assert.ok(names.every((n) => s0.version.includes(`v-${n}`)));
  assert.equal(new Set(rows.map((r) => r.code)).size, rows.length);
});

test('ClinVar: Lite es el único formato horizontal; las plantillas completas validan su encabezado', () => {
  const lite = templateLists(F('SubmissionTemplateLite.xlsx'));
  assert.equal(lite.length, 1);
  assert.equal(lite[0].field, 'clinsig terms');
  assert.equal(lite[0].values.length, 20);
  assert.equal(lite[0].values[0], 'Pathogenic');
  assert.equal(templateLists(F('SubmissionTemplateSomatic.xlsx')).length, 25);
});

test('XSD: sólo tipos simples con nombre y enumeración, con entidades XML decodificadas', () => {
  const xml = '<xs:simpleType name="t1"><xs:restriction><xs:enumeration value="a &amp; b"/><xs:enumeration value="c"/></xs:restriction></xs:simpleType><xs:simpleType name="t2"><xs:restriction base="xs:string"/></xs:simpleType>';
  assert.deepEqual(xsdEnumerations(xml), [{ name: 't1', values: ['a & b', 'c'] }]);
});

test('ClinVar funcional: sólo términos de Sequence Ontology; FENICS se cuenta y no se carga; cruce a SO por el ID que publica ClinVar', () => {
  const { rows, stats } = clinvarFunctionalRows({ consequencesPath: F('functional_consequences.sample.txt'), assaysPath: F('functional_assay_types.sample.txt') }, PROV, PROV);
  assert.deepEqual(stats, { consequences: 6, consequencesLoaded: 4, consequencesNotLoaded: { 'Functional Epilepsy Nomenclature for Ion Channels': 2 }, assays: 20 });
  assert.equal(rows.length, 24);
  const abolished = rows.find((r) => r.code === 'SO:0002391');
  assert.equal(abolished.display, 'abolished transcription');
  assert.deepEqual(abolished.maps, [{ system: 'sequence-ontology', code: 'SO:0002391', context: 'ID declarado por ClinVar (functional_consequences.txt, fuente «Sequence Ontology»)' }]);
  assert.ok(rows.some((r) => r.code === 'OBI_0000916' && r.display === 'flow cytometry assay'));
  assert.ok(!rows.some((r) => r.code.startsWith('FENICS')));
});

test('parseTermIdFile rechaza un encabezado o una fila con otra cantidad de columnas', () => {
  assert.throws(() => parseTermIdFile('Term\tID\n', { withSource: true }), /encabezado inesperado/);
  assert.throws(() => parseTermIdFile('Term\tID\tSource\nx\ty\n', { withSource: true }), /fila con 2 campos/);
});

test('ClinVar: categorías de condición de disease_names como lista, con el conteo del archivo', async () => {
  const dn = await readDiseaseNameCategories(F('disease_names.sample'));
  assert.equal(dn.rows, 6);
  const rows = clinvarCategoryRows(dn.categories, PROV);
  assert.deepEqual(rows.map((r) => r.code), ['disease_names:Category:Disease', 'disease_names:Category:Finding', 'disease_names:Category:Named protein variant', 'disease_names:Category:Pharmacological response', 'disease_names:Category:phenotype instruction']);
  assert.equal(prop(rows[0], 'occurrences_in_file'), '2');
});

// --- ClinGen, HGVS, VRS ----------------------------------------------------------------

test('ClinGen: valores controlados distintos de cada columna; no se cargan las afirmaciones por gen', async () => {
  const { rows, stats } = await clingenTermRows({ validityPath: F('gene-validity.sample.csv'), dosagePath: F('gene-dosage.sample.csv') }, PROV, PROV);
  assert.equal(stats.validityAssertions, 10);
  assert.equal(stats.dosageAssertions, 11);
  const cls = rows.filter((r) => prop(r, 'list_name') === 'validity-classification').map((r) => r.display);
  assert.deepEqual(cls, ['Definitive', 'Limited', 'Moderate']);
  assert.ok(rows.every((r) => r.definition === null && r.maps.length === 0));
  assert.ok(!rows.some((r) => /^[A-Z0-9-]+$/.test(r.display) && r.display.startsWith('HGNC')), 'ningún gen entra como término');
  assert.ok(rows.some((r) => r.code === 'validity-moi:AR'));
  const hi = rows.find((r) => r.code === 'dosage-haploinsufficiency:Sufficient Evidence for Haploinsufficiency');
  assert.equal(prop(hi, 'occurrences_in_file'), '2');
});

test('ClinGen: accionabilidad — valores de consensusAssertion y curationType de adultos y pediatría; las afirmaciones por gen no entran', async () => {
  const actionabilityPaths = [F('actionability-adult.sample.tsv'), F('actionability-pediatric.sample.tsv')];
  const { rows, stats } = await clingenTermRows({ validityPath: F('gene-validity.sample.csv'), dosagePath: F('gene-dosage.sample.csv'), actionabilityPaths }, PROV, PROV, [PROV, { ...PROV, sourceSha256: 'otro=def' }]);
  assert.equal(stats.actionabilityAssertions, 7);
  const a = rows.filter((r) => prop(r, 'list_name') === 'actionability-consensus-assertion').map((r) => r.display);
  assert.deepEqual(a, ['Assertion Pending', 'Definitive Actionability', 'N/A - Insufficient evidence: early rule-out', 'Strong Actionability']);
  assert.equal(prop(rows.find((r) => r.code === 'actionability-consensus-assertion:Strong Actionability'), 'occurrences_in_file'), '4');
  assert.deepEqual(rows.filter((r) => prop(r, 'list_name') === 'actionability-curation-type').map((r) => r.display), ['Gene-Condition', 'Variant-Condition']);
  const r0 = rows.find((r) => r.code === 'actionability-curation-type:Gene-Condition');
  assert.equal(r0.sourceSha256, 'archivo=abc otro=def', 'la fila lista el SHA-256 de los dos archivos que la alimentan');
  assert.ok(!rows.some((r) => /^AC\d+$/.test(r.display)), 'ningún docId de curación entra como término');
});

test('ClinGen: un CSV con columnas distintas se rechaza', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'gen-'));
  try {
    const p = join(dir, 'v.csv');
    writeFileSync(p, '"CLINGEN"\n"GENE SYMBOL","OTRA"\n"A","B"\n');
    await assert.rejects(clingenTermRows({ validityPath: p, dosagePath: F('gene-dosage.sample.csv') }, PROV, PROV), /columnas inesperadas/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('HGVS: elementos globales y tipos de variante por sección con sus formas verbatim', () => {
  const { rows } = hgvsRows(F('syntax.sample.yaml'), PROV);
  assert.equal(rows.length, 43);
  const el = rows.find((r) => r.code === 'element:position_edit');
  assert.match(el.definition.text, /^A string that concatenates a position and edit/);
  const del = rows.find((r) => r.code === 'aa:del');
  assert.equal(del.display, 'aa del');
  assert.equal(prop(del, 'syntax_section'), 'aa');
  const forms = prop(del, 'forms');
  assert.equal(forms[0].name, 'Single position');
  assert.equal(forms[0].examples[0], 'NP_003997.2:p.Val7del');
  assert.ok(rows.some((r) => r.code === 'dna:delins') && rows.some((r) => r.code === 'rna:sub'));
  assert.equal(new Set(rows.map((r) => r.code)).size, rows.length);
});

test('VRS: clases del esquema con herencia y madurez, y valores de enumeración', () => {
  const { rows, version } = vrsRows(F('vrs-source.sample.yaml'), PROV);
  assert.match(version, /\/vrs\/2\.0\.1\/vrs-source\.yaml$/);
  const allele = rows.find((r) => r.code === 'Allele');
  assert.equal(prop(allele, 'inherits'), 'MolecularVariation');
  assert.deepEqual(allele.parents, ['MolecularVariation']);
  assert.equal(prop(allele, 'maturity'), 'trial use');
  assert.equal(allele.definition.text, 'The state of a molecule at a :ref:`Location`.');
  assert.ok(rows.some((r) => r.code === 'Expression.properties.syntax:hgvs.c'));
  assert.ok(rows.some((r) => r.code === 'CopyNumberChange.properties.copyChange:high-level gain'));
  assert.equal(new Set(rows.map((r) => r.code)).size, rows.length);
  // una clase que hereda de otro esquema (gks-core:Entity) no se inventa como padre
  assert.deepEqual(rows.find((r) => r.code === 'SequenceReference').parents, []);
});

// --- versiones declaradas -----------------------------------------------------------------

test('versiones: cada archivo declara la suya (OBO, XSD, ClinGen, VRS); si no, Last-Modified', () => {
  assert.equal(readDeclaredVersion({ versionFrom: 'obo-data-version' }, F('so.sample.obo')).version, '2026-08-07');
  assert.equal(readDeclaredVersion({ versionFrom: 'xsd-version' }, F('ClinVar_VCV.sample.xsd')).version, '2.6; February 26, 2026');
  assert.equal(readDeclaredVersion({ versionFrom: 'clingen-file-created' }, F('gene-validity.sample.csv')).version, '2026-10-28');
  assert.equal(readDeclaredVersion({ versionFrom: 'yaml-id' }, F('vrs-source.sample.yaml')).version, '2.0.1');
  const lm = readDeclaredVersion({ versionFrom: 'last-modified' }, F('so.sample.obo'), 'Tue, 27 Oct 2026 14:21:23 GMT');
  assert.equal(lm.version, '2026-10-27');
  assert.match(lm.kind, /Last-Modified/);
  assert.equal(readDeclaredVersion({ versionFrom: 'last-modified' }, F('so.sample.obo'), null).version, null);
});

// --- plan de carga --------------------------------------------------------------------------

test('plan de carga: ids deterministas, procedencia por fila y una propiedad por código', async () => {
  const { rows } = await hgncRows(F('hgnc_complete_set.sample.txt'), PROV);
  const a1bg = rows[0];
  assert.equal(conceptId('hgnc', 'HGNC:5'), conceptId('hgnc', 'HGNC:5'));
  assert.notEqual(conceptId('hgnc', 'HGNC:5'), conceptId('ncbi-gene-hs', 'HGNC:5'));
  const props = propertyTuples(a1bg);
  const codes = props.map((p) => p[2]);
  assert.equal(new Set(codes).size, codes.length);
  for (const required of ['code_system', 'source', 'source_record_id', 'source_url', 'source_version', 'source_retrieved_at', 'source_input_sha256', 'source_license']) assert.ok(codes.includes(required), `falta ${required}`);
  assert.deepEqual(JSON.parse(props.find((p) => p[2] === 'source_license')[4]), 'LICENCIA DE PRUEBA');
  assert.deepEqual(propertyTuples(a1bg), props, 'mismo resultado en una segunda llamada');
  const c = conceptTuple(a1bg, 'v-id');
  assert.deepEqual(c.slice(1), ['v-id', 'HGNC:5', 'A1BG', null, CONCEPT.TERM_ACTIVE]); // definition de catalog_concepts queda nula
  const d = designationTuples(a1bg);
  assert.equal(d.filter((x) => x[5]).length, 1);
  assert.equal(new Set(d.map((x) => x[0])).size, d.length);
});

test('plan de carga: la definición de la fuente va a source_definition con su idioma', async () => {
  const { rows } = await soRows(F('so.sample.obo'), PROV);
  const p = propertyTuples(rows.find((r) => r.code === 'SO:0001483'));
  const def = JSON.parse(p.find((x) => x[2] === 'source_definition')[4]);
  assert.equal(def.lang, 'en');
  assert.ok(def.refs.length > 0);
});

test('plan de carga: relaciones sólo hacia códigos que existen; part-of y is-a con su tipo interno', async () => {
  const { rows: so } = await soRows(F('so.sample.obo'), PROV);
  const codes = { 'sequence-ontology': new Set(so.map((r) => r.code)), 'hgnc-gene-group': new Set(['594']) };
  const rels = so.flatMap((r) => relationshipTuples(r, (cs) => codes[cs]));
  assert.equal(rels.length, 1);
  assert.equal(rels[0][3], CONCEPT.REL_IS_A);
  const { rows: hg } = await hgncRows(F('hgnc_complete_set.sample.txt'), PROV);
  const partOf = hg.flatMap((r) => relationshipTuples(r, (cs) => codes[cs]));
  assert.equal(partOf.length, 1); // sólo el grupo 594 «existe»
  assert.equal(partOf[0][3], CONCEPT.REL_PART_OF);
  assert.equal(partOf[0][2], conceptId('hgnc-gene-group', '594'));
  assert.throws(() => relationshipTuples({ codeSystem: 'x', code: 'c', parents: [], relations: [{ type: 'inventada', system: 'sequence-ontology', code: 'SO:1' }] }, () => new Set(['SO:1'])), /tipo de relación sin concepto interno/);
});

test('plan de carga: cruces sólo si el destino existe; equivalencia nula; id estable', async () => {
  const { rows } = await hgncRows(F('hgnc_complete_set.sample.txt'), PROV);
  const none = rows.flatMap((r) => mapTuples(r, () => []));
  assert.equal(none.length, 0);
  const found = rows[0].maps.length ? mapTuples(rows[0], (system, code) => (system === 'ncbi-gene-hs' && code === '1' ? ['uuid-destino'] : [])) : [];
  assert.equal(found.length, 1);
  assert.equal(found[0][2], 'uuid-destino');
  assert.equal(found[0][3], null);
  assert.equal(found[0][5], 'vTest');
  assert.deepEqual(mapTuples(rows[0], () => ['uuid-destino']), found);
});

test('plan de carga: code systems, orden y etiqueta de versión', () => {
  assert.deepEqual([...SYSTEM_ORDER].sort(), Object.keys(CODE_SYSTEMS).sort());
  assert.equal(versionLabel(['b', 'a', 'a']), 'a + b');
  assert.equal(versionLabel(['b + a', 'c + a', 'a']), 'a + b + c', 'una lista ya compuesta se parte y se deduplica');
  assert.throws(() => versionLabel([]), /no declara versión/);
  const p = codeSystemPlan('sequence-ontology', { version: '2026-08-07', license: 'CC BY 4.0', checksum: 'abc' });
  assert.equal(p.codeSystem.canonicalUrl, 'http://purl.obolibrary.org/obo/so.owl', 'misma URL canónica que dictionaries/ → un solo code system');
  assert.equal(codeSystemPlan('hgnc', { version: 'v', license: 'l', checksum: 'c' }).codeSystem.canonicalUrl, 'http://www.genenames.org/geneId');
  assert.equal(codeSystemPlan('medgen', { version: 'v', license: 'l', checksum: 'c' }).codeSystem.canonicalUrl, 'https://mantracore.health/fhir/CodeSystem/medgen');
  assert.equal(p.source.code, 'SEQUENCE_ONTOLOGY');
  assert.throws(() => codeSystemPlan('inexistente', { version: '1', license: 'x', checksum: 'x' }), /sin definición de carga/);
});

test('--apply exige conexión explícita (sin valores por defecto hacia la base del stack)', () => {
  assert.throws(() => dbConfig({}), /Falta DB_HOST, DB_PORT, DB_USER, DB_NAME/);
  assert.throws(() => dbConfig({ DB_HOST: 'h', DB_PORT: '1', DB_USER: 'u' }), /Falta DB_NAME/);
  assert.deepEqual(dbConfig({ DB_HOST: 'h', DB_PORT: '55442', DB_USER: 'u', DB_NAME: 'n' }), { host: 'h', port: 55442, user: 'u', password: undefined, database: 'n' });
});

// --- helpers -------------------------------------------------------------------------------

test('designationList no repite el mismo texto y cleanProps descarta vacíos', () => {
  assert.deepEqual(designationList('A', ['A', 'B', 'B', '', null]), [{ value: 'A', lang: 'en', type: 'preferred' }, { value: 'B', lang: 'en', type: 'synonym' }]);
  assert.deepEqual(cleanProps([['a', 'string', ''], ['b', 'json', []], ['c', 'string', 'x'], ['d', 'string', null]]), [['c', 'string', 'x']]);
});

test('pack-data: splitByLines parte por líneas sin cortar filas y rechaza una fila que no entra', () => {
  const text = Array.from({ length: 50 }, (_, i) => JSON.stringify({ i, pad: randomBytes(24).toString('hex') })).join('\n') + '\n';
  const whole = splitByLines(text, PART_LIMIT);
  assert.equal(whole.length, 1);
  const parts = splitByLines(text, 700);
  assert.ok(parts.length > 1);
  assert.equal(parts.reduce((n, p) => n + p.lines.length, 0), 50);
  assert.ok(parts.every((p) => p.gz.length <= 700));
  assert.throws(() => splitByLines(JSON.stringify({ pad: randomBytes(2500).toString('hex') }) + '\n', 100), /Una sola fila comprimida supera/);
});
