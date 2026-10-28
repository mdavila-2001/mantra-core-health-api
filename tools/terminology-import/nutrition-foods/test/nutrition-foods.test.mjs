// Tests de nutrición y alimentos. Los fixtures de `test/fixtures/` son recortes REALES de los archivos descargados
// el 2026-10-28 (FDC Foundation 2026-04-30, SR Legacy 2018-04, Survey 2024-10-31, Branded 2026-04-30, FoodOn 2026-09-20,
// Ciqual 2025-11-03, CNF 2026): filas completas y sin modificar, solo un subconjunto de ellas.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

import { csvObjects, csvRows, parseCsv } from '../lib/csv.mjs';
import { openZip, openZipStream } from '../lib/zip.mjs';
import { readBrandedFoods, readFoods } from '../lib/fdc.mjs';
import { fdcVocabRecords } from '../lib/fdc-vocab.mjs';
import { foodOnRecords, oboRecords, parseFoodOnClasses, parseOboClasses } from '../lib/foodon.mjs';
import { constituentRecords, deepestGroup, foodRecords, groupRecords, readComposition, readConstituents, readGroups, readSources, sourceRecords } from '../lib/ciqual.mjs';
import { cnfRecords, linkNdb, readCnf } from '../lib/cnf.mjs';
import { decodeXml, parseFlatRows } from '../lib/xml.mjs';
import { ARTIFACTS, CODE_SYSTEMS } from '../lib/sources.mjs';
import { LICENSES, LICENSE_IDS, SOURCE_DEFS, conceptRowId } from '../lib/model.mjs';
import { artifactIndex, dataTypeOf, planConcept, structurePlan } from '../lib/load-plan.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FX = join(HERE, 'fixtures');
const DATA = join(HERE, '..', 'data');
const fx = (n) => join(FX, n);

const chunked = (buf, size) => Readable.from((function* () { for (let i = 0; i < buf.length; i += size) yield buf.subarray(i, i + size); })());
async function collect(iter) { const o = []; for await (const x of iter) o.push(x); return o; }

// ---- CSV y ZIP en streaming ------------------------------------------------------------------------------------

test('csvRows: igual que parseCsv sin importar dónde se corten los bloques (comillas, «""», saltos, BOM)', async () => {
  const text = '﻿"a","b","c"\r\n"1","con ""comillas"" y, coma","línea 1\nlínea 2"\n"4","","é€"\n';
  const expected = parseCsv(text.replace(/^﻿/, ''));
  for (const size of [1, 2, 3, 5, 7, 64]) {
    const got = await collect(csvRows(chunked(Buffer.from(text, 'utf8'), size)));
    assert.deepEqual(got, expected, `bloques de ${size} bytes`);
  }
  assert.equal(expected[1][1], 'con "comillas" y, coma');
  assert.equal(expected[1][2], 'línea 1\nlínea 2');
});

test('csvObjects falla ante una fila con columnas de menos (no corrige en silencio)', async () => {
  await assert.rejects(collect(csvObjects(Readable.from([Buffer.from('"a","b"\n"1"\n')]), 't')), /columnas/);
});

test('openZipStream: mismas entradas y mismo contenido que el lector en memoria', async () => {
  const path = fx('fdc-foundation-mini.zip');
  const z = openZipStream(path);
  const m = openZip(path);
  assert.deepEqual(z.entries.map((e) => e.name), m.entries.map((e) => e.name));
  const viaStream = Buffer.concat(await collect(z.stream('food.csv')));
  assert.equal(viaStream.toString('utf8'), m.text('food.csv'));
  assert.throws(() => z.stream('no-existe.csv'), /no tiene la entrada/);
});

// ---- FoodData Central -------------------------------------------------------------------------------------------

