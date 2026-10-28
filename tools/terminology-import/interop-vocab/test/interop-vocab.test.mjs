// Pruebas del importador de vocabularios de interoperabilidad. Todo corre contra recortes REALES de los archivos
// descargados (test/fixtures/raw/: paquetes FHIR, cvx.txt, mvx.txt, ucum-essence.xml, language-subtag-registry).
//   node --test tools/terminology-import/interop-vocab/test/

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { RELATION_TO_EQUIVALENCE } from '../lib/conceptmaps.mjs';
import { buildCorpus } from '../lib/corpus.mjs';
import { classifyLicense, codeSystemInternalCode, illustrativeReason, parseCodeSystem, valueSetInternalCode } from '../lib/fhir.mjs';
import { buildPlan, designationsFor, propertiesFor, requiredInternalIds } from '../lib/load-plan.mjs';
import { INTERNAL, conceptRowId, md5uuid } from '../lib/model.mjs';
import { parseCvx, parseCvxTradenames, parseIanaRegistry, parseMvx, parseUcumEssence } from '../lib/parsers.mjs';
import { SOURCES } from '../lib/sources.mjs';
import { parseIso31662 } from '../lib/wikidata.mjs';

const RAW = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'raw');
const read = (rel) => readFileSync(join(RAW, rel), 'utf8');
const manifest = JSON.parse(read('manifest.json')).files;
const json = (rel) => JSON.parse(read(rel));

// --- CVX / MVX ---------------------------------------------------------------------------------

test('CVX: BOM, código con relleno, notas, noVacuna, fecha ISO y caracteres no ASCII', () => {
  const rows = parseCvx(read('cdc/cvx.txt'));
  assert.equal(rows.length, 18);
  assert.deepEqual(rows[0], { code: '54', shortDescription: 'adenovirus, type 4', fullName: 'adenovirus vaccine, type 4, live, oral', notes: null, status: 'Inactive', nonVaccine: false, lastUpdated: '2010-05-28' });
  const botulinum = rows.find((r) => r.code === '27');
  assert.equal(botulinum.nonVaccine, true);
  assert.equal(botulinum.status, 'Active');
  assert.match(rows.find((r) => r.code === '82').notes, /^This CVX code allows reporting/);
  assert.ok(rows.some((r) => /[^\x00-\x7f]/.test(r.fullName)), 'el recorte trae un nombre con caracteres no ASCII (κ)');
  assert.deepEqual([...new Set(rows.map((r) => r.status))].sort(), ['Active', 'Inactive', 'Never Active', 'Non-US']);
});

test('CVX: rechaza líneas con otro número de campos y códigos repetidos', () => {
  assert.throws(() => parseCvx('54|a|b|c|Active|False'), /7 campos/);
  const line = '54        |a|b||Active|False|2010/05/28';
  assert.throws(() => parseCvx(`${line}\r\n${line}`), /repetido/);
  assert.throws(() => parseCvx('54        |a|b||Active|Maybe|2010/05/28'), /noVacuna/);
  assert.throws(() => parseCvx('54        |a|b||Active|False|28/05/2010'), /fecha/);
});

test('MVX: cinco campos, notas opcionales, estado', () => {
  const rows = parseMvx(read('cdc/mvx.txt'));
  assert.equal(rows.length, 7);
  assert.deepEqual(rows[0], { code: 'AB', manufacturer: 'Abbott Laboratories', notes: 'includes Ross Products Division, Solvay', status: 'Inactive', lastUpdated: '2017-11-16' });
  assert.ok(rows.some((r) => r.notes === null) && rows.some((r) => r.notes !== null));
  assert.throws(() => parseMvx('AB|x|y|Active'), /5 campos/);
});

