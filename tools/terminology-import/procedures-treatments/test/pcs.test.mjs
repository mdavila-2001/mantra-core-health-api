// ICD-10-PCS FY2027 (CMS): extractos REALES de los archivos oficiales descargados el 2026-10-27
// (4 tablas completas del XML de tablas y los códigos y el orden de esas tablas) y de la hoja
// «ES2026 Completa + Marcadores» de CIE-10-ES Procedimientos (Ministerio de Sanidad).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildLoadPlan } from '../lib/load-plan.mjs';
import { RELATION_TYPES } from '../lib/relation-types.mjs';
import { generateCodes, parseCie10esProcedures, parseCodesFile, parseOrderFile, parsePcsTables, pcsCorpus } from '../lib/sources/pcs.mjs';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const read = (n) => readFileSync(join(FIX, n), 'utf8');
const meta = { source: 'icd10pcs-cms-2027', version: 'ICD-10-PCS FY2027', retrievedAt: '2026-10-27T00:00:00.000Z', license: 'Dominio público (CMS)', fileUrl: 'https://www.cms.gov/files/zip/2027-icd-10-pcs-code-tables-index.zip', sha256: 'x' };
const es = () => parseCie10esProcedures(JSON.parse(read('cie10es_procedimientos_2026.excerpt.json')).rows);
function corpus(withEs = true) {
  const { tables, version } = parsePcsTables(read('icd10pcs_tables_2027.excerpt.xml'));
  return pcsCorpus({ tables, version, codes: parseCodesFile(read('icd10pcs_codes_2027.excerpt.txt')), order: parseOrderFile(read('icd10pcs_order_2027.excerpt.txt')), es: withEs ? es() : null }, { tables: meta, tablesUrl: meta.fileUrl });
}

test('tablas: 4 tablas reales; los ejes 1 a 3 tienen una etiqueta y las filas traen los ejes 4 a 7', () => {
  const { version, tables } = parsePcsTables(read('icd10pcs_tables_2027.excerpt.xml'));
  assert.equal(version, '2027');
  assert.deepEqual(tables.map((t) => t.id), ['001', 'D00', 'GZ1', '4A0']);
  assert.equal(tables[0].section.label, 'Medical and Surgical');
  assert.equal(tables[0].operation.label, 'Bypass');
  assert.equal(tables[1].rows[0][4].title, 'Treatment Site');
  assert.equal(tables[2].rows[0][4].title, 'Qualifier');
});

test('códigos generados = códigos del archivo oficial (406), uno por uno', () => {
  const { tables } = parsePcsTables(read('icd10pcs_tables_2027.excerpt.xml'));
  const generated = new Set([...generateCodes(tables)].map((g) => g.code));
  const file = parseCodesFile(read('icd10pcs_codes_2027.excerpt.txt'));
  assert.equal(generated.size, 406);
  assert.deepEqual([...generated].sort(), [...file.keys()].sort());
});

test('si las tablas y el archivo de códigos difieren, el build aborta', () => {
  const { tables, version } = parsePcsTables(read('icd10pcs_tables_2027.excerpt.xml'));
  const codes = parseCodesFile(read('icd10pcs_codes_2027.excerpt.txt'));
  codes.delete('0016070');
  assert.throws(() => pcsCorpus({ tables, version, codes, order: parseOrderFile(read('icd10pcs_order_2027.excerpt.txt')) }, { tables: meta, tablesUrl: meta.fileUrl }), /solo en el archivo: 0; solo en las tablas: 1/);
});

test('orden: ancho fijo; las filas de categoría (no código) quedan marcadas como no válidas', () => {
  const order = parseOrderFile(read('icd10pcs_order_2027.excerpt.txt'));
  assert.deepEqual(order.get('001'), { order: 1, valid: false, short: 'Central Nervous System and Cranial Nerves, Bypass', long: 'Central Nervous System and Cranial Nerves, Bypass' });
  assert.equal(order.get('0016070').valid, true);
  assert.equal(order.get('0016070').short, 'Bypass Cereb Vent to Nasophar with Autol Sub, Open Approach');
  assert.throws(() => parseOrderFile('xxxxx mal formada'), /línea inesperada/);
});

