// Fuerza de una relación del glosario (TAREA-41 F1.4). Cubre lo que pide el
// criterio de aceptación: los 6 niveles de frecuencia, el piso T1, el techo T4
// y la combinación de varias fuentes.
// Correr: node --test tools/terminology-import/test/strength.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  EXCLUDED,
  T2_WITHOUT_FREQUENCY,
  T4_CEILING,
  evidenceScore,
  liftScore,
  strengthOf,
} from '../lib/glossary-es/strength.mjs';

const t2 = (frequency, sourceId = 'orphanet') => ({ tier: 'T2', sourceId, frequency });

test('los 6 grados de frecuencia T2', () => {
  assert.equal(strengthOf([t2('OBLIGATORY')]).score, 1);
  assert.equal(strengthOf([t2('VERY_FREQUENT')]).score, 0.9);
  assert.equal(strengthOf([t2('FREQUENT')]).score, 0.7);
  assert.equal(strengthOf([t2('OCCASIONAL')]).score, 0.4);
  assert.equal(strengthOf([t2('VERY_RARE')]).score, 0.1);
  const excluida = strengthOf([t2(EXCLUDED)]);
  assert.equal(excluida.score, 0);
  assert.equal(excluida.excluded, true);
  assert.equal(excluida.frequency, EXCLUDED);
});

test('piso T1: la norma nacional vale al menos 0,9', () => {
  assert.equal(strengthOf([{ tier: 'T1', sourceId: 'nnac-2025' }]).score, 0.9);
  // Con frecuencia «obligatorio» sube; con «muy raro» no baja del piso.
  assert.equal(evidenceScore({ tier: 'T1', frequency: 'OBLIGATORY' }), 1);
  assert.equal(evidenceScore({ tier: 'T1', frequency: 'VERY_RARE' }), 0.9);
});

test('T3 sin frecuencia: 0,3', () => {
  assert.equal(strengthOf([{ tier: 'T3', sourceId: 'wikidata' }]).score, 0.3);
});

test('techo T4: la co-ocurrencia nunca alcanza 0,25 ni supera a lo curado', () => {
  assert.equal(liftScore(1), 0);
  assert.equal(liftScore(undefined), 0);
  assert.equal(liftScore(2), 0.125);
  assert.ok(liftScore(1e9) < T4_CEILING);
  assert.ok(liftScore(1e9) > 0.249);
  const soloT4 = strengthOf([{ tier: 'T4', sourceId: 'mrcoc', statistic: 1e9 }]);
  assert.ok(soloT4.score <= T4_CEILING);
  assert.ok(soloT4.score < strengthOf([t2('VERY_RARE')]).score + T4_CEILING);
  assert.ok(soloT4.score < strengthOf([{ tier: 'T3', sourceId: 'wikidata' }]).score);
});

test('T2 sin frecuencia: valor documentado', () => {
  assert.equal(strengthOf([{ tier: 'T2', sourceId: 'cima' }]).score, T2_WITHOUT_FREQUENCY);
});

test('varias fuentes: máximo + 0,05 por fuente independiente adicional, techo 1', () => {
  const r = strengthOf([
    t2('FREQUENT', 'orphanet'),
    { tier: 'T3', sourceId: 'wikidata' },
    { tier: 'T4', sourceId: 'mrcoc', statistic: 3 },
  ]);
  assert.equal(r.score, 0.8); // 0,7 + 2 × 0,05
  assert.equal(r.evidenceCount, 3);
  assert.equal(r.bestTier, 'T2');
  assert.equal(r.frequency, 'FREQUENT');

  // Dos evidencias de la MISMA fuente no cuentan como independientes.
  assert.equal(strengthOf([t2('FREQUENT', 'hpo'), t2('OCCASIONAL', 'hpo')]).score, 0.7);

  // Techo en 1.
  const tope = strengthOf([
    { tier: 'T1', sourceId: 'nnac-2025', frequency: 'OBLIGATORY' },
    t2('OBLIGATORY', 'orphanet'),
    t2('OBLIGATORY', 'hpo'),
  ]);
  assert.equal(tope.score, 1);
  assert.equal(tope.bestTier, 'T1');
});

test('lo curado que la descarta manda sobre lo colaborativo que la menciona', () => {
  const r = strengthOf([t2(EXCLUDED, 'hpo'), { tier: 'T3', sourceId: 'wikidata' }]);
  assert.equal(r.excluded, true);
  assert.equal(r.score, 0);
});

test('si otra evidencia curada la afirma, no queda descartada', () => {
  const r = strengthOf([t2(EXCLUDED, 'hpo'), t2('OCCASIONAL', 'orphanet')]);
  assert.equal(r.excluded, false);
  assert.equal(r.score, 0.4);
  assert.equal(r.frequency, 'OCCASIONAL');
});

test('sin evidencias: fuerza 0 y sin nivel', () => {
  assert.deepEqual(strengthOf([]), {
    score: 0,
    evidenceCount: 0,
    bestTier: null,
    frequency: null,
    excluded: false,
  });
});

test('valores desconocidos fallan en vez de inventar un puntaje', () => {
  assert.throws(() => evidenceScore({ tier: 'T9' }), /Nivel de evidencia desconocido/);
  assert.throws(() => evidenceScore({ tier: 'T2', frequency: 'A_VECES' }), /Frecuencia desconocida/);
});
