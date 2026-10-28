// Pruebas de la tanda 2 del catálogo de alergias con extractos REALES de cada fuente
// (fixtures-open/: recortes de los archivos descargados el 2026-10-27).
// Correr: node --test tools/terminology-import/allergies/test/

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { conceptIdOf, makeRecord } from '../lib/catalog.mjs';
import { buildPlan, codeSystemPlans, patchPlan } from '../lib/load-plan.mjs';
import { runOpenPasses } from '../lib/open-runner.mjs';
import {
  meshDescriptors,
  parseChebiObo,
  parseCsv,
  parseCvx,
  parseCvxTradenames,
  parseEuAdditives1333,
  parseEuAnnex1169,
  parseGsrs,
  parseIuis,
  parseJatsTable,
  parseMajorFoodAllergens,
  parseNcitConcept,
  parseSplIngredients,
  parseUniprotTsv,
  uniprotMainName,
} from '../lib/parse-open.mjs';
import * as P from '../lib/passes-open.mjs';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures-open');
const read = (name) => readFileSync(join(FIX, name), 'utf8');
const readJson = (name) => JSON.parse(read(name));

/** Contexto mínimo (mismos lectores que `runOpenPasses`) sobre los fixtures. */
function fixtureCtx(files, { base = [], sources = {} } = {}) {
  const baseMap = new Map(base.map((r) => [r.id, r]));
  const manifest = {
    sources: Object.fromEntries(
      Object.entries(sources).map(([k, v]) => [k, { version: 'fixture', retrievedAt: '2026-10-27T00:00:00.000Z', license: 'test', owner: 'test', files: [{ path: Object.keys(files)[0], url: `https://example.invalid/${k}`, sha256: '0'.repeat(64) }], ...v }]),
    ),
  };
  return {
    manifest,
    base: baseMap,
    cache: {},
    notes: {},
    discarded: [],
    known: (id) => baseMap.has(id),
    allRecords: () => [...baseMap.values()],
    read: (rel) => read(files[rel]),
    readJson: (rel) => readJson(files[rel]),
    exists: (rel) => rel in files,
    list: () => [],
  };
}

const manifestFiles = (rels) => rels.map((path) => ({ path, url: `https://example.invalid/${path}`, sha256: 'a'.repeat(64) }));

// --- lectores ---------------------------------------------------------------------------------------------

test('parseCsv respeta comillas, comas y saltos de línea dentro de una celda', () => {
  const rows = parseCsv('a,b,c\n"x, y","línea 1\nlínea 2","con ""comillas"""\n');
  assert.deepEqual(rows, [{ a: 'x, y', b: 'línea 1\nlínea 2', c: 'con "comillas"' }]);
});

test('parseIuis lee alérgenos e isoalérgenos reales de allergen.org', () => {
  const { allergens, isoallergens } = parseIuis(read('iuis-allergen-excerpt.csv'), read('iuis-isoallergen-excerpt.csv'));
  assert.equal(allergens.length, 5);
  const ambA1 = allergens.find((a) => a.name === 'Amb a 1');
  assert.equal(ambA1.species, 'Ambrosia artemisiifolia');
  assert.match(ambA1.obsoleteName, /antigen E, antigen K/);
  assert.equal(ambA1.exposure, 'Airway');
  const acaF1 = allergens.find((a) => a.name === 'Aca f 1');
  assert.equal(acaF1.id, '837');
  assert.equal(acaF1.taxOrder, 'Fabales');
  const iso = isoallergens.find((i) => i.name === 'Aca f 1.0101');
  assert.equal(iso.allergenId, '837');
  assert.equal(iso.accUniProt, 'A0A0K1SC24');
  // todo isoalérgeno apunta a un alérgeno del extracto
  const ids = new Set(allergens.map((a) => a.id));
  assert.ok(isoallergens.every((i) => ids.has(i.allergenId)));
});

