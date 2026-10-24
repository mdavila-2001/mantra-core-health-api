// Pruebas del importador de procedimientos con extractos REALES de las fuentes
// (`fixtures/`: stanzas copiadas de maxo.obo 2026-01-15 y ncit.obo 24.04e, y
// filas de data/poet/annotations.tsv). Corren sin red ni base:
//   node --test tools/terminology-import/procedures-treatments/test/*.test.mjs

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { fromCurie, parseTsv, readLines } from '../lib/common.mjs';
import { oboStanzas, splitQualifiers } from '../lib/obo.mjs';
import { RELATION_TYPES } from '../lib/relation-types.mjs';
import {
  maxoCategory,
  maxoProcedures,
  maxoSiteAssertions,
  poetAssertions,
  readMaxoTerms,
} from '../lib/sources/maxo.mjs';
import { ncitProcedureAssertions, readNcit } from '../lib/sources/ncit.mjs';
import { mondoMaps } from '../lib/sources/xrefs.mjs';
import {
  buildLoadPlan,
  PROVENANCE_COLUMNS,
  relationshipsBlockedReason,
} from '../lib/load-plan.mjs';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const meta = (source) => ({
  source,
  version: 'test',
  retrievedAt: '2026-10-24T00:00:00.000Z',
  license: 'CC BY 4.0',
  fileUrl: `https://example.invalid/${source}`,
  sha256: 'x',
});

async function maxo() {
  return readMaxoTerms(oboStanzas(readLines(join(FIX, 'maxo-excerpt.obo'))));
}

test('splitQualifiers separa valor, calificadores y comentario', () => {
  const r = splitQualifiers(
    'DOID:9351 {source="EFO:0000400", source="MONDO:equivalentTo"} ! diabetes',
  );
  assert.equal(r.value, 'DOID:9351');
  assert.deepEqual(r.qualifiers, [
    ['source', 'EFO:0000400'],
    ['source', 'MONDO:equivalentTo'],
  ]);
});

test('fromCurie conserva el CURIE en ontologías OBO y lo quita en terminologías externas', () => {
  assert.deepEqual(fromCurie('MONDO:0005015'), {
    system: 'mondo',
    code: 'MONDO:0005015',
  });
  assert.deepEqual(fromCurie('NCIT:C15256'), {
    system: 'ncit',
    code: 'C15256',
  });
  assert.deepEqual(fromCurie('MESH:D003920'), {
    system: 'mesh',
    code: 'D003920',
  });
  assert.equal(
    fromCurie('SCTID:73211009'),
    null,
    'SNOMED no se carga: Bolivia no es miembro de SNOMED International',
  );
});

test('MAxO: categoría por ascendencia; lo farmacológico queda afuera del catálogo', async () => {
  const { terms } = await maxo();
  assert.equal(maxoCategory('MAXO:0000159', terms), 'pharmacological'); // analgesic agent therapy
  assert.equal(maxoCategory('MAXO:0000019', terms), 'diagnostic');
  assert.equal(maxoCategory('MAXO:0000011', terms), 'therapeutic-or-other'); // physical therapy
  const codes = maxoProcedures(terms, meta('maxo')).map((p) => p.code);
  assert.ok(codes.includes('MAXO:0000011'));
  assert.ok(!codes.includes('MAXO:0000159'));
});

test('MAxO: sitio solo por el axioma RO:0002233 hacia UBERON', async () => {
  const { terms } = await maxo();
  const sites = maxoSiteAssertions(terms, meta('maxo'));
  assert.ok(sites.length >= 1);
  const esophagus = sites.find((a) => a.subject.code === 'MAXO:0000019');
  assert.deepEqual(esophagus.object, {
    system: 'uberon',
    code: 'UBERON:0001043',
  });
  assert.equal(esophagus.relationType.code, 'maxo:RO:0002233');
  assert.ok(sites.every((a) => a.object.system === 'uberon'));
});

