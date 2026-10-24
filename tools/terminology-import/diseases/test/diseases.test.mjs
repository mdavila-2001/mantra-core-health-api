// Pruebas del catálogo de enfermedades con extractos REALES de cada fuente
// (fixtures/: MONDO 2026-10-06, DOID 2026-09-30, NCIt 24.04e, Orphanet 2026-06-23;
// licencias en fixtures/README.md). Sin red y sin base.
//
//   node --test "tools/terminology-import/diseases/test/*.test.mjs"

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { deterministicId } from '../../lib/glossary-es/common.mjs';
import { md5uuid } from '../../lib/glossary-es/load-plan.mjs';
import { EXTERNAL_TARGETS, conceptId } from '../lib/code-systems.mjs';
import { readObo } from '../lib/obo.mjs';
import { resolveXrefs } from '../lib/resolve.mjs';
import { INTERNAL, planFor } from '../lib/plan.mjs';
import { buildDoid, buildMondo, buildNcit, buildOrphanet, normalizeCurie, readOrphanet } from '../lib/records.mjs';

const FX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const meta = (file) => ({ path: join(FX, file), url: `fixture:${file}`, version: 'fixture', sha256: null, retrievedAt: '2026-10-24T00:00:00.000Z' });
const byCode = (records) => new Map(records.map((r) => [r.code, r]));

const orphanetInput = () =>
  readOrphanet({
    es: join(FX, 'orphanet_es_product1.sample.xml'),
    en: join(FX, 'orphanet_en_product1.sample.xml'),
    product7: join(FX, 'orphanet_en_product7.sample.xml'),
    product3: [join(FX, 'orphanet_en_product3_199.sample.xml')],
  });

test('readObo conserva nombre, definición con referencias, sinónimos y anotaciones de xref/is_a', async () => {
  const terms = [];
  const header = await readObo(join(FX, 'mondo.sample.obo'), (t) => terms.push(t));
  assert.equal(header['data-version'][0], 'releases/2026-10-06');
  const dm = terms.find((t) => t.id === 'MONDO:0005015');
  assert.equal(dm.name, 'diabetes mellitus');
  assert.match(dm.def, /^A metabolic disorder characterized by abnormally high blood sugar/);
  assert.deepEqual(dm.defRefs, ['NCIT:P378']);
  assert.ok(dm.synonyms.some((s) => s.text === 'DM' && s.scope === 'EXACT' && s.type === 'ABBREVIATION'));
  const doidXref = dm.xrefs.find((x) => x.id === 'DOID:9351');
  assert.deepEqual(doidXref.sources, ['EFO:0000400', 'MONDO:equivalentTo']);
  assert.deepEqual(
    dm.isA.map((p) => p.id),
    ['MONDO:0001933', 'MONDO:0002908'],
  );
});

test('normalizeCurie: prefijos de cada fuente al sistema del catálogo; SNOMED y MedDRA no se mapean', () => {
  assert.deepEqual(normalizeCurie('OMIM:154700'), { cs: 'omim', code: '154700' });
  assert.deepEqual(normalizeCurie('OMIMPS:203655'), { cs: 'omim', code: 'PS203655' });
  assert.deepEqual(normalizeCurie('MIM:154700'), { cs: 'omim', code: '154700' });
  assert.deepEqual(normalizeCurie('Orphanet:558'), { cs: 'orphanet', code: '558' });
  assert.deepEqual(normalizeCurie('ORDO:231111'), { cs: 'orphanet', code: '231111' });
  assert.deepEqual(normalizeCurie('NCI:C3235'), { cs: 'ncit-disease', code: 'C3235' });
  assert.deepEqual(normalizeCurie('UMLS_CUI:C0025517'), { cs: 'umls', code: 'C0025517' });
  assert.deepEqual(normalizeCurie('icd11.foundation:465177735'), { cs: 'icd11-foundation', code: '465177735' });
  assert.deepEqual(normalizeCurie('ICD10CM:E88.9'), { cs: 'icd10cm', code: 'E88.9', external: true });
  assert.equal(normalizeCurie('SCTID:73211009'), null);
  assert.equal(normalizeCurie('MedDRA:10026829'), null);
});