test('parseUniprotTsv y uniprotMainName: el nombre principal es lo anterior al primer paréntesis', () => {
  const rows = parseUniprotTsv(read('uniprot-excerpt.tsv'));
  assert.equal(rows.length, 3);
  const hyal = rows.find((r) => r.accession === 'A0A0S4JYH2');
  assert.equal(uniprotMainName(hyal.proteinNames), 'Hyaluronidase-like enzyme CsHyal');
  assert.ok(hyal.keywords.includes('Allergen'));
  assert.equal(hyal.reviewed, true);
  assert.match(hyal.allergenicProperties, /^ALLERGEN: May cause an allergic reaction in human/);
});

test('parseCvx: los códigos del CDC vienen rellenados con espacios y traen estado oficial', () => {
  const rows = parseCvx(read('cvx-excerpt.txt'));
  const anthrax = rows.find((r) => r.code === '24') ?? rows.find((r) => r.code === '19');
  assert.ok(anthrax, 'hay un CVX activo en el extracto');
  assert.ok(rows.every((r) => r.code === r.code.trim()));
  assert.ok(rows.some((r) => r.status === 'Inactive'));
  assert.ok(rows.find((r) => r.code === '27').nonVaccine);
  const tn = parseCvxTradenames(read('tradename-excerpt.txt'));
  assert.ok(tn.length > 0 && tn.every((t) => t.cvx === t.cvx.trim() && t.name !== ''));
});

test('parseChebiObo conserva las relaciones «has role» (RO:0000087)', () => {
  const { terms, header } = parseChebiObo(read('chebi-excerpt.obo'));
  assert.deepEqual(header['data-version'], ['chebi/256']);
  const benzocaine = terms.get('CHEBI:116735');
  assert.ok(benzocaine.relationships.some((r) => r.rel === 'RO:0000087' && r.target === 'CHEBI:50904'));
  assert.deepEqual(terms.get('CHEBI:88188').isA.sort(), ['CHEBI:23888', 'CHEBI:50904']);
});

test('parseNcitConcept: nombre, sinónimos FULL_SYN, definición y padres', () => {
  const c = parseNcitConcept(readJson('ncit-C189453.json'));
  assert.equal(c.name, 'Arachis hypogaea Antigen');
  assert.ok(c.synonyms.includes('Peanut Allergen'));
  assert.match(c.definition, /^Antigen\(s\) from the seed of the species Arachis hypogaea/);
  assert.deepEqual(c.parents.sort(), ['C268', 'C62651']);
  assert.equal(c.active, true);
});

test('parseEuAnnex1169: 14 grupos en castellano y en inglés con sus excepciones', () => {
  const es = parseEuAnnex1169(read('eu-1169-annex-ii-excerpt.spa.xhtml'));
  const en = parseEuAnnex1169(read('eu-1169-annex-ii-excerpt.eng.xhtml'));
  assert.equal(es.items.length, 14);
  assert.equal(en.items.length, 14);
  assert.equal(es.title, 'SUSTANCIAS O PRODUCTOS QUE CAUSAN ALERGIAS O INTOLERANCIAS');
  assert.equal(es.items[0].title, 'Cereales que contengan gluten');
  assert.equal(es.items[0].exceptions.length, 4);
  assert.equal(es.items[7].title, 'Frutos de cáscara');
  assert.equal(en.items[7].title, 'Nuts');
  assert.match(es.items[11].text, /SO2 total/);
  assert.ok(es.items.every((i, k) => i.number === k + 1));
});

