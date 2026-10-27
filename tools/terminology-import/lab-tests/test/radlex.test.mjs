// RSNA RadLex Playbook: recortes REALES de los archivos que sirve playbook.radlex.org / api3.rsna.org
// (descargados el 2026-10-27) y el .xlsx de mapeos COMPLETO (60 kB).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildPlan } from '../lib/load-plan.mjs';
import { RADLEX_CODE_SYSTEM, parseMapTo, parsePlaybookCsv, parseSubsets, radlexRecords } from '../lib/radlex.mjs';
import { assertRecord } from '../lib/records.mjs';
import { readXlsx, unzip } from '../lib/xlsx-min.mjs';

const F = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'radlex');
const PROV = { sourceName: 'RadLex (prueba)', sourceVersion: 'v', sourceUrl: 'https://api3.rsna.org/radlex/v1/createCsv?csvType=new', sourceFile: 'f', sourceSha256: 's', retrievedAt: '2026-10-27T00:00:00.000Z', license: 'RadLex License Version 2.1' };
const xlsx = () => readFileSync(join(F, 'map-to-table-playbook-dev.xlsx'));

function build() {
  const mapTo = parseMapTo(xlsx());
  return radlexRecords({ playbook: parsePlaybookCsv(readFileSync(join(F, 'complete-playbook-dev.sample.csv'), 'utf8')), subsets: parseSubsets(readFileSync(join(F, 'subset-table-playbook-dev.sample.csv'), 'utf8')), mapTo }, PROV);
}

test('xlsx-min: abre el .xlsx real, con dos hojas, y lee texto compartido', () => {
  assert.ok(unzip(xlsx()).has('xl/workbook.xml'));
  const sheets = readXlsx(xlsx());
  assert.deepEqual(sheets.map((s) => s.name), ['map-to-table-playbook-dev.xlsx', 'CPT_mappings']);
  assert.deepEqual(sheets[0].rows[0], ['RPID', 'MAP_TO', 'COMMENTS', 'TARGET_SYSTEM']);
  assert.deepEqual(sheets[0].rows[1], ['RPID2', '30805-6', '', '2.16.840.1.113883.6.1']);
  assert.throws(() => unzip(Buffer.from('no es un zip')), /No es un ZIP/);
});

test('mapeos: sólo la hoja 1 (LOINC y RadLex); la hoja de CPT (AMA) no se lee', () => {
  const { map, unknownTargets, sheetNames } = parseMapTo(xlsx());
  assert.equal(sheetNames[1], 'CPT_mappings');
  assert.deepEqual(unknownTargets, {});
  assert.deepEqual(map.get('RPID2'), [{ targetSystemOid: '2.16.840.1.113883.6.1', targetSystem: 'LOINC', code: '30805-6' }]);
  const all = JSON.stringify([...map.values()]);
  assert.ok(!all.includes('CPT'), 'ningún dato de CPT');
  const targets = new Set([...map.values()].flat().map((m) => m.targetSystem));
  assert.deepEqual([...targets].sort(), ['LOINC', 'RadLex']);
});

test('mapeos: una cabecera distinta aborta mostrando la real', () => {
  assert.throws(() => parseMapTo(Buffer.from('x')), /No es un ZIP/);
});

test('Playbook: 10 filas reales; núcleo con nombre largo, resto con el nombre automático que publica RSNA', () => {
  const { records, stats } = build();
  assert.equal(records.length, 10);
  records.forEach(assertRecord);
  const core = records.find((r) => r.code === 'RPID2');
  assert.equal(core.display, 'CT Abdomen Angio w and wo IV Contrast');
  assert.equal(core.properties.radlex_display_source, 'LONG_NAME');
  assert.equal(core.properties.radlex_short_name, 'CT Abd Angio w/wo');
  assert.equal(core.definition, 'A computed tomography  RADIOLOGY ORDERABLE ANGIOGRAPHY procedure focused on the ABDOMEN WITHOUT THEN WITH IV CONTRAST', 'descripción verbatim (con el doble espacio de origen)');
  const auto = records.find((r) => r.code === 'RPID456');
  assert.equal(auto.display, 'MR ABDOMEN ANGIOGRAPHY');
  assert.equal(auto.properties.radlex_display_source, 'AUTOMATED_LONG_NAME');
  assert.ok(stats.displayFromAutomatedLongName >= 1);
});

