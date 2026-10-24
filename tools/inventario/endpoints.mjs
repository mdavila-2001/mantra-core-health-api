#!/usr/bin/env node
// Inventario de endpoints de la API (portal interno, H1).
//
//   node tools/inventario/endpoints.mjs                      escribe inventario/ y docs/inventario/
//   node tools/inventario/endpoints.mjs --verificar          falla si lo escrito no coincide con el código
//   node tools/inventario/endpoints.mjs --modulo a,b         limita la salida a esos módulos
//   node tools/inventario/endpoints.mjs --modulo a --solo-ast  tabla handler → servicio (H1.S1.M2)
//
// Variables: MODEL_ROOT apunta al repo del modelo (por defecto, el hermano
// `../mantra-core-health-model`).
import path from 'node:path';
import {
  buildHandlerTable,
  DELEGACION,
  resumenPorModulo,
} from './lib/handlers.mjs';
import { construirInventarioCompleto } from './lib/inventario-completo.mjs';
import { resumir } from './lib/inventario-endpoints.mjs';
import { renderIndice, renderModulo } from './lib/markdown-endpoints.mjs';
import { escribir, jsonPorLinea, modeloRoot } from './lib/salida.mjs';

function argumentos(argv) {
  const opciones = { modulos: undefined, soloAst: false, verificar: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--solo-ast') opciones.soloAst = true;
    else if (arg === '--verificar') opciones.verificar = true;
    else if (arg === '--modulo' || arg === '--modulos')
      opciones.modulos = argv[++i]?.split(',').filter(Boolean);
    else throw new Error(`Argumento desconocido: ${arg}`);
  }
  return opciones;
}

function imprimirTabla({ filas, huerfanas }) {
  for (const fila of filas) {
    const destino = fila.servicios.length
      ? fila.servicios.join(', ')
      : fila.sinResolver.length
        ? `(sin resolver: ${fila.sinResolver.join(', ')})`
        : '(sin llamadas a servicios)';
    const roles = fila.publica ? 'PÚBLICA' : fila.roles.join('|') || '—';
    console.log(
      `${fila.metodo.padEnd(6)} ${fila.ruta}  [${roles}]\n` +
        `       ${fila.controlador ?? '??'}.${fila.handler ?? '??'} (${fila.fuente ?? 'NO ENCONTRADO'})\n` +
        `       → ${destino}`,
    );
  }
  console.log('\nResumen por módulo:');
  console.table(resumenPorModulo(filas));
  if (huerfanas.length) {
    console.log('Handlers sin operación en el contrato:');
    console.table(huerfanas);
  }
}

const opciones = argumentos(process.argv.slice(2));

if (opciones.soloAst) {
  const tabla = buildHandlerTable({ modulos: opciones.modulos });
  imprimirTabla(tabla);
  const noEncontradas = tabla.filas.filter((fila) => !fila.encontrado);
  const noResueltas = tabla.filas.filter(
    (fila) => fila.delegacion === DELEGACION.NO_RESUELTA,
  );
  console.log(
    `Operaciones: ${tabla.filas.length} · no encontradas en el código: ${noEncontradas.length} · con delegación no resuelta: ${noResueltas.length}`,
  );
  process.exit(noEncontradas.length ? 1 : 0);
}

const root = process.cwd();
const modelRoot = modeloRoot(root);

const { endpoints } = construirInventarioCompleto({ root, modelRoot });
const seleccion = opciones.modulos ? new Set(opciones.modulos) : null;
const porModulo = new Map();
for (const e of endpoints) {
  if (seleccion && !seleccion.has(e.modulo)) continue;
  porModulo.set(e.modulo, [...(porModulo.get(e.modulo) ?? []), e]);
}

const diferencias = [];
const ctx = { verificar: opciones.verificar, diferencias };
const modulos = [];
for (const [modulo, lista] of [...porModulo].sort(([a], [b]) =>
  a.localeCompare(b),
)) {
  escribir(
    path.join(root, 'inventario/endpoints', `${modulo}.json`),
    jsonPorLinea(lista),
    ctx,
  );
  escribir(
    path.join(root, 'docs/inventario/endpoints', `${modulo}.md`),
    `${renderModulo(modulo, lista)}\n`,
    ctx,
  );
  modulos.push({
    modulo,
    operaciones: lista.length,
    riesgoAlto: lista.filter((e) => e.riesgo.nivel === 'ALTO').length,
  });
}
const resumen = resumir([...porModulo.values()].flat());
if (!seleccion) {
  const indiceLigero = endpoints.map((e) => ({
    id: e.id,
    origen: e.origen,
    metodo: e.metodo,
    ruta: e.ruta,
    modulo: e.modulo,
    bloque: e.bloque?.nombre ?? null,
    nombre: e.nombre,
    riesgo: e.riesgo.nivel,
    publica: e.autenticacion.publica,
    roles: e.autenticacion.roles,
    tablas: e.tablas.length,
    eventos: e.eventos.length,
    pruebas: e.pruebas.length,
    revision: e.revision.estado,
  }));
  escribir(
    path.join(root, 'inventario/endpoints/indice.json'),
    `${JSON.stringify({ resumen, endpoints: indiceLigero }, null, 2)}\n`,
    ctx,
  );
  escribir(
    path.join(root, 'docs/inventario/endpoints/index.md'),
    `${renderIndice(modulos, resumen)}\n`,
    ctx,
  );
}

if (opciones.verificar) {
  if (diferencias.length) {
    console.error(
      `El inventario escrito no coincide con el código (${diferencias.length} archivo(s)):`,
    );
    for (const archivo of diferencias.slice(0, 20))
      console.error(`  - ${path.relative(root, archivo)}`);
    console.error('Regeneralo con: node tools/inventario/endpoints.mjs');
    process.exit(1);
  }
  console.log(
    `Inventario al día: ${resumen.total} operaciones en ${modulos.length} módulos.`,
  );
} else {
  console.log(
    `Inventario escrito: ${resumen.total} operaciones en ${modulos.length} módulos.`,
  );
  console.log(JSON.stringify(resumen));
}
