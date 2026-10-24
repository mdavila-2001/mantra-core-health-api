import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  loadContract,
  requestBody,
  schemaName,
  schemaType,
} from './openapi.mjs';

function contractWith(spec) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inventario-openapi-'));
  fs.mkdirSync(path.join(root, 'openapi'));
  fs.writeFileSync(
    path.join(root, 'openapi', 'openapi.json'),
    JSON.stringify(spec),
  );
  return loadContract(root);
}

test('operations() devuelve sólo métodos HTTP, en el orden del contrato', () => {
  const { operations } = contractWith({
    paths: {
      '/a': {
        post: { operationId: 'A_post' },
        parameters: [],
        get: { operationId: 'A_get' },
      },
      '/b': { delete: { operationId: 'B_delete' }, summary: 'no es operación' },
    },
  });
  assert.deepEqual(
    operations().map((item) => `${item.method} ${item.route}`),
    ['post /a', 'get /a', 'delete /b'],
  );
});

test('dereference ve los schemas que el llamador agrega después de cargar', () => {
  const { schemas, dereference } = contractWith({
    paths: {},
    components: { schemas: { Uno: { type: 'object' } } },
  });
  schemas.Dos = { type: 'string' };
  assert.deepEqual(dereference({ $ref: '#/components/schemas/Dos' }), {
    type: 'string',
  });
  assert.deepEqual(dereference({ $ref: '#/components/schemas/Nada' }), {});
  assert.deepEqual(dereference(undefined), {});
});

test('sin components.schemas, los agregados igual son visibles', () => {
  const { schemas, dereference } = contractWith({ paths: {} });
  schemas.Tarde = { type: 'number' };
  assert.deepEqual(dereference({ $ref: '#/components/schemas/Tarde' }), {
    type: 'number',
  });
});

test('mergedSchema une allOf: propiedades sumadas y required sin duplicados', () => {
  const { mergedSchema } = contractWith({
    paths: {},
    components: {
      schemas: {
        Base: { properties: { id: { type: 'string' } }, required: ['id'] },
      },
    },
  });
  const merged = mergedSchema({
    allOf: [
      { $ref: '#/components/schemas/Base' },
      { properties: { name: { type: 'string' } }, required: ['id', 'name'] },
    ],
  });
  assert.deepEqual(Object.keys(merged.properties), ['id', 'name']);
  assert.deepEqual(merged.required, ['id', 'name']);
});

test('schemaName y schemaType', () => {
  assert.equal(
    schemaName({ $ref: '#/components/schemas/CreateHoldDto' }),
    'CreateHoldDto',
  );
  assert.equal(schemaName({ type: 'string' }), undefined);
  assert.equal(
    schemaType({ type: 'array', items: { $ref: '#/components/schemas/X' } }),
    'array<X>',
  );
  assert.equal(
    schemaType({ oneOf: [{ type: 'string' }, { type: 'number' }] }),
    'string | number',
  );
  assert.equal(schemaType({ properties: {} }), 'object');
  assert.equal(schemaType(undefined), 'desconocido');
});

test('requestBody toma el primer content type y respeta required', () => {
  assert.deepEqual(requestBody({}), {});
  assert.deepEqual(
    requestBody({
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/D' } },
        },
      },
    }),
    {
      contentType: 'application/json',
      schema: { $ref: '#/components/schemas/D' },
      required: true,
    },
  );
});

test('contra el contrato real: no pierde ni duplica operaciones y todas traen operationId', () => {
  const { spec, operations } = loadContract(process.cwd());
  const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
  const esperadas = Object.values(spec.paths).reduce(
    (total, pathItem) =>
      total + methods.filter((method) => pathItem[method]).length,
    0,
  );
  const all = operations();
  assert.ok(esperadas > 0);
  assert.equal(all.length, esperadas);
  assert.equal(
    new Set(all.map((item) => item.operation.operationId)).size,
    esperadas,
  );
});