test('tradename.txt: ocho campos con «|» final, fabricante y MVX opcionales, marcas repetidas', () => {
  const rows = parseCvxTradenames(read('cdc/tradename.txt'));
  assert.equal(rows.length, 7);
  assert.deepEqual(rows.find((r) => r.tradeName === 'ACEL-IMUNE'), { tradeName: 'ACEL-IMUNE', description: 'DTaP', cvx: '20', manufacturer: null, mvx: null, cvxStatus: 'Inactive', productStatus: 'Inactive', lastUpdated: '2010-09-01' });
  assert.equal(rows.filter((r) => r.tradeName === 'ACAM2000').length, 2); // misma marca, dos fabricantes
  assert.throws(() => parseCvxTradenames('X|y|1|m|M|Active|Active|2020/01/01'), /«\|» final/);
});

// --- UCUM --------------------------------------------------------------------------------------

test('UCUM: prefijos, unidades base y derivadas; atributos, marcado y funciones verbatim', () => {
  const u = parseUcumEssence(read('ucum/ucum-essence.xml'));
  assert.deepEqual(u.header, { xmlns: 'http://unitsofmeasure.org/ucum-essence', version: '2.2', revision: 'N/A', date: '2024-06-17' });
  assert.deepEqual(u.prefixes.map((p) => p.code), ['Y', 'm', 'da', 'Gi']);
  assert.equal(u.prefixes[1].name, 'milli');
  assert.equal(u.prefixes[1].value.value, '1e-3');
  assert.deepEqual(u.baseUnits.map((b) => [b.code, b.CODE, b.dim, b.property]), [['m', 'M', 'L', 'length'], ['g', 'G', 'M', 'mass'], ['rad', 'RAD', 'A', 'plane angle']]);
  const cel = u.units.find((x) => x.code === 'Cel');
  assert.equal(cel.isSpecial, 'yes');
  assert.deepEqual(cel.value.function, { name: 'Cel', value: '1', Unit: 'K' });
  const gon = u.units.find((x) => x.code === 'gon');
  assert.equal(gon.printSymbol, '<sup>g</sup>');
  const pi = u.units.find((x) => x.code === '[pi]');
  assert.equal(pi.printSymbol, 'π');
  assert.equal(u.units.find((x) => x.code === '10*').class, 'dimless');
  // un prefijo y una unidad comparten código («m»): por eso van en code systems distintos
  assert.ok(u.prefixes.some((p) => p.code === 'm') && u.baseUnits.some((b) => b.code === 'm'));
});

test('UCUM: un Code repetido dentro de la misma clase es error', () => {
  const xml = read('ucum/ucum-essence.xml').replace('</root>', '<unit Code="%" CODE="%"><name>x</name><printSymbol>%</printSymbol><property>p</property><value Unit="1" UNIT="1" value="1">1</value></unit></root>');
  assert.throws(() => parseUcumEssence(xml), /repetido/);
});

// --- IANA --------------------------------------------------------------------------------------

test('IANA: registros, descripciones múltiples, rangos, continuaciones y campos', () => {
  const reg = parseIanaRegistry(read('iana/language-subtag-registry.txt'));
  assert.equal(reg.fileDate, '2026-09-17');
  const by = (type, code) => reg.records.find((r) => r.type === type && r.code === code);
  assert.deepEqual(by('language', 'es').descriptions, ['Spanish', 'Castilian']);
  assert.equal(by('language', 'es').suppressScript, 'Latn');
  assert.equal(by('language', 'mo').deprecated, '2008-11-22');
  assert.equal(by('language', 'mo').preferredValue, 'ro');
  assert.ok(by('language', 'qaa..qtz'));
  assert.equal(by('language', 'qaa..qtz').scope, 'private-use');
  assert.deepEqual(by('language', 'kha').comments, ['as of 2008-04-21 this subtag does not include Lyngngam; see lyg']);
  assert.equal(by('extlang', 'yue').macrolanguage, 'zh');
  assert.deepEqual(by('extlang', 'yue').prefixes, ['zh']);
  assert.ok(by('grandfathered', 'i-klingon'));
  assert.equal(by('redundant', 'zh-cmn').preferredValue, 'cmn');
  assert.equal(by('region', 'AR').descriptions[0], 'Argentina');
});

