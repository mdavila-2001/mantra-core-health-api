// Pruebas del catálogo de análisis médicos (tools/terminology-import/lab-tests/).
// Fixtures: recortes REALES de hl7.terminology.r4@7.0.1 (CodeSystem v2-0487,
// ValueSet ucum-common), de @lhncbc/ucum-lhc@8.0.1 (ucumDefs.min.json) y de
// los aranceles (FONASA MLE 2026, SIGTAP 2026.08, TUSS 2026.06.26, PAMI 2022,
// ICD-10-PCS FY2026; `tariffs.recorte.json`), bajados el 2026-10-24. Los CSV de LOINC son SINTÉTICOS y están marcados como
// tales (códigos 0000-0…): no hay archivo real sin cuenta en loinc.org.
// Correr: node --test tools/terminology-import/test/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { md5uuid } from '../lib/glossary-es/load-plan.mjs';
import { loincDomain } from '../lab-tests/lib/domains.mjs';
import { TEST_VERSION_COLUMNS, conditionGeneMap, gtrRecords, methodCategoryMap, parseTsv } from '../lab-tests/lib/gtr.mjs';
import { thoRecords } from '../lab-tests/lib/hl7-tho.mjs';
import { RELATION, buildPlan, planSummary } from '../lab-tests/lib/load-plan.mjs';
import { loincRecords, parseLinguisticIndex, parseLinguisticVariant, parseLoincTable, parsePanels } from '../lab-tests/lib/loinc.mjs';
import { assertRecord, conceptIdFor, propertyIdFor } from '../lab-tests/lib/records.mjs';
import { addCie10esDesignations, cupsItems, fonasaItems, pamiItems, pamiOfficialItems, pcsAxisNames, pcsItems, pcsOrderFile, ruleFor, sigtapItems, tariffRecords, tussItems } from '../lab-tests/lib/tariffs.mjs';
import { partsFromFullySpecifiedName } from '../lab-tests/lib/loinc-tx.mjs';
import { ucumRecords } from '../lab-tests/lib/ucum.mjs';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'lab-tests');
const json = (f) => JSON.parse(readFileSync(join(FIX, f), 'utf8'));
const NPM = (name, version) => ({ packageName: name, packageVersion: version, file: 'fixture', sha256: 'f'.repeat(64), retrievedAt: '2026-10-24T00:00:00.000Z', license: 'test' });

test('HL7 THO v2-0487 (recorte real): verbatim, deprecado no seleccionable, procedencia completa', () => {
  const rows = thoRecords(json('tho-CodeSystem-v2-0487.recorte.json'), 'v2-0487', NPM('hl7.terminology.r4', '7.0.1')).map(assertRecord);
  assert.equal(rows.length, 4);
  const ser = rows.find((r) => r.code === 'SER');
  assert.equal(ser.display, 'Serum');
  assert.equal(ser.selectable, true);
  assert.deepEqual(ser.valueSets, ['lab-catalog-specimen-types']);
  assert.equal(ser.provenance.sourceId, 'http://terminology.hl7.org/CodeSystem/v2-0487#SER');
  const dep = rows.find((r) => r.code === '...');
  assert.equal(dep.selectable, false);
  assert.equal(dep.properties.hl7_deprecated_in, '2.9');
  assert.equal(ser.id, conceptIdFor('hl7-v2-0487', 'SER'));
});

test('UCUM (recortes reales): une ucum-lhc y ucum-common por código, sin inventar nombres', () => {
  const { records, stats } = ucumRecords(json('ucum-lhc-ucumDefs.recorte.json'), json('tho-ValueSet-ucum-common.recorte.json'), {
    lhc: NPM('@lhncbc/ucum-lhc', '8.0.1'),
    tho: NPM('hl7.terminology.r4', '7.0.1'),
  });
  records.forEach(assertRecord);
  assert.equal(stats.lhcUnits, 4);
  assert.equal(records.length, 5); // 4 de ucum-lhc + '%/100', que sólo está en ucum-common
  const m = records.find((r) => r.code === 'm');
  assert.equal(m.display, 'meter');
  assert.equal(m.properties.ucum_common_display, 'meter');
  assert.deepEqual(m.valueSets, ['lab-catalog-ucum-units', 'lab-catalog-ucum-common-units']);
  assert.equal(m.provenance.source, 'ucum');
  assert.equal(m.alsoIn[0].source, 'hl7-tho');
  const onlyCommon = records.find((r) => r.code === '%/100');
  assert.equal(onlyCommon.display, 'percent / 100');
  assert.equal(onlyCommon.provenance.source, 'hl7-tho');
  assert.equal(records.find((r) => r.code === 'sb').selectable, false); // categoría Obsolete
});

