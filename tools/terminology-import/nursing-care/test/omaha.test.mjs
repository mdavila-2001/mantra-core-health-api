// Pruebas del Omaha System con archivos REALES del sitio oficial y del MOSUG (ver fixtures/omaha/README.md).
// Correr: node --test "tools/terminology-import/nursing-care/test/*.test.mjs"
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  OMAHA_CODE_SYSTEM, PRSO, buildOmahaRows, hydrateOmahaProvenance, interventionTargetClaim, parseFaqLicense, parseInterventionScheme, parseMosugModifiers, parseMosugProblemPages, parseMosugProblems, parseProblemClassification, parseProblemModifiers, parseTwoColumnBullets,
} from '../lib/omaha.mjs';
import { applyOwnerApproval } from '../load-nursing-care.mjs';
import { codeSystemPlan, conceptId, definitionOf, designationsFor, displayOf, propertiesFor, relationshipsFor } from '../lib/plan.mjs';

const FX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'omaha');
const read = (n) => readFileSync(join(FX, n), 'utf8');
const problemsHtml = read('problemclassificationscheme.excerpt.html');
const interventionsHtml = read('interventionscheme.excerpt.html');
const faqHtml = read('faq.excerpt.html');
const pdfText = read('mosug-kbs-2010.pdftotext-excerpt.txt');

const problems = parseProblemClassification(problemsHtml);
const interventions = parseInterventionScheme(interventionsHtml);
const mosugProblems = parseMosugProblems(pdfText);
const mosugPages = parseMosugProblemPages(pdfText);

test('sitio oficial: 4 dominios con definición y 42 problemas, en el orden publicado', () => {
  assert.deepEqual(problems.domains.map((d) => [d.name, d.problems.length]), [['Environmental Domain', 4], ['Psychosocial Domain', 12], ['Physiological Domain', 18], ['Health-related Behaviors Domain', 8]]);
  assert.equal(problems.domains[0].definition, 'Material resources and physical surroundings both inside and outside the living area, neighborhood, and broader community.');
  const all = problems.domains.flatMap((d) => d.problems);
  assert.equal(all.length, 42);
  assert.deepEqual([all[0], all[3], all[15], all[41]], ['Income', 'Neighborhood/workplace safety', 'Growth and development', 'Medication regimen']);
  assert.equal(new Set(all).size, 42);
});

test('sitio oficial: modificadores de problema (dos conjuntos) leídos de la frase del nivel 3', () => {
  const m = parseProblemModifiers(problemsHtml);
  assert.deepEqual(m.sets.map((s) => s.terms), [['health promotion', 'potential', 'actual'], ['individual', 'family', 'community']]);
});

test('sitio oficial: intervenciones — 4 categorías con definición y 75 objetivos + «other»', () => {
  assert.deepEqual(interventions.categories.map((c) => c.name), ['Teaching, Guidance, and Counseling', 'Treatments and Procedures', 'Case Management', 'Surveillance']);
  assert.match(interventions.categories[1].definition, /^Technical activities such as wound care, specimen collection/);
  assert.equal(interventionTargetClaim(interventionsHtml), 75);
  assert.equal(interventions.targets.length, 76);
  assert.deepEqual([interventions.targets[0], interventions.targets[16], interventions.targets[75]], ['anatomy/physiology', 'dressing change/wound care', 'other']);
  assert.equal(new Set(interventions.targets).size, 76);
});

test('FAQ oficial: pregunta 1 de la licencia, verbatim', () => {
  const f = parseFaqLicense(faqHtml);
  assert.match(f.question, /^1\. Do I need to buy a license or rights to the terms, definitions, and codes of the Omaha System/);
  assert.match(f.answer, /has existed in the public domain since 1975/);
  assert.match(f.answer, /the terms and structure must be used as described in the 2005 book, and referenced \(ie 2005 book or Website\)\./);
  assert.doesNotMatch(f.answer, /Four official Omaha System books/);
});