test('IANA: un campo desconocido o un tipo repetido es error (no se ignora en silencio)', () => {
  assert.throws(() => parseIanaRegistry('File-Date: 2026-01-01\n%%\nType: language\nSubtag: xx\nDescription: X\nFoo: bar\n'), /campos no contemplados/);
  assert.throws(() => parseIanaRegistry('File-Date: 2026-01-01\n%%\nType: language\nSubtag: xx\nDescription: X\n%%\nType: language\nSubtag: XX\nDescription: X\n'), /repetido/);
});

// --- FHIR: identidad y licencia ---------------------------------------------------------------------

test('identidad: internal_code estable derivado de la URL canónica', () => {
  assert.equal(codeSystemInternalCode('http://terminology.hl7.org/CodeSystem/v3-AddressUse'), 'hl7-tho:v3-AddressUse');
  assert.equal(codeSystemInternalCode('http://hl7.org/fhir/administrative-gender'), 'fhir:administrative-gender');
  assert.equal(valueSetInternalCode('http://hl7.org/fhir/ValueSet/administrative-gender'), 'fhir-vs:administrative-gender');
  assert.equal(valueSetInternalCode('http://terminology.hl7.org/ValueSet/v3-ActRelationshipJoin'), 'hl7-tho-vs:v3-ActRelationshipJoin');
});

test('licencia: SNOMED, DICOM y ejemplos del estándar no entran; los recursos de HL7 sí', () => {
  const r4 = (f) => json(`x/fhir-r4/package/${f}`);
  assert.equal(classifyLicense(r4('CodeSystem-animal-species.json')).ok, false);
  assert.match(classifyLicense(r4('CodeSystem-animal-species.json')).reason, /terceros/);
  assert.equal(classifyLicense(r4('CodeSystem-audit-source-type.json')).ok, false);
  assert.match(classifyLicense(r4('CodeSystem-audit-source-type.json')).reason, /NEMA/);
  assert.match(illustrativeReason(r4('CodeSystem-example.json')), /ejemplo/);
  const ok = classifyLicense(r4('CodeSystem-administrative-gender.json'));
  assert.deepEqual([ok.ok, ok.spdx], [true, 'CC0-1.0']);
  const tho = classifyLicense(json('x/tho-r4/package/CodeSystem-v3-AddressUse.json'));
  assert.equal(tho.ok, true);
});

test('CodeSystem FHIR: jerarquía anidada, propiedades y designaciones verbatim', () => {
  const cs = json('x/tho-r4/package/CodeSystem-v3-AddressUse.json');
  const { meta, concepts } = parseCodeSystem(cs, { key: 'tho-r4', name: 'hl7.terminology.r4', version: '7.5.0', file: 'package/CodeSystem-v3-AddressUse.json' });
  assert.equal(meta.hierarchyMeaning, 'is-a');
  assert.equal(concepts.length, 19);
  const h = concepts.find((c) => c.code === 'H');
  assert.deepEqual(h.parents, ['_GeneralAddressUse']);
  assert.ok(concepts.find((c) => c.code === '_GeneralAddressUse').abstract);
  assert.throws(() => parseCodeSystem({ ...cs, content: 'fragment' }, { key: 'x', name: 'x', version: '1', file: 'x' }), /sólo se cargan los completos/);
});

// --- Corpus completo sobre los fixtures --------------------------------------------------------------

const corpus = buildCorpus(RAW, manifest);
const sys = (code, version) => corpus.systems.find((s) => s.meta.internalCode === code && (!version || s.meta.version === version));

