import assert from 'node:assert/strict';
import test from 'node:test';
import {
  arbolAMermaid,
  esTrivial,
  etiqueta,
  maquinaAMermaid,
} from './mermaid.mjs';

test('una etiqueta no puede romper el diagrama: comillas y ángulos se neutralizan', () => {
  const e = etiqueta('dijo "hola" <b>x</b>\n y');
  assert.ok(!/["<>\n]/.test(e));
});

test('una etiqueta larga se corta con puntos suspensivos', () => {
  assert.equal(etiqueta('a'.repeat(200), 10).length, 10);
  assert.ok(etiqueta('a'.repeat(200), 10).endsWith('…'));
});

const ARBOL = [
  {
    tipo: 'ACCESO',
    txt: 'rol',
    corto: 'rol',
    falla: { estado: 403, codigo: 'FORBIDDEN' },
  },
  {
    tipo: 'SI',
    txt: '!slot',
    entonces: [
      {
        tipo: 'ERROR',
        excepcion: 'ResourceNotFoundException',
        estado: 404,
        codigo: 'NOT_FOUND',
        mensaje: 'no existe',
      },
    ],
    sino: [],
  },
  { tipo: 'EFECTO', tabla: 's.holds', operacion: 'ESCRIBE', detalle: 'CREA' },
  { tipo: 'RESPUESTA', estado: 201, txt: 'Responde con éxito' },
];

test('el árbol se dibuja con la rama de error terminando y la otra continuando', () => {
  const d = arbolAMermaid(ARBOL);
  assert.match(d, /^flowchart TD/);
  assert.match(d, /404 NOT_FOUND no existe/);
  // el nodo de error no tiene aristas de salida: nada sale de él
  const idError = d.match(/(n\d+)\(\["404/)[1];
  assert.equal(new RegExp(`${idError} -->`).test(d), false);
  assert.match(d, /-->\|"no"\|/);
  assert.match(d, /CREA s\.holds/);
});

test('pasado el tope se corta diciéndolo, no en silencio', () => {
  const muchos = Array.from({ length: 30 }, (_, i) => ({
    tipo: 'SI',
    txt: `c${i}`,
    entonces: [
      {
        tipo: 'ERROR',
        excepcion: 'X',
        estado: 409,
        codigo: 'CONFLICT',
        mensaje: `m${i}`,
      },
    ],
    sino: [],
  }));
  const d = arbolAMermaid(muchos, { maxNodos: 10 });
  assert.match(d, /el resto del árbol \(\d+ nodos\)/);
});

test('sólo es trivial el árbol que no decide ni falla por su cuenta', () => {
  assert.equal(esTrivial(ARBOL.filter((n) => n.tipo !== 'SI')), true);
  assert.equal(esTrivial(ARBOL), false);
});

test('la máquina de estados dibuja inicio, aristas y terminales', () => {
  const d = maquinaAMermaid({
    iniciales: ['A'],
    terminales: ['C'],
    transiciones: [
      { de: 'A', a: 'B' },
      { de: 'B', a: 'C' },
    ],
  });
  assert.match(d, /\[\*\] --> A/);
  assert.match(d, /A --> B/);
  assert.match(d, /C --> \[\*\]/);
});

test('la arista de una máquina lleva las operaciones que nombran su estado de destino', () => {
  const d = maquinaAMermaid({
    iniciales: ['A'],
    terminales: ['C'],
    transiciones: [
      { de: 'A', a: 'B' },
      { de: 'B', a: 'C' },
    ],
    operaciones: [
      { metodo: 'POST', ruta: '/x/{id}/cancel', estados: ['C'] },
      { metodo: 'POST', ruta: '/x/{id}/pagar', estados: ['B'] },
    ],
  });
  assert.match(d, /A --> B : POST …\/{id}\/pagar/);
  assert.match(d, /B --> C : POST …\/{id}\/cancel/);
});

test('una arista sin operación que nombre su destino queda sin rótulo', () => {
  const d = maquinaAMermaid({
    iniciales: [],
    terminales: [],
    transiciones: [{ de: 'A', a: 'B' }],
    operaciones: [],
  });
  assert.match(d, /A --> B$/m);
});
