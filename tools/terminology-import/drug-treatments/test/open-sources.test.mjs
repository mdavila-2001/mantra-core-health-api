// Pruebas de las fuentes abiertas por HTTP (pasadas del 2026-10-27), con filas REALES de cada archivo
// descargado (ver fixtures/README.md). Sin red ni base.
//   node --test tools/terminology-import/drug-treatments/test/*.test.mjs

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { code } from '../lib/common.mjs';
import { drugCentralIndex, extendDrugCentralIndex, mondoIndex, resolveAtc, resolveCondition, withCrosswalk } from '../lib/crosswalk.mjs';
import { relationshipsFor } from '../lib/load-plan.mjs';
import {
  chemblAtcIndex,
  drugCentralAtcIndex,
  drugCentralIdentifiers2027,
  meshConceptIndex,
  parseChembl,
  parseCivic,
  parseClinicalTrials,
  parseDrugCentral,
  parseEma,
  parseEemlPage,
  parseEeml,
  parseMedRt,
  parseOpenTargetsEma,
  parseWikidata,
  rxclassAtcIndex,
  wikidataAtcIndex,
} from '../lib/parsers-open.mjs';
import { drugCentralIdentifiers } from '../lib/parsers.mjs';
import { OPEN_RELATION_TYPES } from '../lib/open-sources.mjs';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const read = (name) => readFileSync(join(FIX, name), 'utf8');
const prov = (file) => ({ version: 'v-test', retrievedAt: '2026-10-27T00:00:00.000Z', release: 'r-test', file, fileSha256: 'abc', fileUrl: 'https://example.org/f' });
const keys = (codes) => codes.map((c) => `${c.system}:${c.code}`);
const byType = (assertions) => Object.fromEntries(Object.entries(Object.groupBy(assertions, (a) => a.relation.type)).map(([k, v]) => [k, v.length]));

test('MED-RT: solo las relaciones fármaco → MeSH; el resto de asociaciones se cuenta y se excluye; dos autoridades se acumulan', () => {
  const { assertions, stats } = parseMedRt(read('medrt.xml'), prov('medrt'));
  assert.equal(stats.associations, 9);
  assert.equal(stats['excluded:association=induces'], 1);
  assert.equal(stats['excluded:association=has_MoA'], 1);
  assert.equal(assertions.length, 7);
  assert.deepEqual(byType(assertions), { 'medrt:may_treat': 2, 'medrt:may_prevent': 2, 'medrt:CI_with': 2, 'medrt:may_diagnose': 1 });
  const pali = assertions.find((a) => a.source.recordId === 'may_treat|RxNorm:194279|M0027589');
  assert.deepEqual(keys(pali.drug.codes), ['RXCUI:194279']);
  assert.deepEqual(keys(pali.condition.codes), ['MESH_CONCEPT:M0027589']);
  assert.equal(pali.evidence.subjectKind, 'rxnorm-ingredient');
  assert.equal(pali.relation.polarity, 'positive');
  // una clase farmacológica de MED-RT no es un fármaco
  const epc = assertions.find((a) => a.drug.codes[0].system === 'MEDRT_NUI');
  assert.equal(epc.evidence.subjectKind, 'medrt-pharmacologic-class');
  assert.equal(assertions.find((a) => a.relation.type === 'medrt:CI_with').relation.polarity, 'negative');
  assert.equal(assertions.find((a) => a.relation.type === 'medrt:may_diagnose').relation.polarity, 'diagnostic');
  // el fixture tiene la misma afirmación por dos autoridades: se acumulan en una
  assert.ok(assertions.every((a) => a.evidence.authorities.length >= 1));
  assert.equal(assertions.filter((a) => a.source.recordId === 'may_treat|RxNorm:194279|M0027589').length, 1);
  assert.ok(assertions.every((a) => a.source.release === 'r-test' && a.source.commit === null && a.source.fileUrl));
});

