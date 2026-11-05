// TAREA-41 F4 — seguridad del fármaco con cita literal.
//
// Fixtures: respuestas literales de la API REST de CIMA (AEMPS), sin recortar,
// en `fixtures/cima-safety/<nregistro>-<sección>.json` con su `sourceUrl`
// (comparadas byte a byte con CIMA en vivo el 2026-10-26). LactMed: NXML real
// del paquete de NCBI que ya usa `clinical-pharmacology` (LM514, LM1337).
//
// Correr: node --test tools/terminology-import/test/

import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { lactmedSections } from '../clinical-pharmacology/lib/lactmed.mjs';
import { deterministicId } from '../lib/glossary-es/common.mjs';
import {
  FICHA_SECTIONS, ForbiddenSectionError, SAFETY_SECTIONS, assertAllowedSection, sectionPublicUrl, sectionRequests, sectionUrl, toSection,
} from '../lib/glossary-es/cima.mjs';
import {
  CLINICAL_TARGET_CATEGORIES, CURATED_REFERENCE, LACTATION_TERMS, MEDDRA_FREQUENCY, PREGNANCY_LACTATION_TERMS, SECTION_RELATION, UNMATCHED_COLUMNS,
  buildTermIndex, catalogDrugsByAtc, cimaSafety, fixedTarget, interactionSeverity, lactmedSafety, lactmedSummariesFromMonograph, safetyInputFromRow,
  safetySummary, unmatchedCsv,
} from '../lib/glossary-es/cima-safety.mjs';
import { conceptId } from '../lib/glossary-es/load-plan.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, 'fixtures', 'cima-safety');
const LACTMED_FIXTURES = join(HERE, '..', 'clinical-pharmacology', 'test', 'fixtures', 'lactmed');
const SOURCES = JSON.parse(readFileSync(join(HERE, '..', 'sources.json'), 'utf8')).sources;
const IMPORT_CIMA = readFileSync(join(HERE, '..', 'import-cima.mjs'), 'utf8');
/** Código del importador sin comentarios de línea (el encabezado documenta la forma de la URL). */
const IMPORT_CIMA_CODE = IMPORT_CIMA.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');

const fixture = (nregistro, section) => JSON.parse(readFileSync(join(FIXTURES, `${nregistro}-${section}.json`), 'utf8'));

/** Fixture → sección de entrada de `cimaSafety`, como la arma `safetyInputFromRow`. */
function sheet(nregistro, section) {
  const f = fixture(nregistro, section);
  return { section, html: f.response[0].contenido, nregistro, productName: f.productName, fichaDate: f.fichaTecnicaDate, retrievedAt: f.retrievedAt };
}

// Glosario de prueba: designaciones exactas como las de `terminology.concept_designations`.
const TERMS = [
  ['anafilaxis', 'disease'], ['embarazo', 'care'], ['lactancia', 'care'], ['diarrea', 'signs-symptoms'], ['náuseas', 'signs-symptoms'],
  ['vómitos', 'signs-symptoms'], ['candidiasis', 'disease'], ['urticaria', 'disease'], ['prurito', 'signs-symptoms'], ['anemia', 'disease'],
  ['convulsiones', 'signs-symptoms'], ['hepatitis', 'disease'], ['ictericia', 'signs-symptoms'], ['angioedema', 'disease'],
  ['penicilina', 'pharmacology'], ['hígado', 'anatomy'],
];
const term = (text) => `concepto:${text}`;
const clinicalIndex = buildTermIndex(TERMS.map(([text, categoryKey]) => ({ conceptId: term(text), text, categoryKey })), { categories: CLINICAL_TARGET_CATEGORIES });
const INGREDIENTS = ['amoxicilina', 'alopurinol', 'probenecid', 'metotrexato', 'warfarina', 'simvastatina', 'itraconazol', 'ciclosporina', 'gemfibrozilo', 'ácido fusídico'];
const ingredientIndex = buildTermIndex(INGREDIENTS.map((text) => ({ conceptId: term(text), text })));
const AMOXICILINA = { conceptId: term('amoxicilina'), slug: 'cima-vtm-27658006', name: 'Amoxicilina' };
const SIMVASTATINA = { conceptId: term('simvastatina'), slug: 'cima-vtm-96304005', name: 'Simvastatina' };

