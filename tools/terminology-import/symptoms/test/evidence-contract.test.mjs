import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalEvidenceBatches, EVIDENCE_COLUMNS } from '../lib/evidence-contract.mjs';

function plan({ negated = false, version = '2026-09-02', source = 'hpoa', evidence = 'PCS', frequency = '16/21' } = {}) {
  return {
    relationships: [['r1', 'disease', 'phenotype', negated ? 'excluded' : 'symptom', null]],
    evidence: [['e1', 'r1', 'old-source', 'record-1', version, 'https://example.test/source', '2026-10-24T00:00:00Z', negated, frequency, null, 16, 21, null, evidence, null, 'FEMALE', JSON.stringify(['PMID:123']), JSON.stringify({ source, onset: 'HP:0003577', diseaseAsPublished: 'OMIM:1', modifiers: ['HP:1'] })]],
  };
}

test('usa el contrato canónico y conserva el registro original junto a los campos estructurados', () => {
  assert.ok(EVIDENCE_COLUMNS.includes('concept_relationship_id'));
  assert.ok(EVIDENCE_COLUMNS.includes('code_system_version_id'));
  assert.ok(!EVIDENCE_COLUMNS.includes('relationship_id'));
  const [{ rows: [row] }] = canonicalEvidenceBatches(plan());
  assert.equal(row.sourceConceptId, 'disease');
  assert.equal(row.evidenceTier, 'CURATED_REFERENCE');
  assert.equal(row.frequencyNumerator, 16);
  assert.equal(row.frequencyDenominator, 21);
  assert.equal(row.validFrom, '2026-09-02');
  assert.equal(row.sexConceptId, null);
  const citation = JSON.parse(row.citationText);
  assert.deepEqual(citation.references, ['PMID:123']);
  assert.deepEqual(citation.modifiers, ['HP:1']);
  assert.equal(citation.sex, 'FEMALE');
  assert.equal(citation.frequencyText, '16/21');
  assert.equal(citation.evidenceCode, 'PCS');
});

test('NOT no se transforma en relación positiva; frecuencia EXCLUDED y cita negada', () => {
  const [{ rows: [row] }] = canonicalEvidenceBatches(plan({ negated: true }));
  assert.equal(row.relationshipTypeConceptId, 'excluded');
  assert.equal(row.frequency, 'EXCLUDED');
  assert.equal(JSON.parse(row.citationText).negated, true);
});

test('la minería de texto no se eleva a referencia curada por citar un PMID', () => {
  const [{ rows: [row] }] = canonicalEvidenceBatches(plan({ evidence: 'ITM' }));
  assert.equal(row.evidenceTier, 'STATISTICAL_LITERATURE');
});

test('una versión sin día de publicación exige fecha explícita, no usa la descarga ni inventa enero', () => {
  const input = plan({ source: 'hpo-common-disease', version: '2015 (publicación)' });
  assert.throws(() => canonicalEvidenceBatches(input), /source-release-dates/);
  const [{ rows: [row] }] = canonicalEvidenceBatches(input, { validFromBySource: { 'hpo-common-disease': '2015-07-02' } });
  assert.equal(row.validFrom, '2015-07-02');
  assert.equal(JSON.parse(row.citationText).sourceVersion, '2015 (publicación)');
});

test('rechaza fechas de release inválidas y frecuencias inconsistentes antes de escribir', () => {
  assert.throws(() => canonicalEvidenceBatches(plan({ version: '2026-02-31' })), /fecha de release válida/);
  assert.throws(() => canonicalEvidenceBatches(plan({ frequency: '22/21' })), /invalid-ratio/);
});
