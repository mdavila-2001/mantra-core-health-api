#!/usr/bin/env node
/**
 * reset-e2e.mjs — Deja la base E2E vacía, para volver a sembrar desde cero.
 *
 * ## Por qué borra los esquemas y no la base entera
 *
 * Porque `DROP DATABASE` exige que nadie esté conectado, y la API E2E mantiene
 * un pool abierto: habría que apagarla, borrar, levantarla y esperar a que
 * vuelva a construir 1284 tablas. Vaciar los esquemas y dejar que el arranque
 * de la API los reconstruya con `ORM_SCHEMA_SYNC=safe` es lo mismo sin la
 * coreografía.
 *
 * Con `--truncate` no borra la estructura: sólo vacía las filas. Es lo que se
 * quiere entre corridas de pruebas —segundos en vez de minutos— y sirve porque
 * el esquema no cambia entre una y otra. `--drop` es para cuando sí cambió.
 *
 * ## La protección
 *
 * La misma de todo `tools/e2e/`: `APP_ENV=e2e`, `ALLOW_E2E_SEED=true` y una
 * `DB_NAME` que contenga `e2e` o `test`. Un script que borra tablas es
 * exactamente donde ese guard tiene que estar, y por eso no acepta un
 * argumento que lo saltee: no hay `--force`.
 *
 * Uso:
 *   node tools/e2e/reset-e2e.mjs              # vacía las filas (rápido)
 *   node tools/e2e/reset-e2e.mjs --drop       # borra los esquemas de dominio
 */

import { execFileSync } from 'node:child_process';

import { exigirAmbienteE2E, leerEnvE2E } from './entorno.mjs';

const env = exigirAmbienteE2E(leerEnvE2E());
const borrarEstructura = process.argv.includes('--drop');

/**
 * Esquemas que **no** se tocan.
 *
 * Los de PostgreSQL y `public`, que en esta base no guarda nada del dominio
 * pero sí las extensiones.
 */
const INTOCABLES = "('pg_catalog','information_schema','pg_toast','public')";

/**
 * Corre SQL con un cliente desechable.
 *
 * En un contenedor aparte y **no** con `docker exec` dentro del contenedor de
 * Postgres: un `psql` lanzado ahí adentro es un proceso que el postmaster no
 * controla, y cuando termina con estado distinto de cero lo interpreta como un
 * backend caído y **reinicia el servidor entero**. Pasó durante el relevamiento
 * de este carril y se llevó puesta la API, que quedó con un proceso zombi.
 */
function sql(consulta) {
  return execFileSync(
    'docker',
    [
      'run', '--rm',
      '-e', `PGPASSWORD=${env.DB_PASSWORD}`,
      'postgres:16-alpine',
      'psql',
      '-h', 'host.docker.internal',
      '-p', String(env.DB_PORT ?? 5434),
      '-U', String(env.DB_USER),
      '-d', String(env.DB_NAME),
      '-tAc', consulta,
    ],
    { encoding: 'utf8' },
  ).trim();
}

console.log(`\n  Reiniciando ${env.DB_NAME} (${borrarEstructura ? 'drop' : 'truncate'})\n`);

const esquemas = sql(
  `select string_agg(quote_ident(schema_name), ', ')
     from information_schema.schemata
    where schema_name not like 'pg_%'
      and schema_name not in ${INTOCABLES};`,
);

if (esquemas === '') {
  console.log('  La base ya está vacía.\n');
  process.exit(0);
}

if (borrarEstructura) {
  sql(`drop schema if exists ${esquemas} cascade;`);
  console.log(`  Esquemas borrados: ${esquemas}`);
  console.log('  Reiniciá la API E2E para que los reconstruya (ORM_SCHEMA_SYNC=safe).\n');
} else {
  // Una sola sentencia con todas las tablas: `TRUNCATE ... CASCADE` en bloque
  // no pelea con el orden de las claves foráneas, y hacerlo tabla por tabla sí.
  const tablas = sql(
    `select string_agg(format('%I.%I', schemaname, tablename), ', ')
       from pg_tables
      where schemaname not like 'pg_%'
        and schemaname not in ${INTOCABLES};`,
  );
  if (tablas === '') {
    console.log('  No hay tablas que vaciar.\n');
    process.exit(0);
  }
  sql(`truncate ${tablas} restart identity cascade;`);
  const filas = sql(
    `select coalesce(sum(n_live_tup), 0) from pg_stat_user_tables;`,
  );
  console.log(`  Tablas vaciadas. Filas vivas estimadas: ${filas}`);
  console.log('  Reiniciá la API E2E para que vuelva a sembrar los catálogos.\n');
}