const amoxicilina = cimaSafety({ drug: AMOXICILINA, sections: SAFETY_SECTIONS.map((s) => sheet('62437', s)), clinicalIndex, ingredientIndex });
const simvastatina = cimaSafety({ drug: SIMVASTATINA, sections: ['4.3', '4.5', '4.8'].map((s) => sheet('65198', s)), clinicalIndex, ingredientIndex });

// --- Fixtures ----------------------------------------------------------------------

test('fixtures: respuestas reales de CIMA, < 50 KB, con su URL de origen', () => {
  const files = readdirSync(FIXTURES).filter((f) => f.endsWith('.json'));
  assert.equal(files.length, 7);
  for (const file of files) {
    const [nregistro, section] = file.replace('.json', '').split('-');
    const f = fixture(nregistro, section);
    assert.ok(statSync(join(FIXTURES, file)).size < 50 * 1024, file);
    assert.equal(f.sourceUrl, sectionUrl(nregistro, section), file);
    assert.equal(f.response[0].seccion, section, file);
    assert.ok(SAFETY_SECTIONS.includes(section), file);
  }
});

// --- F4.5: «Dosis: nunca» --------------------------------------------------------------

test('F4.5: la 4.2 no está en la lista blanca y ninguna variante pasa', () => {
  assert.ok(!FICHA_SECTIONS.includes('4.2'));
  assert.ok(Object.isFrozen(FICHA_SECTIONS));
  for (const bad of ['4.2', '4.2.1', ' 4.2', '4.2 ', 4.2, '4.20', null, undefined, '', '4', '4.7']) {
    assert.throws(() => assertAllowedSection(bad), ForbiddenSectionError, String(bad));
  }
});

