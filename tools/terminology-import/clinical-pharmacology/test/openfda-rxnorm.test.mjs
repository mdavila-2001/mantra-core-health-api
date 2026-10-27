// Farmacología clínica · openFDA y RxNav, contra datos REALES.
//
// Fixtures (validación del 2026-10-27, cuando por primera vez hubo red):
//   fixtures/rxnav/*.json     respuestas literales de https://rxnav.nlm.nih.gov/REST (un archivo por pedido)
//   fixtures/openfda/labels.json   cuatro etiquetas reales de las particiones de download.open.fda.gov, RECORTADAS POR
//                                  CAMPO (se omiten campos enteros; los valores que quedan están sin tocar)
//   fixtures/openfda/drug-label-fixture.json.zip   las mismas cuatro en el formato de partición `{ meta, results[] }`
//
// Lo único que no es dato real son las etiquetas derivadas que cada test declara («derivada de…») para ejercitar
// la regla de selección (Rx contra OTC, fecha más reciente, vía), y están marcadas como tales.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertSection } from '../lib/monograph.mjs';
import { effectiveDate, labelCoversIngredients, labelIdentity, openFdaPharmClasses, openFdaSections, referenceLabels } from '../lib/openfda.mjs';
import { parseLabel, streamLabelObjects } from '../lib/openfda-stream.mjs';
import { atcBridge, ingredientUnii, parseProperties, parseRelatedIn, parseRelatedPin, parseRxcuiByAtc, parseUnii } from '../lib/rxnorm.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const rx = (name) => JSON.parse(readFileSync(join(HERE, 'fixtures', 'rxnav', `${name}.json`), 'utf8'));
const LABELS = JSON.parse(readFileSync(join(HERE, 'fixtures', 'openfda', 'labels.json'), 'utf8'));
const ZIP = join(HERE, 'fixtures', 'openfda', 'drug-label-fixture.json.zip');
const WHEN = '2026-10-27T00:00:00.000Z';

const METFORMIN = LABELS['d5228e81-9c86-4781-b984-20feaa2ae779']; // Rx, oral, 1 UNII
const PARACETAMOL = LABELS['7f445de3-30cf-4bd8-892d-05979cd399e7']; // OTC, oral, 1 UNII
const CODEINE_APAP = LABELS['eadc80fa-13c3-471a-a22f-6fe7e1ab290f']; // Rx, oral, 2 UNII (la sal de la codeína)
const OXY_APAP = LABELS['40a68a27-4422-5ba0-e063-6294a90ac550']; // Rx, oral, 2 UNII (la sal de la oxicodona)

/** Respuestas reales de RxNav de un ATC, armadas por RxCUI como las deja fetch-rxnorm en la caché. */
function bridgeFromFixtures(atc, { relatedIn = [], pins = [], extraIds = [] } = {}) {
  const byAtc = rx(`by-atc-${atc}`);
  const ids = new Set([...parseRxcuiByAtc(byAtc), ...extraIds]);
  const r = { byAtc, properties: {}, relatedIn: {}, relatedPin: {}, unii: {} };
  for (const id of ids) {
    r.properties[id] = rx(`properties-${id}`);
    r.unii[id] = rx(`unii-${id}`);
  }
  for (const id of relatedIn) r.relatedIn[id] = rx(`related-in-${id}`);
  for (const id of pins) {
    r.relatedPin[id] = rx(`related-pin-${id}`);
    for (const pin of parseRelatedPin(r.relatedPin[id])) {
      try {
        r.unii[pin.rxcui] = rx(`unii-${pin.rxcui}`);
      } catch {
        /* el fixture sólo trae los PIN que el test necesita */
      }
    }
  }
  return { r, bridge: atcBridge(atc, r) };
}

test('RxNav real: parsers de ATC → RxCUI, propiedades, UNII y relaciones', () => {
  assert.deepEqual(parseRxcuiByAtc(rx('by-atc-N02BE01')), ['161']);
  assert.deepEqual(parseRxcuiByAtc(rx('by-atc-inexistente')), [], 'un ATC que RxNorm no mapea responde {"idGroup":{}}');
  assert.deepEqual(parseProperties(rx('properties-161')), { rxcui: '161', name: 'acetaminophen', tty: 'IN' });
  assert.deepEqual(parseUnii(rx('unii-161')), ['362O9ITL9D']);
  assert.deepEqual(parseUnii(rx('unii-817579')), [], 'un MIN no tiene UNII: la respuesta real es {}');
  assert.deepEqual(parseRelatedIn(rx('related-in-817579')), ['161', '2670']);
  assert.deepEqual(parseRelatedPin(rx('related-pin-7804')).map((p) => [p.rxcui, p.name]), [['82063', 'oxycodone hydrochloride'], ['159821', 'oxycodone terephthalate']]);
  assert.deepEqual(parseRelatedPin(rx('related-pin-161')), [], 'paracetamol no tiene PIN: el grupo PIN viene sin conceptProperties');
});

