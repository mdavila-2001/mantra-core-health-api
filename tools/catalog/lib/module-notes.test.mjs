import assert from 'node:assert/strict';
import { test } from 'node:test';

import { explicacionDeSistema, parseNotaDeModulo } from './module-notes.mjs';

const modulo = ({ proposito = 'Manages login accounts and sessions.', schemaTag = true } = {}) =>
  [
    '---',
    'tags:',
    '  - modulo',
    ...(schemaTag ? ['  - schema/iam'] : []),
    '  - dominio/Identidad_y_Seguridad',
    'module_number: 1',
    '---',
    '# Módulo 01 · iam',
    '',
    '**Identity & Access — User Accounts and Security**',
    '',
    '> Dominio: [[Identidad y Seguridad]] · Schema: `iam` · Estado: `active`',
    '',
    ...(proposito === null ? [] : ['## Propósito de negocio', proposito, '']),
    '## Métricas',
    '- Entidades/tablas: **28**',
    '- Vistas: **0**',
    '- Conjuntos de índices: **14**',
    '- Stubs de referencia externa: **0**',
    '',
    '## Depende de (referencia módulos) →',
    '- [[M04 directory|04 · directory]] — Tenants',
    '',
    '## ← Referenciado por',
    '- [[M54 polyglot_storage|54 · polyglot_storage]] — Polyglot',
    '- [[M56 redis_runtime|56 · redis_runtime]] — Redis',
    '',
    '## Entidades (28)',
    '- [[E iam.users|users]]',
    '',
    '[[Identidad y Seguridad|← volver al dominio]]',
  ].join('\n');

test('lee número, schema, dominio, título, propósito y métricas', () => {
  const m = parseNotaDeModulo(modulo(), 'M01 iam.md');
  assert.equal(m.moduleNumber, 1);
  assert.equal(m.schema, 'iam');
  assert.equal(m.domain, 'Identidad y Seguridad');
  assert.equal(m.title, 'Identity & Access — User Accounts and Security');
  assert.equal(m.business, 'Manages login accounts and sessions.');
  assert.deepEqual([m.entidades, m.vistas, m.conjuntosDeIndices, m.stubs], [28, 0, 14, 0]);
  assert.deepEqual([m.dependeDe, m.referenciadoPor], [1, 2]);
});

test('un módulo sin «Propósito de negocio» queda con business null, no inventado', () => {
  assert.equal(parseNotaDeModulo(modulo({ proposito: null }), 'M08 clinical.md').business, null);
});

test('sin etiqueta schema/… el schema es el código del encabezado', () => {
  assert.equal(parseNotaDeModulo(modulo({ schemaTag: false }), 'M65 surveys.md').schema, 'iam');
});

test('lee igual con finales de línea de Windows', () => {
  assert.equal(parseNotaDeModulo(modulo().replaceAll('\n', '\r\n'), 'M01 iam.md').entidades, 28);
});

test('un archivo que no es una nota de módulo devuelve null', () => {
  assert.equal(parseNotaDeModulo('# Otra cosa', 'README.md'), null);
});

test('la explicación de sistema usa sólo las métricas: las tablas son entidades menos conjuntos de índices', () => {
  const m = parseNotaDeModulo(modulo(), 'M01 iam.md');
  assert.equal(
    explicacionDeSistema(m),
    'Módulo 01 del modelo: 14 tablas o vistas modeladas y 14 conjuntos de índices; depende de 1 módulo y lo referencian 2 módulos.',
  );
});

test('sin métricas no hay frase de sistema', () => {
  assert.equal(explicacionDeSistema({ moduleNumber: 1, entidades: null }), null);
});

test('singular y sin relaciones', () => {
  assert.equal(
    explicacionDeSistema({ moduleNumber: 7, entidades: 1, conjuntosDeIndices: 0, dependeDe: 0, referenciadoPor: 0 }),
    'Módulo 07 del modelo: 1 tabla o vista modelada.',
  );
});
