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

// --- DailyMed real: SPL de ZEGFROVY (set_id 349fa84e…, versión 1, effective 2026-09-16) ---------
import { readFileSync as readRaw } from 'node:fs';
import { dailyMedSections, splIdentity, topSections } from '../lib/dailymed.mjs';

test('DailyMed real: identidad, UNII del principio activo y secciones LOINC de primer nivel, literales', () => {
  const xml = readRaw(join(HERE, 'fixtures', 'dailymed-spl-349fa84e.xml'), 'utf8');
  const id = splIdentity(xml);
  assert.deepEqual([id.setId, id.version, id.effectiveDate, id.docType, id.unii, id.routes], ['349fa84e-1fdb-4976-b1bb-689b80eac8ad', '1', '2026-09-16', '34391-3', ['L1Q2K5JYO8'], ['ORAL']]);
  const rows = dailyMedSections(xml, { criterion: 'prueba', group: {} }, WHEN).map(assertSection);
  assert.deepEqual(rows.map((r) => r.section.number), ['34067-9', '34068-7', '43678-2', '34070-3', '43685-7', '34084-4', '34073-7', '43684-0', '34089-3', '34090-1', '43680-8']);
  const tops = topSections(xml).filter((s) => s.code === '34067-9');
  assert.equal(tops.length, 1, 'una sola sección de indicaciones de primer nivel');
  assert.match(rows[0].text, /^1\. INDICATIONS AND USAGE\n\nZEGFROVY is indicated for the treatment of adult patients/);
  assert.ok(rows.find((r) => r.key === 'adverse_reactions').tables.length > 0);
  assert.match(rows[0].citation, /set_id 349fa84e-1fdb-4976-b1bb-689b80eac8ad, versión 1 \(effective_time 2026-09-16\), sección LOINC 34067-9/);
});

// --- OMS eEML real: JSON-LD de recomendaciones 17, 41 y 143 (consultadas el 2026-10-24) -------------
import { EML_SOURCE, emlRecommendation, emlSections, isCurrentRecommendation, recommendationIdsFromHome } from '../lib/eml.mjs';

test('eEML real: ATC 5 asignado por la OMS, indicación CIE-11 y formulaciones literales, sin ATC no se enlaza', () => {
  const raw = read('eml-recommendations-real.json');
  const atropine = emlRecommendation('41', raw['41']);
  assert.deepEqual(atropine.atc5, ['A03BA01']);
  assert.equal(atropine.guidelineDate, '2025-05-09');
  assert.deepEqual(atropine.icd11, { code: 'PH53', uri: 'http://id.who.int/icd/entity/938040061' });
  assert.ok(isCurrentRecommendation(atropine));
  const [ind, forms] = emlSections(atropine, WHEN).map(assertSection);
  assert.equal(ind.source, EML_SOURCE);
  assert.equal(ind.key, 'indications');
  assert.equal(ind.text, 'Exposure to or harmful effects of undetermined intent of pesticides');
  assert.deepEqual(ind.codes, [{ system: 'ICD-11', code: 'PH53', uri: 'http://id.who.int/icd/entity/938040061' }]);
  assert.equal(ind.document.effectiveDate, '2025-05-09');
  assert.match(ind.license, /Licence: CC BY 3\.0 IGO/);
  assert.match(ind.disclaimer, /The PDF versions are the binding versions/);
  assert.equal(forms.key, 'pharmaceutical_form');
  assert.equal(forms.text, 'Parenteral > General injections > unspecified: 1 mg in 1 mL ampoule or vial (sulfate)');

  const iron = emlRecommendation('143', raw['143']);
  assert.deepEqual(iron.atc5, ['B03AA02', 'B03AA07'], 'varios ATC: cuenta en cada uno');
  const ironForms = emlSections(iron, WHEN).find((s) => s.key === 'pharmaceutical_form');
  assert.equal(ironForms.text, 'Oral > Liquid: 25 mg per  mL elemental iron; 9 mg per  mL elemental iron\n\nOral > Solid > tablet: 60 to 65 mg elemental iron', 'literal, doble espacio incluido');

  const codeine = emlRecommendation('17', raw['17']);
  assert.deepEqual(codeine.atc5, [], 'la OMS no asigna ATC a esta recomendación: no se enlaza por nombre');
  assert.deepEqual(recommendationIdsFromHome('<a href="https://list.essentialmeds.org/recommendations/41">x</a><a href="/recommendations/17">y</a><a href="/recommendations/41">'), [17, 41]);
});

// --- LactMed real: NXML del paquete de NCBI (actualizado 2026-10-22): LM514, LM995 y LM1337 ------------
import { LACTMED_SOURCE, accessionsFromSummary, lactmedIdentity, lactmedSections } from '../lib/lactmed.mjs';