test('POET: relación literal, cita y URI por línea; descarta lo farmacológico', async () => {
  const { terms } = await maxo();
  const rows = parseTsv(readFileSync(join(FIX, 'poet-excerpt.tsv'), 'utf8'));
  const { assertions, skipped } = poetAssertions(
    rows,
    terms,
    meta('maxo-annotations'),
  );
  assert.equal(skipped.pharmacological, 1);
  assert.equal(assertions.length, 3);
  const prevents = assertions.find(
    (a) => a.relationType.code === 'maxo-poet:PREVENTS',
  );
  assert.equal(prevents.object.code, 'MONDO:0010156');
  assert.deepEqual(prevents.evidence.references, ['PMID:20301556']);
  assert.match(prevents.provenance.uri, /#L3$/);
  const refsum = assertions.find((a) => a.object.code === 'MONDO:0009959');
  assert.deepEqual(refsum.evidence.phenotype, {
    system: 'mondo',
    code: 'MONDO:0009959',
  });
});

test('NCIt: roles de procedimiento bajo C25218 con su código de rol literal', async () => {
  const ncit = await readNcit(
    oboStanzas(readLines(join(FIX, 'ncit-excerpt.obo'))),
  );
  const { assertions, procedures } = ncitProcedureAssertions(
    ncit,
    meta('ncit-obo'),
  );
  const hyst = assertions.filter((a) => a.subject.code === 'C15256');
  assert.ok(hyst.length >= 1);
  assert.ok(
    hyst.every(
      (a) =>
        a.kind === 'procedure-site' && a.relationType.code.startsWith('ncit:R'),
    ),
  );
  assert.ok(
    procedures.some((p) => p.code === 'C15256' && p.display === 'Hysterectomy'),
  );
});

test('ids estables: misma entrada → mismos ids; afirmaciones con el mismo par comparten relationshipId', async () => {
  const { terms } = await maxo();
  const rows = parseTsv(readFileSync(join(FIX, 'poet-excerpt.tsv'), 'utf8'));
  const a = poetAssertions(
    rows,
    terms,
    meta('maxo-annotations'),
  ).assertions.map((r) => r.id);
  const b = poetAssertions(
    rows,
    terms,
    meta('maxo-annotations'),
  ).assertions.map((r) => r.id);
  assert.deepEqual(a, b);
});

test('procedencia obligatoria: sin URI o id de origen la fila no se construye', async () => {
  const { terms } = await maxo();
  assert.throws(
    () => maxoSiteAssertions(terms, { source: 'maxo' }),
    /Procedencia incompleta/,
  );
});

test('MONDO: solo xrefs marcados MONDO:equivalentTo', () => {
  const read = {
    xrefs: new Map([
      [
        'MONDO:0005015',
        [
          splitQualifiers('ICD10WHO:E10-E14 {source="MONDO:equivalentTo"}'),
          splitQualifiers('ICD9:250 {source="DOID:9351"}'),
          splitQualifiers('HP:0000819 {source="MONDO:otherHierarchy"}'),
        ],
      ],
    ]),
  };
  const maps = mondoMaps(read, meta('mondo'), new Set(['MONDO:0005015']));
  assert.deepEqual(
    maps.map((m) => m.to),
    [{ system: 'icd10', code: 'E10-E14' }],
  );
});

test('ensayos clínicos: ningún tipo «investigational» puede decir «indicado»', () => {
  for (const t of Object.values(RELATION_TYPES)) {
    if (t.assertion === 'investigational') assert.match(t.label, /en estudio/i);
    assert.doesNotMatch(
      t.label,
      /(^|[^a-z])indicad/i,
      'ninguna etiqueta afirma «indicado»',
    );
  }
});

test('plan de carga: sin columnas de procedencia, las relaciones se bloquean', async () => {
  const { terms } = await maxo();
  const rows = parseTsv(readFileSync(join(FIX, 'poet-excerpt.tsv'), 'utf8'));
  const assertions = poetAssertions(
    rows,
    terms,
    meta('maxo-annotations'),
  ).assertions;
  const procedures = maxoProcedures(terms, meta('maxo'));
  const plan = buildLoadPlan({
    procedures,
    assertions,
    loadedAt: '2026-10-24T00:00:00.000Z',
  });
  assert.ok(plan.concepts.length > 0);
  assert.equal(
    plan.relationships.length,
    new Set(assertions.map((a) => a.relationshipId)).size,
  );
  assert.equal(plan.provenance.length, assertions.length);
  assert.match(
    relationshipsBlockedReason([
      'id',
      'source_concept_id',
      'target_concept_id',
      'relationship_type_concept_id',
      'ordinal',
    ]),
    /procedencia/,
  );
  assert.equal(relationshipsBlockedReason(['id', ...PROVENANCE_COLUMNS]), null);
});

test('OHD: solo procedimientos bajo «dental procedure»; un sitio en un proceso ajeno no entra', async () => {
  const { readOboTerms, oboProcedureCorpus } =
    await import('../lib/sources/obo-procedures.mjs');
  const { terms } = await readOboTerms(
    oboStanzas(readLines(join(FIX, 'ohd-excerpt.obo'))),
  );
  const { procedures, assertions } = oboProcedureCorpus({
    terms,
    prefix: 'OHD',
    root: 'OHD:0000002',
    system: 'ohd',
    category: 'dental',
    typePrefix: 'ohd',
    meta: meta('ohd'),
  });
  assert.deepEqual(procedures.map((p) => p.code).sort(), [
    'OHD:0000002',
    'OHD:0000004',
  ]);
  assert.equal(
    assertions.length,
    0,
    'OHD:0000037 (material combination) declara un sitio pero no es un procedimiento',
  );
});

// --- Fuentes de la red abierta (2026-10-24): extractos reales de MeSH 2026,
// ClinicalTrials.gov API v2, ICD-10-PCS FY2027 (CMS) y NCIt 26.09d (EVS).

test('MeSH: procedimiento, condición y exclusión farmacológica por árbol (no por nombre)', async () => {
  const {
    readMeshDescriptors,
    isNonPharmacologicalIntervention,
    isCondition,
    meshInterventionCategory,
  } = await import('../lib/sources/mesh.mjs');
  const { descriptors, year } = await readMeshDescriptors(
    join(FIX, 'mesh-excerpt.xml'),
  );
  assert.equal(year, '2026');
  const d = (ui) => descriptors.get(ui);
  assert.equal(d('D007044').name, 'Hysterectomy');
  assert.ok(isNonPharmacologicalIntervention(d('D007044')));
  assert.equal(meshInterventionCategory(d('D007044')), 'surgical');
  assert.ok(
    isNonPharmacologicalIntervention(d('D015928')),
    'Cognitive Behavioral Therapy (F04.754)',
  );
  assert.equal(meshInterventionCategory(d('D015928')), 'behavioral');
  assert.ok(
    !isNonPharmacologicalIntervention(d('D000001')),
    'Calcimycin: solo árbol D',
  );
  assert.ok(
    !isNonPharmacologicalIntervention(d('D000971')),
    'protocolo de quimioterapia: E02.183.750 + E02.319, fuera entero',
  );
  assert.ok(!isNonPharmacologicalIntervention(d('D008774')), 'Methylphenidate');
  assert.ok(isCondition(d('D014594')) && isCondition(d('D001289')));
  assert.ok(!isCondition(d('D007044')));
});

test('ClinicalTrials.gov: solo el par no farmacológico, «en estudio», con el NCT en la evidencia', async () => {
  const { readMeshDescriptors } = await import('../lib/sources/mesh.mjs');
  const { ctgovCorpus } = await import('../lib/sources/ctgov.mjs');
  const { descriptors } = await readMeshDescriptors(
    join(FIX, 'mesh-excerpt.xml'),
  );
  const { body } = JSON.parse(
    readFileSync(join(FIX, 'ctgov-studies-excerpt.json'), 'utf8'),
  );
  const { assertions, procedures, stats } = ctgovCorpus(
    body.studies,
    descriptors,
    meta('ctgov'),
    meta('mesh'),
  );
  assert.equal(stats.interventional, 2);
  assert.equal(
    assertions.length,
    1,
    'NCT02210728: tres fármacos + TCC para TDAH → solo TCC ↔ TDAH; NCT01949883 (fármaco) no aporta',
  );
  const [a] = assertions;
  assert.deepEqual([a.subject.code, a.object.code], ['D015928', 'D001289']);
  assert.equal(a.relationType.assertion, 'investigational');
  assert.match(a.relationType.label, /^En estudio/);
  assert.deepEqual(a.evidence.trials, ['NCT02210728']);
  assert.equal(
    a.provenance.uri,
    'https://clinicaltrials.gov/study/NCT02210728',
  );
  assert.deepEqual(
    procedures.map((p) => p.code),
    ['D015928'],
  );
});

test('ICD-10-PCS: expansión exacta de la tabla, título oficial y sitio por el eje 4', async () => {
  const { expandTables, parseOrderFile, icd10pcsCorpus } =
    await import('../lib/sources/icd10pcs.mjs');
  const { rows, declared } = expandTables(
    readFileSync(join(FIX, 'pcs-tables-excerpt.xml'), 'utf8'),
  );
  assert.equal(
    rows.length,
    declared,
    'la expansión da exactamente los códigos que declara la tabla',
  );
  const order = parseOrderFile(
    readFileSync(join(FIX, 'pcs-order-excerpt.txt'), 'latin1'),
  );
  assert.equal(
    order.get('0016070').long,
    'Bypass Cerebral Ventricle to Nasopharynx with Autologous Tissue Substitute, Open Approach',
  );
  assert.equal(
    order.get('001').valid,
    false,
    'los encabezados no son códigos válidos',
  );
  const c = icd10pcsCorpus(rows, order, meta('icd10pcs'));
  assert.equal(c.assertions.length, declared);
  const a = c.assertions.find((x) => x.subject.code === '0016070');
  assert.equal(a.relationType.code, 'icd10pcs:Body Part');
  assert.equal(a.relationType.assertion, 'by-definition');
  assert.deepEqual(
    [a.object.system, a.object.code, a.object.label],
    ['icd10pcs-body-part', '006', 'Cerebral Ventricle'],
  );
  assert.ok(c.sites.every((s) => s.kind === 'site'));
});

test('NCIt oficial (OWL): roles, nombre preferido y padres de una clase real', async () => {
  const { parseNcitClass } = await import('../lib/sources/ncit-owl.mjs');
  const c = parseNcitClass(
    readFileSync(join(FIX, 'ncit-owl-class-C15256.xml'), 'utf8'),
  );
  assert.equal(c.id, 'NCIT:C15256');
  assert.equal(c.name, 'Hysterectomy');
  assert.ok(c.parents.includes('NCIT:C15332'));
  assert.ok(
    c.roles.some((r) => r.role === 'R167' && r.target === 'NCIT:C12405'),
  );
  assert.equal(c.retired, false);
});

test('Wikidata P924: solo con referencia real (P248/P854), tipo colaborativo, id de declaración', async () => {
  const { readMeshDescriptors } = await import('../lib/sources/mesh.mjs');
  const { wikidataP924Corpus } = await import('../lib/sources/wikidata.mjs');
  const { descriptors } = await readMeshDescriptors(
    join(FIX, 'mesh-excerpt.xml'),
  );
  const { results } = JSON.parse(
    readFileSync(join(FIX, 'wikidata-p924-excerpt.json'), 'utf8'),
  );
  const { assertions, skipped } = wikidataP924Corpus(
    results.bindings,
    descriptors,
    meta('wikidata-p924'),
    meta('mesh'),
  );
  assert.equal(
    skipped.withoutRealReference,
    1,
    'D001062: la referencia no cita fuente ni URL',
  );
  assert.equal(assertions.length, 1);
  const [a] = assertions;
  assert.deepEqual(
    [a.subject.code, a.object.system, a.object.code],
    ['D017130', 'mesh', 'D062108'],
  );
  assert.equal(a.relationType.assertion, 'collaborative-referenced');
  assert.match(a.relationType.label, /colaborativa, no oficial/);
  assert.ok(a.evidence.referenceUrls.length >= 1);
  assert.match(a.provenance.sourceRecordId, /^Q\d+-/);
});

test('MeSH: métodos de investigación, placebos y la raíz «Therapeutics» no son procedimientos', async () => {
  const { readMeshDescriptors, isNonPharmacologicalIntervention } =
    await import('../lib/sources/mesh.mjs');
  const { descriptors } = await readMeshDescriptors(
    join(FIX, 'mesh-excerpt.xml'),
  );
  for (const ui of ['D016032', 'D035061', 'D010919', 'D013812']) {
    assert.ok(
      !isNonPharmacologicalIntervention(descriptors.get(ui)),
      `${ui} ${descriptors.get(ui).name}`,
    );
  }
  assert.ok(
    isNonPharmacologicalIntervention(descriptors.get('D010535')),
    'Laparoscopy',
  );
});

test('Cochrane (indexación MeSH de NLM): procedimiento × condición con calificador terapéutico', async () => {
  const { readMeshDescriptors } = await import('../lib/sources/mesh.mjs');
  const { parsePubmedArticle, cochraneCorpus } =
    await import('../lib/sources/pubmed.mjs');
  const { descriptors } = await readMeshDescriptors(
    join(FIX, 'mesh-excerpt.xml'),
  );
  const rec = parsePubmedArticle(
    readFileSync(join(FIX, 'pubmed-cochrane-excerpt.xml'), 'utf8'),
  );
  assert.equal(rec.pmid, '40970433');
  const { assertions, stats } = cochraneCorpus(
    [rec],
    descriptors,
    meta('pubmed-cochrane'),
    meta('mesh'),
  );
  assert.equal(stats.withPair, 1);
  // Appendicitis/surgery es la única condición con calificador terapéutico; «Postoperative
  // Complications/epidemiology» no lo es. «Randomized Controlled Trials as Topic» no es procedimiento.
  assert.deepEqual(
    assertions.map((a) => `${a.subject.code}|${a.object.code}`).sort(),
    ['D001062|D001064', 'D010535|D001064'],
  );
  assert.ok(
    assertions.every((a) => a.relationType.assertion === 'literature-indexing'),
  );
  assert.ok(
    assertions.every((a) => /no implica eficacia/.test(a.relationType.label)),
  );
  assert.deepEqual(assertions[0].evidence.pmids, ['40970433']);
  assert.ok(
    assertions.every(
      (a) => a.relationType.code === 'pubmed-cochrane:co-indexed',
    ),
  );
});

test('subconjuntos de MEDLINE: cada uno con su tipo literal registrado y sin afirmar indicación', async () => {
  const { PUBMED_SUBSETS } = await import('../lib/sources/pubmed.mjs');
  for (const [key, sub] of Object.entries(PUBMED_SUBSETS)) {
    const t = RELATION_TYPES[sub.typeCode];
    assert.ok(t, `${key}: falta el tipo ${sub.typeCode}`);
    assert.equal(t.kind, 'procedure-disease');
    assert.match(t.label, /no implica/);
  }
  assert.equal(
    RELATION_TYPES['pubmed-rct:co-indexed'].assertion,
    'investigational',
  );
});