test('MONDO: sólo enfermedad humana; animales no humanos y «disease characteristic» quedan fuera', async () => {
  const { records, excluded, version } = await buildMondo(meta('mondo.sample.obo'), meta('mondo.sample.obo'));
  const m = byCode(records);
  assert.equal(version, '2026-10-06');
  assert.ok(m.has('MONDO:0005015'));
  assert.ok(!m.has('MONDO:0005583'), 'non-human animal disease');
  assert.ok(!m.has('MONDO:0024905'), 'hijo de non-human animal disease');
  assert.ok(!m.has('MONDO:0021125'), 'disease characteristic');
  // + MONDO:0001933, cuyo padre no está en el extracto (sin camino a la raíz).
  assert.equal(excluded.nonHumanOrCharacteristic, 4);
  const dm = m.get('MONDO:0005015');
  assert.equal(dm.lang, 'en');
  assert.equal(dm.status, 'active');
  // MONDO:0001933 no tiene camino a la raíz dentro del extracto: la arista no se carga.
  assert.deepEqual(dm.parents, ['MONDO:0002908']);
  const doid = dm.xrefs.find((x) => x.cs === 'doid');
  assert.equal(doid.equivalence, 'equivalent');
  assert.equal(doid.context, 'mondo:skos:exactMatch');
  assert.ok(dm.xrefs.some((x) => x.cs === 'icd10cm' && x.external));
  assert.ok(!JSON.stringify(dm).includes('SCTID'), 'SNOMED CT no entra ni como referencia');
  assert.ok(dm.properties.disease_external_xrefs.MEDGEN.includes('MEDGEN:8350'));
  // «disease susceptibility» e «injury» son raíces propias de MONDO (no cuelgan de «disease») y entran.
  assert.ok(m.has('MONDO:0042489') && m.has('MONDO:0020573') && m.has('MONDO:0010255'), 'susceptibilidades');
  assert.ok(m.has('MONDO:0021178'), 'injury');
  assert.deepEqual(m.get('MONDO:0010255').parents, ['MONDO:0020573']);
  const obsolete = m.get('MONDO:0021199');
  assert.equal(obsolete.status, 'deprecated');
  assert.deepEqual(obsolete.parents, []);
});

test('DOID: xrefs sin semántica declarada → mapeo sin equivalencia; SNOMED descartado', async () => {
  const { records } = await buildDoid(meta('doid.sample.obo'), meta('doid.sample.obo'));
  const marfan = byCode(records).get('DOID:14323');
  assert.equal(marfan.display, 'Marfan syndrome');
  const omim = marfan.xrefs.find((x) => x.cs === 'omim');
  assert.deepEqual([omim.code, omim.equivalence, omim.context], ['154700', null, 'doid:xref']);
  assert.ok(marfan.xrefs.some((x) => x.cs === 'mesh' && x.code === 'D008382'));
  assert.deepEqual(marfan.properties.disease_external_xrefs.GARD, ['GARD:6975']);
  assert.ok(!JSON.stringify(marfan).includes('SNOMEDCT'));
});

test('NCIt: sólo el subárbol Disease or Disorder (C2991); hallazgos y fármacos fuera', async () => {
  const { records, version } = await buildNcit(meta('ncit.sample.obo'), meta('ncit.sample.obo'));
  const m = byCode(records);
  assert.equal(version, '24.04e');
  assert.ok(m.has('C2991') && m.has('C27551') && m.has('C3009'));
  assert.ok(!m.has('C3367'), 'Finding');
  assert.ok(!m.has('C1000'), 'Recombinant Amphiregulin');
  assert.ok(!m.has('C2985'), 'sus padres no están en el extracto');
  assert.deepEqual(m.get('C3009').parents, ['C27551']);
});