test('MOSUG: lista de 42 problemas con página del libro; el nombre puede venir cortado por el PDF', () => {
  assert.equal(mosugPages.length, 42);
  assert.deepEqual([mosugPages[0], mosugPages[4]], [{ name: 'Income', pageStart: 169, pageEnd: 171 }, { name: 'Communication with Community', pageStart: 181, pageEnd: 185 }]);
});

test('MOSUG: signos/síntomas en dos columnas, orden por columnas, continuaciones unidas', () => {
  const byPage = Object.fromEntries(mosugProblems.map((p) => [p.page, p]));
  assert.equal(mosugProblems.length, 5);
  assert.deepEqual(byPage[169].signsSymptoms, ['Low/ no income', 'Uninsured medical expenses', 'Difficulty with money management', 'Able to buy only necessities', 'Difficulty buying necessities', 'Other']);
  assert.equal(byPage[169].definition, 'Money from wages, pensions, subsidies, interest, dividends, or other sources available for living and health care expenses');
  const mh = byPage[199].signsSymptoms;
  assert.equal(mh.length, 18);
  assert.equal(mh[0], 'Sadness/ hopelessness/ decreased self-esteem');
  assert.equal(mh[9], 'Somatic complaints/ fatigue');
  assert.equal(mh[12], 'Expresses suicidal/ homicidal thoughts');
  assert.equal(mh[17], 'Other');
  // la viñeta vacía del PDF (Communication with Community Resources) no es un ítem
  assert.equal(byPage[181].signsSymptoms.length, 12);
  assert.equal(byPage[181].signsSymptoms[11], 'Other');
  assert.equal(byPage[346].signsSymptoms[0], 'Fails to obtain routine/preventative health care');
  assert.equal(byPage[190].signsSymptoms.length, 9);
});

test('MOSUG: parseTwoColumnBullets con una sola columna', () => {
  assert.deepEqual(parseTwoColumnBullets([' \u0083 uno', '   dos', ' \u0083 tres']), ['uno dos', 'tres']);
});

test('MOSUG: definiciones de los modificadores Actual, Potencial y Promoción de la salud', () => {
  const d = parseMosugModifiers(pdfText);
  assert.equal(d.Actual, 'Client problem status characterized by the existence of one or more signs and symptoms');
  assert.match(d.Potential, /^Client status characterized by the absence of signs and symptoms and the presence of patterns/);
  assert.match(d['Health Promotion'], /^Client status characterized by interest in increasing knowledge/);
});

test('PRSO: la transcripción de la imagen coincide con las listas de respuesta que publica LOINC', () => {
  const sample = JSON.parse(read('loinc-omaha-terms.sample.json'));
  const answerLists = sample.terms.filter((t) => t.answers).map((t) => t.answers.map((a) => a.DisplayText));
  assert.equal(answerLists.length, 3);
  for (const c of PRSO) assert.ok(answerLists.some((l) => JSON.stringify(l) === JSON.stringify(c.ratings)), `PRSO ${c.name} no coincide con LOINC`);
  assert.equal(sample.total, 403);
});

const META_FILE = (n) => ({ url: `https://example.org/${n}`, sha256: 'a'.repeat(64), retrievedAt: '2026-10-27T23:00:00.000Z', contentType: 'text/html' });
const meta = { files: Object.fromEntries(['site-problems', 'site-interventions', 'site-prso-image', 'site-faq', 'mosug-kbs-supplement'].map((k) => [k, META_FILE(k)])) };
const rawRows = buildOmahaRows({ problems, modifiers: parseProblemModifiers(problemsHtml), interventions, faq: parseFaqLicense(faqHtml), mosugProblems, mosugPages, mosugModifierDefs: parseMosugModifiers(pdfText) }, meta);
// La procedencia de las filas no lleva fecha ni SHA-256 de la descarga (no entran en el hash del corpus): se agregan desde `omaha-meta`.
const rows = hydrateOmahaProvenance(rawRows, meta.files);
const byCode = new Map(rows.map((r) => [r.code, r]));