test('MeSH: concepto → descriptor solo si es el concepto preferido; el encabezado debe ser el nombre de un único descriptor', () => {
  const mesh = meshConceptIndex(read('mesh-concepts.tsv'));
  assert.equal(mesh.byConcept.get('M0027589'), 'D018357');
  assert.equal(mesh.byConcept.get('M000601696'), 'D001068'); // concepto de 9 dígitos
  assert.equal(mesh.byConcept.has('M0353609'), false); // concepto NO preferido de D000001
  assert.equal(mesh.notPreferred, 1);
  assert.deepEqual(mesh.byHeading.get('Obesity'), ['D009765']);
  const mondo = mondoIndex(read('mondo.sssom.tsv'));
  const r = resolveCondition([code('MESH_CONCEPT', 'M0027589')], mondo, mesh);
  assert.deepEqual(r.added.filter((x) => x.via === 'mesh-descriptor-concepts').map((x) => `${x.system}:${x.code}`), ['MESH:D018357']);
  assert.equal(r.canonical.startsWith('MONDO:') || r.canonical === 'MESH:D018357', true);
  // un concepto no preferido no se expande
  assert.deepEqual(resolveCondition([code('MESH_CONCEPT', 'M0353609')], mondo, mesh).added, []);
  // encabezado exacto → descriptor; encabezado desconocido → nada
  const h = resolveCondition([{ system: 'MESH_HEADING', code: 'Diabetes Mellitus' }], mondo, mesh);
  assert.deepEqual(h.added.filter((x) => x.via === 'mesh-main-heading-exact').map((x) => `${x.system}:${x.code}`), ['MESH:D003920']);
  assert.deepEqual(resolveCondition([{ system: 'MESH_HEADING', code: 'Diabetes' }], mondo, mesh).added, []);
});

test('ATC: solo códigos de nivel 5, por código exacto, con el cruce que lo justifica; una combinación no se resuelve', () => {
  const rx = rxclassAtcIndex(read('rxclass-atc.tsv'));
  assert.deepEqual(rx.get('1191').map((x) => x.code), ['A01AD05', 'B01AC06', 'N02BA01']);
  assert.ok(!JSON.stringify([...rx]).includes('name'), 'RxClass: no se guardan nombres ATC');
  const ch = chemblAtcIndex(read('chembl-molecule-atc.tsv'));
  assert.ok(ch.get('CHEMBL:CHEMBL25').some((x) => x.code === 'N02BA01'));
  const idx = [
    { via: 'rxclass-atc', map: new Map([...rx].map(([k, v]) => [`RXCUI:${k}`, v])) },
    { via: 'chembl-atc', map: ch },
  ];
  const added = resolveAtc([code('RXCUI', '1191'), code('CHEMBL', 'CHEMBL25')], idx);
  assert.deepEqual(added.filter((x) => x.via === 'rxclass-atc').map((x) => x.code), ['A01AD05', 'B01AC06', 'N02BA01']);
  assert.ok(added.every((x) => x.system === 'ATC' && x.predicate && x.from));
  assert.ok(added.some((x) => x.via === 'chembl-atc' && x.from === 'CHEMBL:CHEMBL25'));
  assert.deepEqual(resolveAtc([code('RXCUI', '1191')], idx, { combination: true }), []);
  assert.deepEqual(resolveAtc([code('RXCUI', '999999999')], idx), []);
});

test('ChEMBL: un tipo por fase máxima (-1 = fase desconocida), MeSH + EFO/HP/Orphanet; prefijos no cargados se anotan', () => {
  const { assertions, stats } = parseChembl(read('chembl-drug-indication.ndjson'), prov('chembl'));
  assert.equal(stats.rows, 6);
  assert.equal(stats['note:efo_id con prefijo no cargado (MP)'], 1);
  assert.deepEqual(byType(assertions), {
    'chembl:indication-phase-4': 2,
    'chembl:indication-phase-2': 1,
    'chembl:indication-phase-unknown': 1,
    'chembl:indication-phase-3': 1,
    'chembl:indication-phase-0.5': 1,
  });
  const ra = assertions.find((a) => a.source.recordId === '22607');
  assert.deepEqual(keys(ra.condition.codes), ['MESH:D001172', 'EFO:0000685']);
  assert.equal(ra.relation.polarity, 'positive');
  assert.equal(assertions.find((a) => a.source.recordId === '22606').relation.polarity, 'investigational');
  assert.deepEqual(keys(assertions.find((a) => a.source.recordId === '39705').condition.codes), ['MESH:D013927', 'HPO:0004419']);
  assert.deepEqual(keys(assertions.find((a) => a.source.recordId === '22651').condition.codes), ['MESH:D052439', 'ORPHA:309005']);
  assert.deepEqual(keys(assertions.find((a) => a.source.recordId === '23517').condition.codes), ['MESH:D006470']); // MP:… no se carga
  assert.ok(ra.evidence.references.every((x) => x.type && x.id));
  assert.match(OPEN_RELATION_TYPES['chembl:indication-phase-unknown'].definitionEn, /-1 = Clinical Phase unknown/);
});

