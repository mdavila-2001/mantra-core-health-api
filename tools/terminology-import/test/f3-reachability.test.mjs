// TAREA-41 F3.7 — resumen de alcanzabilidad. La consulta SQL se ejercita contra la
// base real (evidencia de la fase); acá se prueba la aritmética y el veredicto.
// Correr: node --test tools/terminology-import/test/f3-reachability.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ORPHAN_LIMIT_PERCENT, REACHABILITY_SQL, reachabilityMarkdown, summarizeReachability } from '../lib/glossary-es/reachability.mjs';

const row = (code_system, total, with_relation, with_facet, orphans, orphans_with_map = 0) => ({ code_system, total, with_relation, with_facet, orphans, orphans_with_map });

test('la meta es 15 % y la consulta es sólo lectura (sin escrituras)', () => {
  assert.equal(ORPHAN_LIMIT_PERCENT, 15);
  assert.doesNotMatch(REACHABILITY_SQL, /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE)\b/i);
  assert.match(REACHABILITY_SQL, /concept_relationships/);
  assert.match(REACHABILITY_SQL, /value_set_members WHERE included/);
});

test('el porcentaje de huérfanos es por sistema y total, con dos decimales', () => {
  const s = summarizeReachability([row('a', 1000, 900, 50, 100), row('b', 3, 1, 1, 1)]);
  assert.equal(s.total, 1003);
  assert.equal(s.orphans, 101);
  assert.equal(s.orphanPercent, 10.07);
  assert.deepEqual(s.bySystem.map((x) => x.orphanPercent), [10, 33.33]);
});

test('menos de 15 % pasa; 15 % exacto ya no; los sistemas fuera de la meta se listan', () => {
  assert.equal(summarizeReachability([row('a', 100, 86, 0, 14)]).withinLimit, true);
  const at = summarizeReachability([row('a', 100, 85, 0, 15), row('b', 100, 100, 0, 0)]);
  assert.equal(at.bySystem[0].withinLimit, false);
  assert.deepEqual(at.systemsOverLimit, ['a']);
  assert.equal(at.withinLimit, true, 'el total (7,5 %) está dentro aunque un sistema no');
});

test('un sistema vacío no divide por cero', () => {
  assert.equal(summarizeReachability([row('vacio', 0, 0, 0, 0)]).orphanPercent, 0);
});

test('el informe en Markdown dice el veredicto y marca los sistemas fuera de la meta', () => {
  const md = reachabilityMarkdown(summarizeReachability([row('a', 100, 80, 0, 20)]), { measuredAt: '2026-10-29', database: 'x@y:1' });
  assert.match(md, /FUERA de la meta/);
  assert.match(md, /20 %.*⚠|20,0? %.*⚠|20 % ⚠/s);
});
