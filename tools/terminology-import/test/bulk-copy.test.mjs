// Cargador masivo (TAREA-41 F1.3).
//
// Dos partes:
//  - Unitarias sin base: el formato texto de COPY y el mapeo de los value sets
//    a la fórmula.
//  - Paridad con la base: el agregado SQL que recalcula las columnas derivadas
//    (`strengthAggregateSql`) tiene que dar EXACTAMENTE lo mismo que
//    `strengthOf()` de strength.mjs. Corre sobre una tabla temporal dentro de
//    una transacción que se deshace; necesita Postgres (`DB_*` del `.env`) y se
//    salta, avisando, si no hay base.
//
// Correr: node --test tools/terminology-import/test/bulk-copy.test.mjs

import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';

import {
  EVIDENCE_TIER_VALUE_SET,
  FREQUENCY_CODE_TO_STRENGTH_KEY,
  FREQUENCY_VALUE_SET,
  STAGE_COLUMNS,
  copyField,
  copyLine,
  strengthAggregateSql,
  strengthReferenceParams,
  strengthReferenceRows,
  valueSetConceptIds,
} from '../lib/bulk-copy.mjs';
import { EVIDENCE_TIERS, FREQUENCY_SCORE, strengthOf } from '../lib/glossary-es/strength.mjs';
import { md5uuid } from '../lib/glossary-es/load-plan.mjs';
import { DB_CONFIG } from '../symptoms/lib/db.mjs';

test('copyField: null, escapes de control y fechas', () => {
  assert.equal(copyField(null), '\\N');
  assert.equal(copyField(undefined), '\\N');
  assert.equal(copyField('a\tb\nc\rd\\e'), 'a\\tb\\nc\\rd\\\\e');
  assert.equal(copyField(0), '0');
  assert.equal(copyField(new Date('2025-03-04T10:00:00Z')), '2025-03-04');
});

test('copyLine: una columna por campo del staging, en orden', () => {
  const line = copyLine({
    sourceConceptId: 's',
    targetConceptId: 't',
    relationshipTypeConceptId: 'r',
    evidenceTier: 'CURATED_REFERENCE',
    sourceReference: 'ORPHA:558',
    frequency: 'FREQUENT',
    validFrom: '2025-01-01',
  });
  assert.ok(line.endsWith('\n'));
  const fields = line.slice(0, -1).split('\t');
  assert.equal(fields.length, STAGE_COLUMNS.length);
  const at = (name) => fields[STAGE_COLUMNS.findIndex(([n]) => n === name)];
  assert.equal(at('evidence_tier_code'), 'CURATED_REFERENCE');
  assert.equal(at('frequency_code'), 'FREQUENT');
  assert.equal(at('citation_text'), '\\N');
});

test('cada código del value set de frecuencia tiene puntaje en la fórmula', () => {
  for (const [code, key] of Object.entries(FREQUENCY_CODE_TO_STRENGTH_KEY)) {
    if (code === 'EXCLUDED') continue;
    assert.equal(typeof FREQUENCY_SCORE[key], 'number', `${code} → ${key}`);
  }
  assert.equal(FREQUENCY_CODE_TO_STRENGTH_KEY.OBLIGATE, 'OBLIGATORY');
});

test('strengthReferenceRows exige los 4 niveles y las 6 frecuencias', () => {
  const tiers = new Map(Object.keys(EVIDENCE_TIERS).map((c, i) => [c, `t${i}`]));
  const freqs = new Map(Object.keys(FREQUENCY_CODE_TO_STRENGTH_KEY).map((c, i) => [c, `f${i}`]));
  const { tierRows, frequencyRows } = strengthReferenceRows(tiers, freqs);
  assert.deepEqual(tierRows.map((r) => r[2]).sort(), [1, 2, 3, 4]);
  assert.equal(frequencyRows.length, 6);
  assert.deepEqual(frequencyRows.find((r) => r[1] === 'EXCLUDED').slice(2), [null, true]);
  tiers.delete('NATIONAL_STANDARD');
  assert.throws(() => strengthReferenceRows(tiers, freqs), /NATIONAL_STANDARD/);
});

// --- Paridad con la base ------------------------------------------------------