// --- LOINC: CSV SINTÉTICOS (formato de la distribución, contenido inventado y marcado) ---
const LOINC_CSV = [
  'LOINC_NUM,COMPONENT,PROPERTY,TIME_ASPCT,SYSTEM,SCALE_TYP,METHOD_TYP,CLASS,CLASSTYPE,STATUS,LONG_COMMON_NAME,SHORTNAME,ORDER_OBS,EXAMPLE_UCUM_UNITS,PanelType,RELATEDNAMES2',
  '0000-0,Panel sintetico,-,Pt,Ser/Plas,-,,PANEL.CHEM,1,ACTIVE,Panel sintético de prueba,,Order,,Panel,',
  '0001-0,Componente sintetico,MCnc,Pt,Ser/Plas,Qn,,CHEM,1,ACTIVE,Componente sintético [Masa/volumen],Comp sint,Both,mg/dL;g/L,,uno; dos',
  '0002-0,Pregunta sintetica,Find,Pt,^Patient,Nom,,SURVEY.SINT,4,ACTIVE,Pregunta sintética de encuesta,,Observation,,,',
  '0003-0,Estudio sintetico,Find,Pt,Chest,Doc,XR,RAD,2,DEPRECATED,Estudio de imagen sintético,,Order,,,',
  '0004-0,Adjunto sintetico,Find,Pt,^Patient,Doc,,ATTACH.SINT,3,ACTIVE,Adjunto sintético,,Observation,,,',
].join('\n');
const PANELS_CSV = ['ParentId,ParentLoinc,ParentName,ID,SEQUENCE,Loinc,LoincName,ObservationRequiredInPanel', '1,0000-0,Panel,1,0,0000-0,Panel,', '1,0000-0,Panel,2,1,0001-0,Comp,R', '1,0000-0,Panel,3,2,0002-0,Preg,O'].join('\n');
const LV_INDEX = 'ID,ISO_LANGUAGE,ISO_COUNTRY,LANGUAGE_NAME,PRODUCER\n9,es,XX,Español sintético,Productor sintético\n';
const LV_ES = 'LOINC_NUM,COMPONENT,LONG_COMMON_NAME,LinguisticVariantDisplayName,RELATEDNAMES2\n0001-0,Componente,Componente sintético ES,Comp sint ES,uno es; dos es\n';

function syntheticLoinc() {
  const index = parseLinguisticIndex(LV_INDEX);
  return loincRecords(
    { table: parseLoincTable(LOINC_CSV), panels: parsePanels(PANELS_CSV), es: parseLinguisticVariant(LV_ES) },
    { release: '0.00-sintetico', retrievedAt: '2026-10-24T00:00:00.000Z', files: { 'Loinc.csv': { file: 'fixture', sha256: 'f'.repeat(64) } }, esVariant: { ...index[0], file: 'esXX9LinguisticVariant.csv' }, license: 'test' },
  );
}