test('FDC Foundation: alimento real 321358 (hummus) con categoría, NDB, valores y atributos tal cual la fuente', async () => {
  const recs = await readFoods({ key: 'fdc-foundation', zipPath: fx('fdc-foundation-mini.zip'), cs: 'usda-fdc-foundation' });
  assert.equal(recs.length, 3);
  const h = recs.find((r) => r.code === '321358');
  assert.equal(h.display, 'Hummus, commercial');
  assert.deepEqual(h.parents, [['usda-fdc-food-category', '16']]);
  assert.equal(h.properties.ndb_number, '16158');
  assert.equal(h.properties.fdc_data_type, 'foundation_food');
  const n = h.properties.fdc_nutrients.find((x) => x.nutrient_id === '1265');
  assert.deepEqual(n, { nutrient_id: '1265', amount: '1.41', data_points: '6', derivation_id: '1', min: '1.05', max: '1.76', median: '1.43', min_year_acquired: '2015' });
  assert.ok(h.properties.fdc_portions.length > 0);
  assert.deepEqual(h.prov, ['fdc-foundation', 'food.csv']);
  // las celdas vacías no generan clave: la fuente no dice nada
  assert.ok(!('footnote' in h.properties) || h.properties.footnote !== '');
  for (const r of recs) for (const v of Object.values(r.properties)) assert.notEqual(v, '');
});

test('FDC SR Legacy y Survey: padres por la clave que cita la propia fuente', async () => {
  const sr = await readFoods({ key: 'fdc-sr-legacy', zipPath: fx('fdc-sr-legacy-mini.zip'), cs: 'usda-fdc-sr-legacy' });
  assert.deepEqual(sr.map((r) => r.code), ['167512', '167513', '167514']);
  assert.ok(sr.every((r) => r.parents.length === 1 && r.parents[0][0] === 'usda-fdc-food-category'));
  assert.equal(sr[0].properties.ndb_number, '18634');
  const sv = await readFoods({ key: 'fdc-survey', zipPath: fx('fdc-survey-mini.zip'), cs: 'usda-fdc-survey' });
  assert.deepEqual(sv[0].parents, [['usda-fdc-wweia-category', '9602']]);
  assert.equal(sv[0].display, 'Milk, human');
  assert.equal(sv[0].properties.food_code, '11000000');
  assert.equal(sv[0].properties.wweia_category_number, '9602');
});

test('FDC Branded: une food.csv y branded_food.csv; descripción vacía real (776874) → display = código y marca de fallback', async () => {
  const stats = {};
  const recs = await collect(readBrandedFoods({ zipPath: fx('fdc-branded-mini.zip'), cs: 'usda-fdc-branded', stats }));
  assert.equal(recs.length, 6);
  const a = recs.find((r) => r.code === '1105904');
  assert.equal(a.display, 'WESSON Vegetable Oil 1 GAL');
  assert.equal(a.properties.brand_owner, 'Richardson Oilseed Products (US) Limited');
  assert.equal(a.properties.gtin_upc, '00027000612323');
  assert.deepEqual(a.parents, [['usda-fdc-branded-category', 'Oils Edible']]);
  assert.ok(!('ingredients' in a.properties), 'los ingredientes no se cargan (no son terminología)');
  const e = recs.find((r) => r.code === '776874');
  assert.equal(e.display, '776874');
  assert.equal(e.displayFallback, true);
  assert.equal(stats.foodWithoutBrandedRow, 0);
});

test('FDC vocabularios: unión por clave, gana la edición más nueva y las diferencias quedan como conflictos', async () => {
  const zips = { 'fdc-foundation': openZipStream(fx('fdc-foundation-mini.zip')), 'fdc-survey': openZipStream(fx('fdc-survey-mini.zip')), 'fdc-sr-legacy': openZipStream(fx('fdc-sr-legacy-mini.zip')), 'fdc-branded': openZipStream(fx('fdc-branded-mini.zip')) };
  const { records, conflicts } = await fdcVocabRecords(zips);
  assert.equal(records['usda-fdc-nutrient'].length, 477);
  assert.equal(records['usda-fdc-food-category'].length, 28);
  assert.equal(records['usda-fdc-wweia-category'].length, 172);
  assert.equal(records['usda-fdc-nutrient-derivation'].length, 64);
  const energy = records['usda-fdc-nutrient'].find((r) => r.code === '1008');
  assert.equal(energy.display, 'Energy');
  assert.equal(energy.properties.unit_name, 'KCAL');
  assert.deepEqual(energy.prov, ['fdc-foundation', 'nutrient.csv']);
  const name = conflicts.find((c) => c.key === '1063' && c.field === 'name');
  assert.deepEqual([name.kept, name.keptIn, name.other, name.otherIn], ['Sugars, Total', 'fdc-foundation', 'Sugars, Total NLEA', 'fdc-sr-legacy']);
  const cat = records['usda-fdc-food-category'][0];
  assert.deepEqual([cat.code, cat.properties.usda_category_code], ['1', '0100']);
});