/** Generador determinista (mulberry32) para que la muestra sea reproducible. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TIER_CODES = Object.keys(EVIDENCE_TIERS);
const FREQUENCY_CODES = Object.keys(FREQUENCY_CODE_TO_STRENGTH_KEY);
const SOURCES = ['nnac', 'orphanet', 'hpo', 'wikidata', 'mrcoc'];

/** Casos de borde explícitos + una muestra aleatoria. Cada caso: lista de evidencias. */
function sampleEvidenceSets(randomCount) {
  const ev = (tier, sourceId, frequency = null, statistic = null) => ({ tier, sourceId, frequency, statistic });
  const edge = [
    [ev('NATIONAL_STANDARD', 'nnac')],
    [ev('NATIONAL_STANDARD', 'nnac', 'OBLIGATE')],
    ...FREQUENCY_CODES.map((f) => [ev('CURATED_REFERENCE', 'orphanet', f)]),
    [ev('CURATED_REFERENCE', 'orphanet')],
    [ev('COLLABORATIVE_KNOWLEDGE', 'wikidata')],
    [ev('STATISTICAL_LITERATURE', 'mrcoc', null, 1)],
    [ev('STATISTICAL_LITERATURE', 'mrcoc', null, 1.5)],
    [ev('STATISTICAL_LITERATURE', 'mrcoc', null, 1000000)],
    [ev('STATISTICAL_LITERATURE', 'mrcoc')],
    [ev('CURATED_REFERENCE', 'orphanet', 'EXCLUDED'), ev('COLLABORATIVE_KNOWLEDGE', 'wikidata')],
    [ev('CURATED_REFERENCE', 'orphanet', 'EXCLUDED'), ev('CURATED_REFERENCE', 'hpo', 'FREQUENT')],
    [ev('NATIONAL_STANDARD', 'nnac'), ev('CURATED_REFERENCE', 'orphanet', 'VERY_FREQUENT'), ev('COLLABORATIVE_KNOWLEDGE', 'wikidata'), ev('STATISTICAL_LITERATURE', 'mrcoc', null, 4)],
    [ev('CURATED_REFERENCE', 'orphanet', 'OCCASIONAL'), ev('CURATED_REFERENCE', 'orphanet', 'FREQUENT', null)],
    [ev('COLLABORATIVE_KNOWLEDGE', 'wikidata', 'EXCLUDED')],
  ];
  const rand = seeded(41_013);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const random = Array.from({ length: randomCount }, () =>
    Array.from({ length: 1 + Math.floor(rand() * 5) }, () => {
      const tier = pick(TIER_CODES);
      const frequency = tier !== 'STATISTICAL_LITERATURE' && rand() < 0.6 ? pick(FREQUENCY_CODES) : null;
      const statistic = tier === 'STATISTICAL_LITERATURE' && rand() < 0.9 ? Math.round(rand() * 20 * 1000) / 1000 : null;
      return ev(tier, pick(SOURCES), frequency, statistic);
    }),
  );
  return [...edge, ...random];
}

/** Lo que dice strength.mjs para un caso, con los códigos del value set. */
function expectedFromFormula(evidences) {
  const result = strengthOf(
    evidences.map((e) => ({
      tier: EVIDENCE_TIERS[e.tier],
      sourceId: e.sourceId,
      frequency: e.frequency == null ? null : FREQUENCY_CODE_TO_STRENGTH_KEY[e.frequency],
      statistic: e.statistic,
    })),
  );
  const tierCode = Object.keys(EVIDENCE_TIERS).find((c) => EVIDENCE_TIERS[c] === result.bestTier) ?? null;
  const frequencyCode = Object.keys(FREQUENCY_CODE_TO_STRENGTH_KEY).find((c) => FREQUENCY_CODE_TO_STRENGTH_KEY[c] === result.frequency) ?? null;
  return { score: result.score, evidenceCount: result.evidenceCount, bestTier: tierCode, frequency: frequencyCode };
}

async function connectOrNull() {
  if (!DB_CONFIG.password) return null;
  const client = new pg.Client({ ...DB_CONFIG, connectionTimeoutMillis: 3000 });
  try {
    await client.connect();
    return client;
  } catch {
    return null;
  }
}

test('paridad: el agregado SQL del cargador da lo mismo que strengthOf()', async (t) => {
  const client = await connectOrNull();
  if (!client) {
    t.skip('sin Postgres (DB_* del .env): paridad no ejecutada');
    return;
  }
  try {
    const tierIds = await valueSetConceptIds(client, EVIDENCE_TIER_VALUE_SET);
    const frequencyIds = await valueSetConceptIds(client, FREQUENCY_VALUE_SET);
    const params = strengthReferenceParams(strengthReferenceRows(tierIds, frequencyIds));
    const codeOfTier = new Map([...tierIds].map(([c, id]) => [id, c]));
    const codeOfFrequency = new Map([...frequencyIds].map(([c, id]) => [id, c]));

    const sets = sampleEvidenceSets(1000);
    const rows = sets.flatMap((evidences, i) =>
      evidences.map((e) => [md5uuid(`parity:${i}`), md5uuid(`parity-source:${e.sourceId}`), tierIds.get(e.tier), e.frequency ? frequencyIds.get(e.frequency) : null, e.statistic]),
    );

    await client.query('BEGIN');
    await client.query(
      `CREATE TEMP TABLE parity_evidence (concept_relationship_id uuid, terminology_source_id uuid, evidence_tier_concept_id uuid, frequency_concept_id uuid, statistic_value numeric) ON COMMIT DROP`,
    );
    await client.query(
      `INSERT INTO parity_evidence SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(concept_relationship_id uuid, terminology_source_id uuid, evidence_tier_concept_id uuid, frequency_concept_id uuid, statistic_value numeric)`,
      [JSON.stringify(rows.map(([a, b, c, d, e]) => ({ concept_relationship_id: a, terminology_source_id: b, evidence_tier_concept_id: c, frequency_concept_id: d, statistic_value: e })))],
    );
    const { rows: got } = await client.query(strengthAggregateSql('parity_evidence e'), params);
    await client.query('ROLLBACK');

    const byId = new Map(got.map((r) => [r.concept_relationship_id, r]));
    assert.equal(byId.size, sets.length);
    let compared = 0;
    sets.forEach((evidences, i) => {
      const sql = byId.get(md5uuid(`parity:${i}`));
      const actual = {
        score: Number(sql.strength_score),
        evidenceCount: sql.evidence_count,
        bestTier: codeOfTier.get(sql.best_evidence_tier_concept_id) ?? null,
        frequency: sql.frequency_concept_id ? codeOfFrequency.get(sql.frequency_concept_id) : null,
      };
      assert.deepEqual(actual, expectedFromFormula(evidences), `caso ${i}: ${JSON.stringify(evidences)}`);
      compared += 1;
    });
    t.diagnostic(`paridad SQL = strengthOf() en ${compared} relaciones (${rows.length} evidencias)`);
  } finally {
    await client.end();
  }
});