test('RxNav: parsers defensivos — forma desconocida → vacío, nunca un código adivinado', () => {
  assert.deepEqual(parseRxcuiByAtc({}), []);
  assert.deepEqual(parseRxcuiByAtc({ idGroup: { rxnormId: ['x'] } }), []);
  assert.deepEqual(parseUnii({ propConceptGroup: { propConcept: [{ propName: 'UNII_CODE', propValue: 'bad' }] } }), []);
  assert.deepEqual(parseRelatedPin(null), []);
  assert.equal(parseProperties({}), null);
});

test('RxNav real: IN simple, IN con sales (PIN), combinación (MIN→IN) y PIN mapeado directo', () => {
  const apap = bridgeFromFixtures('N02BE01', { pins: ['161'] }).bridge;
  assert.deepEqual(apap.ingredients.map((i) => [i.rxcui, i.tty, i.name, i.unii, i.pins.length]), [['161', 'IN', 'acetaminophen', ['362O9ITL9D'], 0]]);
  assert.equal(apap.complete, true);

  const oxy = bridgeFromFixtures('N02AA05', { pins: ['7804'], extraIds: ['82063', '159821'] }).bridge;
  assert.deepEqual(oxy.ingredients[0].unii, ['CD35PMG570'], 'el UNII del IN es el de la BASE');
  assert.deepEqual(ingredientUnii(oxy.ingredients[0]), ['C1ENJ2TE6C', 'CD35PMG570', 'M04XWV43UF'], 'y los de sus sales vienen de los PIN de RxNorm');

  const combo = bridgeFromFixtures('N02AJ06', { relatedIn: ['817579'], pins: ['161', '2670'], extraIds: ['161', '2670'] }).bridge;
  assert.deepEqual(combo.ingredients.map((i) => i.rxcui), ['161', '2670']);
  assert.ok(ingredientUnii(combo.ingredients[1]).includes('GSL05Y1MN6'), 'fosfato de codeína (PIN 2672)');
  assert.equal(combo.complete, true);

  const pin = bridgeFromFixtures('J01CE09').bridge;
  assert.deepEqual(pin.ingredients.map((i) => [i.rxcui, i.tty, i.unii]), [['7983', 'PIN', ['17R794ESYN']]], 'RxNorm mapea este ATC a un PIN: no se busca otro ingrediente');
});

test('RxNav: si a un ingrediente le falta todo UNII, el puente queda incompleto (no empareja etiquetas)', () => {
  const { r } = bridgeFromFixtures('N02AJ06', { relatedIn: ['817579'], pins: ['161', '2670'], extraIds: ['161', '2670'] });
  const sinCodeina = { ...r, unii: { 161: r.unii[161] }, relatedPin: { 161: r.relatedPin[161] } };
  const b = atcBridge('N02AJ06', sinCodeina);
  assert.equal(b.complete, false);
});

test('openFDA real: identidad de la etiqueta y fecha efectiva literal', () => {
  assert.equal(effectiveDate({ effective_time: '20260909' }), '2026-09-09');
  assert.equal(effectiveDate({ effective_time: '2026' }), null);
  const id = labelIdentity(METFORMIN);
  assert.equal(id.setId, 'd5228e81-9c86-4781-b984-20feaa2ae779');
  assert.equal(id.productType, 'HUMAN PRESCRIPTION DRUG');
  assert.deepEqual(id.unii, ['786Z46389E']);
  assert.deepEqual(id.routes, ['ORAL']);
  assert.deepEqual(labelIdentity(CODEINE_APAP).unii, ['362O9ITL9D', 'GSL05Y1MN6']);
});