// ---- FoodOn ---------------------------------------------------------------------------------------------------

test('FoodOn: clases FOODON_ del archivo real, jerarquía, restricciones, obsoletas y referencias externas', () => {
  const classes = parseFoodOnClasses(readFileSync(fx('foodon-mini.owl'), 'utf8'));
  const by = new Map(classes.map((c) => [c.code, c]));
  assert.equal(classes.length, 10);
  const fruit = by.get('FOODON_00001057');
  assert.equal(fruit.label, 'plant fruit food product');
  assert.equal(fruit.definition, 'A food product derived from plant fruit.');
  assert.deepEqual(fruit.parents, ['FOODON_00001261']);
  assert.deepEqual(fruit.restrictions, [{ property: 'RO_0001000', target: 'FOODON_03411140' }, { property: 'RO_0002350', target: 'FOODON_03400143' }]);
  assert.equal(fruit.hasEquivalentClassAxiom, true);
  const obs = by.get('FOODON_00001026');
  assert.equal(obs.deprecated, true);
  assert.equal(obs.label, 'obsolete: cane sugar');
  assert.deepEqual(by.get('FOODON_00001047').replacedBy, ['FOODON_03315293']);
  const { records, danglingParents } = foodOnRecords(classes, { cs: 'foodon', prov: ['foodon', 'foodon.owl'] });
  const fr = records.find((r) => r.code === 'FOODON_00001057');
  assert.deepEqual(fr.parents, [['foodon', 'FOODON_00001261']]);
  assert.equal(records.find((r) => r.code === 'FOODON_00001026').state, 'retired');
  assert.ok(danglingParents >= 0);
  assert.ok(records.every((r) => r.display && r.display.length > 0));
  // solo FOODON_ llegan como conceptos; los padres de otras ontologías quedan como texto de referencia
  const ext = classes.find((c) => c.externalParents.length);
  assert.ok(ext, 'el recorte incluye una clase con padre externo');
  assert.ok(ext.externalParents.every((p) => !p.startsWith('FOODON_')));
});

test('OBO genérico: CDNO, FOBI y ONS se leen por su prefijo; padres propios, obsoletas y clases sin etiqueta con marca de fallback', () => {
  const cdno = parseOboClasses(readFileSync(fx('cdno-mini.owl'), 'utf8'), 'CDNO');
  assert.deepEqual(cdno.map((c) => c.code), ['CDNO_0000001', 'CDNO_0000002', 'CDNO_0100005', 'CDNO_0000003']);
  const dry = cdno.find((c) => c.code === 'CDNO_0000002');
  assert.equal(dry.label, 'dry plant matter');
  assert.deepEqual(dry.synonyms, [{ scope: 'exact', value: 'dry matter', lang: 'en' }]);
  assert.deepEqual(dry.parents, ['CDNO_0000001']);
  const cr = oboRecords(cdno, { cs: 'cdno', prov: ['cdno', 'cdno.owl'] });
  assert.deepEqual(cr.records.find((r) => r.code === 'CDNO_0000002').parents, [['cdno', 'CDNO_0000001']]);
  assert.equal(cr.danglingParents, 0);
  const fobi = parseOboClasses(readFileSync(fx('fobi-mini.owl'), 'utf8'), 'FOBI');
  assert.equal(fobi.find((c) => c.code === 'FOBI_0048').label, 'Fruits and vegetables');
  assert.deepEqual(fobi.find((c) => c.code === 'FOBI_0048').parents, ['FOBI_0001']);
  const ons = parseOboClasses(readFileSync(fx('ons-mini.owl'), 'utf8'), 'ONS');
  const or = oboRecords(ons, { cs: 'ons', prov: ['ons', 'ons.owl'] }).records;
  const nolabel = or.find((r) => r.code === 'ONS_0000003');
  assert.equal(nolabel.displayFallback, true);
  assert.equal(nolabel.display, 'ONS_0000003');
  assert.equal(nolabel.state, 'retired');
  // un prefijo no mezcla ontologías: FOODON_ no aparece al pedir CDNO
  assert.ok(cdno.every((c) => c.code.startsWith('CDNO_')));
});