test('Playbook: los espacios marcadores del CSV no se escriben y los atributos múltiples quedan como listas', () => {
  const { records } = build();
  const r = records.find((x) => x.code === 'RPID4936');
  assert.equal(r.properties.radlex_pharmaceuticals.length, 2, 'PHARMACEUTICAL y PHARMACEUTICAL_2');
  for (const rec of records) for (const [k, v] of Object.entries(rec.properties)) assert.ok(v !== ' ' && v !== '', `${rec.code}.${k} no debe ser un marcador vacío`);
  const left = records.find((x) => x.code === 'RPID6030');
  assert.equal(left.properties.radlex_laterality, 'LEFT');
  assert.ok(left.properties.radlex_population);
});

test('Playbook: estado publicado manda sobre la selección (sólo ACTIVE y TRIAL son seleccionables)', () => {
  const { records } = build();
  const by = Object.fromEntries(records.map((r) => [r.code, r]));
  assert.equal(by.RPID2.selectable, true);
  assert.equal(by.RPID6883.properties.radlex_status, 'TRIAL');
  assert.equal(by.RPID6883.selectable, true);
  assert.deepEqual(by.RPID6883.properties.radlex_subsets, ['TRIAL']);
  assert.equal(by.RPID6345.properties.radlex_status, 'DEPRECATED');
  assert.equal(by.RPID6345.selectable, false);
  assert.equal(by.RPID5961.properties.radlex_status, 'DISCOURAGED');
  assert.equal(by.RPID5961.selectable, false);
});

test('Playbook: sin modalidad no hay categoría inventada; un campo con salto de línea se conserva entero', () => {
  const { records } = build();
  const by = Object.fromEntries(records.map((r) => [r.code, r]));
  assert.equal(by.RPID6345.category, null);
  assert.ok(!by.RPID6345.valueSets.some((v) => v.includes('-cat-')));
  assert.equal(by.RPID6151.category.code, 'xr-rf');
  assert.ok(Object.values(by).some((r) => (r.properties.radlex_change_reason_public ?? '').includes('\n')), 'el recorte real trae un motivo de cambio con salto de línea');
});

test('Playbook: RPID repetido aborta; sin LONG_NAME ni nombre automático aborta', () => {
  const playbook = parsePlaybookCsv(readFileSync(join(F, 'complete-playbook-dev.sample.csv'), 'utf8'));
  const mapTo = parseMapTo(xlsx());
  assert.throws(() => radlexRecords({ playbook: [...playbook, playbook[0]], subsets: new Map(), mapTo }, PROV), /RPID repetido/);
  assert.throws(() => radlexRecords({ playbook: [{ ...playbook[0], LONG_NAME: ' ', AUTOMATED_LONG_NAME: ' ' }], subsets: new Map(), mapTo }, PROV), /sin LONG_NAME/);
  assert.throws(() => parsePlaybookCsv('A,B\n1,2\n'), /faltan columnas/);
});

test('Playbook: el plan de carga arma value sets de dominio, modalidad y subconjunto con nombres', () => {
  const { records } = build();
  const plan = buildPlan([{ layer: 'radlex-playbook', records, meta: { codeSystems: [{ internalCode: RADLEX_CODE_SYSTEM, name: 'RadLex', canonicalUrl: 'http://playbook.radlex.org/', version: 'v', sourceKey: 'radlex-playbook' }] } }]);
  const codes = plan.valueSets.map((v) => v.code);
  assert.ok(codes.includes('lab-catalog-radlex-playbook') && codes.includes('lab-catalog-radlex-playbook-cat-ct') && codes.includes('lab-catalog-radlex-playbook-subset-core'));
  assert.match(plan.valueSets.find((v) => v.code === 'lab-catalog-radlex-playbook-subset-trial').description, /^Subconjunto «TRIAL» de /);
});
