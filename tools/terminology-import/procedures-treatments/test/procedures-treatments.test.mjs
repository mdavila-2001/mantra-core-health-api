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