test('openFDA + RxNav reales: una etiqueta cubre los ingredientes del ATC por UNII propio o de la sal, y nunca una combinación a medias', () => {
  const apap = bridgeFromFixtures('N02BE01', { pins: ['161'] }).bridge;
  const oxy = bridgeFromFixtures('N02AA05', { pins: ['7804'], extraIds: ['82063', '159821'] }).bridge;
  // Oxicodona + paracetamol como dos ingredientes (IN 7804 y 161): RxNorm no mapea N02AJ17, así que se arma con los dos IN reales.
  const oxyR = bridgeFromFixtures('N02AA05', { pins: ['7804'], extraIds: ['82063', '159821'] }).r;
  const apapR = bridgeFromFixtures('N02BE01', { pins: ['161'] }).r;
  const oxyApap = atcBridge('oxi+para', { byAtc: { idGroup: { rxnormId: ['7804', '161'] } }, properties: { ...oxyR.properties, ...apapR.properties }, relatedIn: {}, relatedPin: { ...oxyR.relatedPin, ...apapR.relatedPin }, unii: { ...oxyR.unii, ...apapR.unii } });
  const combo = bridgeFromFixtures('N02AJ06', { relatedIn: ['817579'], pins: ['161', '2670'], extraIds: ['161', '2670'] }).bridge;
  const covers = (label, bridge) => labelCoversIngredients(labelIdentity(label).unii, bridge.ingredients.map(ingredientUnii));

  assert.equal(covers(PARACETAMOL, apap), true);
  assert.equal(covers(PARACETAMOL, combo), false, 'paracetamol solo no es codeína + paracetamol');
  assert.equal(covers(CODEINE_APAP, combo), true, 'la etiqueta lista la SAL (GSL05Y1MN6): el PIN de RxNorm la enlaza con la codeína');
  assert.equal(covers(CODEINE_APAP, apap), false, 'la combinación no empareja con el ATC de un solo ingrediente');
  assert.equal(covers(OXY_APAP, oxyApap), true, 'clorhidrato de oxicodona (C1ENJ2TE6C) es PIN de la oxicodona');
  assert.equal(covers(OXY_APAP, oxy), false);
  assert.equal(covers(OXY_APAP, combo), false);
  assert.equal(labelCoversIngredients([], [['X']]), false);
  // Sin los PIN (el comportamiento anterior) la etiqueta de la combinación con codeína NO emparejaría: es el hueco que mostró el dato real.
  const sinPin = combo.ingredients.map((i) => i.unii);
  assert.equal(labelCoversIngredients(labelIdentity(CODEINE_APAP).unii, sinPin), false);
});

test('openFDA: referencia por vías; la más reciente; Rx antes que OTC (etiquetas derivadas de las reales)', () => {
  const derive = (label, over, openfda = {}) => ({ ...label, ...over, openfda: { ...label.openfda, ...openfda } });
  const ids = [
    labelIdentity(METFORMIN), // 2026-09-09, ORAL, Rx
    labelIdentity(derive(METFORMIN, { id: 'derivada-b', set_id: 'set-b', effective_time: '20240101' })),
    labelIdentity(derive(METFORMIN, { id: 'derivada-c', set_id: 'set-c' }, { route: ['INTRAVENOUS'] })),
    labelIdentity(derive(METFORMIN, { id: 'derivada-e', set_id: 'set-e', effective_time: '20990101' }, { product_type: ['HUMAN OTC DRUG'] })),
  ];
  const refs = referenceLabels(ids, ['6809']);
  assert.deepEqual(refs.map((r) => [r.group.routes, r.identity.setId]), [
    ['INTRAVENOUS', 'set-c'],
    ['ORAL', 'd5228e81-9c86-4781-b984-20feaa2ae779'],
  ]);
  assert.equal(refs[1].group.candidates, 2, 'la OTC no cuenta mientras haya de prescripción');
  assert.deepEqual(refs[1].group.ingredients, ['6809']);
  const otcOnly = referenceLabels([ids[3]], ['6809']);
  assert.equal(otcOnly[0].identity.setId, 'set-e');
  assert.match(otcOnly[0].criterion, /no hay de prescripción/);
  assert.deepEqual(referenceLabels([labelIdentity(PARACETAMOL)], ['161']).map((r) => r.identity.setId), ['7f445de3-30cf-4bd8-892d-05979cd399e7'], 'real: paracetamol sólo tiene etiquetas OTC');
});