test('reproducibilidad: las filas no dependen de la fecha ni de los bytes de la descarga', () => {
  const other = Object.fromEntries(Object.entries(meta.files).map(([k, v]) => [k, { ...v, sha256: 'b'.repeat(64), retrievedAt: '2030-01-01T00:00:00.000Z' }]));
  const again = buildOmahaRows({ problems, modifiers: parseProblemModifiers(problemsHtml), interventions, faq: parseFaqLicense(faqHtml), mosugProblems, mosugPages, mosugModifierDefs: parseMosugModifiers(pdfText) }, { files: other });
  assert.equal(JSON.stringify(again), JSON.stringify(rawRows));
  assert.ok(!JSON.stringify(rawRows).includes('retrievedAt') && !/[0-9a-f]{64}/.test(JSON.stringify(rawRows)));
  assert.equal(rows[0].provenance.retrievedAt, '2026-10-27T23:00:00.000Z');
});

test('licencia: todo Omaha espera la decisión del propietario y por defecto no se carga', () => {
  assert.ok(rows.every((r) => r.ownerApproval === 'omaha-system'));
  assert.equal(byCode.get('problem/income').provenance.license.status, 'public-domain-terms-pending-owner-decision');
  assert.match(byCode.get('problem/income').provenance.license.summary, /contact(ar)?|Health Connections Press/);
  const none = applyOwnerApproval({ [OMAHA_CODE_SYSTEM]: rows }, new Set());
  assert.deepEqual(none.rowsByCs, {});
  assert.deepEqual(none.omitted, [{ codeSystem: OMAHA_CODE_SYSTEM, key: 'omaha-system', rows: rows.length }]);
  assert.equal(applyOwnerApproval({ [OMAHA_CODE_SYSTEM]: rows }, new Set(['omaha-system'])).rowsByCs[OMAHA_CODE_SYSTEM].length, rows.length);
});

test('filas: conteos por clase, códigos únicos, padres presentes y procedencia en cada fila', () => {
  const count = rows.reduce((m, r) => ((m[r.kind] = (m[r.kind] ?? 0) + 1), m), {});
  assert.deepEqual(count, { domain: 4, problem: 42, 'sign-symptom': 6 + 18 + 12 + 8 + 9, 'problem-modifier-set': 2, 'problem-modifier': 6, 'intervention-category': 4, 'intervention-target': 76, 'prso-concept': 3, 'prso-rating': 15 });
  for (const r of rows) {
    assert.equal(r.codeSystem, OMAHA_CODE_SYSTEM);
    assert.ok(r.provenance.sha256 && r.provenance.uri && r.provenance.retrievedAt && r.provenance.license, `sin procedencia: ${r.code}`);
    if (r.parentCode) assert.ok(byCode.has(r.parentCode), `padre ausente: ${r.code}`);
  }
  assert.equal(byCode.get('problem/income').parentCode, 'domain/environmental');
  assert.equal(byCode.get('problem/income').sourceOrder, 1);
  assert.equal(byCode.get('problem/medication-regimen').sourceOrder, 42);
});

test('filas: la definición sólo existe donde la fuente la publica, y cita al MOSUG', () => {
  assert.equal(byCode.get('problem/income').descriptionOriginal.startsWith('Money from wages'), true);
  assert.match(byCode.get('problem/income').definitionSource.source, /Minnesota Omaha System Users Group/);
  assert.equal(byCode.get('problem/sanitation').descriptionOriginal, null);
  assert.equal(byCode.get('modifier/actual').descriptionOriginal.startsWith('Client problem status'), true);
  assert.equal(byCode.get('modifier/individual').descriptionOriginal, null);
  assert.equal(byCode.get('sign-symptom/mental-health/self-mutilation').nameOriginal, 'Self-mutilation');
  assert.equal(byCode.get('prso/status/1').nameOriginal, 'Extreme signs/symptoms');
  assert.equal(byCode.get('prso/status/1').ordinalValue, 1);
  assert.equal(byCode.get('prso/status/1').provenance.transcribedFromImage, true);
});

