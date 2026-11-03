import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { leerAppendOnly, leerGlosario } from './catalogo-fuentes.mjs';

function raiz(archivos) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inventario-fuentes-'));
  for (const [ruta, texto] of Object.entries(archivos)) {
    fs.mkdirSync(path.dirname(path.join(root, ruta)), { recursive: true });
    fs.writeFileSync(path.join(root, ruta), texto);
  }
  return root;
}

test('append-only: sólo las tres formas explícitas, con su línea, y los comodines contra las tablas del módulo', () => {
  const root = raiz({
    'src/modules/m/README.md': [
      '# Módulo',
      '- **Append-only (WORM)**: `bitacora`, `accesos` y todas las `*_history`.',
      'Otra cosa: `federados` (append-only) y `eventos` (IMMUTABLE append-only).',
      '- `pings` — pings append-only (`<<LOG>>`)',
      'La tabla `normal` se actualiza; `otra` no se menciona como append-only.',
      'El flujo es append-only pero no nombra tablas: `fantasma_inexistente`.',
    ].join('\n'),
  });
  const tablas = new Map([
    [
      'm',
      new Set([
        'bitacora',
        'accesos',
        'a_history',
        'b_history',
        'federados',
        'eventos',
        'pings',
        'normal',
        'otra',
      ]),
    ],
  ]);
  const r = leerAppendOnly(root, tablas);
  assert.deepEqual([...r.keys()].sort(), [
    'm.a_history',
    'm.accesos',
    'm.b_history',
    'm.bitacora',
    'm.eventos',
    'm.federados',
    'm.pings',
  ]);
  assert.equal(r.get('m.bitacora')[0].fuente, 'src/modules/m/README.md:2');
  assert.equal(r.get('m.federados')[0].forma, 'PARENTESIS');
  assert.equal(r.get('m.pings')[0].forma, 'VINETA');
  assert.equal(
    r.has('m.normal'),
    false,
    'mencionar una tabla no la hace append-only',
  );
});

test('glosario: término y definición, sin enlaces relativos rotos y con las tablas que nombra', () => {
  const root = raiz({
    'docs/g.md': [
      '| Término | Significado |',
      '|---|---|',
      '| **PDP** | Decide el acceso (ver [autorización](../api/authz.md)) y usa `authz.grants`. |',
      '| texto suelto | no es un término |',
    ].join('\n'),
  });
  const [t, ...resto] = leerGlosario(
    root,
    'docs/g.md',
    'repo',
    new Map([['authz.grants', {}]]),
  );
  assert.equal(resto.length, 0);
  assert.equal(t.termino, 'PDP');
  assert.ok(
    !t.definicion.includes('](') && t.definicion.includes('ver autorización'),
  );
  assert.deepEqual(t.tablasRelacionadas, ['authz.grants']);
  assert.equal(t.fuente, 'repo:docs/g.md:3');
});
