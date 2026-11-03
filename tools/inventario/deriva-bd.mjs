#!/usr/bin/env node
// Deriva entre el catálogo (DDL del modelo) y una base PostgreSQL ya construida (H3.S1.M6).
//
//   DERIVA_DATABASE_URL=postgres://… node tools/inventario/deriva-bd.mjs
//
// Sólo ejecuta SELECT sobre information_schema y pg_catalog. Escribe `inventario/catalogo/deriva-bd.json`,
// que `catalogo.mjs` incorpora a la ficha de cada tabla. Sin la variable no hace nada y lo dice: no
// adivina una conexión ni usa DATABASE_URL, que puede apuntar a una base real.
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { CONSULTAS, compararConBase } from './lib/deriva-bd.mjs';

const url = process.env.DERIVA_DATABASE_URL;
if (!url) {
  console.error(
    'BLOQUEADO: falta DERIVA_DATABASE_URL (una base construida con SQL/apply_all.sql y apply_deferred.sql del modelo). No se usa DATABASE_URL a propósito.',
  );
  process.exit(2);
}
const root = process.cwd();
const dir = path.join(root, 'inventario/catalogo');
const tablas = fs
  .readdirSync(dir)
  .filter(
    (f) => f.endsWith('.json') && f !== 'indice.json' && f !== 'deriva-bd.json',
  )
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));

const cliente = new pg.Client({ connectionString: url });
await cliente.connect();
try {
  await cliente.query('set default_transaction_read_only = on');
  const bd = {};
  for (const [nombre, sql] of Object.entries(CONSULTAS))
    bd[nombre] = (await cliente.query(sql)).rows;
  const { porTabla, totales, tablasDeMas, indicesDeMas } = compararConBase(
    tablas,
    bd,
  );
  const conexion = new URL(url);
  const salida = {
    fuente: {
      servidor: bd.version[0].version.split(' on ')[0],
      base: conexion.pathname.slice(1),
      aplicado:
        'SQL/apply_all.sql + SQL/apply_deferred.sql del modelo (sin SQL/patches)',
    },
    resumen: {
      tablasDelCatalogo: tablas.length,
      tablasEnBase: bd.tablas.length,
      columnasEnBase: bd.columnas.length,
      indicesEnBase: bd.indices.length,
      fkEnBase: bd.fks.length,
      ...totales,
      tablasCoinciden: [...porTabla.values()].filter(
        (t) => t.estado === 'COINCIDE',
      ).length,
    },
    tablasDeMas,
    indicesDeMas,
    tablas: Object.fromEntries(
      [...porTabla].sort(([a], [b]) => a.localeCompare(b)),
    ),
  };
  fs.writeFileSync(
    path.join(dir, 'deriva-bd.json'),
    `${JSON.stringify(salida, null, 1)}\n`,
    'utf8',
  );
  console.log(JSON.stringify(salida.resumen));
} finally {
  await cliente.end();
}