test('corpus: capas presentes, versiones por edición y una sola edición por defecto por URL', () => {
  const codes = corpus.systems.map((s) => `${s.meta.internalCode}@${s.meta.version}`).sort();
  assert.deepEqual(codes, [
    'cdc-cvx@2025-11-19', 'cdc-mvx@2026-04-14',
    'cldr-currency@cldr-49.0.0', 'cldr-language@cldr-49.0.0', 'cldr-script@cldr-49.0.0', 'cldr-territory@cldr-49.0.0', 'cldr-variant@cldr-49.0.0',
    'fhir:address-use@4.0.1', 'fhir:address-use@5.0.0', 'fhir:administrative-gender@4.0.1', 'fhir:administrative-gender@4.3.0', 'fhir:administrative-gender@5.0.0',
    'hl7-namingsystem@7.5.0', 'hl7-tho:v3-ActRelationshipJoin@4.0.0', 'hl7-tho:v3-AddressUse@2018-08-12', 'hl7-tho:v3-AddressUse@5.0.0',
    'iana-lsr-extlang@2026-09-17', 'iana-lsr-grandfathered@2026-09-17', 'iana-lsr-language@2026-09-17', 'iana-lsr-redundant@2026-09-17', 'iana-lsr-region@2026-09-17', 'iana-lsr-script@2026-09-17', 'iana-lsr-variant@2026-09-17',
    'ucum-prefix@essence-2.2-2024-06-17', 'ucum@essence-2.2-2024-06-17', 'wikidata-iso3166-2@consulta del 2026-10-28',
  ]);
  const defaults = corpus.systems.filter((s) => s.meta.isDefault).map((s) => s.meta.canonicalUrl);
  assert.equal(new Set(defaults).size, defaults.length);
  assert.equal(sys('fhir:administrative-gender', '5.0.0').meta.isDefault, true); // la más nueva (R5) primero
  assert.equal(sys('fhir:administrative-gender', '4.0.1').meta.isDefault, false);
});

test('corpus: lo omitido queda registrado con su motivo exacto', () => {
  const omitted = Object.fromEntries(corpus.coverage.codeSystems.filter((x) => x.decision === 'omitido').map((x) => [x.url.split('/').pop(), x.reason]));
  assert.match(omitted['v2-0493'], /ya lo carga lab-tests/);
  assert.match(omitted['v3-Country'], /sin ningún concepto/);
  assert.match(omitted['animal-species'], /terceros/);
  assert.match(omitted['security-source-type'], /NEMA/);
  assert.match(omitted['example'], /ejemplo/);
});

test('corpus: CVX/MVX con OID de HL7, estado verbatim y selectable sólo para Active', () => {
  const cvx = sys('cdc-cvx');
  assert.equal(cvx.meta.canonicalUrl, 'http://hl7.org/fhir/sid/cvx');
  assert.equal(cvx.meta.oid, '2.16.840.1.113883.12.292');
  assert.equal(sys('cdc-mvx').meta.oid, '2.16.840.1.113883.12.227');
  const c54 = cvx.concepts.find((c) => c.code === '54');
  assert.equal(c54.properties.cvx_status, 'Inactive');
  assert.equal(c54.selectable, false);
  assert.equal(cvx.concepts.find((c) => c.code === '24').selectable, true);
  assert.match(c54.provenance.license, /17 U\.S\.C\. §105/);
  assert.equal(c54.provenance.sourceSha256, manifest['cdc-cvx'].sha256);
});

test('corpus: marcas del CDC adjuntas al CVX y al MVX exactos, sin cruzar por nombre', () => {
  const cvx = sys('cdc-cvx');
  assert.deepEqual(cvx.meta.notes, { tradenameRows: 7, tradenamesWithoutCvx: 0, tradenamesWithoutMvx: 0 });
  const c75 = cvx.concepts.find((c) => c.code === '75');
  assert.deepEqual(c75.properties.cvx_trade_names.map((t) => [t.tradeName, t.mvx]), [['ACAM2000', 'MIP'], ['ACAM2000', 'ACA']]);
  assert.ok(c75.designations.filter((d) => d.value === 'ACAM2000').length === 1); // una designación por marca distinta
  const mip = sys('cdc-mvx').concepts.find((c) => c.code === 'MIP');
  assert.ok(mip.properties.mvx_products.some((t) => t.tradeName === 'ACAM2000' && t.cvx === '75'));
});