test('F4.5: la 4.2 no se pide: ni URL de API, ni URL pública, ni pedido del producto', () => {
  assert.throws(() => sectionUrl('62437', '4.2'), ForbiddenSectionError);
  assert.throws(() => sectionPublicUrl('62437', '4.2'), ForbiddenSectionError);
  const requests = sectionRequests('62437');
  assert.deepEqual(requests.map((r) => r.section), [...FICHA_SECTIONS]);
  for (const r of requests) {
    assert.match(r.url, /&seccion=\d\.\d$/);
    assert.ok(!r.url.endsWith('seccion=4.2'), r.url);
  }
  // El importador pide secciones sólo por `sectionRequests`: no arma URLs propias ni nombra la 4.2.
  assert.ok(IMPORT_CIMA_CODE.includes('sectionRequests(ref.nregistro)'));
  assert.ok(!/seccion=/.test(IMPORT_CIMA_CODE));
  assert.ok(!/['"`]4\.2['"`]/.test(IMPORT_CIMA_CODE));
});

test('F4.5: la 4.2 no se lee: ni la respuesta, ni una fila vieja del glosario, ni el extractor', () => {
  const posology = [{ seccion: '4.2', titulo: 'Posología y forma de administración', contenido: '<p>MARCADOR-POSOLOGIA</p>', orden: 1 }];
  const ref = { nregistro: '62437', name: 'X', fichaTecnicaUrl: null, fichaTecnicaDate: null };
  assert.throws(() => toSection('4.2', posology, ref, '2026-10-26'), ForbiddenSectionError);
  const oldRow = { slug: 'cima-vtm-1', esName: 'X', drugFacts: { sections: [{ section: '4.2', html: '<p>MARCADOR-POSOLOGIA</p>', nregistro: '1' }] } };
  assert.throws(() => safetyInputFromRow(oldRow), ForbiddenSectionError);
  assert.throws(
    () => cimaSafety({ drug: AMOXICILINA, sections: [{ ...sheet('62437', '4.3'), section: '4.2' }], clinicalIndex, ingredientIndex }),
    ForbiddenSectionError,
  );
});

test('F4.5: el lector de LactMed descarta la posología que el corpus trae para profesionales', () => {
  const monograph = {
    code: 'J01CA04',
    sections: [
      { source: 'aemps-cima', key: 'posology', section: { number: '4.2' }, text: 'MARCADOR-POSOLOGIA', document: { id: '62437' } },
      { source: 'nlm-lactmed', key: 'pregnancy_lactation', section: { number: 'Drug Levels' }, text: 'Drug levels.', document: { id: 'LM13' } },
    ],
  };
  assert.deepEqual(lactmedSummariesFromMonograph(monograph), []);
});

test('F4.5: sources.json declara la misma lista blanca y la 4.2 prohibida', () => {
  assert.deepEqual(SOURCES['aemps-cima'].sections.allowed, [...FICHA_SECTIONS]);
  assert.deepEqual(SOURCES['aemps-cima'].sections.safety, [...SAFETY_SECTIONS]);
  assert.deepEqual(SOURCES['aemps-cima'].sections.forbidden, ['4.2']);
});

test('F4.5: ninguna cita cargable lleva una dosis (guardia del corte S3)', () => {
  const doseRejected = [...amoxicilina.unmatched, ...simvastatina.unmatched].filter((u) => u.reason.startsWith('dose-guard'));
  assert.ok(doseRejected.length > 0, 'las fichas reales traen oraciones con dosis en 4.5/4.8');
  const cited = new Set([...amoxicilina.relationships, ...simvastatina.relationships].map((r) => r.citationText));
  for (const u of doseRejected) assert.ok(!cited.has(u.sentence), u.sentence);
});

// --- F4.1: fuente y límite registrados antes de descargar --------------------------------

test('F4.1: términos de reutilización y límite de la AEMPS registrados y aplicados', () => {
  const cima = SOURCES['aemps-cima'];
  assert.match(cima.reuseTerms.quote, /Se autoriza la reproducción total o parcial de los contenidos de la web, siempre que se cite expresamente su origen\./);
  assert.match(cima.reuseTerms.quote, /fecha de la última actualización/);
  assert.equal(cima.evidenceTier, CURATED_REFERENCE);
  assert.equal(cima.rateLimit.policy.concurrency, 1);
  assert.ok(cima.rateLimit.policy.minIntervalMs >= 1000);
  // El importador toma la política de `sources.json`, no un número propio.
  assert.ok(IMPORT_CIMA.includes("sources['aemps-cima'].rateLimit.policy"));
  assert.ok(IMPORT_CIMA.includes('minDelayMs: REQUEST_POLICY.minIntervalMs'));
});

// --- F4.2: 4.3 → CONTRAINDICATED_IN -----------------------------------------------------------

const ofType = (result, section) => result.relationships.filter((r) => r.relationshipTypeConceptId === SECTION_RELATION[section].typeId);

test('F4.2 4.3: contraindicación sólo hacia un término exacto, con la oración literal', () => {
  const ci = ofType(amoxicilina, '4.3');
  assert.deepEqual(ci.map((r) => r.targetConceptId), [term('anafilaxis')]);
  assert.equal(
    ci[0].citationText,
    'Antecedentes de una reacción de hipersensibilidad inmediata grave (ej. anafilaxis) a otro agente beta-lactámico (p. ej. una cefalosporina, carbapenem o monobactam).',
  );
  assert.equal(ci[0].sourceConceptId, AMOXICILINA.conceptId);
  assert.equal(ci[0].evidenceTier, CURATED_REFERENCE);
  assert.equal(ci[0].validFrom, '2026-05-12', 'vigencia = fecha de la ficha');
  assert.match(ci[0].citationLocator, /nº reg\. 62437\), sección 4\.3, versión del 2026-05-12\. https:\/\/cima\.aemps\.es\/cima\/dochtml\/ft\/62437\/4\.3\/FichaTecnica\.html/);
  // «a cualquiera de las penicilinas» nombra un fármaco, no un estado: la categoría lo deja fuera.
  assert.ok(!amoxicilina.relationships.some((r) => r.targetConceptId === term('penicilina')));
  // La oración de hipersensibilidad sin término del glosario va a la cola.
  assert.ok(amoxicilina.unmatched.some((u) => u.section === '4.3' && u.reason === 'no-exact-term' && u.sentence.startsWith('Hipersensibilidad al principio activo')));
});

test('F4.2 4.3: «Embarazo y lactancia» en la lista de contraindicaciones de la simvastatina', () => {
  const ci = ofType(simvastatina, '4.3');
  assert.deepEqual(ci.map((r) => r.targetConceptId).sort(), [term('embarazo'), term('lactancia')].sort());
  for (const r of ci) assert.equal(r.citationText, '- Embarazo y lactancia (ver sección 4.6).');
});

// --- F4.2: 4.8 → ADVERSE_EFFECT con frecuencia ---------------------------------------------

test('F4.2 4.8: frecuencia sólo si la tabla la declara en texto, por la tabla fija', () => {
  const ae = ofType(amoxicilina, '4.8');
  const freq = (target, ref) => ae.find((r) => r.targetConceptId === term(target) && r.sourceReference === ref)?.frequency;
  assert.equal(freq('diarrea', 'cima:62437:4.8:18'), 'FREQUENT'); // «Frecuentes»
  assert.equal(freq('vómitos', 'cima:62437:4.8:19'), 'OCCASIONAL'); // «Poco frecuentes»
  assert.equal(freq('hepatitis', 'cima:62437:4.8:25'), 'VERY_RARE'); // «Muy raras»
  // Fuera de la tabla, la oración introductoria no tiene etiqueta: sin frecuencia.
  assert.equal(freq('diarrea', 'cima:62437:4.8:1'), null);
  const hep = ae.find((r) => r.sourceReference === 'cima:62437:4.8:25');
  assert.equal(hep.citationText, 'Hepatitis e ictericia colestásica.');
  assert.match(hep.citationLocator, /SOC: Trastornos hepatobiliares · frecuencia en la ficha: Muy raras · fila de tabla$/);
  // Simvastatina: «Raras: anemia.» (etiqueta en línea, banda declarada en el texto de la sección).
  const anemia = ofType(simvastatina, '4.8').find((r) => r.targetConceptId === term('anemia'));
  assert.equal(anemia.citationText, 'Raras: anemia.');
  assert.equal(anemia.frequency, 'VERY_RARE');
});

test('F4.2 4.8: la tabla de frecuencias es fija y nunca asigna OBLIGATE ni EXCLUDED', () => {
  assert.ok(Object.isFrozen(MEDDRA_FREQUENCY));
  const codes = new Set(Object.values(MEDDRA_FREQUENCY));
  assert.deepEqual([...codes].sort(), [null, 'FREQUENT', 'OCCASIONAL', 'VERY_FREQUENT', 'VERY_RARE'].sort());
  for (const r of [...amoxicilina.relationships, ...simvastatina.relationships]) assert.ok(!['OBLIGATE', 'EXCLUDED'].includes(r.frequency));
});

test('F4.2 4.8: el aviso «Notificación de sospechas de reacciones adversas» no se extrae', () => {
  const all = [...amoxicilina.relationships, ...amoxicilina.unmatched.map((u) => ({ citationText: u.sentence }))];
  assert.ok(!all.some((r) => /notificar las sospechas|www\.notificaRAM\.es/i.test(r.citationText)));
});

// --- F4.2: 4.5 → drug_interactions --------------------------------------------------------

test('F4.2 4.5: sólo pares con otro principio activo del catálogo, severidad por tabla fija', () => {
  const byB = (name) => amoxicilina.interactions.filter((i) => i.substanceB === name);
  assert.deepEqual(byB('probenecid').map((i) => i.severityCode), ['NOT_RECOMMENDED', 'UNSPECIFIED', 'UNSPECIFIED']);
  assert.equal(byB('probenecid')[0].citationText, 'No se recomienda el uso concomitante de probenecid.');
  assert.deepEqual([...new Set(byB('alopurinol').map((i) => i.severityCode))], ['UNSPECIFIED']);
  for (const i of amoxicilina.interactions) {
    assert.equal(i.substanceAConceptId, AMOXICILINA.conceptId);
    assert.ok(INGREDIENTS.map(term).includes(i.substanceBConceptId));
    assert.notEqual(i.substanceBConceptId, AMOXICILINA.conceptId, 'el propio fármaco no es interacción');
  }
  assert.ok(amoxicilina.unmatched.some((u) => u.section === '4.5' && u.reason === 'no-catalog-ingredient'));
});

test('F4.2 4.5: simvastatina — «Está contraindicada la combinación…» y «No se recomienda» de la ficha real', () => {
  const sev = (name) => [...new Set(simvastatina.interactions.filter((i) => i.substanceB === name).map((i) => i.severityCode))].sort();
  assert.deepEqual(sev('itraconazol'), ['CONTRAINDICATED', 'UNSPECIFIED']);
  assert.deepEqual(sev('acido fusidico'), ['NOT_RECOMMENDED', 'UNSPECIFIED']);
  assert.equal(simvastatina.interactions.find((i) => i.substanceB === 'acido fusidico').citationText, 'Ácido fusídico — No se recomienda con simvastatina.');
  const ci = simvastatina.interactions.find((i) => i.substanceB === 'itraconazol' && i.citationText.startsWith('Está contraindicada la combinación con itraconazol'));
  assert.equal(ci.severityCode, 'CONTRAINDICATED');
  // «- Ciclosporina:» es un subtítulo: no es una cita.
  assert.ok(!simvastatina.interactions.some((i) => i.citationText === '- Ciclosporina:'));
  assert.ok(simvastatina.unmatched.some((u) => u.sentence === '- Ciclosporina:' && u.reason === 'not-a-sentence'));
  assert.ok(!simvastatina.interactions.some((i) => i.substanceBConceptId === SIMVASTATINA.conceptId));
});

test('F4.2 4.5: tabla de severidad', () => {
  assert.equal(interactionSeverity('El uso concomitante está contraindicado.'), 'CONTRAINDICATED');
  assert.equal(interactionSeverity('Contraindicado con pimozida.'), 'CONTRAINDICATED');
  assert.equal(interactionSeverity('No está contraindicado, pero se vigilará.'), 'UNSPECIFIED');
  assert.equal(interactionSeverity('No se recomienda la combinación.'), 'NOT_RECOMMENDED');
  assert.equal(interactionSeverity('Puede aumentar los niveles plasmáticos.'), 'UNSPECIFIED');
});

// --- F4.2: 4.6 → PREGNANCY_LACTATION_CAUTION -------------------------------------------------

test('F4.2 4.6: sólo hacia embarazo/lactancia, con la oración literal', () => {
  const pl = ofType(amoxicilina, '4.6');
  assert.deepEqual([...new Set(pl.map((r) => r.targetConceptId))].sort(), [term('embarazo'), term('lactancia')].sort());
  const lactante = pl.find((r) => r.sourceReference === 'cima:62437:4.6:7');
  assert.equal(lactante.citationText, 'Por tanto, pueden aparecer en el lactante diarrea e infección fúngica de las membranas mucosas, por lo que la lactancia podría tener que interrumpirse.');
  assert.equal(lactante.targetConceptId, term('lactancia'));
  // La misma oración nombra «diarrea»: en 4.6 no es destino.
  assert.ok(!pl.some((r) => r.targetConceptId === term('diarrea')));
  assert.ok(PREGNANCY_LACTATION_TERMS.includes('embarazo'));
});

// --- Contrato con bulkLoadRelationships ----------------------------------------------------

test('contrato: filas de bulkLoadRelationships sin `ordinal` y con referencia única por evidencia', () => {
  const rows = [...amoxicilina.relationships, ...simvastatina.relationships];
  assert.ok(rows.length > 20);
  const keys = new Set();
  for (const r of rows) {
    assert.ok(!('ordinal' in r), 'nunca se envía ordinal');
    for (const k of ['sourceConceptId', 'targetConceptId', 'relationshipTypeConceptId', 'evidenceTier', 'sourceReference', 'citationText', 'citationLocator', 'validFrom']) {
      assert.ok(r[k], `${k} vacío`);
    }
    assert.match(r.validFrom, /^\d{4}-\d{2}-\d{2}$/);
    const key = `${r.sourceConceptId}|${r.targetConceptId}|${r.relationshipTypeConceptId}|aemps-cima|${r.sourceReference}`;
    assert.ok(!keys.has(key), `evidencia duplicada ${key}`);
    keys.add(key);
  }
});

test('contrato: ids de tipo de relación = deterministicId de concepts.ts', () => {
  assert.equal(SECTION_RELATION['4.3'].typeId, deterministicId('terminology:relationship:contraindicated-in'));
  assert.equal(SECTION_RELATION['4.8'].typeId, deterministicId('terminology:relationship:adverse-effect'));
  assert.equal(SECTION_RELATION['4.6'].typeId, deterministicId('terminology:relationship:pregnancy-lactation-caution'));
});

test('cola: lo que no casó va a cima-unmatched.csv y nunca a relaciones', () => {
  const csv = unmatchedCsv(amoxicilina.unmatched);
  const [header, ...lines] = csv.trim().split('\n');
  assert.equal(header, UNMATCHED_COLUMNS.map((c) => `"${c}"`).join(','));
  assert.equal(lines.length, amoxicilina.unmatched.length);
  const cited = new Set(amoxicilina.relationships.map((r) => r.citationText));
  for (const u of amoxicilina.unmatched.filter((x) => x.reason !== 'ambiguous')) assert.ok(!cited.has(u.sentence) || u.reason === 'not-a-sentence', u.sentence);
});

test('designación ambigua (dos conceptos) va a la cola, no se elige', () => {
  const twoAnemias = buildTermIndex(
    [{ conceptId: 'anemia-1', text: 'anemia', categoryKey: 'disease' }, { conceptId: 'anemia-2', text: 'Anemia', categoryKey: 'disease' }],
    { categories: CLINICAL_TARGET_CATEGORIES },
  );
  const r = cimaSafety({ drug: SIMVASTATINA, sections: [sheet('65198', '4.8')], clinicalIndex: twoAnemias, ingredientIndex });
  assert.equal(r.relationships.length, 0);
  assert.ok(r.unmatched.some((u) => u.reason === 'ambiguous' && u.term === 'anemia' && u.candidates.length === 2));
});

test('conteos por sección (fixtures reales, glosario de prueba)', () => {
  const s = safetySummary(amoxicilina);
  assert.deepEqual(s.relationships, { CONTRAINDICATED_IN: 1, PREGNANCY_LACTATION_CAUTION: 4, ADVERSE_EFFECT: 12 });
  assert.deepEqual(s.interactionsBySeverity, { NOT_RECOMMENDED: 1, UNSPECIFIED: 5 });
});

// --- F4.3: LactMed --------------------------------------------------------------------------

/** NXML real → monografía del corpus con el ATC que le da el puente UNII → ATC. */
function monographFromNxml(file, atc, accession) {
  const sections = lactmedSections(readFileSync(join(LACTMED_FIXTURES, `${file}.nxml`), 'utf8'), '2026-10-24T18:51:32.380Z', { accession });
  return { code: atc, sections };
}

const lactationIndex = buildTermIndex([{ conceptId: 'concepto:lactancia-materna', text: 'Lactancia materna', categoryKey: 'care' }], { categories: CLINICAL_TARGET_CATEGORIES });
const catalog = [
  { codeSystem: 'cima-vtm', slug: 'cima-vtm-colestipol', esName: 'Colestipol', externalIds: { atc: ['C10AC02'] } },
  { codeSystem: 'cima-vtm', slug: 'cima-vtm-regadenoson-a', esName: 'Regadenosón', externalIds: { atc: ['C01EB21'] } },
  { codeSystem: 'cima-vtm', slug: 'cima-vtm-regadenoson-b', esName: 'Regadenosón monohidrato', externalIds: { atc: ['C01EB21'] } },
];

test('F4.3: el resumen de LactMed → PREGNANCY_LACTATION_CAUTION, CURATED_REFERENCE, cita literal', () => {
  const summaries = lactmedSummariesFromMonograph(monographFromNxml('LM514', 'C10AC02', 'NBK501393'));
  assert.equal(summaries.length, 1, 'sólo el resumen, no Drug Levels ni Effects…');
  const target = fixedTarget(lactationIndex, LACTATION_TERMS);
  assert.deepEqual(target, { conceptId: 'concepto:lactancia-materna', term: 'lactancia materna' });
  const { relationships, unmatched } = lactmedSafety({ summaries, drugsByAtc: catalogDrugsByAtc(catalog), lactationTarget: target });
  assert.equal(unmatched.length, 0);
  assert.equal(relationships.length, 1);
  const [r] = relationships;
  assert.equal(r.sourceConceptId, conceptId('cima-vtm-colestipol'));
  assert.equal(r.targetConceptId, 'concepto:lactancia-materna');
  assert.equal(r.relationshipTypeConceptId, SECTION_RELATION['4.6'].typeId);
  assert.equal(r.evidenceTier, CURATED_REFERENCE);
  assert.equal(r.sourceReference, 'lactmed:LM514');
  assert.equal(
    r.citationText,
    "Colestipol is a nonabsorbable resin. Because it does not enter the mother's bloodstream, it will not reach the infant via breastmilk. It is acceptable for use during lactation.",
  );
  assert.equal(r.validFrom, '2026-07-15', 'vigencia = revisión del registro');
  assert.match(r.citationLocator, /Colestipol \(LM514\), NBK501393, revisado el 2026-07-15, sección «Summary of Use during Lactation»/);
  assert.match(r.citationLocator, /Courtesy of the U\.S\. National Library of Medicine\. · ATC C10AC02$/);
  assert.ok(!('ordinal' in r));
});

test('F4.3: ATC ambiguo, ATC fuera del catálogo, sin concepto de lactancia o con dosis → cola', () => {
  const regadenoson = lactmedSummariesFromMonograph(monographFromNxml('LM1337', 'C01EB21', 'NBK501888'));
  const drugsByAtc = catalogDrugsByAtc(catalog);
  const target = fixedTarget(lactationIndex, LACTATION_TERMS);
  assert.deepEqual(lactmedSafety({ summaries: regadenoson, drugsByAtc, lactationTarget: target }).unmatched.map((u) => u.reason), ['ambiguous-atc']);
  const outside = regadenoson.map((s) => ({ ...s, atc: 'Z99ZZ99' }));
  assert.deepEqual(lactmedSafety({ summaries: outside, drugsByAtc, lactationTarget: target }).unmatched.map((u) => u.reason), ['no-catalog-drug']);
  const colestipol = lactmedSummariesFromMonograph(monographFromNxml('LM514', 'C10AC02', 'NBK501393'));
  assert.deepEqual(lactmedSafety({ summaries: colestipol, drugsByAtc, lactationTarget: null }).unmatched.map((u) => u.reason), ['no-lactation-concept']);
  // Resumen real del corpus (omeprazol, A02BC01) que cita una dosis: no se carga.
  const withDose = [{ ...colestipol[0], text: 'Limited information indicates that maternal omeprazole doses of 20 mg daily produce low levels in milk and would not be expected to cause any adverse effects in breastfed infants.' }];
  const dosed = lactmedSafety({ summaries: withDose, drugsByAtc, lactationTarget: target });
  assert.equal(dosed.relationships.length, 0);
  assert.match(dosed.unmatched[0].reason, /^dose-guard:/);
});

test('F4.3: un registro enlazado por dos ATC del mismo fármaco no duplica la evidencia', () => {
  const twoAtc = [{ codeSystem: 'cima-vtm', slug: 'cima-vtm-x', esName: 'X', externalIds: { atc: ['C10AC02', 'C10AC52'] } }];
  const s = lactmedSummariesFromMonograph(monographFromNxml('LM514', 'C10AC02', 'NBK501393'));
  const summaries = [...s, ...s.map((x) => ({ ...x, atc: 'C10AC52' }))];
  const r = lactmedSafety({ summaries, drugsByAtc: catalogDrugsByAtc(twoAtc), lactationTarget: fixedTarget(lactationIndex, LACTATION_TERMS) });
  assert.equal(r.relationships.length, 1);
});

test('F4.3/F4.4: LactMed y LINAME registrados en sources.json', () => {
  const lactmed = SOURCES['nlm-lactmed'];
  assert.notEqual(lactmed.status, 'PENDING');
  assert.equal(lactmed.evidenceTier, CURATED_REFERENCE);
  assert.ok(lactmed.reuseTerms.quotes.some((q) => q.quote.includes('within the public domain')));
  assert.ok(lactmed.reuseTerms.quotes.some((q) => q.quote.includes('Courtesy of the U.S. National Library of Medicine')));
  const liname = SOURCES['liname-bo'];
  assert.equal(liname.status, 'BLOCKED');
  assert.match(liname.rule, /No se reconstruye desde terceros/);
});
