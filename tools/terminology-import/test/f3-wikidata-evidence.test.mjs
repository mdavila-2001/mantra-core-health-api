// TAREA-41 F3.6 — Wikidata ampliado: P828/P5642/P1542 como evidencia T3 y P279 como IS_A.
// Fixture: respuestas reales de query.wikidata.org sin tocar
// (test/fixtures/f3/wikidata-evidence.cut.json, cita su fuente).
// Correr: node --test tools/terminology-import/test/f3-wikidata-evidence.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { RELATION_TYPE } from '../lib/glossary-es/load-plan.mjs';
import { hierarchyToRelationshipRows } from '../lib/glossary-es/hierarchy.mjs';
import {
  CODE_TABLES, EVIDENCE_PROPERTIES, EVIDENCE_RELATION_TYPE, WIKIDATA_EVIDENCE_TIER,
  codeTableSparql, evidenceRows, itemPairsSparql, itemResolver, parseCodeTable, parseItemEdges, subclassEdges,
} from '../lib/glossary-es/wikidata-evidence.mjs';

const fixture = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'f3', 'wikidata-evidence.cut.json'), 'utf8'));
const codes = new Map();
for (const { property, prefix } of CODE_TABLES) parseCodeTable(fixture[`codes-${property}`], prefix, codes);
const edges = (prop) => parseItemEdges(fixture[`pairs-${prop}`], prop, codes);

/** Cada Q se vuelve su propio concepto; sirve para comprobar dirección y tipo sin la identidad real. */
const conceptOfQ = (q) => `00000000-0000-4000-8000-${String(q.replace('Q', '')).padStart(12, '0')}`;
const codesToConcept = new Map();
for (const [q, set] of codes) for (const code of set) codesToConcept.set(code, conceptOfQ(q));
const resolveItem = itemResolver((code) => (codesToConcept.has(code) ? { conceptId: codesToConcept.get(code) } : { conceptId: null, reason: 'no-mondo-group' }));

test('las propiedades cubiertas y el tipo de cada una siguen la tabla de la ficha', () => {
  assert.equal(EVIDENCE_PROPERTIES.P828.type, 'CAUSED_BY');
  assert.equal(EVIDENCE_PROPERTIES.P5642.type, 'RISK_FACTOR');
  assert.equal(EVIDENCE_PROPERTIES.P1542.type, 'COMPLICATION');
  assert.equal(EVIDENCE_PROPERTIES.P5642.reverse, true, 'RISK_FACTOR va factor → enfermedad');
  assert.ok(!('P2175' in EVIDENCE_PROPERTIES) && !('P769' in EVIDENCE_PROPERTIES) && !('P4044' in EVIDENCE_PROPERTIES));
});

test('las consultas parten de los ítems con código y piden sólo ids y códigos', () => {
  assert.match(itemPairsSparql('P279'), /SELECT DISTINCT \?d \?x WHERE \{ \?d wdt:P279 \?x \./);
  assert.match(itemPairsSparql('P828'), /wdt:P494 \[\].*wdt:P4229 \[\].*wdt:P486 \[\]/);
  assert.equal(codeTableSparql('P486'), 'SELECT ?item ?code WHERE { ?item wdt:P486 ?code }');
});

test('el parser une cada par con los códigos de sus dos extremos, ordenados', () => {
  const [first] = edges('P828');
  assert.deepEqual([first.subjectQ, first.objectQ], ['Q1621830', 'Q1485']);
  assert.ok(first.subject.every((c) => /^(ICD10WHO|ICD10CM|MESH):/.test(c)) && first.subject.length > 0);
  assert.deepEqual(first.subject, [...first.subject].sort());
});

test('P828 «tiene causa»: enfermedad → causa, T3, referencia al par de ítems y sin frecuencia ni ordinal', () => {
  const { rows, stats } = evidenceRows(edges('P828'), { resolveItem, validFrom: '2026-10-29' });
  assert.equal(rows.length, 2);
  assert.equal(stats.byProperty.P828, 2);
  for (const row of rows) {
    assert.equal(row.relationshipTypeConceptId, EVIDENCE_RELATION_TYPE.CAUSED_BY);
    assert.equal(row.evidenceTier, WIKIDATA_EVIDENCE_TIER);
    assert.equal(row.targetConceptId, conceptOfQ('Q1485'));
    assert.match(row.sourceReference, /^wikidata:Q\d+ P828 Q1485$/);
    assert.ok(!('frequency' in row) && !('ordinal' in row));
  }
});

test('P5642 «factor de riesgo»: la arista se carga factor → enfermedad (invertida respecto de Wikidata)', () => {
  const { rows } = evidenceRows(edges('P5642'), { resolveItem, validFrom: '2026-10-29' });
  assert.equal(rows.length, 2);
  for (const row of rows) {
    assert.equal(row.relationshipTypeConceptId, EVIDENCE_RELATION_TYPE.RISK_FACTOR);
    assert.equal(row.targetConceptId, conceptOfQ('Q83030'), 'el sujeto de Wikidata (la enfermedad) queda como destino');
    assert.match(row.sourceReference, /^wikidata:Q83030 P5642 Q\d+$/);
  }
});

test('P1542 «tiene efecto»: enfermedad → enfermedad que la complica', () => {
  const { rows } = evidenceRows(edges('P1542'), { resolveItem, validFrom: '2026-10-29' });
  assert.equal(rows.length, 2);
  assert.ok(rows.every((r) => r.relationshipTypeConceptId === EVIDENCE_RELATION_TYPE.COMPLICATION));
});

test('un extremo sin concepto, con códigos en grupos distintos o consigo mismo no produce fila y se cuenta', () => {
  const [edge] = edges('P828');
  const none = evidenceRows([edge], { resolveItem: () => ({ conceptId: null, reason: 'no-mondo-group' }), validFrom: '2026-10-29' });
  assert.equal(none.rows.length, 0);
  assert.deepEqual(none.stats.unresolved, { 'subject-no-mondo-group': 1 });

  const ambiguous = itemResolver((code) => ({ conceptId: code.startsWith('MESH:') ? 'a' : 'b' }));
  assert.deepEqual(ambiguous(['ICD10WHO:X', 'MESH:Y']), { conceptId: null, reason: 'ambiguous-codes' });
  assert.deepEqual(itemResolver(() => ({ conceptId: null }))([]), { conceptId: null, reason: 'item-without-code' });

  const same = evidenceRows([edge], { resolveItem: () => ({ conceptId: 'x' }), validFrom: '2026-10-29' });
  assert.equal(same.stats.selfEdges, 1);
  assert.equal(same.rows.length, 0);
});

test('P279 se carga como REL_IS_A hijo → padre por la misma ruta que la jerarquía de F3.4', () => {
  const { edges: isA, itemCodes } = subclassEdges(edges('P279'));
  const { rows, stats } = hierarchyToRelationshipRows(isA, (key) => resolveItem(itemCodes.get(key) ?? []));
  assert.equal(rows.length, 2);
  assert.equal(stats.byVia['wikidata-p279'], 2);
  assert.equal(rows[0][1], conceptOfQ('Q101896'));
  assert.equal(rows[0][2], conceptOfQ('Q3041498'));
  assert.notEqual(rows[0][3], RELATION_TYPE.SYMPTOM);
});

test('sin validFrom el módulo se niega a producir filas', () => {
  assert.throws(() => evidenceRows([], { resolveItem }), /validFrom/);
});