test('plan de carga: designación EN, definición, PART_OF y propiedades de procedencia', () => {
  const income = byCode.get('problem/income');
  assert.equal(displayOf(income), 'Income');
  assert.match(definitionOf(income), /^Money from wages/);
  assert.equal(designationsFor(income).length, 1);
  const rel = relationshipsFor(income, new Set(rows.map((r) => r.code)));
  assert.equal(rel.length, 1);
  assert.equal(rel[0].target, conceptId(byCode.get('domain/environmental')));
  const props = Object.fromEntries(propertiesFor(income).map((p) => [p.code, p.value]));
  assert.equal(props.omaha_kind, 'problem');
  assert.equal(props.source_order, 1);
  assert.ok(props['omaha-provenance'].license.answer.includes('public domain since 1975'));
  assert.equal(props['nursing-provenance'], undefined);
  assert.equal(codeSystemPlan(OMAHA_CODE_SYSTEM, '2005+sitio-2026-10-27').codeSystem.canonicalUrl, 'https://mantracore.health/fhir/CodeSystem/omaha-system');
  const ids = rows.flatMap((r) => propertiesFor(r).map((p) => p.id));
  assert.equal(new Set(ids).size, ids.length);
});

// --- Licencias de escalas con evidencia primaria (2026-10-27) -----------------------------------------
import { LICENSE_OVERRIDES, SCALE_LICENSE_NOTES, TERMINOLOGY_LICENSES } from '../lib/licenses.mjs';
import { classifyContentLicense } from '../lib/ckm.mjs';
import { parseNdjsonText, readRepoDataset } from '../lib/repo-data.mjs';