test('parseEuAdditives1333: número E y denominación oficial, con E 170 y E 172 en dos secciones', () => {
  const es = parseEuAdditives1333(read('eu-1333-annex-ii-excerpt.spa.xhtml'));
  assert.deepEqual(es.find((r) => r.eNumber === 'E 100'), { eNumber: 'E 100', name: 'Curcumina', section: '1. Colorantes' });
  assert.equal(es.filter((r) => r.eNumber === 'E 170').length, 2);
  assert.equal(es.find((r) => r.eNumber === 'E 951').section, '2. Edulcorantes');
  const en = parseEuAdditives1333(read('eu-1333-annex-ii-excerpt.eng.xhtml'));
  assert.equal(en.find((r) => r.eNumber === 'E 102').name, 'Tartrazine');
  assert.equal(en.length, es.length);
});

test('parseMajorFoodAllergens: los nueve alérgenos del FDCA §201(qq)(1) con sus ejemplos', () => {
  const { items } = parseMajorFoodAllergens(read('usc-321-qq-excerpt.htm'));
  assert.deepEqual(items.map((i) => i.name), ['Milk', 'egg', 'fish', 'Crustacean shellfish', 'tree nuts', 'wheat', 'peanuts', 'soybeans', 'sesame']);
  assert.equal(items[2].examples, 'bass, flounder, or cod');
  assert.equal(items[0].examples, null);
});

test('parseJatsTable: filas con encabezados de grupo y exponentes pegados al texto', () => {
  const t = parseJatsTable(read('ebs-table-excerpt.xml'), 'cod70134-tbl-0002');
  assert.equal(t.rows[0][1], 'Conc. (%)/mg/cm2');
  assert.deepEqual(t.rows[1], ['Metals']);
  assert.equal(t.rows[2][0], 'Potassium dichromate');
  assert.match(t.footnote, /tested in petrolatum/);
});

test('meshDescriptors: Allergens y Hypersensitivity por número de árbol, con términos de entrada y nota de alcance', () => {
  const d = meshDescriptors(read('mesh-excerpt.xml'), ['D23.050.063', 'C20.543']);
  const allergens = d.find((x) => x.ui === 'D000485');
  assert.equal(allergens.name, 'Allergens');
  assert.deepEqual(allergens.trees, ['D23.050.063']);
  assert.match(allergens.scopeNote, /^Antigen-type substances/);
  assert.ok(d.find((x) => x.ui === 'D000080384').trees.includes('D23.050.063.500'));
  assert.ok(d.some((x) => x.ui === 'D000707' && x.trees.includes('C20.543.480.099')));
});

// --- pasadas -------------------------------------------------------------------------------------------------

const sources = (...keys) => Object.fromEntries(keys.map((k) => [k, {}]));

test('pasadas 21–23: fuentes, moléculas e isoalérgenos de WHO/IUIS con jerarquía y vínculo por accesión exacta', () => {
  const files = { 'iuis/allergen.csv': 'iuis-allergen-excerpt.csv', 'iuis/isoallergen.csv': 'iuis-isoallergen-excerpt.csv' };
  const ctx = fixtureCtx(files, { sources: { iuis: { version: 'fixture', files: manifestFiles(Object.keys(files)) } } });
  const src = P.passIuisSources(ctx);
  const species = src.filter((r) => r.properties.iuis_level === 'Species');
  assert.ok(species.some((r) => r.code === 'Ambrosia artemisiifolia'));
  const ambrosia = species.find((r) => r.code === 'Ambrosia artemisiifolia');
  assert.ok(ambrosia.parents[0].startsWith('taxorder:'));
  assert.ok(src.filter((r) => r.properties.iuis_level !== 'Species').every((r) => r.selectable === false));
  // padres existen en el mismo conjunto
  const codes = new Set(src.map((r) => r.code));
  assert.ok(src.every((r) => r.parents.every((p) => codes.has(p))));

  const al = P.passIuisAllergens(ctx);
  const aca = al.find((r) => r.display === 'Aca f 1');
  assert.equal(aca.code, '837');
  assert.deepEqual(aca.properties.source_species_code, { codeSystem: 'allergy-iuis-sources', code: 'Acacia farnesiana (Vachellia farnesiana)' });
  assert.equal(aca.displayLanguage, 'en');
  assert.equal(aca.provenance.license, 'test');

  const iso = P.passIuisIsoallergens(ctx);
  const i = iso.find((r) => r.display === 'Aca f 1.0101');
  assert.deepEqual(i.crossParents, [{ codeSystem: 'allergy-iuis-allergens', code: '837' }]);
  assert.deepEqual(i.properties.accession_uniprot, ['A0A0K1SC24']);
  // los ids son los deterministas de siempre
  assert.equal(i.id, conceptIdOf('allergy-iuis-allergens', 'iso:' + i.properties.iuis_isoallergen_id));
});

