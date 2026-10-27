// Farmacología clínica · EMA (datos abiertos de medicamentos), contra registros REALES del archivo
// https://www.ema.europa.eu/en/documents/report/medicines-output-medicines_json-report_en.json
// descargado el 2026-10-27 (fixtures/ema/medicines-sample.json: ocho registros completos, sin tocar).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EMA_DATA_URL, emaAtcCodes, emaByAtc5, emaDate, emaProductsSummary, emaReferenceRecords, emaSections } from '../lib/ema.mjs';
import { assertSection } from '../lib/monograph.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = JSON.parse(readFileSync(join(HERE, 'fixtures', 'ema', 'medicines-sample.json'), 'utf8'));
const PROVENANCE = { retrievedAt: '2026-10-27T23:00:00.000Z', sha256: 'a'.repeat(64), timestamp: '2026-10-27T18:19:10Z' };

test('EMA real: fechas y códigos ATC tal como los publica el archivo', () => {
  assert.equal(emaDate('27/10/2026'), '2026-10-27');
  assert.equal(emaDate(''), null);
  assert.equal(emaDate('2026-10-27'), null, 'otra forma → null, no se adivina');
  const humalog = FILE.data.find((r) => r.name_of_medicine === 'Humalog');
  assert.deepEqual(emaAtcCodes(humalog), ['A10AB04', 'A10AD04']);
});

test('EMA real: sólo humanos autorizados y sólo igualdad exacta con un ATC 5', () => {
  const { byAtc, skipped, total } = emaByAtc5(FILE);
  assert.equal(total, 8);
  assert.deepEqual([...byAtc.keys()].sort(), ['A10AB04', 'A10AD04', 'A10BD16', 'L01EA01']);
  assert.deepEqual(skipped, { notHuman: 1, notAuthorised: 1, withoutAtc5: 1 }, 'veterinario, retirado, y «A05» (nivel 2) quedan fuera');
  assert.equal(byAtc.get('A10AB04')[0].name_of_medicine, 'Humalog', 'un medicamento con dos ATC aparece en los dos');
  assert.equal(byAtc.get('A10AD04')[0].name_of_medicine, 'Humalog');
});

test('EMA real: una indicación de referencia por sustancia activa; el no genérico primero', () => {
  const imatinib = emaByAtc5(FILE).byAtc.get('L01EA01');
  assert.equal(imatinib.length, 3);
  const refs = emaReferenceRecords(imatinib);
  assert.equal(refs.length, 1, 'misma sustancia activa: un documento');
  assert.equal(refs[0].record.name_of_medicine, 'Glivec');
  assert.equal(refs[0].group.candidates, 3);
  assert.deepEqual(emaProductsSummary(imatinib).map((p) => `${p.name}:${p.generic}`).sort(), ['Glivec:false', 'Imatinib Accord:true', 'Imatinib Teva:true']);
  assert.ok(emaProductsSummary(imatinib).every((p) => /^EMEA\/H\/C\/\d+$/.test(p.emaProductNumber) && p.url?.startsWith('https://www.ema.europa.eu/')));
});

test('EMA real: la sección es la indicación terapéutica literal, en inglés, con documento, versión, URL y cita', () => {
  const rec = emaByAtc5(FILE).byAtc.get('A10BD16')[0];
  const ref = emaReferenceRecords([rec])[0];
  const rows = emaSections(rec, ref, PROVENANCE).map(assertSection);
  assert.equal(rows.length, 1);
  const [s] = rows;
  assert.equal(s.key, 'indications');
  assert.equal(s.language, 'en');
  assert.equal(s.text, rec.therapeutic_indication.trim(), 'sin traducir ni reformatear');
  assert.equal(s.document.id, 'EMEA/H/C/002656');
  assert.equal(s.document.version, rec.revision_number);
  assert.equal(s.document.effectiveDate, emaDate(rec.last_updated_date));
  assert.equal(s.document.url, rec.medicine_url);
  assert.equal(s.section.number, 'therapeutic_indication');
  assert.equal(s.section.apiUrl, EMA_DATA_URL);
  assert.match(s.license, /for non-commercial and commercial purposes|fines comerciales y no comerciales/);
  assert.match(s.citation, /Vokanamet \(EMEA\/H\/C\/002656\)/);
  assert.match(s.citation, /sha256 aaaaaaaaaaaaaaaa/);
  assert.deepEqual(emaSections({ ...rec, therapeutic_indication: '' }, ref, PROVENANCE), [], 'sin texto no hay fila');
});
