import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { leerComentariosDeColumna, leerIndicesOmitidos } from './modelo.mjs';

function modelo(archivos) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inventario-modelo-'));
  for (const [ruta, texto] of Object.entries(archivos)) {
    fs.mkdirSync(path.dirname(path.join(root, ruta)), { recursive: true });
    fs.writeFileSync(path.join(root, ruta), texto);
  }
  return root;
}

test('índices USING brin/gist/gin que el CSV no lista se leen del SQL; los comentados y los ya listados no', () => {
  const root = modelo({
    'SQL/01_x/04_indexes.sql': [
      'CREATE INDEX IF NOT EXISTS "ix_normal" ON "s"."t" ("a");',
      'CREATE INDEX IF NOT EXISTS "brin_t_creado" ON "s"."t" USING brin ("created_at") WITH (pages_per_range=128);',
      'CREATE INDEX IF NOT EXISTS "gist_t_periodo" ON "s"."t" USING gist (tstzrange(valid_from, valid_to, \'[)\')) WHERE activo;',
      'CREATE UNIQUE INDEX IF NOT EXISTS "gin_ya_listado" ON "s"."t" USING gin ("x");',
      '-- TODO(placeholder): CREATE INDEX IF NOT EXISTS "gist_comentado" ON "s"."t" USING gist ("y");',
    ].join('\n'),
  });
  const filas = leerIndicesOmitidos(root, new Set(['s.gin_ya_listado']));
  assert.deepEqual(
    filas.map((f) => f.index_name),
    ['brin_t_creado', 'gist_t_periodo'],
  );
  assert.equal(filas[0].metodo, 'brin');
  assert.equal(filas[0].columns_or_expression, '"created_at"');
  assert.equal(
    filas[1].columns_or_expression,
    "tstzrange(valid_from, valid_to, '[)')",
  );
  assert.equal(filas[1].predicate, 'activo');
  assert.equal(filas[0].omitido, true);
  assert.equal(filas[0].source_ddl, 'SQL/01_x/04_indexes.sql');
});

test('comentarios de columna: sólo los indentados dentro de la entidad y justo antes de la columna', () => {
  const root = modelo({
    'm/d.puml': [
      "' comentario de grupo, al margen",
      'entity t <<X>> {',
      '  * id : uuid <<PK>>',
      "  ' explica a nombre,",
      "  ' en dos líneas",
      '    nombre : varchar',
      '  otra : text',
      '}',
    ].join('\n'),
  });
  const tablas = new Map([['s.t', { table: 't', source_diagram: 'm/d.puml' }]]);
  const { porColumna, ambiguas, sinEntidad } = leerComentariosDeColumna(
    root,
    tablas,
  );
  assert.deepEqual([...porColumna.keys()], ['s.t.nombre']);
  assert.equal(
    porColumna.get('s.t.nombre').texto,
    'explica a nombre, en dos líneas',
  );
  assert.equal(porColumna.get('s.t.nombre').fuente, 'm/d.puml:4');
  assert.deepEqual([ambiguas, sinEntidad], [[], []]);
});

test('una entidad que el diagrama no declara se informa en sinEntidad', () => {
  const root = modelo({ 'm/d.puml': 'entity otra {\n  * id : uuid\n}\n' });
  const tablas = new Map([['s.t', { table: 't', source_diagram: 'm/d.puml' }]]);
  assert.deepEqual(leerComentariosDeColumna(root, tablas).sinEntidad, ['s.t']);
});
