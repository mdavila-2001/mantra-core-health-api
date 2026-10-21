#!/usr/bin/env node
// Catálogo de datos (portal interno, H3): tablas, columnas, relaciones, índices, linaje y glosario.
//
//   node tools/inventario/catalogo.mjs             escribe inventario/catalogo, inventario/glosario.json y docs/inventario/catalogo
//   node tools/inventario/catalogo.mjs --verificar falla si lo escrito no coincide con el modelo y el código
//   node tools/inventario/catalogo.mjs --conteos   imprime sólo los conteos del modelo (H3.S1.M1)
//
// Variables: MODEL_ROOT (repo del modelo; por defecto el hermano `../mantra-core-health-model`) y
// FRONT_ROOT (repo del frontend, sólo para su glosario; por defecto `../mantra-core-health`).
import fs from 'node:fs';
import path from 'node:path';
import { construirCatalogo, resumirCatalogo } from './lib/catalogo.mjs';
import { leerAppendOnly, leerGlosario } from './lib/catalogo-fuentes.mjs';
import { leerConsultas } from './lib/consultas.mjs';
import { dominiosPorEsquema } from './lib/documentos.mjs';
import { construirInventarioDeEndpoints } from './lib/inventario-endpoints.mjs';
import { construirLinaje } from './lib/linaje.mjs';
import {
  renderDeriva,
  renderEsquema,
  renderGlosario,
  renderIndiceCatalogo,
} from './lib/markdown-catalogo.mjs';
import { leerComentariosDeColumna, leerModelo } from './lib/modelo.mjs';
import { leerColumnasDeEntidades } from './lib/orm.mjs';
import { escribir, jsonPorLinea, modeloRoot } from './lib/salida.mjs';

const argv = process.argv.slice(2);
const opciones = {
  verificar: argv.includes('--verificar'),
  conteos: argv.includes('--conteos'),
};
for (const a of argv)
  if (!['--verificar', '--conteos'].includes(a))
    throw new Error(`Argumento desconocido: ${a}`);

const root = process.cwd();
const modelRoot = modeloRoot(root);
const modelo = leerModelo(modelRoot);
if (opciones.conteos) {
  console.log(JSON.stringify(modelo.conteos, null, 2));
  process.exit(0);
}
const frontRoot = process.env.FRONT_ROOT
  ? path.resolve(process.env.FRONT_ROOT)
  : path.resolve(root, '..', 'mantra-core-health');

const { endpoints, index, datos } = construirInventarioDeEndpoints({
  root,
  modelRoot,
});
const comentarios = leerComentariosDeColumna(modelRoot, modelo.tablas);
const orm = leerColumnasDeEntidades(index, datos.entidades);
const consultas = leerConsultas(index, datos);
const tablasPorModulo = new Map();
for (const e of datos.entidades.values()) {
  if (!e.modulo) continue;
  if (!tablasPorModulo.has(e.modulo)) tablasPorModulo.set(e.modulo, new Set());
  tablasPorModulo.get(e.modulo).add(e.tabla);
}
const appendOnly = leerAppendOnly(root, tablasPorModulo);
const dominios = dominiosPorEsquema(root, modelRoot);
const archivoDerivaBd = path.join(root, 'inventario/catalogo/deriva-bd.json');
const derivaBd = fs.existsSync(archivoDerivaBd)
  ? JSON.parse(fs.readFileSync(archivoDerivaBd, 'utf8'))
  : null;
const { tablas, deriva } = construirCatalogo({
  derivaBd,
  modelRoot,
  modelo,
  comentarios: comentarios.porColumna,
  orm,
  consultas,
  entidades: datos.entidades,
  endpoints,
  appendOnly,
  dominioPorEsquema: dominios,
});
const resumen = resumirCatalogo(tablas);
const esquemasSinCatalogoDeApi = [...new Set(tablas.map((t) => t.schema))]
  .filter((s) => !dominios.has(s))
  .sort();