test('decodeXml: entidades nombradas y numéricas; una desconocida falla', () => {
  assert.equal(decodeXml('Jones&apos; &amp; &#233; &#x20AC; &quot;x&quot; &lt;&gt;'), "Jones' & é € \"x\" <>");
  assert.throws(() => decodeXml('&nbsp;'), /Entidad XML desconocida/);
});

// ---- Ciqual ---------------------------------------------------------------------------------------------------------

test('Ciqual: grupos jerárquicos, constituyentes, fuentes y alimentos con composición verbatim', () => {
  const g = readGroups(fx('ciqual-alim_grp_mini.xml'));
  const gr = groupRecords({ groups: g.groups, cs: 'ciqual-food-group', prov: ['ciqual-alim-grp', 'alim_grp'] });
  const g6 = gr.find((r) => r.code === '060303');
  assert.deepEqual(g6.parents, [['ciqual-food-group', '0603']]);
  assert.equal(gr.find((r) => r.code === '0603').parents[0][1], '06');
  assert.deepEqual(gr.find((r) => r.code === '06').parents, []);
  assert.ok(!gr.some((r) => /^0+$/.test(r.code)), 'los códigos «sin nivel» (0000/000000) no son conceptos');
  const c = constituentRecords({ rows: readConstituents(fx('ciqual-const_mini.xml')), cs: 'ciqual-constituent', prov: ['ciqual-const', 'const'] });
  assert.equal(c.find((r) => r.code === '327').properties.infoods_tagname, 'ENERC');
  const comp = readComposition(fx('ciqual-compo_mini.xml'));
  const foods = foodRecords({ alimPath: fx('ciqual-alim_mini.xml'), composition: comp.byFood, groupCs: 'ciqual-food-group', cs: 'ciqual-food', prov: ['ciqual-alim', 'alim + compo'] });
  const pastis = foods.find((r) => r.code === '1000');
  assert.equal(pastis.display, 'Pastis (anise-flavoured spirit)');
  assert.deepEqual(pastis.designations.map((d) => [d.lang, d.value]), [['en', 'Pastis (anise-flavoured spirit)'], ['fr', 'Pastis']]);
  assert.deepEqual(pastis.parents, [['ciqual-food-group', '060303']]);
  const water = pastis.properties.ciqual_composition.find((x) => x.const_code === '400');
  assert.deepEqual(water, { const_code: '400', teneur: '59,7', min: '58,7', max: '60,4', code_confiance: 'D', source_code: '1373' });
  assert.equal(pastis.properties.facteur_jones, '6.25');
  assert.ok(!('scientific_name' in pastis.properties), 'alim_nom_sci missing=" " no genera clave');
  const s = sourceRecords({ rows: readSources(fx('ciqual-sources_mini.xml')), cs: 'ciqual-source', prov: ['ciqual-sources', 'sources'] });
  assert.ok(s.records.length > 0 && s.records.every((r) => r.display.length > 0));
  assert.equal(deepestGroup({ alim_grp_code: '06', alim_ssgrp_code: '0603', alim_ssssgrp_code: '000000' }), '0603');
  assert.equal(deepestGroup({ alim_grp_code: '06', alim_ssgrp_code: '0000', alim_ssssgrp_code: '000000' }), '06');
});

test('parseFlatRows: columnas «missing» omitidas y espacios recortados', () => {
  const rows = parseFlatRows('<TABLE><X><a> 1 </a><b missing=" " /><c> hola &amp; chau </c></X></TABLE>', 'X');
  assert.deepEqual(rows, [{ a: '1', c: 'hola & chau' }]);
});

// ---- Canadian Nutrient File -------------------------------------------------------------------------------------