test('LOINC (CSV SINTÉTICO): dominios, exclusiones, miembros de panel, variante ES', () => {
  const { records, stats } = syntheticLoinc();
  records.forEach(assertRecord);
  const by = Object.fromEntries(records.map((r) => [r.code, r]));
  assert.deepEqual(Object.keys(by).sort(), ['0000-0', '0001-0', '0002-0', '0003-0']); // 0004-0 (CLASSTYPE 3) fuera
  assert.equal(stats.excludedByClass['ATTACH.SINT|3'], 1);
  assert.equal(by['0000-0'].domain, 'laboratory');
  assert.equal(by['0003-0'].domain, 'imaging');
  assert.equal(by['0003-0'].selectable, false); // DEPRECATED
  assert.equal(by['0002-0'].domain, null); // encuesta: entra sólo por ser miembro del panel
  assert.deepEqual(by['0001-0'].relations, [{ type: 'part-of', targetCodeSystem: 'loinc', targetCode: '0000-0', ordinal: 1 }]);
  assert.deepEqual(by['0000-0'].properties.loinc_panel_members.map((m) => m.loinc), ['0001-0', '0002-0']);
  assert.deepEqual(by['0001-0'].properties.loinc_example_ucum_units, ['mg/dL', 'g/L']);
  assert.deepEqual(by['0001-0'].designations, [
    { lang: 'es', type: 'preferred', value: 'Componente sintético ES' },
    { lang: 'es', type: 'synonym', value: 'Comp sint ES' },
  ]);
  assert.deepEqual(by['0001-0'].properties.loinc_related_names_es, ['uno es', 'dos es']);
  assert.ok(by['0000-0'].valueSets.includes('lab-catalog-loinc-panels'));
  assert.ok(by['0001-0'].valueSets.includes('lab-catalog-loinc-orderable'));
  assert.ok(by['0001-0'].valueSets.includes('lab-catalog-loinc-class-chem'));
});

test('LOINC: cabeceras ausentes abortan mostrando las reales', () => {
  assert.throws(() => parseLoincTable('CODE,NAME\n1,2\n'), /Cabeceras encontradas: CODE, NAME/);
  assert.throws(() => parsePanels('A,B\n1,2\n'), /PanelsAndForms\.csv: faltan columnas/);
});

test('LOINC: ids y property_code idénticos a import-loinc.mjs (enriquece, no duplica)', () => {
  assert.equal(conceptIdFor('loinc', '0001-0'), md5uuid('mantra:loinc:concept:0001-0'));
  assert.equal(propertyIdFor('loinc', '0001-0', 'component'), md5uuid('mantra:loinc:property:0001-0:component'));
});

test('dominios: reglas por CLASS/CLASSTYPE; lo no reconocido queda sin dominio', () => {
  assert.deepEqual(loincDomain('PANEL.HEM/BC', '1'), { domain: 'laboratory', rule: 'loinc:classtype-1-laboratory' });
  assert.equal(loincDomain('MOLPATH.MUT', '1').domain, 'genetics');
  assert.equal(loincDomain('PATH', '1').domain, 'pathology');
  assert.equal(loincDomain('PULM', '2').domain, 'functional');
  assert.equal(loincDomain('H&P.HX', '2').domain, null);
  assert.equal(loincDomain('SURVEY.X', '4').domain, null);
});

test('plan de carga: relaciones dentro del plan, value sets y conteos deterministas', () => {
  const { records } = syntheticLoinc();
  const meta = { codeSystems: [{ internalCode: 'loinc', name: 'LOINC', canonicalUrl: 'http://loinc.org', version: '0.00-sintetico', sourceKey: 'loinc' }] };
  const plan = buildPlan([{ layer: 'loinc', meta, records }]);
  const s = planSummary(plan);
  assert.equal(s.concepts, 4);
  assert.equal(s.relationships, 2);
  assert.ok(plan.relationships.every((t) => t[3] === RELATION['part-of']));
  assert.equal(s.designations, 2);
  assert.equal(new Set(plan.properties.map((p) => p[0])).size, plan.properties.length);
  assert.ok(plan.valueSets.find((v) => v.code === 'lab-catalog-domain-imaging').members.length === 1);
  assert.deepEqual(buildPlan([{ layer: 'loinc', meta, records }]).properties, plan.properties);
});

// --- Aranceles y nomencladores (recortes reales) ------------------------------
const TAR = json('tariffs.recorte.json');
const TPROV = { sourceName: 'test', sourceVersion: 'test', sourceUrl: 'https://example.invalid/', sourceFile: 'fixture', sourceSha256: 'f'.repeat(64), retrievedAt: '2026-10-24T00:00:00.000Z', license: 'test' };
const byCode = (records) => Object.fromEntries(records.map((r) => [r.code, r]));

