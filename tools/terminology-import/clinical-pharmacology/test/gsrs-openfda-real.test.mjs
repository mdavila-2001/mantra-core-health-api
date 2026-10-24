// Farmacología clínica · openFDA y GSRS con datos REALES.
// Fixtures recortados (sólo campos, nunca texto) de las descargas del
// 2026-10-24: etiquetas openFDA (export 2026-10-23) de paracetamol inyectable
// (set_id 6d763554…), tramadol HCl + paracetamol (4e40f55e…) y ondansetrón HCl
// (3f2e8efe…); sustancias GSRS (export 2026-10-21) de esos principios y de
// los opioides que comparten códigos N02AJ con el paracetamol.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildGsrsIndex, gsrsDisplayFor, gsrsEntry, linkUniiSet } from '../lib/gsrs.mjs';
import { ResultsSplitter } from '../lib/json-stream.mjs';
import { assertSection } from '../lib/monograph.mjs';
import { labelIdentity, openFdaSections, referenceLabels } from '../lib/openfda.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(readFileSync(join(HERE, 'fixtures', p), 'utf8'));
const labels = read('openfda-labels-real.json');
const gsrsRaw = read('gsrs-substances-real.json');
const index = buildGsrsIndex(gsrsRaw.map(gsrsEntry));
const WHEN = '2026-10-24T15:30:00.000Z';

test('GSRS real: UNII, fracción activa de la sal y códigos WHO-ATC', () => {
  const apap = index.byUnii.get('362O9ITL9D');
  assert.equal(apap.moiety, '362O9ITL9D');
  assert.ok(apap.atc.includes('N02BE01') && apap.atc.includes('N02AJ13'));
  assert.deepEqual(apap.rxcui, ['161']);
  assert.equal(index.byUnii.get('NMH84OZK2B').moiety, '4AF302ESOS', 'ondansetrón HCl → ondansetrón');
  assert.equal(index.byUnii.get('9N7R477WCK').moiety, '39J1LGJ30J', 'tramadol HCl → tramadol');
});

test('enlace por código: sal → ATC del principio; combinación sólo con su combinación; series 50/70 de la OMS', () => {
  assert.deepEqual(pick(linkUniiSet(['NMH84OZK2B'], index)), ['linked', 'A04AA01', 'unique']);
  assert.deepEqual(pick(linkUniiSet(['362O9ITL9D', '9N7R477WCK'], index)), ['linked', 'N02AJ13', 'unique']);
  const apap = linkUniiSet(['362O9ITL9D'], index);
  assert.deepEqual(pick(apap), ['linked', 'N02BE01', 'who-atc-50-series']);
  assert.deepEqual(apap.candidates, ['N02BE01', 'N02BE51', 'N02BE71'], 'N02AJ* se excluyen: también los lista un opioide');
  assert.equal(linkUniiSet(['ZZZZZZZZZZ'], index).status, 'unknown-unii');
  assert.deepEqual(gsrsDisplayFor('A04AA01', index), { display: 'ONDANSETRON', source: 'fda-gsrs', unii: '4AF302ESOS', language: 'en' });
  assert.equal(gsrsDisplayFor('N02AJ13', index), null, 'combinación: sin nombre compuesto inventado');
});
const pick = (r) => [r.status, r.atc, r.rule];

test('openFDA real: una fila por campo, texto = párrafos de la etiqueta, cita con set_id/versión/fecha', () => {
  const l = labels.apap;
  const ref = referenceLabels([labelIdentity(l)], ['362O9ITL9D'])[0];
  const rows = openFdaSections(l, ref, WHEN).map(assertSection);
  const by = Object.fromEntries(rows.map((r) => [r.section.number, r]));
  assert.ok(by.boxed_warning && by.indications_and_usage && by.dosage_and_administration && by.adverse_reactions && by.overdosage);
  assert.equal(by.indications_and_usage.text, l.indications_and_usage.join('\n\n'));
  assert.match(by.indications_and_usage.text, /^1 INDICATIONS AND USAGE Acetaminophen Injection is indicated/);
  assert.equal(by.indications_and_usage.language, 'en');
  assert.equal(by.indications_and_usage.document.id, '6d763554-913d-4bed-9efd-b9c9b936a2f4');
  assert.equal(by.indications_and_usage.document.version, '18');
  assert.equal(by.indications_and_usage.document.effectiveDate, '2023-05-18');
  assert.ok(by.adverse_reactions.tables.length > 0, 'la tabla de reacciones adversas se conserva');
  assert.ok(rows.every((r) => r.key !== undefined));
});

test('openFDA real: referencia por conjunto exacto de UNII', () => {
  const ids = Object.values(labels).map(labelIdentity);
  assert.deepEqual(referenceLabels(ids, ['362O9ITL9D']).map((r) => r.identity.setId), ['6d763554-913d-4bed-9efd-b9c9b936a2f4']);
  assert.deepEqual(referenceLabels(ids, ['362O9ITL9D', '9N7R477WCK']).map((r) => r.identity.setId), ['4e40f55e-1d8e-ce2f-e063-6294a90a7bec']);
});

test('lector en streaming: objetos completos aunque el corte caiga dentro de strings, escapes y llaves', () => {
  const objs = [...Object.values(labels), { a: 'x}{"\\"}', b: [{ c: '}' }] }];
  const text = JSON.stringify({ meta: { results: { total: 1 } }, results: objs });
  for (const size of [1, 7, 4096]) {
    const sp = new ResultsSplitter();
    const got = [];
    for (let i = 0; i < text.length; i += size) got.push(...sp.push(text.slice(i, i + size)));
    assert.deepEqual(got, objs, `trozos de ${size}`);
    assert.equal(sp.state, 'done');
  }
});