test('LactMed real: identidad por UNII, secciones de lactancia literales con atribución de la NLM', () => {
  const xml = (id) => readRaw(join(HERE, 'fixtures', 'lactmed', `${id}.nxml`), 'utf8');
  assert.deepEqual(lactmedIdentity(xml('LM514')), { id: 'LM514', title: 'Colestipol', revised: '2026-07-15', unii: ['X7D10K905G'], casrn: '50925-79-6' });
  const rows = lactmedSections(xml('LM514'), WHEN, { accession: 'NBK501393' }).map(assertSection);
  assert.deepEqual(rows.map((r) => r.section.number), ['Summary of Use during Lactation', 'Drug Levels', 'Effects in Breastfed Infants', 'Effects on Lactation and Breastmilk', 'Alternate Drugs to Consider']);
  assert.ok(rows.every((r) => r.key === 'pregnancy_lactation' && r.source === LACTMED_SOURCE && r.language === 'en'));
  assert.equal(rows[0].text, "Colestipol is a nonabsorbable resin. Because it does not enter the mother's bloodstream, it will not reach the infant via breastmilk. It is acceptable for use during lactation.");
  assert.equal(rows[0].document.url, 'https://www.ncbi.nlm.nih.gov/books/NBK501393/');
  assert.equal(rows[0].document.effectiveDate, '2026-07-15');
  assert.match(rows[0].license, /Courtesy of the U\.S\. National Library of Medicine/);
  assert.match(rows[0].disclaimer, /not meant as a substitute for professional judgment/);
  assert.match(rows[1].text, /^Maternal Levels\. Relevant published information was not found as of the revision date\./, 'el rótulo en cursiva queda en el texto');
  assert.deepEqual(lactmedIdentity(xml('LM995')).unii, [], 'sin UNII: no se enlaza (se cuenta)');
  assert.deepEqual(lactmedIdentity(xml('LM1337')).unii, ['2XLN4Y044H', '7AXV542LZ4'], 'todos los UNII del registro; el puente los reduce a la fracción activa');
  const sum = { result: { uids: ['1', '2'], 1: { id: 'lactmed/chapter/LM514/PMC', book: 'lactmed', rtype: 'chapter', accessionid: 'NBK501393' }, 2: { id: 'lactmed/LM514.s1/PMC', book: 'lactmed', rtype: 'section', accessionid: 'NBK501393' } } };
  assert.deepEqual([...accessionsFromSummary(sum)], [['LM514', 'NBK501393']], 'sólo capítulos');
});

// --- LiverTox real: NXML del paquete de NCBI (actualizado 2026-10-21) + sustancia GSRS real de acarbosa ------
import { uniiForCas } from '../lib/gsrs.mjs';
import { LIVERTOX_SOURCE, livertoxIdentity, livertoxSections } from '../lib/livertox.mjs';

test('LiverTox real: CAS → UNII por el CAS PRIMARY del GSRS; sólo secciones hepáticas, literales', () => {
  const xml = (id) => readRaw(join(HERE, 'fixtures', 'livertox', `${id}.nxml`), 'utf8');
  const acarbose = gsrsEntry(read('gsrs-acarbose-real.json'));
  assert.deepEqual(acarbose.cas, ['56180-94-0'], 'sólo el CAS de tipo PRIMARY');
  const idx = buildGsrsIndex([acarbose]);
  assert.equal(uniiForCas('56180-94-0', idx), 'T58MSI464G');
  assert.equal(uniiForCas('00-00-0', idx), null, 'CAS desconocido: no se resuelve');
  assert.equal(uniiForCas('56180-94-0', buildGsrsIndex([acarbose, { ...acarbose, unii: 'XXXXXXXXXX', moiety: 'XXXXXXXXXX' }])), null, 'CAS de dos sustancias: no se elige');

  assert.deepEqual(livertoxIdentity(xml('Acarbose')), { id: 'Acarbose', title: 'Acarbose', updated: '2021-01-10', cas: ['56180-94-0'] });
  const rows = livertoxSections(xml('Acarbose'), WHEN, { accession: 'NBK548181' }).map(assertSection);
  assert.deepEqual(rows.map((r) => r.section.number), ['Hepatotoxicity', 'Mechanism of Injury', 'Outcome and Management'], 'Introduction y Background no se publican');
  assert.ok(rows.every((r) => r.key === 'adverse_reactions' && r.source === LIVERTOX_SOURCE && r.language === 'en'));
  assert.match(rows[0].text, /^In several large clinical trials, serum enzyme elevations above 3 times the upper limit of normal/);
  assert.equal(rows[0].document.url, 'https://www.ncbi.nlm.nih.gov/books/NBK548181/');
  assert.match(rows[0].license, /is copyright free/);
  assert.match(rows[0].disclaimer, /not meant as a substitute for FDA approved product labeling/);
  assert.deepEqual(livertoxIdentity(xml('Salicylates')).cas, [], 'ficha de clase sin CAS: no se enlaza');
});