test('FONASA MLE (recorte real): prefijos homogéneos, exclusión terapéutica explícita, nombre oficial verbatim', () => {
  const { records, stats } = tariffRecords('fonasa-mle', fonasaItems(TAR.fonasa), TPROV);
  records.forEach(assertRecord);
  const by = byCode(records);
  assert.deepEqual(Object.keys(by).sort(), ['0301091', '1001012']);
  assert.equal(by['0301091'].domain, 'laboratory');
  assert.equal(by['0301091'].display, 'Proteína C funcional');
  assert.equal(by['0301091'].properties.tariff_official_name, 'PROTEÍNA C FUNCIONAL');
  assert.equal(by['0301091'].properties.reference_price.currency, 'CLP');
  assert.equal(by['1001012'].domain, 'functional');
  assert.equal(stats.excludedExplicitly[0].code, '0402022'); // angioplastía
  assert.equal(stats.excludedByPrefix['0101'], 1); // consulta: fuera por prefijo
});

test('SIGTAP (recorte real): sólo grupo 02, categoría con nombres oficiales, genética gana a laboratorio', () => {
  const t = TAR.sigtap;
  const { records } = tariffRecords('sigtap-sus', sigtapItems(t.procedures, t.subGroups, t.organizationForms), TPROV);
  records.forEach(assertRecord);
  assert.equal(records.length, 3); // el del grupo 03 no entra
  const by = byCode(records);
  assert.equal(by['0202010015'].domain, 'laboratory');
  assert.equal(by['0202100014'].domain, 'genetics');
  assert.match(by['0202100014'].category.display, /Exames de genética/);
  assert.equal(records.find((r) => r.code.startsWith('0201')).domain, null);
  assert.ok(by['0202100014'].valueSets.includes('lab-catalog-sigtap-sus-cat-020210'));
});

test('TUSS (recorte real): 4.03 laboratorio; 4.08.13 y 40502210 excluidos; consultas fuera', () => {
  const { records, stats } = tariffRecords('tuss-ans', tussItems(TAR.tuss), TPROV);
  assert.deepEqual(records.map((r) => r.code), ['40301010']);
  assert.equal(records[0].lang, 'pt');
  assert.deepEqual(stats.excludedExplicitly.map((x) => x.code).sort(), ['40502210', '40813010']);
});

test('PAMI (recorte real): código rellenado a 6 dígitos; 77621 es capítulo 07, no laboratorio', () => {
  const { records, stats } = tariffRecords('pami-nomenclador', pamiItems(TAR.pami), TPROV);
  const by = byCode(records);
  assert.equal(by['660002'].domain, 'laboratory');
  assert.equal(by['340101'].domain, 'imaging');
  assert.equal(by['077621'], undefined);
  assert.equal(stats.excludedExplicitly[0].code, '187143'); // drenaje bajo eco
});

test('ICD-10-PCS (recorte real): B imagen, C1 imagen, C7 terapia fuera, 4A y F0 evaluaciones funcionales', () => {
  const sections = new Map(TAR.pcs.sections.map((x) => [x.value, x.meaning]));
  const { records } = tariffRecords('icd10pcs-cms', pcsItems(TAR.pcs.codes, sections), TPROV);
  records.forEach(assertRecord);
  const by = byCode(records);
  assert.deepEqual(Object.keys(by).sort(), ['4A0002Z', 'B00B0ZZ', 'C0101ZZ', 'F003GKZ']);
  assert.equal(by.B00B0ZZ.domain, 'imaging');
  assert.equal(by.B00B0ZZ.category.display, 'Imaging › Plain Radiography');
  assert.equal(by['4A0002Z'].domain, 'functional');
  assert.equal(by.F003GKZ.domain, 'functional');
  assert.equal(ruleFor('icd10pcs-cms', 'CW70NZZ'), null);
});