test('overrides de licencia: cada uno trae estado, cita, URL https del titular y fecha', () => {
  for (const [id, ov] of Object.entries(LICENSE_OVERRIDES)) {
    // Cambio de comportamiento esperado (2026-10-27): Glasgow pasa de `verified-free` a `pending-owner-decision` (el permiso cubre atención clínica e
    // investigación, y las filas vienen de un arquetipo CC BY-SA). Ningún override es `verified-free` hasta que el propietario decida.
    assert.equal(ov.status, 'pending-owner-decision', id);
    assert.ok(ov.approvalKey && ov.approvalReason, id);
    assert.ok(ov.quote.length > 40 && /^https:\/\//.test(ov.url) && /^\d{4}-\d{2}-\d{2}$/.test(ov.checkedAt), id);
  }
  assert.deepEqual(Object.keys(LICENSE_OVERRIDES), ['openEHR-EHR-OBSERVATION.glasgow_coma_scale.v1']);
  // NEWS2 tiene evidencia primaria pero NO se habilita (la condición «no modificar» choca con re-expresarla)
  assert.equal(SCALE_LICENSE_NOTES['openEHR-EHR-OBSERVATION.news2.v1'].evidence.startsWith('primary'), true);
  assert.equal(LICENSE_OVERRIDES['openEHR-EHR-OBSERVATION.news2.v1'], undefined);
});

test('classifyContentLicense: el override gana, deja la evidencia primaria y la clave de aprobación', () => {
  const a = { archetypeId: 'openEHR-EHR-OBSERVATION.glasgow_coma_scale.v1', definition: { nodes: [] }, originalLanguage: 'en' };
  const c = classifyContentLicense(a, LICENSE_OVERRIDES);
  assert.equal(c.status, 'pending-owner-decision');
  assert.equal(c.approvalKey, 'glasgow-coma-scale');
  assert.equal(c.evidence[0].url, 'https://www.glasgowcomascale.org/permissions/');
  assert.notEqual(classifyContentLicense({ ...a, archetypeId: 'openEHR-EHR-OBSERVATION.glasgow_coma_scale_paediatric.v0' }, LICENSE_OVERRIDES).status, 'pending-owner-decision');
});

test('Omaha: el registro de terminologías la marca con evidencia primaria, fecha propia y decisión pendiente', () => {
  assert.equal(TERMINOLOGY_LICENSES.oms.evidence.startsWith('primary'), true);
  assert.equal(TERMINOLOGY_LICENSES.oms.loadable, false);
  assert.equal(TERMINOLOGY_LICENSES.oms.checkedAt, '2026-10-27');
});

test('datos versionados: Glasgow adulto con contenido condicionado a la aprobación; la pediátrica sigue retenida', () => {
  const rows = parseNdjsonText(readRepoDataset('openehr-ckm'));
  const adult = rows.filter((r) => r.archetypeId === 'openEHR-EHR-OBSERVATION.glasgow_coma_scale.v1');
  assert.equal(adult[0].contentLicense.status, 'pending-owner-decision');
  assert.equal(adult[0].contentOwnerApproval, 'glasgow-coma-scale');
  const content = adult.filter((r) => r.kind !== 'archetype');
  assert.equal(content.length, 22);
  assert.ok(content.every((r) => r.ownerApproval === 'glasgow-coma-scale'));
  assert.deepEqual(content.filter((r) => r.kind === 'value').map((r) => r.ordinalValue), [1, 2, 3, 4, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 6]);
  const paed = rows.filter((r) => r.archetypeId === 'openEHR-EHR-OBSERVATION.glasgow_coma_scale_paediatric.v0');
  assert.equal(paed.length, 1);
  assert.equal(paed[0].contentLoaded, false);
  // por defecto el cargador omite los 22 y la raíz dice que su contenido NO está cargado; con la aprobación entran
  const none = applyOwnerApproval({ 'openehr-ckm': rows }, new Set());
  assert.equal(none.rowsByCs['openehr-ckm'].length, rows.length - 22);
  assert.equal(none.rowsByCs['openehr-ckm'].find((r) => r.code === adult[0].code).contentLoaded, false);
  assert.deepEqual(none.omitted, [{ codeSystem: 'openehr-ckm', key: 'glasgow-coma-scale', rows: 22 }]);
  assert.equal(applyOwnerApproval({ 'openehr-ckm': rows }, new Set(['glasgow-coma-scale'])).rowsByCs['openehr-ckm'].length, rows.length);
});

test('datos versionados: Omaha coincide con lo que construye el armado (mismos conteos)', () => {
  const rows = parseNdjsonText(readRepoDataset('omaha-system'));
  assert.equal(rows.length, 320);
  assert.equal(new Set(rows.map((r) => r.code)).size, 320);
  const cov = JSON.parse(readRepoDataset('omaha-coverage'));
  assert.equal(cov.concepts, 320);
  const check = JSON.parse(readRepoDataset('omaha-crosscheck'));
  assert.equal(check.orderMismatches.length, 0);
  assert.equal(check.signsSymptomsEqual, check.signsSymptomsCompared);
  const cmdic = JSON.parse(readRepoDataset('cmdic-license-verification'));
  assert.equal(cmdic.zipVsCorpus.differing, 0);
  assert.equal(cmdic.status, 'reuse-allowed-with-conditions');
  const msssi = parseNdjsonText(readRepoDataset('es-msssi-cmdic-13606'));
  assert.ok(msssi.every((r) => r.contentLicense.status === 'reuse-allowed-with-conditions' && r.provenance.retrievedAt === undefined));
  const links = JSON.parse(readRepoDataset('loinc-links-report'));
  assert.equal(links.resolvedInPublicSubset, links.boundTermCodes);
});