test('pasada 24: UniProt enlaza con IUIS sólo por accesión exacta', () => {
  const files = { 'uniprot/uniprotkb-kw0020.tsv': 'uniprot-excerpt.tsv', 'iuis/allergen.csv': 'iuis-allergen-excerpt.csv', 'iuis/isoallergen.csv': 'iuis-isoallergen-excerpt.csv' };
  const ctx = fixtureCtx(files, { sources: { uniprot: { version: 'UniProt 2026_03 (x)', files: manifestFiles(['uniprot/uniprotkb-kw0020.tsv']) }, iuis: { files: manifestFiles(['iuis/allergen.csv']) } } });
  const out = P.passUniprot(ctx);
  const linked = out.find((r) => r.code === 'P15494');
  const unlinked = out.find((r) => r.code === 'A0A0S4JYH2');
  assert.ok(linked.properties.iuis_isoallergens.includes('Bet v 1.0101'));
  assert.equal(unlinked.properties.iuis_isoallergens, null);
  assert.equal(linked.provenance.sourceVersion, '2026_03');
});

test('pasada 25: CVX nuevo se crea, el existente recibe parche con el estado del CDC y 998/999 no son sustancias', () => {
  const existing = makeRecord({ codeSystem: 'allergy-cvx-vaccines', code: '19', designations: [{ lang: 'en', value: 'Bacillus Calmette-Guerin vaccine', preferred: true }], provenance: { artifact: 'vsac', license: 'US Govt' } });
  const ctx = fixtureCtx({ 'cdc-cvx/cvx.txt': 'cvx-excerpt.txt' }, { base: [existing], sources: { 'cdc-cvx': { files: manifestFiles(['cdc-cvx/cvx.txt']) } } });
  const out = P.passCdcCvx(ctx);
  assert.equal(out.find((x) => x.code === '998'), undefined);
  assert.equal(out.find((x) => x.code === '999'), undefined);
  const patch = out.find((x) => x.patch && x.code === '19');
  assert.equal(patch.properties.cdc_cvx.status, 'Active');
  const created = out.find((x) => !x.patch && x.code === '75');
  assert.ok(created);
  assert.deepEqual(created.valueSets, ['allergy-substances', 'allergy-substances-vaccine']);
});

test('pasada 29: ChEBI toma el rol «allergen», sus roles descendientes y los compuestos con ese rol', () => {
  const ctx = fixtureCtx({ 'chebi-lite/chebi_lite.obo.gz': 'chebi-excerpt.obo' }, { sources: { 'chebi-lite': { files: manifestFiles(['chebi-lite/chebi_lite.obo.gz']) } } });
  ctx.chebi = () => parseChebiObo(read('chebi-excerpt.obo'));
  const out = P.passChebiFull(ctx);
  const codes = out.map((r) => r.code);
  assert.ok(codes.includes('CHEBI:50904'));
  assert.ok(codes.includes('CHEBI:116735'), 'benzocaína tiene el rol allergen');
  assert.ok(codes.includes('CHEBI:88188'), 'rol descendiente: drug allergen');
  assert.ok(!codes.includes('CHEBI:52209'), 'el padre del rol no es alérgeno');
  const benzocaine = out.find((r) => r.code === 'CHEBI:116735');
  assert.deepEqual(benzocaine.properties.chebi_allergen_roles, ['CHEBI:50904']);
  assert.equal(benzocaine.provenance.sourceVersion, 'chebi/256');
});