test('CNF: nombres EN/FR de la fuente, grupo, valores y cruce exacto por NDB con FDC', async () => {
  const t = await readCnf(fx('cnf-mini.zip'));
  const out = cnfRecords(t, { prov: ['cnf', 'CSV 2026'] });
  const foods = out['cnf-food'];
  const f5 = foods.find((r) => r.code === '5');
  assert.equal(f5.display, 'Chinese dish, chow mein, chicken');
  assert.deepEqual(f5.designations, [{ lang: 'en', value: 'Chinese dish, chow mein, chicken', preferred: true }, { lang: 'fr', value: 'Mets chinois, chow mein, poulet', preferred: false }]);
  assert.equal(f5.properties.usda_ndb_code, '36623');
  assert.deepEqual(f5.parents, [['cnf-food-group', '22']]);
  assert.ok(f5.properties.cnf_nutrient_amounts.length > 0);
  assert.equal(out['cnf-nutrient'].find((r) => r.code === '203').properties.infoods_tagname, 'PROCNT');
  // cruce: solo igualdad exacta de la cadena del número
  const idx = new Map([['16158', [['usda-fdc-foundation', '321358']]], ['3662', [['usda-fdc-sr-legacy', 'x']]]]);
  const stats = linkNdb(foods, idx);
  assert.deepEqual(foods.find((r) => r.properties.usda_ndb_code === '16158').properties.fdc_ndb_exact_matches, [['usda-fdc-foundation', '321358']]);
  assert.ok(!('fdc_ndb_exact_matches' in f5.properties), '36623 no es igual a 3662: no hay cruce por parecido');
  assert.deepEqual([stats.withNdb, stats.exact, stats.missing], [2, 1, 1]);
});

// ---- plan de carga -----------------------------------------------------------------------------------------------

function fakeArtifacts(cs) {
  const def = CODE_SYSTEMS[cs];
  return artifactIndex([{ internalCode: cs, artifacts: def.artifacts.map((k) => ({ key: k, title: ARTIFACTS[k].title, url: ARTIFACTS[k].url, version: ARTIFACTS[k].version, sha256: 'a'.repeat(64), retrievedAt: '2026-10-28T00:00:00.000Z', licenseId: ARTIFACTS[k].licenseId, license: ARTIFACTS[k].license })) }]);
}

test('planConcept: ids deterministas, procedencia con licencia, idiomas no sembrados como propiedad, is-a con extremo exacto', () => {
  const rec = { cs: 'ciqual-food', code: '1000', display: 'Pastis', designations: [{ lang: 'en', value: 'Pastis', preferred: true }, { lang: 'fr', value: 'Pastis fr', preferred: false }], parents: [['ciqual-food-group', '060303']], properties: { facteur_jones: '6.25', ciqual_composition: [{ const_code: '400' }] }, prov: ['ciqual-alim', 'alim + compo'] };
  const a = planConcept(rec, fakeArtifacts('ciqual-food'));
  const b = planConcept(rec, fakeArtifacts('ciqual-food'));
  assert.deepEqual(a, b, 'determinista');
  assert.equal(a.concept.id, conceptRowId('ciqual-food', '2025-11-03', '1000'));
  assert.equal(a.designations.length, 1);
  const names = a.properties.map((p) => p.code);
  assert.deepEqual(names.sort(), ['ciqual_composition', 'facteur_jones', 'names_other_languages', 'nutrition_provenance', 'source_license']);
  const prov = a.properties.find((p) => p.code === 'nutrition_provenance').value;
  assert.equal(prov.license, 'CC-BY-4.0');
  assert.deepEqual(Object.keys(prov).sort(), ['artifact', 'license', 'retrievedAt', 'sourceSha256', 'sourceUrl', 'sourceVersion', 'table']);
  assert.equal(a.properties.find((p) => p.code === 'source_license').value, 'CC-BY-4.0');
  assert.equal(prov.sourceSha256, 'a'.repeat(64));
  assert.equal(a.relationships[0].target, conceptRowId('ciqual-food-group', '2025-11-03', '060303'));
  assert.equal(a.properties.find((p) => p.code === 'facteur_jones').dataType, 'string');
  assert.equal(a.properties.find((p) => p.code === 'ciqual_composition').dataType, 'json');
});

