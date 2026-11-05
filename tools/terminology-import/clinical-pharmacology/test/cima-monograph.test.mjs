// Farmacología clínica · CIMA → monografía → plan de carga.
// Fixtures: respuestas REALES de la API de CIMA ya versionadas en el repo
// (bencilpenicilina procaína, nº reg. 15419/50161; Clamoxyl 500 mg, nº reg.
// 50239). Correr: node --test tools/terminology-import/clinical-pharmacology/test/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { htmlToText } from '../../lib/glossary-es/common.mjs';
import { atcAncestors, atcLevel, cimaProduct, cimaSections, groupByAtc5, missingSections, referenceDocuments } from '../lib/cima.mjs';
import { extractTables } from '../lib/literal.mjs';
import { linameByAtc, loadLiname, loadVademecumAtc } from '../lib/liname.mjs';
import { CODE_SYSTEM, conceptId, planFor, sectionDiscriminator } from '../lib/load-plan.mjs';
import { assertSection, atcNameIndex, buildMonograph } from '../lib/monograph.mjs';
import { CIMA_SECTIONS, requiredCoverage, sectionPropertyCode } from '../lib/sections.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(readFileSync(join(HERE, p), 'utf8'));
const S3 = '../../encyclopedia/s3-farmacos/test/fixtures';
const WHEN = '2026-10-24T00:00:00.000Z';

const penicilina = read('../../test/fixtures/cima-vtm-449005.json');
const penicilinaProducts = penicilina.list.map((r) => cimaProduct(r, penicilina.detail[r.nregistro]));
// Documento completo = las secciones reales concatenadas (misma forma `[{seccion,titulo,contenido,orden}]`).
const penicilinaDoc = Object.values(penicilina.sections).flat();

const amoxiProduct = { ...read(`${S3}/cima-vtm-27658006.json`).drugFacts.products[0], vtm: { id: 27658006, name: 'amoxicilina' } };
const amoxiDoc = ['4.1', '4.5', '4.8-recorte', '5.1'].flatMap((s) => read(`${S3}/cima-50239-${s}.json`));

test('secciones: numeración QRD exacta y código de propiedad por clave', () => {
  assert.equal(CIMA_SECTIONS['4.2'], 'posology');
  assert.equal(CIMA_SECTIONS['4.8'], 'adverse_reactions');
  assert.equal(CIMA_SECTIONS['10'], undefined, 'la 10 sólo se lee para la fecha de revisión');
  assert.equal(sectionPropertyCode('interactions'), 'pharmacology_section_interactions');
  assert.throws(() => sectionPropertyCode('resumen'), /desconocida/);
  const cov = requiredCoverage(['pharmacodynamics', 'indications']);
  assert.equal(cov.mechanism, true, 'en la ficha técnica el mecanismo está dentro de 5.1');
  assert.equal(cov.posology, false);
});

test('ATC: nivel y ancestros salen de la forma del código', () => {
  assert.deepEqual(['J', 'J01', 'J01C', 'J01CE', 'J01CE09'].map(atcLevel), [1, 2, 3, 4, 5]);
  assert.deepEqual(atcAncestors('J01CE09'), ['J', 'J01', 'J01C', 'J01CE', 'J01CE09']);
  assert.equal(atcLevel('J01CE9'), null);
});

test('CIMA: agrupa por ATC 5 y elige una ficha por (VTM, vías) de forma determinista', () => {
  const { byAtc, withoutAtc5 } = groupByAtc5(penicilinaProducts);
  assert.deepEqual([...byAtc.keys()], ['J01CE09']);
  assert.equal(withoutAtc5.length, 0);
  const refs = referenceDocuments(byAtc.get('J01CE09'));
  assert.equal(refs.length, 1, 'mismo VTM y misma vía intramuscular: una ficha');
  assert.equal(refs[0].product.nregistro, '15419', 'comercializados los dos: gana el nº de registro más bajo');
  assert.equal(refs[0].group.candidates, 2);
  const all = referenceDocuments(byAtc.get('J01CE09'), 'product');
  assert.deepEqual(all.map((r) => r.product.nregistro), ['15419', '50161']);
});

test('CIMA: las secciones son el texto literal de la ficha, con documento, versión y cita', () => {
  const ref = referenceDocuments(penicilinaProducts)[0];
  const rows = cimaSections(penicilinaDoc, ref, WHEN).map(assertSection);
  assert.deepEqual(rows.map((r) => r.key), ['indications', 'contraindications']);
  const ind = rows[0];
  assert.equal(ind.text, htmlToText(penicilina.sections['4.1'][0].contenido), 'texto = HTML sin etiquetas, nada más');
  assert.equal(ind.language, 'es');
  assert.equal(ind.document.id, '15419');
  assert.equal(ind.document.version, new Date(1776337562000).toISOString());
  assert.equal(ind.section.url, 'https://cima.aemps.es/cima/dochtml/ft/15419/4.1/FichaTecnica.html');
  assert.match(ind.citation, /nº reg\. 15419\), sección 4\.1 «Indicaciones terapéuticas», versión del 2026-04-16/);
  assert.match(ind.license, /cite expresamente su origen/);
  assert.match(ind.textSha256, /^[0-9a-f]{64}$/);
  assert.deepEqual(missingSections(penicilinaDoc).includes('4.2'), true, 'lo que falta se pide de a una sección');
});

