// MCH-025 · pruebas del detector de cambios incompatibles de OpenAPI.
//
// Node's built-in test runner (`node:test`), mismo patrón que
// `tools/e2e/identity-evidence/prepare.test.mjs`: es una herramienta de CI,
// no código de la aplicación, así que no necesita el harness de Jest ni una
// base de datos. Se ejecuta con `yarn tools:check-breaking:test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  diffOpenApi,
  applyExceptions,
  loadDocument,
  loadExceptions,
  resolveSchema,
  run,
} from './check-breaking.mjs';

/** Un documento OpenAPI mínimo con una operación configurable. */
function doc(overrides = {}) {
  return {
    openapi: '3.0.0',
    info: { title: 't', version: '1' },
    paths: {
      '/widgets': {
        post: {
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateWidget' },
              },
            },
          },
          responses: {
            '201': {
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Widget' },
                },
              },
            },
          },
        },
        get: {
          parameters: [{ name: 'q', in: 'query', required: false, schema: { type: 'string' } }],
          responses: {
            '200': {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { items: { type: 'array' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        CreateWidget: {
          type: 'object',
          properties: { name: { type: 'string' }, tag: { type: 'string' } },
          required: ['name'],
        },
        Widget: {
          type: 'object',
          properties: { id: { type: 'string' }, name: { type: 'string' } },
        },
      },
    },
    ...overrides,
  };
}

/** Aplica una mutación a una copia profunda del doc base. */
function mutar(mutador) {
  const base = doc();
  const head = JSON.parse(JSON.stringify(base));
  mutador(head);
  return { base, head };
}

test('dos documentos idénticos no producen hallazgos', () => {
  const base = doc();
  const head = doc();
  assert.deepEqual(diffOpenApi(base, head), []);
});

test('una ruta eliminada es una ruptura por operación', () => {
  const { base, head } = mutar((h) => {
    delete h.paths['/widgets'];
  });
  const hallazgos = diffOpenApi(base, head);
  const kinds = hallazgos.map((h) => h.kind);
  assert.ok(kinds.includes('removed_operation'));
  assert.equal(hallazgos.length, 2); // post y get, las dos operaciones del path
});

test('una operación eliminada (el path sigue, un método no) es una ruptura', () => {
  const { base, head } = mutar((h) => {
    delete h.paths['/widgets'].get;
  });
  const hallazgos = diffOpenApi(base, head);
  assert.equal(hallazgos.length, 1);
  assert.equal(hallazgos[0].kind, 'removed_operation');
  assert.equal(hallazgos[0].method, 'get');
});

test('un código de respuesta eliminado es una ruptura', () => {
  const { base, head } = mutar((h) => {
    delete h.paths['/widgets'].post.responses['201'];
  });
  const hallazgos = diffOpenApi(base, head);
  assert.deepEqual(
    hallazgos.map((h) => h.kind),
    ['removed_response'],
  );
  assert.equal(hallazgos[0].detail, '201');
});

test('un campo nuevo obligatorio en el request es una ruptura', () => {
  const { base, head } = mutar((h) => {
    h.components.schemas.CreateWidget.required.push('tag');
  });
  const hallazgos = diffOpenApi(base, head);
  assert.deepEqual(
    hallazgos.map((h) => [h.kind, h.detail]),
    [['new_required_request_field', 'tag']],
  );
});

test('un campo completamente nuevo y opcional NO es una ruptura', () => {
  const { base, head } = mutar((h) => {
    h.components.schemas.CreateWidget.properties.nota = { type: 'string' };
  });
  assert.deepEqual(diffOpenApi(base, head), []);
});

test('un parámetro que pasa de opcional a obligatorio es una ruptura', () => {
  const { base, head } = mutar((h) => {
    h.paths['/widgets'].get.parameters[0].required = true;
  });
  const hallazgos = diffOpenApi(base, head);
  assert.deepEqual(
    hallazgos.map((h) => h.kind),
    ['new_required_request_field'],
  );
});

test('una propiedad eliminada de una respuesta es una ruptura', () => {
  const { base, head } = mutar((h) => {
    delete h.components.schemas.Widget.properties.name;
  });
  const hallazgos = diffOpenApi(base, head);
  assert.deepEqual(
    hallazgos.map((h) => [h.kind, h.detail]),
    [['removed_response_property', '201.name']],
  );
});

test('un cambio de tipo en una propiedad de response es una ruptura', () => {
  const { base, head } = mutar((h) => {
    h.components.schemas.Widget.properties.id = { type: 'integer' };
  });
  const hallazgos = diffOpenApi(base, head);
  assert.deepEqual(
    hallazgos.map((h) => h.kind),
    ['changed_type'],
  );
  assert.match(hallazgos[0].detail, /string -> integer/);
});

test('un cambio compatible (agregar un endpoint nuevo) no produce hallazgos', () => {
  const { base, head } = mutar((h) => {
    h.paths['/widgets/{id}'] = {
      get: { responses: { '200': {} } },
    };
  });
  assert.deepEqual(diffOpenApi(base, head), []);
});

test('resolveSchema aplana un allOf fusionando properties y required', () => {
  const document = {
    components: {
      schemas: {
        Base: { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] },
      },
    },
  };
  const resuelto = resolveSchema(document, {
    allOf: [
      { $ref: '#/components/schemas/Base' },
      { type: 'object', properties: { b: { type: 'number' } }, required: ['b'] },
    ],
  });
  assert.deepEqual(Object.keys(resuelto.properties).sort(), ['a', 'b']);
  assert.deepEqual(resuelto.required.sort(), ['a', 'b']);
});

