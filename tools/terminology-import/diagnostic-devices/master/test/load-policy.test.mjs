import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOAD_POLICY, planTaxonomy } from '../lib/load-plan.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ndjson = (f) =>
  readFileSync(join(HERE, 'fixtures', f), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
// Recortes reales de master/out/taxonomy-*.ndjson.gz (2 nodos por nomenclatura + el par del mapeo).
const nodes = ndjson('taxonomy-nodes.sample.ndjson');
const crosswalks = ndjson('taxonomy-crosswalks.sample.ndjson');

test('GMDN, ANVISA, JMDN y CDSCO no entran al plan de carga', () => {
  const plan = planTaxonomy({ nodes, crosswalks });
  assert.deepEqual(plan.systems.map((s) => s.system).sort(), [
    'emdn',
    'fda-product-code',
  ]);
  const skipped = plan.skipped.map((s) => s.system).sort();
  assert.deepEqual(skipped, [
    'br:anvisa-nome-tecnico',
    'gmdn',
    'gmdn-pt',
    'in:cdsco-device-name',
    'jmdn',
  ]);
});

test('un mapeo con extremo GMDN no se carga (cruce con nomenclatura licenciada)', () => {
  const plan = planTaxonomy({ nodes, crosswalks });
  assert.equal(crosswalks.length, 1);
  assert.equal(plan.maps.length, 0);
  assert.equal(plan.skippedCrosswalks, 1);
});

test('el value set solo tiene miembros de sistemas cargables', () => {
  const plan = planTaxonomy({ nodes, crosswalks });
  const loadable = new Set(
    nodes.filter((n) => LOAD_POLICY[n.system]?.loadable).map((n) => n.key),
  );
  const diagnostic = nodes.filter((n) => loadable.has(n.key) && n.diagnostic === true);
  assert.equal(plan.valueSet.members.length, diagnostic.length);
});

test('una nomenclatura sin política no se carga', () => {
  const x = { ...nodes[0], system: 'xx:desconocida', key: 'xx:desconocida|1' };
  const plan = planTaxonomy({ nodes: [x], crosswalks: [] });
  assert.equal(plan.systems.length, 0);
  assert.equal(plan.skipped[0].system, 'xx:desconocida');
});

test('GMDN figura como licenciada, sin posibilidad de override', () => {
  for (const s of ['gmdn', 'gmdn-pt']) {
    assert.equal(LOAD_POLICY[s].loadable, false);
    assert.equal(LOAD_POLICY[s].kind, 'licensed');
  }
});
