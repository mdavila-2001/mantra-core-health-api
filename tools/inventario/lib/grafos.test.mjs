import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import Ajv from 'ajv/dist/2020.js';
import { archivoDeGrafo, grafoDeProceso } from './grafos.mjs';

const esquema = JSON.parse(
  fs.readFileSync(
    path.join(import.meta.dirname, '../schema/grafo.schema.json'),
    'utf8',
  ),
);
const validar = new Ajv({ allErrors: true }).compile(esquema);

const PROCESO = {
  codigo: 'critico:m',
  nombre: 'Ciclo',
  tipo: 'CRITICO',
  etapas: [
    {
      codigo: 'P1',
      tipo: 'PRINCIPAL',
      nombre: 'reservar',
      operaciones: [
        {
          operacionId: 'A_x',
          metodo: 'POST',
          ruta: '/a',
          quienActua: 'PATIENT',
          riesgo: 'MEDIO',
          efectos: {
            tablas: [
              { tabla: 's.t', operacion: 'ESCRIBE', detalle: 'CREA' },
              { tabla: 's.u', operacion: 'LEE', detalle: 'LEE' },
            ],
            eventos: ['E1'],
            trabajos: [],
          },
        },
      ],
    },
    {
      codigo: 'P2',
      tipo: 'PRINCIPAL',
      nombre: 'confirmar',
      operaciones: [
        {
          operacionId: 'A_y',
          metodo: 'POST',
          ruta: '/b',
          quienActua: 'PATIENT',
          riesgo: 'BAJO',
          efectos: {
            tablas: [
              { tabla: 's.t', operacion: 'ESCRIBE', detalle: 'ACTUALIZA' },
            ],
            eventos: [],
            trabajos: ['J1'],
          },
        },
      ],
    },
  ],
};

test('el grafo de un proceso cumple el esquema y no duplica nodos compartidos', () => {
  const g = grafoDeProceso(PROCESO);
  assert.equal(validar(g), true, JSON.stringify(validar.errors));
  assert.equal(
    g.nodos.filter((n) => n.id === 'tabla:s.t').length,
    1,
    'la tabla compartida es un solo nodo',
  );
  assert.deepEqual(g.roles, ['PATIENT']);
});

test('los pasos principales se encadenan y las aristas de efecto llevan su operación', () => {
  const g = grafoDeProceso(PROCESO);
  assert.ok(
    g.aristas.some(
      (a) => a.de === 'etapa:P1' && a.a === 'etapa:P2' && a.tipo === 'SIGUE',
    ),
  );
  assert.ok(
    g.aristas.some(
      (a) =>
        a.de === 'op:A_x' &&
        a.a === 'tabla:s.t' &&
        a.tipo === 'ESCRIBE' &&
        a.etiqueta === 'CREA',
    ),
  );
  assert.ok(
    g.aristas.some(
      (a) => a.de === 'op:A_x' && a.a === 'tabla:s.u' && a.tipo === 'LEE',
    ),
  );
  assert.ok(g.aristas.some((a) => a.a === 'trabajo:J1' && a.tipo === 'ENCOLA'));
});

test('toda arista apunta a nodos que existen', () => {
  const g = grafoDeProceso(PROCESO);
  const ids = new Set(g.nodos.map((n) => n.id));
  for (const a of g.aristas)
    assert.ok(ids.has(a.de) && ids.has(a.a), JSON.stringify(a));
});

test('el esquema rechaza un grafo con un tipo de nodo inventado', () => {
  const g = grafoDeProceso(PROCESO);
  g.nodos[0].tipo = 'INVENTADO';
  assert.equal(validar(g), false);
});

test('el nombre de archivo no lleva dos puntos', () => {
  assert.equal(archivoDeGrafo('critico:scheduling'), 'critico-scheduling.json');
});

test('todos los grafos generados cumplen el esquema', () => {
  const dir = path.join(process.cwd(), 'inventario/grafos');
  const archivos = fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.json') && f !== 'linaje.json')
    : [];
  assert.ok(
    archivos.length >= 67,
    `hay ${archivos.length} grafos; faltan los generados (yarn inventario:flujos)`,
  );
  for (const f of archivos) {
    const g = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    assert.equal(
      validar(g),
      true,
      `${f}: ${JSON.stringify(validar.errors?.slice(0, 2))}`,
    );
    const ids = new Set(g.nodos.map((n) => n.id));
    for (const a of g.aristas)
      assert.ok(ids.has(a.de) && ids.has(a.a), `${f}: arista huérfana`);
  }
});