test('applyExceptions aprueba sólo con reason y migrationNote presentes', () => {
  const hallazgos = [{ id: 'x', kind: 'removed_response', method: 'get', path: '/w', detail: '201' }];

  const sinNota = applyExceptions(hallazgos, [{ id: 'x', reason: 'porque sí' }]);
  assert.equal(sinNota.bloqueantes.length, 1, 'sin migrationNote sigue bloqueando');

  const completa = applyExceptions(hallazgos, [
    { id: 'x', reason: 'se retiró en v2', migrationNote: 'usar /widgets-v2' },
  ]);
  assert.equal(completa.bloqueantes.length, 0);
  assert.equal(completa.aprobados.length, 1);
});

test('applyExceptions no aprueba un hallazgo con un id distinto', () => {
  const hallazgos = [{ id: 'x', kind: 'removed_response', method: 'get', path: '/w', detail: '201' }];
  const { bloqueantes } = applyExceptions(hallazgos, [
    { id: 'otro-id', reason: 'r', migrationNote: 'm' },
  ]);
  assert.equal(bloqueantes.length, 1);
});

test('loadDocument lanza si el archivo no existe', () => {
  assert.throws(() => loadDocument('/no/existe/openapi.json'));
});

test('loadDocument lanza si el JSON es inválido', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mch025-'));
  const archivo = join(dir, 'malo.json');
  writeFileSync(archivo, '{ esto no es json');
  try {
    assert.throws(() => loadDocument(archivo));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('loadExceptions devuelve [] si no se pasó ruta, y lanza si el archivo no es un array', () => {
  assert.deepEqual(loadExceptions(undefined), []);

  const dir = mkdtempSync(join(tmpdir(), 'mch025-'));
  const archivo = join(dir, 'excepciones.json');
  writeFileSync(archivo, JSON.stringify({ no: 'es un array' }));
  try {
    assert.throws(() => loadExceptions(archivo));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- La CLI completa (run), que es lo que corre en el workflow ---

function conArchivos(callback) {
  const dir = mkdtempSync(join(tmpdir(), 'mch025-cli-'));
  try {
    return callback(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('run() devuelve 0 y no falla cuando no hay cambios incompatibles', () => {
  conArchivos((dir) => {
    const base = join(dir, 'base.json');
    const head = join(dir, 'head.json');
    writeFileSync(base, JSON.stringify(doc()));
    writeFileSync(head, JSON.stringify(doc()));

    const codigo = run(['--base', base, '--head', head]);
    assert.equal(codigo, 0);
  });
});

test('run() devuelve 1 cuando hay una ruptura real (campo requerido nuevo)', () => {
  conArchivos((dir) => {
    const base = join(dir, 'base.json');
    const head = join(dir, 'head.json');
    const { base: docBase, head: docHead } = mutar((h) => {
      h.components.schemas.CreateWidget.required.push('tag');
    });
    writeFileSync(base, JSON.stringify(docBase));
    writeFileSync(head, JSON.stringify(docHead));

    const codigo = run(['--base', base, '--head', head]);
    assert.equal(codigo, 1);
  });
});

test('run() devuelve 2 (no 0) cuando el comando está mal invocado — nunca simula "sin cambios"', () => {
  assert.equal(run([]), 2);
  assert.equal(run(['--base', '/no/existe.json', '--head', '/tampoco.json']), 2);
});

test('run() devuelve 0 cuando la única ruptura tiene una excepción con migración documentada', () => {
  conArchivos((dir) => {
    const base = join(dir, 'base.json');
    const head = join(dir, 'head.json');
    const excepciones = join(dir, 'excepciones.json');
    const { base: docBase, head: docHead } = mutar((h) => {
      delete h.paths['/widgets'].post.responses['201'];
    });
    writeFileSync(base, JSON.stringify(docBase));
    writeFileSync(head, JSON.stringify(docHead));
    const id = diffOpenApi(docBase, docHead)[0].id;
    writeFileSync(
      excepciones,
      JSON.stringify([{ id, reason: 'se retiró el 201 a propósito', migrationNote: 'usar 200' }]),
    );

    const codigo = run(['--base', base, '--head', head, '--exceptions', excepciones]);
    assert.equal(codigo, 0);
  });
});