test('corpus: NamingSystem — id como código, URI y OID verbatim, solo licencia del paquete', () => {
  const ns = sys('hl7-namingsystem');
  assert.deepEqual(ns.concepts.map((c) => c.code).sort(), ['CVX', 'MVX']);
  const cvx = ns.concepts.find((c) => c.code === 'CVX');
  assert.deepEqual(cvx.properties.ns_oids, ['2.16.840.1.113883.12.292']);
  assert.deepEqual(cvx.properties.ns_uris, ['http://hl7.org/fhir/sid/cvx', 'http://terminology.hl7.org/CodeSystem/CVX']);
  assert.equal(cvx.properties.ns_kind, 'codesystem');
  assert.match(cvx.provenance.license, /CC0-1\.0/);
});

test('corpus: CLDR — nombres en/es verbatim, alfa-3 y numérico de CLDR, part-of sólo geográfico', () => {
  const t = sys('cldr-territory');
  assert.equal(t.meta.hierarchyMeaning, 'part-of');
  const ar = t.concepts.find((c) => c.code === 'AR');
  assert.deepEqual([ar.display, ar.designations.map((d) => d.value)], ['Argentina', ['Argentina', 'Argentina']]);
  assert.equal(ar.properties.cldr_alpha3, 'ARG');
  assert.equal(ar.properties.cldr_numeric, '032');
  assert.deepEqual(ar.parents, ['005']); // «UN» es un agrupamiento (grouping) y no un contenedor geográfico
  assert.ok(ar.properties.cldr_containers.some((c) => c.container === 'UN' && c.grouping === 'true'));
  assert.ok(ar.properties.cldr_currencies.length >= 1);
  const gb = t.concepts.find((c) => c.code === 'GB');
  assert.ok(gb.properties.cldr_alt_names.some((a) => a.alt === 'short'));
  assert.equal(t.meta.notes.codeMappingsWithoutName >= 1, true); // códigos de CLDR sin nombre (p. ej. BU) no se inventan
  assert.ok(!t.concepts.some((c) => c.code === 'BU'));
  const world = t.concepts.find((c) => c.code === '001');
  assert.equal(world.properties.cldr_kind, 'm49-area');
});

test('corpus: CLDR — monedas con numérico tal cual lo publica CLDR y formas de nombre completas', () => {
  const ars = sys('cldr-currency').concepts.find((c) => c.code === 'ARS');
  assert.equal(ars.display, 'Argentine Peso');
  assert.equal(ars.properties.cldr_numeric, '32'); // CLDR publica «32»: no se rellena con ceros
  assert.equal(ars.properties.cldr_digits, undefined); // CLDR no lista ARS en `fractions` (rige DEFAULT): no se infiere
  assert.equal(ars.properties.cldr_names_es.displayName, 'peso argentino');
  assert.ok('displayName-count-other' in ars.properties.cldr_names_en);
  const adp = sys('cldr-currency').concepts.find((c) => c.code === 'ADP');
  assert.equal(adp.designations.find((d) => d.language === 'es').value, 'peseta andorrana');
  assert.match(ars.provenance.license, /Unicode-3\.0/);
});