test('procedimiento → sitio: sólo los ejes 4 que son sitio; «Qualifier» (G/H) no se relaciona', () => {
  const { procedures, assertions, stats } = corpus();
  assert.equal(stats.codes, 406);
  const owned = procedures.filter((p) => p.system === 'icd10pcs-cms');
  assert.equal(owned.length, 406);
  assert.ok(stats.skippedQualifierAxis > 0, 'GZ1 tiene eje 4 «Qualifier»');
  assert.equal(assertions.length + stats.skippedQualifierAxis, 406);
  const a = assertions.find((x) => x.subject.code === '0016070');
  assert.equal(a.relationType.code, 'icd10pcs:axis4-body-part');
  assert.equal(a.relationType.assertion, 'by-definition');
  assert.deepEqual(a.object, { system: 'icd10pcs-site', code: '00-6', label: 'Cerebral Ventricle' });
  assert.deepEqual(a.evidence, { table: '001', row: 1, axis: 4, axisTitle: 'Body Part', value: '6', meaning: 'Cerebral Ventricle' });
  const radio = assertions.find((x) => x.subject.code.startsWith('D00'));
  assert.equal(radio.relationType.code, 'icd10pcs:axis4-treatment-site');
  assert.ok(!assertions.some((x) => x.subject.code.startsWith('GZ1')));
  for (const code of Object.keys(stats.byAxisTitle)) assert.ok(['Body Part', 'Body System', 'Body System / Region', 'Body Region', 'Treatment Site'].includes(code));
  for (const t of ['body-part', 'body-region', 'body-system-region', 'body-system', 'treatment-site']) assert.ok(RELATION_TYPES[`icd10pcs:axis4-${t}`]);
});

test('sitios: un concepto por (sección, sistema, valor) con la etiqueta oficial; el mismo valor en otro sistema es otro concepto', () => {
  const { procedures } = corpus();
  const sites = procedures.filter((p) => p.system === 'icd10pcs-site');
  assert.ok(sites.length > 5);
  assert.equal(sites.find((s) => s.code === '00-6').display, 'Cerebral Ventricle');
  assert.equal(new Set(sites.map((s) => s.code)).size, sites.length);
  assert.ok(sites.every((s) => s.kind === 'site' && s.owned));
});

test('español oficial: por código exacto; lo que CIE-10-ES 2026 no traduce queda sin designación', () => {
  const { procedures, stats } = corpus();
  const p = procedures.find((x) => x.code === '0016070');
  assert.deepEqual(p.designations, [{ lang: 'es', type: 'preferred', value: 'Derivación de ventrículo cerebral a nasofaringe, con sustituto de tejido autólogo, abordaje abierto' }]);
  assert.match(p.properties.designation_es_source, /CIE-10-ES Procedimientos 2026/);
  assert.equal(stats.withSpanish, 405);
  const without = procedures.filter((x) => x.system === 'icd10pcs-cms' && x.designations.length === 0);
  assert.equal(without.length, 1, 'un código de FY2027 sin traducción oficial');
  assert.ok(!without[0].properties.designation_es_source);
  assert.throws(() => parseCie10esProcedures([['x', 'y']]), /cabecera inesperada/);
});

test('plan de carga: los conceptos de PCS llevan sus propiedades y designaciones; los tipos de relación existen', () => {
  const { procedures, assertions } = corpus();
  const plan = buildLoadPlan({ procedures, assertions });
  const c = plan.concepts.find((x) => x.system === 'icd10pcs-cms' && x.code === '0016070');
  assert.ok(c.properties.some((p) => p.code === 'pcs_axes'));
  assert.ok(c.properties.some((p) => p.code === 'source' ));
  assert.equal(c.designations.length, 1);
  assert.equal(plan.relationships.length, assertions.length);
  assert.ok(plan.concepts.some((x) => x.system === 'procedure-relationship-types' && x.code === 'icd10pcs:axis4-body-part'));
});
