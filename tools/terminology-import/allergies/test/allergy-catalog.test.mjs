// Pruebas del catálogo de alergias con extractos REALES de cada fuente
// (fixtures/: copiados tal cual de los artefactos descargados el 2026-10-24).
// Correr: node --test tools/terminology-import/allergies/test/

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { deterministicId } from '../../lib/glossary-es/common.mjs';
import {
  conceptIdOf,
  hl7Code,
  hpoSpanish,
  makeRecord,
  passChebiAllergens,
  passDoid,
  passHl7,
  passMondo,
  runPasses,
} from '../lib/catalog.mjs';
import { buildPlan, enumConceptMaps } from '../lib/load-plan.mjs';
import { flattenCodeSystem, offTagId, oboDescendants, owlVersionIri, parseObo, parseOffTaxonomy, parseOwlClasses, parseTsv } from '../lib/parse.mjs';
import { RXNORM_LEXICAL_GROUPS } from '../lib/sources.mjs';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const read = (name) => readFileSync(join(FIX, name), 'utf8');

const artifact = (key) => ({ spec: key, version: 'fixture', url: `https://example.invalid/${key}`, sha256: '0'.repeat(64), retrievedAt: '2026-10-24T00:00:00.000Z', license: 'test', owner: 'test' });

/** Contexto mínimo con los mismos lectores que build-allergy-catalog.mjs, sobre los fixtures. */
function fixtureContext() {
  const owl = read('ecto-excerpt.owl');
  return {
    manifest: { artifacts: Object.fromEntries(['fhir-r5-core', 'hl7-terminology', 'doid', 'mondo', 'ecto', 'hpo'].map((k) => [k, artifact(k)])) },
    discarded: [],
    notes: {},
    readPackageJson: (_key, file) => JSON.parse(read(file)),
    readObo: (key) => parseObo(read({ doid: 'doid-excerpt.obo', mondo: 'mondo-excerpt.obo', hpo: 'hp-excerpt.obo' }[key])),
    readOwl: () => ({ classes: parseOwlClasses(owl), version: owlVersionIri(owl) }),
  };
}

test('parseObo lee nombre, sinónimos EXACT, xrefs con su procedencia e is_a sin comentario', () => {
  const { terms } = parseObo(read('mondo-excerpt.obo'));
  const t = terms.get('MONDO:0005271');
  assert.equal(t.name, 'allergic disease');
  assert.ok(t.synonyms.some((s) => s.text === 'allergy' && s.scope === 'EXACT'));
  assert.deepEqual(t.isA, ['MONDO:0000605']);
  const doid = t.xrefs.find((x) => x.id === 'DOID:1205');
  assert.deepEqual(doid.sources, ['EFO:0003785', 'MONDO:equivalentTo']);
  assert.match(t.def, /^An immune response that occurs following re-exposure/);
});

test('oboDescendants recorre is_a transitivamente (DOID: rinitis alérgica bajo enfermedad alérgica)', () => {
  const { terms } = parseObo(read('doid-excerpt.obo'));
  const d = oboDescendants(terms, 'DOID:1205');
  assert.ok(d.has('DOID:0060496'));
  assert.ok(d.has('DOID:4481'));
  assert.ok(!d.has('DOID:2914'));
});

test('la traducción oficial de la HPO sólo se usa si traduce la etiqueta vigente', () => {
  const { terms } = parseObo(read('hp-excerpt.obo'));
  const es = hpoSpanish(terms, parseTsv(read('hp-es-excerpt.tsv')));
  assert.equal(es.labels.get('HP:0012393'), 'Alergia');
  assert.equal(es.labels.get('HP:0001025'), 'Urticaria');
  // HP:0000008 cambió de nombre en inglés después de traducirse: se descarta.
  assert.equal(terms.get('HP:0000008').name, 'Abnormal morphology of female internal genitalia');
  assert.equal(es.labels.has('HP:0000008'), false);
  assert.equal(es.stale, 1);
});

test('parseOffTaxonomy arma ids de etiqueta OFF y lee propiedades y padres', () => {
  const allergens = parseOffTaxonomy(read('off-allergens-excerpt.txt'));
  const gluten = allergens.find((e) => e.id === 'en:gluten');
  assert.ok(gluten.names.es.includes('trigo'));
  assert.equal(gluten.props.wikidata, 'Q188251');
  assert.ok(allergens.some((e) => e.id === 'en:none'));
  const additives = parseOffTaxonomy(read('off-additives-excerpt.txt'));
  const e100 = additives.find((e) => e.id === 'en:e100');
  assert.equal(e100.props.e_number, '100');
  const child = additives.find((e) => e.id === 'en:e100-i');
  assert.deepEqual(child.parents, [{ lang: 'en', name: 'E100' }]);
  // Mismo resultado que get_string_id_for_lang de OFF (Store.pm).
  assert.equal(offTagId('en', 'E100(ii)'), 'en:e100-ii');
  assert.equal(offTagId('en', 'Sulphur dioxide and sulphites'), 'en:sulphur-dioxide-and-sulphites');
  assert.equal(offTagId('en', 'E 160a.(iv)'), 'en:e-160a-iv');
});

test('parseOwlClasses lee etiqueta, superclases y restricciones has-role del RDF/XML de ROBOT', () => {
  const text = read('ecto-excerpt.owl');
  const classes = parseOwlClasses(text);
  const benzyl = classes.get('CHEBI:18208');
  assert.equal(benzyl.label, 'benzylpenicillin');
  assert.ok(benzyl.subClassOf.includes('CHEBI:88187'));
  assert.ok(benzyl.restrictions.some((r) => r.property === 'RO:0000087' && r.value === 'CHEBI:88188'));
  assert.equal(owlVersionIri(text), 'http://purl.obolibrary.org/obo/ecto/releases/2026-07-28/ecto.owl');
});