test('DrugCentral 2027: un tipo por relationship_name; sin UMLS CUI no hay enfermedad; SNOMED no entra; identificadores y ATC por struct_id', () => {
  const { assertions, stats } = parseDrugCentral(read('drugcentral2027-omop_relationship.tsv'), read('drugcentral2027-structures.tsv'), prov('dc'));
  assert.equal(stats.rows, 13);
  assert.equal(stats['excluded:fila sin UMLS CUI (la enfermedad no tiene código que se pueda cargar)'], 1);
  assert.deepEqual(byType(assertions), {
    'drugcentral:contraindication': 4,
    'drugcentral:off-label-use': 2,
    'drugcentral:indication': 3,
    'drugcentral:reduce-risk': 1,
    'drugcentral:symptomatic-treatment': 1,
    'drugcentral:diagnosis': 1,
  });
  const contra = assertions.find((a) => a.relation.type === 'drugcentral:contraindication');
  assert.equal(contra.relation.polarity, 'negative');
  assert.equal(contra.drug.label, 'zinc sulfate');
  assert.equal(assertions.find((a) => a.relation.type === 'drugcentral:diagnosis').relation.polarity, 'diagnostic');
  assert.ok(!JSON.stringify(assertions.map((a) => [a.evidence, a.condition, a.drug])).toLowerCase().includes('snomed'));
  const ids = drugCentralIdentifiers2027(read('drugcentral2027-identifier.tsv'));
  assert.ok(ids.get('4275').some((c) => c.system === 'RXCUI'));
  const atc = drugCentralAtcIndex(read('drugcentral2027-struct2atc.tsv'));
  assert.ok(atc.get('DRUGCENTRAL:1540').every((c) => c.system === 'ATC'));
});

test('DrugCentral 2027 amplía el cruce de 2016 sin pisarlo y deja el origen (via) en cada código', () => {
  const old = drugCentralIndex(drugCentralIdentifiers(read('drugcentral-identifiers.tsv')));
  const before = JSON.stringify([...old.toDrugCentral]);
  const extended = extendDrugCentralIndex(old, new Map([['4275', [code('RXCUI', '999001')]], ['1540', [code('CHEMBL', 'CHEMBL9999')]]]), 'drugcentral-identifiers-2027');
  assert.ok(extended.byDrug.get('4275').some((c) => c.code === '999001' && c.via === 'drugcentral-identifiers-2027'));
  // los códigos que ya apuntaban a un fármaco siguen apuntando al mismo
  const after = new Map(extended.toDrugCentral);
  for (const [k, v] of JSON.parse(before)) assert.deepEqual(after.get(k), v);
});

test('EMA: solo medicamentos humanos AUTORIZADOS con ATC de nivel 5; el área es el encabezado MeSH tal cual; sin ATC no hay fármaco', () => {
  const { assertions, stats } = parseEma(read('ema-medicines.tsv'), prov('ema'));
  assert.equal(stats.rows, 6);
  assert.equal(stats['excluded:Category=Veterinary'], 1);
  assert.equal(stats['excluded:Medicine status=Withdrawn (no afirma un tratamiento vigente)'], 1);
  assert.equal(stats['excluded:sin código ATC de nivel 5'], 2); // sin ATC y «A05» (nivel 2)
  assert.equal(assertions.length, 3);
  const humalog = assertions.find((a) => a.source.recordId === 'EMEA/H/C/000088|Diabetes Mellitus');
  assert.deepEqual(keys(humalog.drug.codes), ['ATC:A10AB04', 'ATC:A10AD04']);
  assert.deepEqual(keys(humalog.condition.codes), ['MESH_HEADING:Diabetes Mellitus']);
  assert.equal(humalog.relation.polarity, 'positive');
  assert.equal(assertions.filter((a) => a.source.recordId.startsWith('EMEA/H/C/000959')).length, 2); // Pain y Cancer
});

