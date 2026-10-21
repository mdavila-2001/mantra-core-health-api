#!/usr/bin/env node
// Inventario de flujos: procesos, máquinas de estado y árbol de decisión por operación.
//
//   node tools/inventario/flujos.mjs                    escribe inventario/flujos, inventario/arboles y docs/inventario/flujos
//   node tools/inventario/flujos.mjs --verificar        falla si lo escrito no coincide con el código
//   node tools/inventario/flujos.mjs --modulo a,b       limita la salida a esos módulos
//   node tools/inventario/flujos.mjs --modulo a --json  imprime procesos y máquinas de esos módulos
import path from 'node:path';
import { construirInventarioCompleto } from './lib/inventario-completo.mjs';
import { esTrivial } from './lib/mermaid.mjs';
import {
  renderFlujosDeModulo,
  renderHallazgos,
  renderIndiceDeFlujos,
  renderMapa,
} from './lib/markdown-flujos.mjs';
import { escribir, jsonPorLinea, modeloRoot } from './lib/salida.mjs';

const opciones = { modulos: undefined, verificar: false, json: false };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === '--verificar') opciones.verificar = true;
  else if (argv[i] === '--json') opciones.json = true;
  else if (argv[i] === '--modulo' || argv[i] === '--modulos')
    opciones.modulos = argv[++i]?.split(',').filter(Boolean);
  else throw new Error(`Argumento desconocido: ${argv[i]}`);
}

const root = process.cwd();
const { endpoints, procesos, maquinas, arboles, sinResolver, mapa } =
  construirInventarioCompleto({ root, modelRoot: modeloRoot(root) });
const seleccion = opciones.modulos ? new Set(opciones.modulos) : null;
const incluye = (modulo) => !seleccion || seleccion.has(modulo);

if (opciones.json) {
  console.log(
    JSON.stringify(
      {
        procesos: procesos.filter((p) => incluye(p.modulo)),
        maquinas: maquinas.filter((m) => incluye(m.modulo)),
        sinResolver,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const diferencias = [];
const ctx = { verificar: opciones.verificar, diferencias };
const porModulo = new Map();
for (const e of endpoints)
  porModulo.set(e.modulo, [...(porModulo.get(e.modulo) ?? []), e]);

const filasIndice = [];
for (const [modulo, lista] of [...porModulo].sort(([a], [b]) =>
  a.localeCompare(b),
)) {
  if (!incluye(modulo)) continue;
  escribir(
    path.join(root, 'inventario/arboles', `${modulo}.json`),
    jsonPorLinea(
      lista.map((e) => ({
        id: e.id,
        metodo: e.metodo,
        ruta: e.ruta,
        ...arboles.get(e.id),
      })),
    ),
    ctx,
  );
  escribir(
    path.join(root, 'docs/inventario/flujos', `${modulo}.md`),
    `${renderFlujosDeModulo(modulo, { procesos, maquinas, endpoints: lista, arboles })}\n`,
    ctx,
  );
  filasIndice.push({
    modulo,
    procesos: procesos.filter(
      (p) => p.modulo === modulo || p.modulos?.includes(modulo),
    ).length,
    operaciones: lista.length,
    maquinas: maquinas.filter((m) => m.modulo === modulo).length,
  });
}

if (!seleccion) {
  escribir(
    path.join(root, 'inventario/flujos/procesos.json'),
    jsonPorLinea(procesos),
    ctx,
  );
  escribir(
    path.join(root, 'inventario/flujos/maquinas.json'),
    jsonPorLinea(maquinas),
    ctx,
  );
  escribir(
    path.join(root, 'inventario/flujos/mapa.json'),
    jsonPorLinea(mapa.filas),
    ctx,
  );
  escribir(
    path.join(root, 'inventario/flujos/hallazgos.json'),
    `${JSON.stringify(mapa.hallazgos, null, 2)}\n`,
    ctx,
  );
  escribir(
    path.join(root, 'docs/inventario/flujos/mapa.md'),
    `${renderMapa(mapa)}\n`,
    ctx,
  );
  escribir(
    path.join(root, 'docs/inventario/flujos/hallazgos.md'),
    `${renderHallazgos(mapa)}\n`,
    ctx,
  );
  const conDecisiones = endpoints.filter(
    (e) => !esTrivial(arboles.get(e.id).nodos),
  ).length;
  const porAgrupacion = {};
  for (const p of procesos)
    porAgrupacion[p.agrupacion] = (porAgrupacion[p.agrupacion] ?? 0) + 1;
  const resumen = {
    procesos: procesos.length,
    criticos: procesos.filter((p) => p.tipo === 'CRITICO').length,
    deModulo: procesos.filter((p) => p.tipo === 'MODULO').length,
    maquinas: maquinas.length,
    operaciones: endpoints.length,
    conDecisiones,
    sinDecisiones: endpoints.length - conDecisiones,
    sinFlujo: endpoints.filter((e) => !e.flujos.length).length,
    porAgrupacion,
  };
  escribir(
    path.join(root, 'docs/inventario/flujos/index.md'),
    `${renderIndiceDeFlujos(filasIndice, resumen)}\n`,
    ctx,
  );
  if (!opciones.verificar) console.log(JSON.stringify(resumen));
}

if (sinResolver.length) {
  console.error(
    `Referencias de critical-workflows.md que no corresponden a ninguna operación (${sinResolver.length}):`,
  );
  for (const s of sinResolver)
    console.error(`  - ${s.proceso}: ${s.referencia} (${s.fuente})`);
  process.exit(1);
}
if (opciones.verificar) {
  if (diferencias.length) {
    console.error(
      `Los flujos escritos no coinciden con el código (${diferencias.length} archivo(s)):`,
    );
    for (const archivo of diferencias.slice(0, 20))
      console.error(`  - ${path.relative(root, archivo)}`);
    console.error('Regeneralos con: node tools/inventario/flujos.mjs');
    process.exit(1);
  }
  console.log(
    `Flujos al día: ${procesos.length} procesos, ${endpoints.length} árboles.`,
  );
} else
  console.log(
    `Flujos escritos: ${procesos.length} procesos, ${endpoints.length} árboles.`,
  );