test('Wikidata ISO 3166-2: un código con dos ítems no se carga (no se elige uno); sin etiqueta no se completa', () => {
  const page = { file: 'wikidata/iso3166-2-p000.json', sha256: manifest['wikidata-iso3166-2'].sha256, json: json('wikidata/iso3166-2-p000.json') };
  const r = parseIso31662([page]);
  assert.equal(r.total, 10);
  assert.deepEqual(r.ambiguous, [{ code: 'AD-07', items: ['Q2522163', 'Q1863'] }]);
  assert.deepEqual(r.rows.map((x) => x.code), ['AD-02', 'AD-03', 'AD-04', 'AD-05', 'AD-06', 'AZ-NA', 'BR-PE', 'BS-AC']);
  assert.equal(r.rows.find((x) => x.code === 'BR-PE').labelEn, null);
  assert.throws(() => parseIso31662([page, page]), /repetido/);
  assert.throws(() => parseIso31662([{ file: 'x', sha256: 'x', json: { results: { bindings: [{ item: { value: 'https://example.org/Q1' }, code: { value: 'AD-02' } }] } } }]), /URI inesperada/);
});

test('corpus: Wikidata — QID y licencia CC0 por fila, display desde la etiqueta disponible', () => {
  const w = sys('wikidata-iso3166-2');
  assert.equal(w.concepts.length, 8);
  assert.deepEqual(w.meta.notes.ambiguous.map((a) => a.code), ['AD-07']);
  const canillo = w.concepts.find((c) => c.code === 'AD-02');
  assert.equal(canillo.properties.wikidata_qid, 'Q24260');
  assert.match(canillo.provenance.license, /CC0-1\.0/);
  assert.equal(w.concepts.find((c) => c.code === 'BR-PE').display, 'Pernambuco'); // sin etiqueta en inglés: la española, no la inventada
});

test('corpus: UCUM y prefijos en code systems distintos, sin cruzar códigos', () => {
  const units = sys('ucum');
  const prefixes = sys('ucum-prefix');
  assert.equal(units.meta.canonicalUrl, 'http://unitsofmeasure.org');
  assert.equal(units.concepts.length, 10);
  assert.equal(prefixes.concepts.length, 4);
  assert.equal(units.concepts.find((c) => c.code === 'Cel').display, 'degree Celsius');
  assert.match(units.concepts[0].provenance.license, /no modific|Prohíbe modificar|prohíbe modificar/i);
});

test('corpus: IANA — región ISO 3166-1, deprecado con valor preferido y rango verbatim', () => {
  const region = sys('iana-lsr-region');
  assert.deepEqual(region.concepts.map((c) => c.code).sort(), ['419', 'AR', 'BU']);
  const bu = region.concepts.find((c) => c.code === 'BU');
  assert.equal(bu.state, 'deprecated');
  assert.equal(bu.selectable, false);
  assert.equal(bu.properties.iana_preferred_value, 'MM');
  assert.ok(sys('iana-lsr-language').concepts.some((c) => c.code === 'qaa..qtz'));
  const es = sys('iana-lsr-language').concepts.find((c) => c.code === 'es');
  assert.deepEqual(es.designations, [{ language: null, use: null, value: 'Castilian' }]);
});

test('corpus: value sets expandidos sólo sobre contenido cargado, con ediciones separadas', () => {
  const vs = corpus.valueSets.filter((v) => v.meta.canonicalUrl.endsWith('/ValueSet/administrative-gender'));
  assert.deepEqual(vs.map((v) => v.meta.version).sort(), ['4.0.1', '4.3.0', '5.0.0']);
  const r5 = vs.find((v) => v.meta.version === '5.0.0');
  assert.deepEqual(r5.members.map((m) => m[2]).sort(), ['female', 'male', 'other', 'unknown']);
  assert.ok(r5.members.every((m) => m[0] === 'fhir:administrative-gender' && m[1] === '5.0.0'));
  const detached = corpus.valueSets.find((v) => v.meta.canonicalUrl.endsWith('v3-ActRelationshipJoinDetached'));
  assert.equal(detached.members.length, 1); // filtro `concept is-a`
});