const glosario = [
  ...leerGlosario(
    root,
    'docs/business/glossary.md',
    'mantra-core-health-api',
    datos.entidades,
  ),
  ...(fs.existsSync(frontRoot)
    ? leerGlosario(
        frontRoot,
        'docs/business/glossary.md',
        'mantra-core-health',
        datos.entidades,
      )
    : []),
];
const nombresDeTabla = new Set(tablas.map((t) => t.id));
for (const g of glosario)
  g.tablasRelacionadas = g.tablasRelacionadas.filter((t) =>
    nombresDeTabla.has(t),
  );
const linaje = construirLinaje({ tablas, endpoints });

const diferencias = [];
const ctx = { verificar: opciones.verificar, diferencias };
const porEsquema = new Map();
for (const t of tablas)
  porEsquema.set(t.schema, [...(porEsquema.get(t.schema) ?? []), t]);
const filas = [];
for (const [schema, lista] of [...porEsquema].sort(([a], [b]) =>
  a.localeCompare(b),
)) {
  escribir(
    path.join(root, 'inventario/catalogo', `${schema}.json`),
    jsonPorLinea(lista),
    ctx,
  );
  escribir(
    path.join(root, 'docs/inventario/catalogo', `${schema}.md`),
    `${renderEsquema(schema, lista)}\n`,
    ctx,
  );
  filas.push({
    schema,
    tablas: lista.length,
    columnas: lista.reduce((n, t) => n + t.columnas.length, 0),
  });
}
escribir(
  path.join(root, 'inventario/catalogo/indice.json'),
  `${JSON.stringify({ resumen, deriva: { entidadesSinTabla: deriva.entidadesSinTabla, tablasSinEntidad: deriva.tablasSinEntidad, columnasAusentesEnOrm: deriva.columnasAusentesEnOrm, columnasDeMasEnOrm: deriva.columnasDeMasEnOrm, nulabilidad: deriva.nulabilidad, tipos: deriva.tipos, esquemasSinCatalogoDeApi }, tablas: tablas.map((t) => ({ id: t.id, schema: t.schema, tabla: t.tabla, dominio: t.dominio?.dominio ?? null, columnas: t.columnas.length, indices: t.indices.length, operaciones: t.operaciones.length, orm: t.deriva.orm.estado, appendOnly: Boolean(t.gobierno.appendOnly.valor) })) }, null, 2)}\n`,
  ctx,
);
escribir(
  path.join(root, 'inventario/grafos/linaje.json'),
  `${JSON.stringify(linaje)}\n`,
  ctx,
);
escribir(
  path.join(root, 'inventario/glosario.json'),
  jsonPorLinea(glosario),
  ctx,
);
escribir(
  path.join(root, 'docs/inventario/catalogo/index.md'),
  `${renderIndiceCatalogo(filas, resumen)}\n`,
  ctx,
);
escribir(
  path.join(root, 'docs/inventario/catalogo/deriva.md'),
  `${renderDeriva(resumen, deriva, tablas, esquemasSinCatalogoDeApi, derivaBd)}\n`,
  ctx,
);
escribir(
  path.join(root, 'docs/inventario/catalogo/glosario.md'),
  `${renderGlosario(glosario)}\n`,
  ctx,
);

if (opciones.verificar) {
  if (diferencias.length) {
    console.error(
      `El catálogo escrito no coincide con el modelo y el código (${diferencias.length} archivo(s)):`,
    );
    for (const archivo of diferencias.slice(0, 20))
      console.error(`  - ${path.relative(root, archivo)}`);
    console.error('Regeneralo con: node tools/inventario/catalogo.mjs');
    process.exit(1);
  }
  console.log(
    `Catálogo al día: ${resumen.tablas} tablas en ${resumen.esquemas} schemas.`,
  );
} else {
  console.log(JSON.stringify(resumen));
  console.log(
    `Catálogo escrito: ${resumen.tablas} tablas en ${resumen.esquemas} schemas.`,
  );
}