test('pasadas 31–33: normas oficiales con castellano e inglés de EUR-Lex y número E exacto', () => {
  const off = makeRecord({ codeSystem: 'allergy-off-additives', code: 'en:e100', designations: [{ lang: 'en', value: 'E100', preferred: true }], properties: { e_number: 'E100' }, provenance: { artifact: 'off-additives', license: 'ODbL-1.0' } });
  const celex = { consolidated: 'X' };
  const files = {
    'eurlex-1169/X.spa.xhtml': 'eu-1169-annex-ii-excerpt.spa.xhtml',
    'eurlex-1169/X.eng.xhtml': 'eu-1169-annex-ii-excerpt.eng.xhtml',
    'eurlex-1333/X.spa.xhtml': 'eu-1333-annex-ii-excerpt.spa.xhtml',
    'eurlex-1333/X.eng.xhtml': 'eu-1333-annex-ii-excerpt.eng.xhtml',
    'usc-21-321/USCODE-2023-title21-sec321.htm': 'usc-321-qq-excerpt.htm',
  };
  const ctx = fixtureCtx(files, {
    base: [off],
    sources: { 'eurlex-1169': { celex, files: manifestFiles(['eurlex-1169/X.spa.xhtml']) }, 'eurlex-1333': { celex, files: manifestFiles(['eurlex-1333/X.spa.xhtml']) }, 'usc-21-321': { files: manifestFiles(['usc-21-321/USCODE-2023-title21-sec321.htm']) } },
  });
  const eu = P.passEuAllergens(ctx);
  assert.equal(eu.length, 14);
  assert.equal(eu[4].display, 'Cacahuetes y productos a base de cacahuetes');
  assert.equal(eu[4].displayLanguage, 'es');
  assert.equal(eu[4].designations.find((d) => d.lang === 'en').value, 'Peanuts and products thereof');
  const add = P.passEuAdditives(ctx);
  const e100 = add.find((r) => r.code === 'E 100');
  assert.equal(e100.display, 'Curcumina');
  assert.deepEqual(e100.properties.same_e_number_as, { codeSystem: 'allergy-off-additives', code: 'en:e100', basis: 'mismo número E (coincidencia exacta del código)' });
  assert.equal(add.find((r) => r.code === 'E 102').properties.same_e_number_as, undefined, 'sin equivalente exacto, sin vínculo (no se cruza por nombre)');
  assert.deepEqual(add.find((r) => r.code === 'E 170').properties.annex_sections.es.length, 2);
  assert.equal(add.filter((r) => r.code === 'E 170').length, 1);
  const us = P.passUsMajorAllergens(ctx);
  assert.equal(us.length, 9);
  assert.equal(us[3].properties.examples, 'crab, lobster, or shrimp');
});

test('pasada 35: serie basal europea con grupo y concentración tal como los publica el artículo abierto', () => {
  const ctx = fixtureCtx({ 'europepmc-ebs/PMC13238334.xml': 'ebs-table-excerpt.xml', 'europepmc-ebs/PMC13441338.xml': 'ebs-table-excerpt.xml' }, { sources: { 'europepmc-ebs': { files: manifestFiles(['europepmc-ebs/PMC13238334.xml', 'europepmc-ebs/PMC13441338.xml']) } } });
  // el fixture sólo trae la tabla del primer artículo: la del segundo se saltea acá probando el lector directo
  const t = parseJatsTable(read('ebs-table-excerpt.xml'), 'cod70134-tbl-0002');
  assert.equal(t.rows.filter((r) => r.length > 1).length - 1, 7);
  assert.throws(() => P.passEbs(ctx), /Tabla cod70183-tbl-0002 no encontrada/);
});