test('ChEBI: entran los químicos con rol de alérgeno y los descendientes de las clases de alérgeno; la naltrexona no', () => {
  const ctx = fixtureContext();
  const codes = passChebiAllergens(ctx).map((r) => r.code);
  for (const c of ['CHEBI:50904', 'CHEBI:88187', 'CHEBI:18208', 'CHEBI:88184', 'CHEBI:28112']) assert.ok(codes.includes(c), c);
  assert.ok(!codes.includes('CHEBI:7465'));
});

test('enumeraciones HL7: la jerarquía anidada del CodeSystem se conserva (presumed ⊂ unconfirmed)', () => {
  const flat = flattenCodeSystem(JSON.parse(read('CodeSystem-allergyintolerance-verification.json')));
  assert.deepEqual(flat.find((c) => c.code === 'presumed').parent, 'unconfirmed');
  const ctx = fixtureContext();
  ctx.readPackageJson = (_k, file) => {
    if (file === 'CodeSystem-allergyintolerance-verification.json' || file === 'CodeSystem-reaction-event-severity.json') return JSON.parse(read(file));
    return { id: file, url: `urn:${file}`, concept: [] };
  };
  const records = passHl7(ctx);
  const presumed = records.find((r) => r.code === hl7Code('allergyintolerance-verification', 'presumed'));
  assert.deepEqual(presumed.parents, ['allergyintolerance-verification|unconfirmed']);
  assert.equal(presumed.provenance.sourceSystem, 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification');
});

test('Mondo: lo equivalentTo un DOID cargado no se duplica y el hijo cuelga del DOID', () => {
  const ctx = fixtureContext();
  const { records, report } = runPasses(ctx, [
    { n: 1, key: 'doid', title: 'doid', run: passDoid },
    { n: 2, key: 'mondo', title: 'mondo', run: passMondo },
  ]);
  const mondo = records.filter((r) => r.codeSystem === 'allergy-mondo').map((r) => r.code);
  // 0005271 ≡ DOID:1205 y 0011786 ≡ DOID:4481: fusionados. 0005551 y 0005324 no tienen equivalente.
  assert.deepEqual(mondo.sort(), ['MONDO:0005324', 'MONDO:0005551']);
  const seasonal = records.find((r) => r.code === 'MONDO:0005324');
  assert.deepEqual(seasonal.crossParents, [{ codeSystem: 'allergy-doid', code: 'DOID:4481' }]);
  const doid = records.find((r) => r.code === 'DOID:1205');
  assert.deepEqual(doid.properties.external_ids.MONDO, ['MONDO:0005271']);
  assert.equal(doid.properties.external_ids.SNOMEDCT_US_2025_09_01, undefined, 'los xrefs SNOMED no se guardan');
  assert.equal(report[1].added, 2);
});

test('el plan de carga es determinista y no deja relaciones colgando', () => {
  const ctx = fixtureContext();
  const { records } = runPasses(ctx, [
    { n: 1, key: 'doid', title: 'doid', run: passDoid },
    { n: 2, key: 'mondo', title: 'mondo', run: passMondo },
  ]);
  const a = buildPlan(records);
  const b = buildPlan(JSON.parse(JSON.stringify(records)));
  assert.deepEqual(a.properties.map((p) => p.id), b.properties.map((p) => p.id));
  assert.equal(a.relationships.find((x) => x.source === conceptIdOf('allergy-mondo', 'MONDO:0005324')).target, conceptIdOf('allergy-doid', 'DOID:4481'));
  assert.ok(a.properties.some((p) => p.code === 'allergy_provenance'));
});

test('concept_maps de las enumeraciones: 20, desde el UUIDv5 de la clave del seed de la API', () => {
  const maps = enumConceptMaps();
  assert.equal(maps.length, 20);
  assert.ok(maps.some((m) => m.source === deterministicId('clinical:ALLERGY_ACTIVE') && m.target === conceptIdOf('allergy-hl7-fhir', 'allergyintolerance-clinical|active')));
});

test('display en castellano sólo cuando la fuente lo publica', () => {
  const r = makeRecord({ codeSystem: 'x', code: '1', designations: [{ lang: 'en', value: 'Allergy', preferred: true }], provenance: {} });
  assert.equal(r.display, 'Allergy');
  assert.equal(r.displayLanguage, 'en');
  const s = makeRecord({ codeSystem: 'x', code: '1', designations: [{ lang: 'en', value: 'Allergy', preferred: true }, { lang: 'es', value: 'Alergia', preferred: true }], provenance: {} });
  assert.equal(s.display, 'Alergia');
});

test('grupos léxicos RxNorm: polen, veneno, ácaro y epitelio por el nombre de RxNorm', () => {
  const group = (name) => RXNORM_LEXICAL_GROUPS.filter((g) => g.pattern.test(name)).map((g) => g.key);
  assert.deepEqual(group('tall oat grass pollen extract'), ['pollen', 'allergenic-extract']);
  assert.deepEqual(group('honey bee venom'), ['venom']);
  assert.ok(group('European house dust mite allergenic extract').includes('house-dust-mite'));
  assert.ok(group('horse dander extract').includes('animal-epithelia'));
  assert.deepEqual(group('amoxicillin'), []);
});
