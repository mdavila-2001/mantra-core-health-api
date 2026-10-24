// Farmacología clínica · openFDA y RxNav.
//
// ATENCIÓN: a diferencia de cima-monograph.test.mjs, acá NO hay respuestas
// reales (la sesión que escribió el importador no alcanzaba api.fda.gov ni
// rxnav.nlm.nih.gov). Los objetos de abajo reproducen SÓLO LA FORMA documentada
// de cada API, con textos de relleno «SYNTHETIC …» y códigos ficticios
// (UNII «TESTUNII01»…, RxCUI 9000001…) que no existen en ninguna fuente. Prueban
// las reglas de selección y de procedencia, no el contenido. Antes de la primera
// carga real hay que agregar una partición y respuestas reales como fixtures.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { assertSection } from '../lib/monograph.mjs';
import { effectiveDate, labelIdentity, openFdaSections, referenceLabels } from '../lib/openfda.mjs';
import { atcBridge, parseRelatedIn, parseRxcuiByAtc, parseUnii } from '../lib/rxnorm.mjs';

const WHEN = '2026-10-24T00:00:00.000Z';

const label = (over = {}) => ({
  id: 'spl-version-a',
  set_id: 'set-a',
  version: '7',
  effective_time: '20250115',
  indications_and_usage: ['SYNTHETIC indications paragraph 1.', 'SYNTHETIC indications paragraph 2.'],
  dosage_and_administration: ['SYNTHETIC posology.'],
  adverse_reactions: ['SYNTHETIC adverse reactions.'],
  adverse_reactions_table: ['<table><tr><td>SYNTHETIC term</td><td>SYNTHETIC frequency</td></tr></table>'],
  precautions: ['SYNTHETIC precautions.'],
  warnings: ['SYNTHETIC warnings.'],
  spl_unclassified_section: ['SYNTHETIC not mapped.'],
  openfda: { product_type: ['HUMAN PRESCRIPTION DRUG'], unii: ['TESTUNII01'], route: ['ORAL'], brand_name: ['SYNTHETICBRAND'], manufacturer_name: ['SYNTHETIC LABS'] },
  ...over,
});

test('openFDA: fecha efectiva literal e identidad de la etiqueta', () => {
  assert.equal(effectiveDate({ effective_time: '20250115' }), '2025-01-15');
  assert.equal(effectiveDate({ effective_time: '2025' }), null);
  const id = labelIdentity(label());
  assert.deepEqual(id.unii, ['TESTUNII01']);
  assert.equal(id.productType, 'HUMAN PRESCRIPTION DRUG');
});

test('openFDA: referencia por conjunto EXACTO de UNII y vía; la más reciente; Rx antes que OTC', () => {
  const ids = [
    labelIdentity(label()),
    labelIdentity(label({ id: 'b', set_id: 'set-b', effective_time: '20240101' })),
    labelIdentity(label({ id: 'c', set_id: 'set-c', openfda: { product_type: ['HUMAN PRESCRIPTION DRUG'], unii: ['TESTUNII01', 'TESTUNII02'], route: ['ORAL'] } })),
    labelIdentity(label({ id: 'd', set_id: 'set-d', openfda: { product_type: ['HUMAN PRESCRIPTION DRUG'], unii: ['TESTUNII01'], route: ['INTRAVENOUS'] } })),
    labelIdentity(label({ id: 'e', set_id: 'set-e', effective_time: '20990101', openfda: { product_type: ['HUMAN OTC DRUG'], unii: ['TESTUNII01'], route: ['ORAL'] } })),
  ];
  const refs = referenceLabels(ids, ['TESTUNII01']);
  assert.deepEqual(refs.map((r) => [r.group.routes, r.identity.setId]), [
    ['INTRAVENOUS', 'set-d'],
    ['ORAL', 'set-a'],
  ]);
  assert.equal(refs[1].group.candidates, 2, 'la combinación de dos UNII no cuenta como candidata');
  const otcOnly = referenceLabels([ids[4]], ['TESTUNII01']);
  assert.equal(otcOnly[0].identity.setId, 'set-e');
  assert.match(otcOnly[0].criterion, /no hay de prescripción/);
});