test('pasada 37: MeSH con padres por número de árbol dentro del conjunto', () => {
  const ctx = fixtureCtx({ 'mesh/desc2026.allergy-subset.xml': 'mesh-excerpt.xml' }, { sources: { mesh: { files: manifestFiles(['mesh/desc2026.allergy-subset.xml']) } } });
  const out = P.passMesh(ctx);
  const allergoids = out.find((r) => r.code === 'D000080384');
  assert.deepEqual(allergoids.parents, ['D000485']);
  assert.ok(allergoids.valueSets.includes('allergy-substances-mesh-allergen'));
  const anaphylaxis = out.find((r) => r.code === 'D000707');
  assert.deepEqual(anaphylaxis.valueSets, ['allergy-conditions']);
});

// --- ejecutor y plan de carga -----------------------------------------------------------------------------------

const baseRecord = (over = {}) =>
  makeRecord({ codeSystem: 'allergy-rxnorm-ingredients', code: '161', designations: [{ lang: 'en', value: 'Acetaminophen', preferred: true }], valueSets: ['allergy-substances'], provenance: { artifact: 'vsac', artifactVersion: '0.24.0', license: 'US Govt', sourceVersion: '05052025' }, ...over });

test('ejecutor: un concepto repetido no se vuelve a emitir, un parche sólo agrega lo que falta y uno huérfano es error', () => {
  const base = baseRecord();
  const fakePass = (n, produced) => ({ n, key: `p${n}`, title: 't', run: () => produced });
  const patch = (extra) => P.makePatch({ codeSystem: 'allergy-rxnorm-ingredients', code: '161', provenanceKey: 'rxnav', provenance: { artifact: 'rxnav' }, ...extra });
  const dup = makeRecord({ codeSystem: 'allergy-rxnorm-ingredients', code: '161', designations: [{ lang: 'en', value: 'Acetaminophen', preferred: true }], provenance: { artifact: 'rxnav', license: 'x' } });
  const res = runOpenPasses({
    manifest: { sources: {} },
    baseRecords: [base],
    openDir: FIX,
    passes: [
      fakePass(27, [dup, patch({ designations: [{ lang: 'es', value: 'paracetamol', preferred: true }, { lang: 'en', value: 'Acetaminophen', preferred: true }], properties: { rxnorm_current: { version: '10052026' } }, valueSets: ['allergy-substances', 'allergy-substances-medication-ingredient'] })]),
      fakePass(28, [patch({ properties: { rxnorm_current: { version: 'otra' } } })]),
    ],
  });
  assert.equal(res.report[0].added, 0);
  assert.equal(res.report[0].duplicates, 1);
  assert.equal(res.report[0].patches, 1);
  assert.equal(res.report[1].patches, 0, 'la propiedad ya estaba: el segundo parche no agrega nada nuevo');
  const [line] = res.lines;
  assert.equal(line.patch, true);
  assert.deepEqual(line.designations, [{ lang: 'es', value: 'paracetamol', preferred: true }]);
  assert.deepEqual(line.valueSets, ['allergy-substances-medication-ingredient']);
  assert.ok('rxnorm_current' in line.properties && 'rxnav_provenance' in line.properties);
  assert.throws(
    () => runOpenPasses({ manifest: { sources: {} }, baseRecords: [base], openDir: FIX, passes: [fakePass(99, [P.makePatch({ codeSystem: 'allergy-rxnorm-ingredients', code: 'no-existe', provenanceKey: 'x', provenance: {} })])] }),
    /Parche huérfano/,
  );
});