// --- NCBI GTR (recorte real de test_version.gz / test_condition_gene.txt) ------
test('GTR (recorte real): sólo la versión vigente, con tipo, genes, condiciones y categoría mayor oficial', () => {
  const g = json('gtr.recorte.json');
  const versions = parseTsv(g.test_version, TEST_VERSION_COLUMNS, 'test_version');
  const { records, stats } = gtrRecords(versions, conditionGeneMap(g.test_condition_gene), methodCategoryMap(g.tests_by_method_category), { sourceVersion: 'test', sourceFile: 'fixture', sourceSha256: 'f'.repeat(64), retrievedAt: '2026-10-24T00:00:00.000Z' });
  records.forEach(assertRecord);
  assert.equal(new Set(records.map((r) => r.code)).size, records.length);
  assert.equal(stats.current, records.length);
  const fx = records.find((r) => r.code === 'GTR000004006');
  assert.ok(fx, 'el test vigente de GTR000004006 está');
  assert.equal(fx.domain, 'genetics');
  assert.equal(fx.properties.gtr_test_type, 'Clinical');
  assert.ok(fx.properties.gtr_genes.some((x) => x.symbol === 'FMR1' && x.geneId === '2332'));
  assert.ok(fx.properties.gtr_conditions.some((x) => x.medgenCui === 'C0016667'));
  assert.equal(fx.provenance.sourceUrl, 'https://www.ncbi.nlm.nih.gov/gtr/tests/4006/');
  // GTR000053361.5 trae una categoría con caracteres mal codificados en la propia fuente («Karyotypingâ„¢»):
  // no se adivina su categoría mayor, se reporta; las demás categorías del test sí resuelven.
  const sky = records.find((r) => r.code === 'GTR000053361');
  assert.ok(sky.properties.gtr_major_method_categories.includes('Molecular Genetics'));
  assert.equal(Object.keys(stats.unmappedMethodCategories).length, 1);
  assert.match(Object.keys(stats.unmappedMethodCategories)[0], /Karyotyping/);
  assert.throws(() => parseTsv('a\tb\n1\t2\n', TEST_VERSION_COLUMNS, 'x'), /Cabeceras encontradas: a, b/);
});

// --- CUPS de MinSalud Colombia (recorte real de POS Pópuli, datos.gov.co) -------
test('CUPS (recorte real): «Qué es» oficial como definición, prefijos verificados, 5 dígitos fuera, exclusión terapéutica', () => {
  const fx = json('cups-co.recorte.json');
  const { records, stats } = tariffRecords('cups-co', cupsItems(fx.lab, fx.pbs, { 'Procedimiento del PBS': { sourceUrl: 'https://www.datos.gov.co/x/9zcz-bjue' } }), TPROV);
  records.forEach(assertRecord);
  const by = byCode(records);
  assert.deepEqual(Object.keys(by).sort(), ['870001', '901001']); // 890201 (consulta) fuera por prefijo; 954610 terapia; 10101 tiene 5 dígitos
  assert.equal(by['901001'].domain, 'laboratory');
  assert.match(by['901001'].definition, /sensibilidad a los antibióticos/);
  assert.equal(by['901001'].properties.tariff_official_name, 'ANTIBIOGRAMA (DISCO)');
  assert.equal(by['870001'].domain, 'imaging');
  assert.equal(by['870001'].provenance.sourceUrl, 'https://www.datos.gov.co/x/9zcz-bjue');
  assert.equal(by['901001'].provenance.sourceUrl, TPROV.sourceUrl);
  assert.equal(stats.excludedExplicitly[0].code, '954610');
});