test('Orphanet: nombre, sinónimos y definición en castellano; equivalencias tal como las declara Orphanet', () => {
  const { records, version } = buildOrphanet(orphanetInput(), meta('orphanet_es_product1.sample.xml'));
  assert.equal(version, '2026-06-23');
  const m = byCode(records);
  const marfan = m.get('558');
  assert.equal(marfan.display, 'Síndrome de Marfan');
  assert.equal(marfan.lang, 'es');
  assert.match(marfan.definition, /^El síndrome de Marfan \(SM\) es una enfermedad sistémica del tejido conectivo/);
  assert.ok(marfan.designations.some((d) => d.value === 'MFS' && d.lang === 'es' && !d.preferred));
  assert.ok(marfan.designations.some((d) => d.value === 'Marfan syndrome' && d.lang === 'en' && !d.preferred));
  const eq = (cs, code) => marfan.xrefs.find((x) => x.cs === cs && x.code === code)?.equivalence;
  assert.equal(eq('icd10-who', 'Q87.4'), 'equivalent'); // E
  assert.equal(eq('omim', '154700'), 'narrower'); // BTNT: ORPHA más amplio que el destino
  assert.equal(eq('omim', '610168'), 'wider'); // NTBT: ORPHA más específico que el destino
  assert.equal(eq('mondo', 'MONDO:0007947'), 'equivalent');
  assert.deepEqual(marfan.properties.disease_external_xrefs.MedDRA, [{ code: '10026829', relation: 'E' }]);
  assert.equal(marfan.properties.orphanet_classification.preferentialParent, '98023');
  // Aristas de la clasificación de enfermedades óseas raras (product3 199).
  assert.deepEqual(marfan.parents, ['498448']);
  assert.deepEqual(m.get('284963').parents, ['558']);
  assert.equal(m.get('166068').status, 'deprecated');
});

test('claves cruzadas: un concepto por código citado, con el código como display; destinos ausentes = no resueltos', async () => {
  const mondo = await buildMondo(meta('mondo.sample.obo'), meta('mondo.sample.obo'));
  const orpha = buildOrphanet(orphanetInput(), meta('orphanet_es_product1.sample.xml'));
  const records = [...mondo.records, ...orpha.records];
  const { keyRecords, unresolved } = resolveXrefs(records);
  const omim = keyRecords.find((k) => k.cs === 'omim' && k.code === '154700');
  assert.equal(omim.display, '154700');
  assert.equal(omim.properties.disease_xref_key.displayIsCode, true);
  assert.equal(omim.provenance.uri, 'https://omim.org/entry/154700');
  // DOID no está en este conjunto: los xrefs de MONDO hacia DOID quedan sin resolver, no se inventan.
  assert.ok(unresolved['mondo→doid'] >= 1);
});

test('plan: ids deterministas y únicos, vigentes antes que obsoletos, conceptos internos de la API', async () => {
  const { records } = await buildMondo(meta('mondo.sample.obo'), meta('mondo.sample.obo'));
  resolveXrefs(records);
  const plan = planFor('mondo', '2026-10-06', records);
  assert.equal(plan.concepts[0][0], conceptId('mondo', plan.concepts[0][2]));
  assert.equal(conceptId('mondo', 'MONDO:0005015'), md5uuid('mantra:diseases:concept:mondo:MONDO:0005015'));
  for (const key of ['concepts', 'designations', 'properties', 'relationships', 'maps', 'externalMaps']) {
    assert.equal(new Set(plan[key].map((t) => t[0])).size, plan[key].length, `ids únicos en ${key}`);
  }
  const firstDeprecated = plan.concepts.findIndex((c) => c[7] === INTERNAL.TERM_DEPRECATED);
  assert.ok(plan.concepts.slice(firstDeprecated).every((c) => c[7] === INTERNAL.TERM_DEPRECATED));
  assert.equal(INTERNAL.REL_IS_A, deterministicId('terminology:relationship:is-a'));
  assert.equal(INTERNAL.EQUIV.equivalent, deterministicId('terminology:equivalence:equivalent'));
  // ICD-10-CM: el destino se calcula con el id de import-icd10cm.mjs y con el slug de CIE-10-ES.
  const ext = plan.externalMaps.filter((t) => t[1] === conceptId('mondo', 'MONDO:0005015'));
  assert.ok(ext.some((t) => t[2] === md5uuid('mantra:icd10cm:concept:E08-E13')));
  assert.ok(ext.some((t) => t[2] === EXTERNAL_TARGETS['cie10es-dx']('E08-E13')));
  assert.equal(EXTERNAL_TARGETS['cie10es-dx']('E11.9'), md5uuid('mantra:glossary-es:concept:cie10es-dx-e11-9'));
});