test('openFDA: una fila por campo, en inglés, sin unir campos distintos; campos no mapeados se ignoran', () => {
  const ref = referenceLabels([labelIdentity(label())], ['TESTUNII01'])[0];
  const rows = openFdaSections(label(), ref, WHEN).map(assertSection);
  assert.deepEqual(rows.map((r) => r.section.number), ['indications_and_usage', 'dosage_and_administration', 'warnings', 'precautions', 'adverse_reactions']);
  assert.deepEqual(rows.map((r) => r.key), ['indications', 'posology', 'warnings', 'warnings', 'adverse_reactions']);
  const ind = rows[0];
  assert.equal(ind.language, 'en');
  assert.equal(ind.text, 'SYNTHETIC indications paragraph 1.\n\nSYNTHETIC indications paragraph 2.');
  assert.equal(ind.document.id, 'set-a');
  assert.equal(ind.document.version, '7');
  assert.equal(ind.document.effectiveDate, '2025-01-15');
  assert.match(ind.citation, /set_id set-a, versión 7 \(effective_time 2025-01-15\), campo «indications_and_usage»/);
  assert.match(ind.license, /CC0/);
  assert.deepEqual(rows[4].tables[0].rows[0].map((c) => c.text), ['SYNTHETIC term', 'SYNTHETIC frequency']);
});

test('RxNav: parsers defensivos — forma desconocida → vacío, nunca un código adivinado', () => {
  assert.deepEqual(parseRxcuiByAtc({ idGroup: { rxnormId: ['9000002', '9000001', 'x'] } }), ['9000001', '9000002']);
  assert.deepEqual(parseRxcuiByAtc({}), []);
  assert.deepEqual(parseUnii({ propConceptGroup: { propConcept: [{ propName: 'UNII_CODE', propValue: 'TESTUNII01' }, { propName: 'UNII_CODE', propValue: 'bad' }] } }), ['TESTUNII01']);
  assert.deepEqual(parseRelatedIn({ relatedGroup: { conceptGroup: [{ tty: 'IN', conceptProperties: [{ rxcui: '9000003' }] }, { tty: 'PIN' }] } }), ['9000003']);
});

test('RxNav: un MIN se resuelve a sus IN; si a un ingrediente le falta UNII, el puente queda sin UNII', () => {
  const r = {
    byAtc: { idGroup: { rxnormId: ['9000010'] } },
    properties: { 9000010: { properties: { rxcui: '9000010', name: 'SYNTHETIC MIN', tty: 'MIN' } } },
    relatedIn: { 9000010: { relatedGroup: { conceptGroup: [{ tty: 'IN', conceptProperties: [{ rxcui: '9000011' }, { rxcui: '9000012' }] }] } } },
    unii: {
      9000011: { propConceptGroup: { propConcept: [{ propName: 'UNII_CODE', propValue: 'TESTUNII11' }] } },
      9000012: { propConceptGroup: { propConcept: [{ propName: 'UNII_CODE', propValue: 'TESTUNII12' }] } },
    },
  };
  const ok = atcBridge('Z99ZZ99', r);
  assert.deepEqual(ok.ingredients, ['9000011', '9000012']);
  assert.deepEqual(ok.unii, ['TESTUNII11', 'TESTUNII12']);
  assert.equal(ok.complete, true);
  const partial = atcBridge('Z99ZZ99', { ...r, unii: { 9000011: r.unii[9000011] } });
  assert.deepEqual(partial.unii, []);
  assert.equal(partial.complete, false);
});

test('pack-data: parte el NDJSON en trozos gzip bajo el tope sin perder ni reordenar filas', async () => {
  const { gunzipSync } = await import('node:zlib');
  const { splitNdjson } = await import('../pack-data.mjs');
  const rows = Array.from({ length: 300 }, (_, i) => JSON.stringify({ i, pad: `${i}`.repeat(50) + Math.random().toString(36) }));
  const parts = splitNdjson(rows.join('\n') + '\n', 2048);
  assert.ok(parts.length > 1);
  for (const p of parts) assert.ok(p.gz.length <= 2048 || p.rows === 1);
  const back = parts.flatMap((p) => gunzipSync(p.gz).toString('utf8').split('\n').filter(Boolean));
  assert.deepEqual(back, rows);
});