test('ICD-10-PCS + CIE-10-ES: designación oficial en castellano sólo por igualdad exacta de código', () => {
  const sections = new Map(TAR.pcs.sections.map((x) => [x.value, x.meaning]));
  const { records } = tariffRecords('icd10pcs-cms', pcsItems(TAR.pcs.codes, sections), TPROV);
  // Textos verbatim de Procedimientos_Tabla_Referencia_CIE10ES_2026.xlsx (hoja «ES2026 Completa + Marcadores»).
  const es = new Map([
    ['B00B0ZZ', 'Radiografía simple de médula espinal, con contraste, hiperosmolar'],
    ['4A0002Z', 'Medición de conductividad, nervioso central, abordaje abierto'],
  ]);
  const r = addCie10esDesignations(records, es, { edition: '2026', url: 'https://example.invalid/px.xlsx', file: 'fixture', sha256: 'f'.repeat(64) });
  assert.deepEqual(r, { added: 2, missing: records.length - 2 });
  const b = records.find((x) => x.code === 'B00B0ZZ');
  assert.deepEqual(b.designations, [{ lang: 'es', type: 'preferred', value: 'Radiografía simple de médula espinal, con contraste, hiperosmolar' }]);
  assert.match(b.properties.designation_es_source.source, /CIE-10-ES Procedimientos 2026/);
  assert.deepEqual(records.find((x) => x.code === 'F003GKZ').designations, []);
});

test('LOINC vía tx.fhir.org: el nombre corto es-AR (FSN) se corta en los seis ejes sólo si son exactamente seis', () => {
  // Valor real de tx.fhir.org para 2345-7 (designación es-AR SHORTNAME, LOINC 2.82).
  assert.deepEqual(partsFromFullySpecifiedName('glucosa:concentración de masa:punto en el tiempo:suero/plasma:cuantitativo:'), {
    component: 'glucosa',
    property: 'concentración de masa',
    time_aspct: 'punto en el tiempo',
    system: 'suero/plasma',
    scale_typ: 'cuantitativo',
  });
  assert.equal(partsFromFullySpecifiedName('Glucose SerPl-mCnc'), null);
  assert.equal(partsFromFullySpecifiedName('a:b:c'), null);
});

test('ICD-10-PCS FY2027 (recorte real de cms.gov): order file de ancho fijo y nombres oficiales de sección y tipo', () => {
  const fx = json('cms-icd10pcs-2027.recorte.json');
  const codes = pcsOrderFile(fx.order);
  assert.deepEqual(codes.map((c) => c.code).sort(), ['4A0002Z', 'B00B0ZZ', 'CW70NZZ', 'F003GKZ']); // «B00» es encabezado (válido = 0)
  assert.equal(codes.find((c) => c.code === 'B00B0ZZ').long_desc, 'Plain Radiography of Spinal Cord using High Osmolar Contrast');
  const { sections, types } = pcsAxisNames(fx.tables);
  assert.equal(sections.get('F'), 'Physical Rehabilitation and Diagnostic Audiology');
  assert.equal(types.get('F0'), 'Speech Assessment');
  assert.equal(types.get('B0'), 'Plain Radiography');
  const { records } = tariffRecords('icd10pcs-cms', pcsItems(codes, sections, types), TPROV);
  assert.equal(records.find((r) => r.code === 'F003GKZ').category.display, 'Physical Rehabilitation and Diagnostic Audiology › Speech Assessment');
  assert.equal(records.find((r) => r.code === 'CW70NZZ'), undefined);
});

test('PAMI (recorte real del CSV oficial de datos.pami.org.ar): nombre verbatim, módulo y valor en pesos', () => {
  const fx = json('pami-oficial.recorte.json');
  const rows = fx.csv_latin1_decoded.split('\r\n').filter(Boolean).map((l) => l.split(';'));
  const items = pamiOfficialItems(rows);
  const acet = items.find((i) => i.code === '660002');
  assert.equal(acet.name, 'ACETONURIA');
  assert.equal(acet.display, 'Acetonuria');
  assert.equal(acet.properties.pami_module, '5');
  assert.deepEqual(acet.properties.reference_price, { currency: 'ARS', schedule: 'NOMENCLADOR ESTRUCTURA UNIDADES FEBRERO 2019', amount: '27.26', priceText: '$ 27,26' });
  assert.equal(items.find((i) => i.code === '187143').properties.reference_price.amount, '2935.17');
  const { records, stats } = tariffRecords('pami-nomenclador', items, TPROV);
  assert.deepEqual(records.map((r) => r.code).sort(), ['340101', '660002']);
  assert.equal(stats.excludedExplicitly[0].code, '187143');
});