test('ConceptMap: R4 equivalence y R5 relationship llegan a la misma equivalencia interna', () => {
  const pairs = corpus.conceptMaps.filter((m) => m.source.code === 'old' && m.target.code === 'OLD');
  const r4 = pairs.find((m) => m.source.version === '4.0.1');
  const r5 = pairs.find((m) => m.source.version === '5.0.0');
  assert.equal(r4.relationship, 'narrower');
  assert.equal(r5.relationship, 'source-is-broader-than-target');
  assert.equal(r4.equivalence, 'narrower');
  assert.equal(r5.equivalence, 'narrower');
  assert.equal(corpus.conceptMaps.filter((m) => m.relationship === 'equal').every((m) => m.equivalence === 'equivalent'), true);
  assert.equal(RELATION_TO_EQUIVALENCE['source-is-narrower-than-target'], 'wider');
  assert.equal(RELATION_TO_EQUIVALENCE.disjoint, undefined); // sin concepto interno → no se carga
});

test('ConceptMap: los pares con un extremo fuera del corpus se cuentan, no se cargan', () => {
  const v2 = corpus.coverage.conceptMaps.maps.find((m) => m.file === 'ConceptMap-cm-address-use-v2.json');
  assert.equal(v2.decision, 'sin pares cargables');
  assert.ok(v2.skipped > 0);
  assert.ok(corpus.coverage.conceptMaps.elements.endpointMissing >= v2.skipped);
});

test('corpus: dos armados seguidos dan exactamente los mismos bytes', () => {
  const again = buildCorpus(RAW, manifest);
  assert.equal(JSON.stringify(again.systems), JSON.stringify(corpus.systems));
  assert.equal(JSON.stringify(again.valueSets), JSON.stringify(corpus.valueSets));
  assert.equal(JSON.stringify(again.conceptMaps), JSON.stringify(corpus.conceptMaps));
});

// --- Plan de carga -----------------------------------------------------------------------------------------

function planOf() {
  // Mismo recorrido que readCorpus: líneas planas (meta de code system sin conceptos, conceptos con `cs`/`version`).
  const flat = {
    codeSystems: corpus.systems.map((s) => JSON.parse(JSON.stringify(s.meta))),
    concepts: corpus.systems.flatMap((s) => s.concepts.map((c) => JSON.parse(JSON.stringify({ cs: s.meta.internalCode, version: s.meta.version, ...c })))),
    valueSets: corpus.valueSets.map((v) => JSON.parse(JSON.stringify({ ...v.meta, members: v.members }))),
    conceptMaps: JSON.parse(JSON.stringify(corpus.conceptMaps)),
  };
  return buildPlan(flat);
}

test('plan: ids deterministas, sin repetidos, y toda relación/miembro/mapa apunta a un concepto del plan', () => {
  const a = planOf();
  const b = planOf();
  assert.deepEqual(a.concepts.map((c) => c.id), b.concepts.map((c) => c.id));
  const ids = new Set(a.concepts.map((c) => c.id));
  assert.equal(ids.size, a.concepts.length);
  for (const x of [...a.properties, ...a.designations]) assert.ok(ids.has(x.conceptId));
  for (const r of a.relationships) assert.ok(ids.has(r.source) && ids.has(r.target));
  for (const m of a.members) assert.ok(ids.has(m.conceptId));
  for (const m of a.conceptMaps) assert.ok(ids.has(m.source) && ids.has(m.target));
  assert.equal(new Set(a.properties.map((p) => p.id)).size, a.properties.length);
  assert.equal(a.concepts[0].id, conceptRowId(a.concepts[0].editionKey.split('\u0000')[0], a.concepts[0].editionKey.split('\u0000')[1], a.concepts[0].code));
});

