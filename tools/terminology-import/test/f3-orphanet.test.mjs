// TAREA-41 F3.3 — Orphanet product4 → filas de bulk-copy.
// Fixture recortado del archivo real (test/fixtures/f3/orphanet-product4.cut.xml,
// cita su fuente en la cabecera).
// Correr: node --test tools/terminology-import/test/f3-orphanet.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { STAGE_COLUMNS } from '../lib/bulk-copy.mjs';
import { RELATION_TYPE } from '../lib/glossary-es/load-plan.mjs';
import { hpoPhenotypeConceptId } from '../lib/glossary-es/hpo.mjs';
import {
  ORPHANET_FREQUENCY_LABELS,
  ORPHANET_TIER,
  orphanetFrequency,
  orphanetToRelationshipRows,
  parseOrphanetProduct4,
  parseOrphanetReleaseDate,
} from '../lib/glossary-es/orphanet.mjs';

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'f3', 'orphanet-product4.cut.xml');
const xml = readFileSync(FIXTURE, 'utf8');
const DISEASE_CONCEPT = '11111111-1111-4111-8111-111111111111';
const resolveKnown = (curie) => (curie === 'ORPHA:243' ? { conceptId: DISEASE_CONCEPT } : { conceptId: null, reason: 'no-group' });

test('la fecha de release sale del encabezado y es YYYY-MM-DD', () => {
  assert.equal(parseOrphanetReleaseDate(xml), '2026-06-23');
  assert.throws(() => parseOrphanetReleaseDate('<JDBOR/>'), /sin <JDBOR date/);
});

test('el parser lee una asociación por fenotipo, con id, HP y etiqueta de frecuencia decodificada', () => {
  const associations = parseOrphanetProduct4(xml);
  assert.equal(associations.length, 6);
  assert.ok(associations.every((a) => a.curie === 'ORPHA:243' && /^HP:\d{7}$/.test(a.hpo) && /^\d+$/.test(a.associationId)));
  assert.deepEqual(
    associations.map((a) => a.frequencyLabel),
    Object.keys(ORPHANET_FREQUENCY_LABELS),
  );
});

test('los seis grados de Orphanet mapean a los seis códigos y una etiqueta desconocida no se adivina', () => {
  assert.deepEqual(Object.values(ORPHANET_FREQUENCY_LABELS), ['OBLIGATE', 'VERY_FREQUENT', 'FREQUENT', 'OCCASIONAL', 'VERY_RARE', 'EXCLUDED']);
  assert.equal(orphanetFrequency('Very rare (&lt;4-1%)'), 'VERY_RARE');
  assert.equal(orphanetFrequency('Sometimes'), null);
  assert.equal(orphanetFrequency(null), null);
});

test('las filas son SYMPTOM T2 sin ordinal, con referencia única por asociación y columnas conocidas', () => {
  const { rows, stats } = orphanetToRelationshipRows(parseOrphanetProduct4(xml), {
    resolveDisease: resolveKnown,
    validFrom: '2026-06-23',
  });
  assert.equal(rows.length, 6);
  assert.equal(stats.excluded, 1);
  assert.equal(stats.withFrequency, 6);
  assert.equal(new Set(rows.map((r) => r.sourceReference)).size, 6);
  const known = new Set(STAGE_COLUMNS.map(([name]) => name));
  for (const row of rows) {
    assert.equal(row.relationshipTypeConceptId, RELATION_TYPE.SYMPTOM);
    assert.equal(row.evidenceTier, ORPHANET_TIER);
    assert.equal(row.sourceConceptId, DISEASE_CONCEPT);
    assert.equal(row.targetConceptId, hpoPhenotypeConceptId(parseOrphanetProduct4(xml).find((a) => a.associationId && row.sourceReference.endsWith(`#${a.associationId}`)).hpo));
    assert.equal(row.frequencyNumerator, null);
    assert.ok(!('ordinal' in row));
    assert.match(row.sourceReference, /^ORPHA:243 @orphadata-product4 #\d+$/);
  }
  assert.ok(rows.some((r) => r.frequency === 'EXCLUDED'));
});

test('una enfermedad sin grupo MONDO no se carga y se cuenta por motivo', () => {
  const { rows, stats, unresolvedDiseases } = orphanetToRelationshipRows(parseOrphanetProduct4(xml), {
    resolveDisease: () => ({ conceptId: null, reason: 'no-group' }),
    validFrom: '2026-06-23',
  });
  assert.equal(rows.length, 0);
  assert.equal(stats.diseaseUnresolved, 6);
  assert.deepEqual(unresolvedDiseases, { 'no-group': 6 });
});

test('una etiqueta de frecuencia desconocida deja la fila sin frecuencia y queda contada', () => {
  const odd = parseOrphanetProduct4(xml).map((a, i) => (i === 0 ? { ...a, frequencyLabel: 'Sometimes' } : a));
  const { rows, stats } = orphanetToRelationshipRows(odd, { resolveDisease: resolveKnown, validFrom: '2026-06-23' });
  assert.equal(rows[0].frequency, null);
  assert.deepEqual(stats.unknownFrequencyLabels, { Sometimes: 1 });
});

test('sin validFrom el módulo se niega a producir filas', () => {
  assert.throws(() => orphanetToRelationshipRows([], { resolveDisease: resolveKnown }), /validFrom/);
});
