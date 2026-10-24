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