test('plan: is-a sólo cuando el code system declara hierarchyMeaning; si no, el padre queda como propiedad', () => {
  const plan = planOf();
  const h = plan.concepts.find((c) => c.code === 'H' && c.editionKey.startsWith('hl7-tho:v3-AddressUse\u00005.0.0'));
  const rel = plan.relationships.filter((r) => r.source === h.id);
  assert.equal(rel.length, 1);
  assert.equal(rel[0].type, INTERNAL.REL_IS_A);
  // concepto con padres declarados en un sistema sin hierarchyMeaning → propiedad fhir_parent, ninguna relación
  const orphanParent = corpus.systems.flatMap((s) => s.concepts.map((c) => ({ s, c }))).find(({ s, c }) => !s.meta.hierarchyMeaning && c.parents.length);
  if (orphanParent) {
    const id = conceptRowId(orphanParent.s.meta.internalCode, orphanParent.s.meta.version, orphanParent.c.code);
    assert.ok(plan.properties.some((p) => p.conceptId === id && p.code === 'fhir_parent'));
    assert.equal(plan.relationships.filter((r) => r.source === id).length, 0);
  }
});

test('plan: designaciones sólo en inglés/español/sin idioma; todas quedan en fhir_designations', () => {
  const fake = { cs: 'x', version: '1', code: 'c', display: 'c', provenance: { license: 'l', sourceUrl: 'u', retrievedAt: 't' }, designations: [{ language: 'de', use: null, value: 'Hallo' }, { language: 'es-AR', use: null, value: 'Hola' }, { language: 'en', use: { system: 'http://terminology.hl7.org/CodeSystem/hl7TermMaintInfra', code: 'preferredForLanguage' }, value: 'Hello' }, { language: null, use: null, value: 'sin idioma' }], properties: {}, parents: [] };
  const id = conceptRowId('x', '1', 'c');
  const d = designationsFor(fake, id);
  assert.deepEqual(d.map((x) => x.value), ['Hola', 'Hello', 'sin idioma']);
  assert.equal(d[0].lang, INTERNAL.LANG.es);
  assert.equal(d[1].type, INTERNAL.DESIG_PREFERRED);
  assert.equal(d[2].lang, null);
  const props = propertiesFor(fake, id, { createsHierarchy: false });
  assert.deepEqual(props.find((p) => p.code === 'fhir_designations').value.map((x) => x.value), ['Hallo', 'Hola', 'Hello', 'sin idioma']);
});

test('plan: una propiedad de la fuente con nombre reservado es error', () => {
  const fake = { cs: 'x', version: '1', code: 'c', display: 'c', provenance: { license: 'l', sourceUrl: 'u', retrievedAt: 't' }, designations: [], properties: { source_license: 'x' }, parents: [] };
  assert.throws(() => propertiesFor(fake, conceptRowId('x', '1', 'c'), { createsHierarchy: false }), /reservado/);
});

test('plan: conceptos internos exigidos, con los ids de concepts.ts', () => {
  const need = requiredInternalIds();
  assert.equal(Object.keys(need).length, 16);
  assert.equal(need['state:active'], INTERNAL.STATE.active);
  assert.notEqual(need['state:active'], need['state:retired']);
});

test('procedencia por fila: URL, versión, fecha, SHA-256 y licencia en cada concepto', () => {
  for (const s of corpus.systems) {
    for (const c of s.concepts.slice(0, 5)) {
      const p = c.provenance;
      for (const k of ['source', 'sourceUrl', 'retrievedAt', 'license']) assert.ok(p[k], `${s.meta.internalCode}: falta ${k}`);
      assert.match(p.sourceSha256 ?? p.artifactSha256, /^[0-9a-f]{64}$/);
      assert.ok(p.sourceVersion);
    }
  }
});

test('fuentes: cada archivo del fetch tiene licencia declarada o es una página de licencia', () => {
  for (const s of SOURCES) {
    if (s.kind === 'fhir-package' || s.kind === 'npm-package') assert.equal(s.pkgLicense, s.key.startsWith('cldr-') ? 'Unicode-3.0' : 'CC0-1.0');
    assert.match(s.url, /^https:\/\//);
  }
  assert.equal(md5uuid('a').length, 36);
});