test('openFDA real (metformina): una fila por campo, en inglés, texto literal, tabla con su título', () => {
  const ref = referenceLabels([labelIdentity(METFORMIN)], ['6809'])[0];
  const rows = openFdaSections(METFORMIN, ref, WHEN).map(assertSection);
  const byNumber = Object.fromEntries(rows.map((r) => [r.section.number, r]));
  assert.deepEqual(Object.keys(byNumber).sort(), ['adverse_reactions', 'boxed_warning', 'contraindications', 'dosage_and_administration', 'drug_interactions', 'geriatric_use', 'indications_and_usage', 'mechanism_of_action', 'overdosage', 'pediatric_use', 'pregnancy']);
  assert.deepEqual(
    [byNumber.indications_and_usage.key, byNumber.dosage_and_administration.key, byNumber.overdosage.key, byNumber.pediatric_use.key, byNumber.geriatric_use.key, byNumber.pregnancy.key],
    ['indications', 'posology', 'overdose', 'pediatric_use', 'geriatric_use', 'pregnancy_lactation'],
  );
  const ind = byNumber.indications_and_usage;
  assert.equal(ind.language, 'en');
  assert.equal(ind.text, METFORMIN.indications_and_usage.join('\n\n'), 'texto = los párrafos de la etiqueta, sin tocar');
  assert.equal(ind.document.id, 'd5228e81-9c86-4781-b984-20feaa2ae779');
  assert.equal(ind.document.version, '3');
  assert.equal(ind.document.effectiveDate, '2026-09-09');
  assert.match(ind.citation, /set_id d5228e81-9c86-4781-b984-20feaa2ae779, versión 3 \(effective_time 2026-09-09\), campo «indications_and_usage»/);
  assert.match(ind.license, /CC0/);
  const ar = byNumber.adverse_reactions;
  assert.equal(ar.tables.length, 1);
  assert.match(ar.tables[0].caption, /^Table 1: Adverse Reactions from Clinical Trials of Metformin HCl Extended-Release Tablets/);
  assert.deepEqual(ar.tables[0].rows[0].map((c) => c.text), ['Adverse Reaction', 'Metformin HCl Extended-Release Tablets (n=781)', 'Placebo (n=195)']);
  assert.equal(ind.selection.group.routes, 'ORAL');
  assert.equal(openFdaSections(METFORMIN, null, WHEN)[0].selection, null, 'sin ref, la selección la completa el armado por ATC');
});

test('openFDA real (formato antiguo): precautions y dependencia se mapean cada uno a su fila; campos no mapeados se ignoran', () => {
  const rows = openFdaSections(OXY_APAP, null, WHEN).map(assertSection);
  assert.deepEqual(rows.map((r) => [r.section.number, r.key]).sort(), [
    ['contraindications', 'contraindications'],
    ['drug_abuse_and_dependence', 'abuse_dependence'],
    ['indications_and_usage', 'indications'],
    ['overdosage', 'overdose'],
    ['precautions', 'warnings'],
  ]);
});

test('openFDA real: clases farmacológicas EPC/MoA tal como las publica la etiqueta; sin clases → null', () => {
  const pc = openFdaPharmClasses(METFORMIN, WHEN);
  if (METFORMIN.openfda.pharm_class_epc) assert.deepEqual(pc.epc, METFORMIN.openfda.pharm_class_epc);
  else assert.equal(pc, null);
  assert.equal(openFdaPharmClasses(PARACETAMOL, WHEN), null);
});

test('openFDA real: lectura en flujo de una partición ZIP, en el formato de download.open.fda.gov', async () => {
  const all = [];
  for await (const { ordinal, raw } of streamLabelObjects(ZIP)) all.push([ordinal, parseLabel(raw)]);
  assert.deepEqual(all.map(([o]) => o), [0, 1, 2, 3]);
  assert.deepEqual(all.map(([, l]) => l.set_id), ['d5228e81-9c86-4781-b984-20feaa2ae779', '7f445de3-30cf-4bd8-892d-05979cd399e7', 'eadc80fa-13c3-471a-a22f-6fe7e1ab290f', '40a68a27-4422-5ba0-e063-6294a90ac550']);
  for (const [, l] of all) assert.deepEqual(l, LABELS[l.set_id], 'cada elemento se recorta y parsea sin alterar nada (llaves y comillas dentro de cadenas incluidas)');
  const only = [];
  for await (const { ordinal, raw } of streamLabelObjects(ZIP, (o) => o === 2)) only.push([ordinal, parseLabel(raw).set_id]);
  assert.deepEqual(only, [[2, 'eadc80fa-13c3-471a-a22f-6fe7e1ab290f']]);
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
