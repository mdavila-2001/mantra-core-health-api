// TAREA-41 F3.4 — jerarquía IS_A (MONDO, DOID, CIE-10-ES) llevada a los conceptos del glosario.
// Fixture: registros reales sin tocar (test/fixtures/f3/hierarchy.cut.ndjson).
// Correr: node --test tools/terminology-import/test/f3-hierarchy.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { conceptId as diseaseCatalogConceptId } from '../diseases/lib/code-systems.mjs';
import { INTERNAL } from '../diseases/lib/plan.mjs';
import { conceptId as glossaryConceptId } from '../lib/glossary-es/load-plan.mjs';
import { IS_A_RELATION_TYPE, catalogParentEdges, cie10ParentEdges, hierarchyToRelationshipRows, isAEdgeId } from '../lib/glossary-es/hierarchy.mjs';

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'f3', 'hierarchy.cut.ndjson');
const records = readFileSync(FIXTURE, 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => JSON.parse(l));
const catalog = records.filter((r) => r.cs);
const cie10 = records.filter((r) => r.codeSystem);

const mondoId = (code) => diseaseCatalogConceptId('mondo', code);
const resolveByCatalog = (curie) => ({ conceptId: curie.startsWith('MONDO:') ? mondoId(curie) : curie.startsWith('DOID:') ? diseaseCatalogConceptId('doid', curie) : null, reason: 'no-group' });

test('IS_A es el tipo REL_IS_A que ya cargó el catálogo de enfermedades', () => {
  assert.equal(IS_A_RELATION_TYPE, INTERNAL.REL_IS_A);
});

test('los padres declarados de MONDO y DOID salen como aristas hijo → padre, con su sistema', () => {
  const edges = catalogParentEdges(catalog);
  const of = (via, child) => edges.filter((e) => e.via === via && e.child === child).map((e) => e.parent);
  assert.deepEqual(of('mondo', 'MONDO:0000005'), ['MONDO:0004907', 'MONDO:0100118']);
  assert.deepEqual(of('doid', 'DOID:0001816'), ['DOID:175']);
  // Los registros padre del fixture traen sus propios padres: 5 aristas MONDO en total.
  assert.equal(edges.filter((e) => e.via === 'mondo').length, 5);
});

test('un registro inactivo no aporta aristas', () => {
  assert.deepEqual(catalogParentEdges([{ ...catalog[0], status: 'obsolete' }]), []);
});

test('CIE-10-ES: la categoría padre es el último elemento de la ruta y sólo si es otro diagnóstico del glosario', () => {
  const edges = cie10ParentEdges(cie10);
  assert.deepEqual(edges.map((e) => `${e.child}>${e.parent}`).sort(), ['ICD10CM:A00.0>ICD10CM:A00', 'ICD10CM:A00.1>ICD10CM:A00']);
  assert.ok(!edges.some((e) => e.child === 'ICD10CM:A00'), 'A00 cuelga de un bloque («A00-A09»), que no es concepto');
  assert.ok(edges.every((e) => e.childConceptId && e.parentConceptId), 'las dos puntas son fichas: llevan su concepto');
});

test('las aristas CIE-10-ES van ficha → ficha sin pasar por la identidad', () => {
  const noIdentity = () => ({ conceptId: null, reason: 'no-mondo-group' });
  const { rows, stats } = hierarchyToRelationshipRows(cie10ParentEdges(cie10), noIdentity);
  assert.equal(rows.length, 2);
  assert.deepEqual(stats.unresolved, {});
  const a00 = glossaryConceptId(cie10.find((r) => r.code === 'A00').slug);
  assert.ok(rows.every((r) => r[2] === a00));
});

test('una arista MONDO entre nodos de catálogo ya está cargada y no se vuelve a emitir', () => {
  const { rows, stats } = hierarchyToRelationshipRows(catalogParentEdges(catalog).filter((e) => e.via === 'mondo'), resolveByCatalog);
  assert.equal(rows.length, 0);
  assert.equal(stats.alreadyInCatalog, 5);
});

test('si el hijo se reutiliza como ficha del glosario, la arista nueva va ficha → padre con id determinista', () => {
  const ficha = glossaryConceptId('cie10es-dx-fixture');
  const resolve = (curie) => (curie === 'MONDO:0000005' ? { conceptId: ficha } : resolveByCatalog(curie));
  const { rows, stats } = hierarchyToRelationshipRows(catalogParentEdges(catalog).filter((e) => e.via === 'mondo' && e.child === 'MONDO:0000005'), resolve);
  assert.equal(rows.length, 2);
  for (const [id, source, target, type, ordinal] of rows) {
    assert.equal(source, ficha);
    assert.equal(type, IS_A_RELATION_TYPE);
    assert.equal(ordinal, null);
    assert.equal(id, isAEdgeId(source, target));
  }
  assert.equal(stats.byVia.mondo, 2);
});

test('extremos sin resolver, aristas a sí mismo y duplicados se cuentan y no producen filas', () => {
  const a = glossaryConceptId('cie10es-dx-a');
  const b = glossaryConceptId('cie10es-dx-b');
  const map = { 'X:1': a, 'X:2': b, 'X:3': a };
  const resolve = (curie) => (map[curie] ? { conceptId: map[curie] } : { conceptId: null, reason: 'no-mondo-group' });
  const { rows, stats } = hierarchyToRelationshipRows(
    [
      { child: 'X:1', parent: 'X:2', via: 'doid' },
      { child: 'X:3', parent: 'X:2', via: 'cie10-es' },
      { child: 'X:1', parent: 'X:3', via: 'doid' },
      { child: 'X:9', parent: 'X:2', via: 'doid' },
    ],
    resolve,
  );
  assert.equal(rows.length, 1);
  assert.deepEqual(stats, { read: 4, unresolved: { 'no-mondo-group': 1 }, selfEdges: 1, alreadyInCatalog: 0, duplicates: 1, rows: 1, byVia: { doid: 1 } });
});