test('planConcept: Branded colapsa sus campos en una sola propiedad; padres sin jerarquía is-a declarada fallan', () => {
  const rec = { cs: 'usda-fdc-branded', code: '1105904', display: 'WESSON', designations: [], parents: [['usda-fdc-branded-category', 'Oils Edible']], properties: { brand_owner: 'X', gtin_upc: '0027' }, prov: ['fdc-branded', 'food.csv + branded_food.csv'] };
  const p = planConcept(rec, fakeArtifacts('usda-fdc-branded'));
  assert.deepEqual(p.properties.map((x) => x.code).sort(), ['fdc_branded', 'nutrition_provenance', 'source_license']);
  assert.throws(() => planConcept({ ...rec, cs: 'usda-fdc-nutrient', parents: [['usda-fdc-nutrient', '1']], prov: ['fdc-foundation', 'nutrient.csv'] }, fakeArtifacts('usda-fdc-nutrient')), /jerarquía no está declarada is-a/);
  assert.throws(() => planConcept({ ...rec, prov: ['fdc-survey', 'x'] }, fakeArtifacts('usda-fdc-branded')), /artefacto «fdc-survey» sin registrar/);
});

test('modelo: toda fuente y artefacto tienen licencia leída; todo code system apunta a una fuente definida', () => {
  for (const [k, a] of Object.entries(ARTIFACTS)) {
    assert.ok(a.license && a.license.length > 60, `${k}: licencia`);
    assert.ok(Object.values(LICENSE_IDS).includes(a.licenseId), `${k}: id de licencia`);
    assert.ok(SOURCE_DEFS[a.sourceCode], `${k}: fuente`);
    assert.match(a.url, /^https:\/\//);
  }
  for (const [k, c] of Object.entries(CODE_SYSTEMS)) {
    assert.ok(SOURCE_DEFS[c.sourceCode], `${k}: fuente`);
    for (const art of c.artifacts) assert.ok(ARTIFACTS[art], `${k}: artefacto ${art}`);
  }
  assert.match(LICENSES.FDC, /CC0/);
  assert.match(LICENSES.FOODON, /CC BY 4\.0/);
  assert.match(LICENSES.CNF, /Open Government Licence/);
  assert.equal(dataTypeOf(true), 'boolean');
  assert.equal(dataTypeOf([1]), 'json');
  assert.equal(structurePlan([]).systems.length, 0);
});

// ---- corpus versionado (solo si ya se construyó data/) ----------------------------------------------------------

test('data/: SHA256SUMS coincide, cada parte < 45 MB, gzip válido y conteos = meta', { skip: !existsSync(join(DATA, 'SHA256SUMS')) }, () => {
  const lines = readFileSync(join(DATA, 'SHA256SUMS'), 'utf8').trim().split('\n');
  assert.ok(lines.length >= 3);
  for (const l of lines) {
    const [sum, name] = l.split(/\s+/);
    const buf = readFileSync(join(DATA, name));
    assert.equal(createHash('sha256').update(buf).digest('hex'), sum, name);
    assert.ok(statSync(join(DATA, name)).size < 45 * 1024 * 1024, `${name} < 45 MB`);
    if (name.endsWith('.gz')) assert.ok(gunzipSync(buf).length > 0);
  }
  const meta = JSON.parse(readFileSync(join(DATA, 'nutrition-foods.meta.json'), 'utf8'));
  assert.equal(meta.totalConcepts, Object.values(meta.counts).reduce((a, b) => a + b, 0));
  const csLines = gunzipSync(readFileSync(join(DATA, 'nutrition-foods-codesystems.ndjson.gz'))).toString('utf8').trim().split('\n').map((l) => JSON.parse(l));
  for (const cs of csLines) {
    assert.equal(cs.concepts, meta.counts[cs.internalCode], cs.internalCode);
    assert.ok(cs.artifacts.length > 0);
    for (const a of cs.artifacts) {
      assert.match(a.sha256, /^[0-9a-f]{64}$/);
      assert.ok(a.license && a.licenseId && a.url && a.retrievedAt, `${cs.internalCode}/${a.key}: procedencia`);
    }
  }
});

test('data/: el manifiesto de descarga registra todos los artefactos con SHA-256', { skip: !existsSync(join(DATA, 'nutrition-foods.manifest.json')) }, () => {
  const m = JSON.parse(readFileSync(join(DATA, 'nutrition-foods.manifest.json'), 'utf8'));
  for (const k of Object.keys(ARTIFACTS)) {
    assert.match(m.artifacts[k]?.sha256 ?? '', /^[0-9a-f]{64}$/, k);
    assert.equal(m.artifacts[k].url, ARTIFACTS[k].url);
  }
});