test('Open Targets: solo informes de la EMA con etapa APPROVAL; varios fármacos = combinación; ids con sistemas no cargados se cuentan', () => {
  const { assertions, stats } = parseOpenTargetsEma(read('opentargets-ema.ndjson'), prov('ot'));
  assert.equal(stats.reports, 5);
  assert.equal(stats['excluded:clinicalStage=WITHDRAWAL (no es APPROVAL)'], 1);
  assert.equal(stats['excluded:diseaseId sin sistema cargado (GO)'], 1);
  assert.equal(stats['excluded:diseaseId sin sistema cargado (null)'], 2);
  const combo = assertions.find((a) => a.drug.codes.length === 2);
  assert.equal(combo.drug.combination, true);
  assert.deepEqual(keys(combo.condition.codes), ['MONDO:0005109']);
  assert.ok(assertions.every((a) => a.evidence.clinicalStage === 'APPROVAL' && a.relation.polarity === 'positive'));
});

test('CIViC: solo evidencia predictiva; SEQUENTIAL y terapias sin NCIt se excluyen; COMBINATION es el conjunto y SUBSTITUTES una por terapia; siempre condicionada', () => {
  const { assertions, stats } = parseCivic(read('civic-predictive.ndjson'), prov('civic'));
  assert.equal(stats['evidence items'], 9);
  assert.equal(stats['excluded:2 terapias con interacción SEQUENTIAL'], 1);
  assert.equal(stats['excluded:enfermedad sin DOID'], 1);
  assert.equal(stats['excluded:terapia sin código NCIt'], 1);
  assert.ok(assertions.every((a) => a.relation.polarity === 'conditional' && a.evidence.conditionalOnMolecularProfile === true));
  const combo = assertions.find((a) => a.evidence.therapyInteractionType === 'COMBINATION');
  assert.equal(combo.drug.codes.length, 2);
  assert.equal(combo.drug.combination, true);
  assert.equal(assertions.filter((a) => a.evidence.therapyInteractionType === 'SUBSTITUTES').length, 3);
  assert.ok(assertions.some((a) => a.relation.type === 'civic:predictive-does-not-support-sensitivity-response'));
  assert.ok(assertions.every((a) => a.condition.codes[0].system === 'DOID'));
});

test('Wikidata: P2176 está en la enfermedad y P2175 en el fármaco; sin identificador farmacéutico, rango deprecated o sin código de enfermedad se excluye', () => {
  const { assertions, stats } = parseWikidata(read('wikidata-statements.ndjson'), read('wikidata-item-ids.ndjson'), prov('wd'));
  assert.equal(stats['excluded:rango deprecated'], 1);
  assert.equal(stats['excluded:fármaco/terapia sin identificador farmacéutico (RxNorm, ChEMBL, DrugBank, UNII, ATC)'], 1);
  assert.equal(stats['excluded:enfermedad sin código (MeSH, DOID, MONDO, UMLS, ICD, OMIM, Orphanet, NCIt)'], 1);
  assert.deepEqual(byType(assertions), { 'wikidata:P2175': 1, 'wikidata:P2176': 1 });
  const p2176 = assertions.find((a) => a.relation.type === 'wikidata:P2176');
  assert.equal(p2176.evidence.drugItem, p2176.source.recordId.startsWith('P2176') ? p2176.evidence.drugItem : null);
  assert.ok(keys(p2176.drug.codes).includes('RXCUI:8638'));
  assert.ok(p2176.drug.codes.filter((c) => c.system === 'ATC').every((c) => /^[A-Z]\d{2}[A-Z]{2}\d{2}$/.test(c.code)));
  assert.equal(p2176.source.release, 'r-test');
});

test('Wikidata: el ATC de un código solo vale si el código pertenece a un único ítem con ATC', () => {
  const { map, ambiguous } = wikidataAtcIndex(read('wikidata-item-ids.ndjson'));
  assert.equal(ambiguous, 1); // MeSH C031233 compartido por dos ítems con ATC distintos
  assert.equal(map.has('MESH:C031233'), false);
  assert.ok(map.get('RXCUI:448').every((c) => c.system === 'ATC'));
});