// --- RxNav real (2026-10-24): ATC 5 → RxCUI → UNII, combinado con el GSRS -----------------
import { combineLinks, moietiesOf, rxnavIndex } from '../lib/gsrs.mjs';
import { readBridge } from '../lib/inputs.mjs';

const RXNAV_ATC = ['N02BE01', 'J01CA04', 'J01CR02', 'C09AA02', 'C09BA02', 'N01BB02', 'D04AB01', 'C01BB01', 'N02AJ13'];
const bridges = RXNAV_ATC.map((atc) => readBridge(atc, join(HERE, 'fixtures', 'rxnav-real', atc)));
const gsrsFull = buildGsrsIndex(read('gsrs-entries-real.json'));

test('RxNav real: el ATC 5 de una combinación no tiene ingrediente; un MIN se abre en sus IN', () => {
  const by = Object.fromEntries(bridges.map((b) => [b.atc, b]));
  assert.deepEqual(by.J01CA04.unii, ['804826J2HU']);
  assert.equal(by.J01CR02.complete, false, 'amoxicilina + clavulánico: RxNav no la mapea a ingredientes');
  assert.deepEqual(by.N02AJ13.ingredients, ['161', '10689']);
  assert.deepEqual(by.N02AJ13.unii, ['362O9ITL9D', '39J1LGJ30J']);
  assert.equal(by.N01BB02.rxcuis[0].rxcui, '6387');
});

test('GSRS + RxNav: resuelve lo que el GSRS deja ambiguo sólo si RxNav da UN ATC dentro de sus candidatos', () => {
  const rx = rxnavIndex(bridges, gsrsFull);
  const decide = (uniis) => combineLinks(linkUniiSet(uniis, gsrsFull), rx.get(moietiesOf(uniis, gsrsFull).join('+')) ?? []);
  assert.deepEqual(decide(['804826J2HU']), { atc: 'J01CA04', rule: 'gsrs-ambiguous+rxnav-unique' }, 'amoxicilina');
  assert.deepEqual(decide(['9O25354EPJ']), { atc: 'C09AA02', rule: 'gsrs-ambiguous+rxnav-unique' }, 'enalapril maleato → fracción enalaprilat');
  assert.deepEqual(decide(['V13007Z41A']), { atc: null, rule: 'ambiguous:rxnav-multiple' }, 'lidocaína: tres ATC por vía/uso, sigue sin enlazar');
  assert.deepEqual(decide(['362O9ITL9D', '9N7R477WCK']), { atc: 'N02AJ13', rule: 'gsrs:unique+rxnav' });
  assert.equal(combineLinks({ status: 'linked', atc: 'X01XX01', rule: 'unique', candidates: [] }, ['Y01YY01']).rule, 'conflict:gsrs-vs-rxnav');
  assert.equal(combineLinks({ status: 'ambiguous', atc: null, candidates: ['A'] }, ['B']).rule, 'conflict:rxnav-outside-gsrs-candidates');
});

test('desempate GSRS/RxNav por los ATC que la AEMPS usa en medicamentos autorizados', () => {
  const g = { status: 'linked', atc: 'L01XC02', rule: 'unique', candidates: ['L01XC02'] };
  assert.deepEqual(combineLinks(g, ['L01FA01'], { inUse: new Set(['L01FA01']) }), { atc: 'L01FA01', rule: 'rxnav-over-gsrs:aemps-in-use' });
  assert.deepEqual(combineLinks(g, ['L01FA01'], { inUse: new Set(['L01XC02']) }), { atc: 'L01XC02', rule: 'gsrs-over-rxnav:aemps-in-use' });
  assert.deepEqual(combineLinks(g, ['L01FA01'], { inUse: new Set(['L01XC02', 'L01FA01']) }), { atc: null, rule: 'conflict:gsrs-vs-rxnav' });
  assert.deepEqual(combineLinks(g, ['L01FA01']), { atc: null, rule: 'conflict:gsrs-vs-rxnav' }, 'sin CIMA no se desempata');
});

// --- EMA real: informe «Medicines output» generado el 24/10/2026 18:10 (filas recortadas) ---------
import { emaDate, emaIndicationSection, emaRecords, isHumanAuthorised, reportGeneratedAt } from '../lib/ema.mjs';

test('EMA real: sólo uso humano autorizado, ATC 5 asignado por la EMA, indicación literal citando a la EMA', () => {
  const rows = read('ema-medicines-real.json');
  assert.equal(reportGeneratedAt(rows), '2026-10-24T18:10');
  const recs = emaRecords(rows);
  assert.deepEqual(recs.map((r) => [r.productNumber, isHumanAuthorised(r), r.atc5]), [
    ['EMEA/H/C/003737', true, ['J02AC03']],
    ['EMEA/H/C/005333', true, []],
    ['EMEA/H/C/000088', true, ['A10AB04', 'A10AD04']],
    ['EMEA/H/C/004136', false, ['J06BB21']],
    ['EMEA/V/C/006713', false, []],
  ]);
  const s = assertSection(emaIndicationSection(recs[0], WHEN));
  assert.equal(s.source, 'ema-epar');
  assert.equal(s.language, 'en');
  assert.equal(s.text, String(rows[2][rows[1].indexOf('Therapeutic indication')]).trim(), 'literal');
  assert.equal(s.document.id, 'EMEA/H/C/003737');
  assert.equal(s.document.effectiveDate, '2026-10-23');
  assert.match(s.license, /provided that EMA is always acknowledged as the source/);
  assert.match(s.citation, /^European Medicines Agency \(EMA\)\. Voriconazole Hikma/);
  assert.equal(emaDate('2026-10-23'), null, 'otra forma de fecha: no se adivina');
});