test('plan de carga: la tanda 2 es otra versión del mismo code system y los parches usan ids deterministas', () => {
  const base = baseRecord({ pass: 2 });
  const fresh = { ...makeRecord({ codeSystem: 'allergy-rxnorm-ingredients', code: '999999', designations: [{ lang: 'en', value: 'nuevo', preferred: true }], valueSets: ['allergy-substances', 'allergy-substances-medication-ingredient'], provenance: { artifact: 'rxnav', artifactVersion: 'v', sourceVersion: '10052026', license: 'x' } }), pass: 27 };
  const plans = codeSystemPlans([base, fresh]);
  assert.equal(plans.length, 2);
  assert.deepEqual(plans.map((p) => p.origin).sort(), ['base', 'open']);
  const [a, b] = plans;
  assert.notEqual(a.version.id, b.version.id);
  assert.equal(a.codeSystem.id, b.codeSystem.id, 'el code system es uno solo');
  const patch = { patch: true, id: base.id, codeSystem: base.codeSystem, code: base.code, designations: [{ lang: 'es', value: 'paracetamol', preferred: true }], properties: { rxnorm_current: { tty: 'IN' } }, valueSets: ['allergy-substances-medication-ingredient'] };
  const one = patchPlan([patch]);
  const two = patchPlan([patch]);
  assert.deepEqual(one, two, 'determinista: la segunda corrida genera los mismos ids');
  assert.equal(one.designations.length, 1);
  assert.equal(one.properties.length, 1);
  assert.equal(one.members.length, 1);
  const plan = buildPlan([base, fresh], [patch]);
  assert.equal(plan.patches.members.length, 1);
  assert.ok(plan.valueSets.some((v) => v.code === 'allergy-substances-allergen-molecule'), 'los value sets de la tanda 2 están definidos');
});

test('Wikidata: sólo por identificador exacto; un id con dos ítems no se usa', () => {
  const rec = baseRecord({ pass: 2 });
  const ctx = fixtureCtx({}, { base: [rec], sources: { wikidata: { files: [] } } });
  const bind = (v, item, es) => ({ v: { value: v }, item: { value: `http://www.wikidata.org/entity/${item}` }, ...(es ? { es: { value: es } } : {}) });
  const data = { 'wikidata/P3345-0000.json': { results: { bindings: [bind('161', 'Q57055', 'paracetamol'), bind('999', 'Q1', 'uno'), bind('999', 'Q2', 'dos')] } } };
  ctx.exists = (rel) => rel === 'wikidata' || rel in data;
  ctx.list = () => ['P3345-0000.json'];
  ctx.readJson = (rel) => data[rel];
  const other = baseRecord({ code: '999', pass: 2 });
  ctx.base.set(other.id, other);
  const out = P.passWikidataEs(ctx);
  assert.equal(out.length, 1);
  assert.equal(out[0].code, '161');
  assert.deepEqual(out[0].designations, [{ lang: 'es', value: 'paracetamol', preferred: true }]);
  assert.equal(out[0].properties.wikidata.qid, 'Q57055');
  assert.deepEqual(ctx.notes.wikidata, { targets: 2, matched: 1, withSpanishLabel: 1, ambiguousItem: 1, noItem: 0 });
});

test('SPL y GSRS (extractos reales)', () => {
  const splProducts = parseSplIngredients(read('spl-excerpt.xml'));
  assert.ok(splProducts.length >= 1);
  const p = splProducts[0];
  assert.match(p.ndc, /^\d+-\d+$/);
  const active = p.ingredients.filter((i) => i.role === 'ACTIB');
  assert.ok(active.length >= 1);
  assert.match(active[0].unii, /^[A-Z0-9]{10}$/);
  const g = parseGsrs(readJson('gsrs-excerpt.json'));
  assert.equal(g.unii, '9IOA40ANG6');
  assert.equal(g.name, 'ASPERGILLUS NIGER VAR. NIGER');
  assert.equal(g.organism.genus, 'Aspergillus');
  assert.ok(g.codes.some((c) => c.system === 'NCBI TAXONOMY' && c.code === '5061'));
  assert.ok(!g.codes.some((c) => c.system === 'DRUG BANK' || c.system === 'DSLD'), 'sin DrugBank ni DSLD');
});