test('ClinicalTrials.gov: un par (término de intervención, término de condición) por todos los estudios en que figuran juntos; es «en estudio», nunca indicación', () => {
  const { assertions, stats } = parseClinicalTrials(read('clinicaltrials-studies.ndjson'), prov('ct'));
  assert.equal(stats.studies, 6);
  assert.equal(stats['excluded:estudio sin término MeSH de condición'], 1);
  assert.equal(stats['excluded:estudio sin término MeSH de intervención'], 1);
  assert.equal(assertions.length, 5);
  const nal = assertions.find((a) => a.source.recordId === 'D009271|D000437');
  assert.deepEqual(nal.evidence.nctIds, ['NCT00000438', 'NCT00000440']);
  assert.equal(nal.evidence.studyCount, 2);
  assert.deepEqual(nal.evidence.phases, { PHASE2: 1, PHASE4: 1 });
  assert.equal(nal.evidence.maxPhase, 'PHASE4');
  assert.equal(nal.relation.polarity, 'investigational');
  assert.equal(assertions.find((a) => a.source.recordId === 'D013792|D011230').evidence.maxPhase, null); // fase N/A
});

test('eEML: se extraen los campos estructurados de la página (sin formulaciones); sin ATC o sin ICD-11 no se carga', () => {
  const page = parseEemlPage(read('eeml-recommendation-298.html'), 298);
  assert.equal(page.medicineName, 'Atropine');
  assert.deepEqual(page.atc, ['S01FA01']);
  assert.deepEqual(page.icd11, [{ code: '9A96.Z', entity: '908233081' }]);
  assert.equal(page.indication, 'Anterior uveitis');
  assert.deepEqual(page.lists, ['EMLC']);
  assert.ok(!JSON.stringify(page).includes('0.1%'), 'sin concentraciones');
  const pending = parseEemlPage(read('eeml-recommendation-17.html'), 17);
  assert.deepEqual(pending.atc, []);
  const ndjson = [page, pending].map((p) => JSON.stringify(p)).join('\n');
  const { assertions, stats } = parseEeml(ndjson, prov('eeml'));
  assert.equal(stats['excluded:sin código ATC (p. ej. medicamento sin ATC asignado)'], 1);
  assert.equal(assertions.length, 1);
  assert.deepEqual(keys(assertions[0].drug.codes), ['ATC:S01FA01']);
  assert.deepEqual(keys(assertions[0].condition.codes), ['ICD11MMS:9A96.Z']);
  assert.equal(assertions[0].source.uri, 'https://list.essentialmeds.org/recommendations/298');
});

test('encadenado: el fármaco llega a ATC por RxClass y el cruce de DrugCentral; el destino se enlaza solo por código exacto', () => {
  const mesh = meshConceptIndex(read('mesh-concepts.tsv'));
  const mondo = mondoIndex(read('mondo.sssom.tsv'));
  const dc = drugCentralIndex(drugCentralIdentifiers(read('drugcentral-identifiers.tsv')));
  const rx = rxclassAtcIndex(read('rxclass-atc.tsv'));
  const atc = [{ via: 'rxclass-atc', map: new Map([...rx].map(([k, v]) => [`RXCUI:${k}`, v])) }];
  const { assertions } = parseMedRt(read('medrt.xml'), prov('medrt'));
  const sertraline = assertions.find((a) => a.source.recordId === 'may_treat|RxNorm:36437|M0006033');
  const x = withCrosswalk(sertraline, { mondo, drugCentral: dc, mesh, atc });
  assert.deepEqual(x.crosswalk.drug.filter((c) => c.system === 'ATC').map((c) => c.code), ['N06AB06']);
  assert.ok(x.crosswalk.drug.find((c) => c.system === 'ATC').from === 'RXCUI:36437');
  // relaciones estructurales: ATC → vademecum y RXCUI → rxnorm_full por código exacto
  const targets = new Map([['ATC:N06AB06', ['concept-atc']], ['RXCUI:36437', ['concept-rx']]]);
  const rels = relationshipsFor(x, targets);
  assert.deepEqual(rels.map((r) => r[2]).sort(), ['concept-atc', 'concept-rx']);
});