test('CIMA: reacciones adversas conservan las tablas celda a celda (frecuencia literal)', () => {
  const ref = { product: amoxiProduct, criterion: 'prueba', group: {} };
  const rows = cimaSections(amoxiDoc, ref, WHEN);
  assert.deepEqual(rows.map((r) => r.key).sort(), ['adverse_reactions', 'indications', 'interactions', 'pharmacodynamics']);
  const adr = rows.find((r) => r.key === 'adverse_reactions');
  assert.match(adr.text, /Frecuentes \(≥ 1\/100 a < 1\/10\)/);
  assert.equal(adr.tables.length, 1);
  assert.deepEqual(adr.tables[0].rows[0], [{ text: 'Infecciones e infestaciones', colspan: 2 }]);
  const inter = rows.find((r) => r.key === 'interactions');
  assert.match(inter.text, /^Probenecid/);
});

test('tablas: anidadas y celdas vacías no inventan contenido', () => {
  const t = extractTables('<table><tr><td>a</td><td><table><tr><td>x</td></tr></table></td></tr><tr><td></td></tr></table>');
  assert.equal(t.length, 1);
  assert.equal(t[0].rows.length, 1, 'la fila sin texto no se guarda');
  assert.equal(t[0].rows[0][0].text, 'a');
  assert.equal(t[0].rows[0][1].text, 'x');
});

test('monografía: nombres ATC de la AEMPS; lo que ninguna fuente nombra queda en null', () => {
  const names = atcNameIndex({ products: penicilinaProducts });
  const ref = referenceDocuments(penicilinaProducts)[0];
  const m = buildMonograph({ code: 'J01CE09', names, cimaProducts: penicilinaProducts, sections: cimaSections(penicilinaDoc, ref, WHEN) });
  assert.equal(m.display, 'Penicilina procaina');
  assert.equal(m.displaySource, 'aemps-cima:medicamento:15419');
  assert.deepEqual(
    m.atcPath.map((p) => [p.code, p.name]),
    [
      ['J', null],
      ['J01', null],
      ['J01C', 'ANTIBACTERIANOS BETALACTAMICOS, PENICILINAS'],
      ['J01CE', 'Penicilinas sensibles a la betalactamasa'],
      ['J01CE09', 'Penicilina procaina'],
    ],
  );
  assert.equal(m.cima.products, 2);
  assert.deepEqual(m.cima.substances, [{ id: 449005, name: 'bencilpenicilina procaína' }]);
  assert.equal(m.coverage['aemps-cima'].indications, true);
  assert.equal(m.coverage['aemps-cima'].posology, false);
});

test('plan de carga: 5 niveles, IS_A al padre, ids estables y únicos', () => {
  const names = atcNameIndex({ products: penicilinaProducts });
  const ref = referenceDocuments(penicilinaProducts)[0];
  const m = buildMonograph({ code: 'J01CE09', names, cimaProducts: penicilinaProducts, sections: cimaSections(penicilinaDoc, ref, WHEN) });
  const plan = planFor([m], '2026-10-24');
  const again = planFor([JSON.parse(JSON.stringify(m))], '2026-10-24');
  assert.equal(plan.codeSystem.internalCode, CODE_SYSTEM);
  assert.deepEqual(plan.concepts.map((c) => c[2]), ['J', 'J01', 'J01C', 'J01CE', 'J01CE09']);
  assert.deepEqual(plan.concepts.map((c) => c[3]).slice(0, 2), ['J', 'J01'], 'sin nombre de fuente, el display es el código');
  assert.equal(plan.designations.length, 3, 'designación sólo donde hay nombre oficial');
  assert.equal(plan.relationships.length, 4);
  assert.equal(plan.relationships.find((r) => r[1] === conceptId('J01CE09'))[2], conceptId('J01CE'));
  const ids = plan.properties.map((p) => p[0]);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids, again.properties.map((p) => p[0]), 'misma entrada → mismos ids');
  const sections = plan.properties.filter((p) => p[2].startsWith('pharmacology_section_') && p[2] !== 'pharmacology_section_coverage');
  assert.equal(sections.length, 2);
  assert.equal(JSON.parse(sections[0][4]).document.id, '15419');
  assert.match(sectionDiscriminator(m.sections[0]), /^aemps-cima:15419:/);
});

test('LINAME (archivo del repo): presentaciones por ATC 5 con su código y uso restringido', () => {
  const liname = loadLiname();
  const ome = liname.get('A02BC01');
  assert.equal(ome.source, 'liname-bo');
  assert.ok(ome.presentations.some((p) => p.code === 'A-02-02' && p.form === 'Cápsula' && p.restrictedUse === false));
  assert.equal(linameByAtc({ medicamentos: [{ codigo: 'X', atc: 'N02BE' }] }).size, 0, 'sólo ATC de nivel 5');
  const vad = loadVademecumAtc();
  assert.ok(vad.size >= 400);
  assert.match(vad.get('A02BC01').id, /^[0-9a-f-]{36}$/);
});

test('CIMA: ficha sin fecha publicada (autorización centralizada) se publica marcada, con la fecha de consulta', () => {
  const p = { ...penicilinaProducts[0], fichaTecnicaDate: null };
  const rows = cimaSections(penicilinaDoc, { product: p, criterion: 'prueba', group: {} }, WHEN).map(assertSection);
  assert.equal(rows[0].document.version, null);
  assert.equal(rows[0].document.versionUnpublished, true);
  assert.match(rows[0].citation, /sin fecha de versión publicada por CIMA/);
  const withDate = cimaSections(penicilinaDoc, referenceDocuments(penicilinaProducts)[0], WHEN);
  assert.equal(withDate[0].document.versionUnpublished, undefined, 'con fecha no se marca');
});
