#!/usr/bin/env node
/**
 * F09 · Comprobación de deriva entre el DDL versionado y una base real.
 *
 * EL PROBLEMA QUE RESUELVE. El esquema llega a la base por `postgres-init`, que
 * aplica el DDL del repositorio del modelo. Si ese repositorio no está al lado,
 * el init aborta **antes** de aplicar los parches y la base queda desfasada en
 * silencio: nadie se entera hasta que un seed falla por una columna que no
 * existe (fue exactamente lo que pasó con `insurance_carriers.sigla`). Un
 * fallo así aparece lejos de su causa y cuesta horas.
 *
 * QUÉ COMPARA. Las tablas y columnas que declaran los `database/SQL/**\/02_tables.sql`
 * versionados contra las que tiene de verdad una base viva. Informa:
 *
 *   - tablas declaradas que faltan en la base;
 *   - columnas declaradas que faltan en la base;
 *   - columnas de la base que el DDL versionado no declara.
 *
 * Las tres direcciones importan y ninguna es automáticamente un error: el
 * `database/` del repo es una copia vendorizada del modelo y puede ir una
 * versión atrás. Por eso el script **describe** la deriva y deja decidir, salvo
 * que se le pida `--strict`.
 *
 * QUÉ NO COMPARA. Tipos, restricciones, índices, FK y valores por omisión.
 * Comparar tipos exige normalizar los alias de Postgres (`varchar` contra
 * `character varying`, `int` contra `integer`) y la comparación a medias
 * confunde más de lo que ayuda. Presencia de tablas y columnas es el 90 % de
 * los desfasajes reales y se puede afirmar sin ambigüedad.
 *
 * USO:
 *   node scripts/db/check-schema-drift.mjs
 *   node scripts/db/check-schema-drift.mjs --strict   # sale != 0 si hay deriva
 *   node scripts/db/check-schema-drift.mjs --json     # salida para un job de CI
 *
 * Conexión: toma `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` del
 * entorno (los mismos del `.env`), o sus equivalentes `POSTGRES_*`.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR_SQL = join(RAIZ, 'database', 'SQL');

const args = new Set(process.argv.slice(2));
const ESTRICTO = args.has('--strict');
const JSON_OUT = args.has('--json');

/**
 * Esquemas que `database/SQL` no gobierna, así que compararlos contra él sólo
 * produce falsos positivos.
 *
 * Dos grupos: los que crean las extensiones y el propio motor, y los dos que
 * sí son nuestros pero se declaran en `database/NoSQL/58_*` y `59_*`
 * (TimescaleDB y pgvector). Estos últimos viven en Postgres pero no salen de
 * los `02_tables.sql`; sin excluirlos, el informe gritaría deriva en cada
 * corrida y nadie volvería a mirarlo.
 */
const ESQUEMAS_AJENOS = new Set([
  'public',
  'information_schema',
  'pg_catalog',
  'pg_toast',
  '_timescaledb_catalog',
  '_timescaledb_internal',
  '_timescaledb_config',
  '_timescaledb_cache',
  '_timescaledb_functions',
  'timescaledb_information',
  'timescaledb_experimental',
  // Declarados en database/NoSQL/, no en database/SQL/.
  'time_series',
  'vector_rag',
]);

/**
 * Lee los `02_tables.sql` versionados y devuelve el esquema que declaran.
 *
 * El DDL es generado, no escrito a mano: cada tabla abre con
 * `CREATE TABLE IF NOT EXISTS "esquema"."tabla" (` y cada columna es una línea
 * que empieza con un identificador entre comillas. Las líneas de `CONSTRAINT`
 * se saltan. Esa regularidad es lo que hace que un parser de treinta líneas
 * alcance; si el generador cambia de forma, este script lo va a notar porque
 * dejará de encontrar tablas y lo dice.
 *
 * @returns {Map<string, Set<string>>} `esquema.tabla` -> columnas declaradas.
 */
function leerDdlVersionado() {
  const declarado = new Map();
  const modulos = readdirSync(DIR_SQL, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'patches' && d.name !== '_integrity')
    .map((d) => d.name);

  for (const modulo of modulos) {
    const archivo = join(DIR_SQL, modulo, '02_tables.sql');
    if (!existsSync(archivo)) continue;

    let clave = null;
    for (const cruda of readFileSync(archivo, 'utf8').split('\n')) {
      const linea = cruda.trim();

      const apertura = linea.match(
        /^CREATE TABLE(?: IF NOT EXISTS)? "([^"]+)"\."([^"]+)"/i,
      );
      if (apertura) {
        clave = `${apertura[1]}.${apertura[2]}`;
        if (!declarado.has(clave)) declarado.set(clave, new Set());
        continue;
      }
      if (clave === null) continue;
      if (linea.startsWith(')')) {
        clave = null;
        continue;
      }
      if (/^(CONSTRAINT|PRIMARY KEY|UNIQUE|FOREIGN KEY|CHECK|--)/i.test(linea)) {
        continue;
      }
      const columna = linea.match(/^"([^"]+)"\s/);
      if (columna) declarado.get(clave).add(columna[1]);
    }
  }
  return declarado;
}

/**
 * Lee el esquema real de la base.
 *
 * @param {pg.Client} cliente - Conexión abierta.
 * @returns {Promise<Map<string, Set<string>>>} `esquema.tabla` -> columnas reales.
 */
async function leerBaseViva(cliente) {
  const { rows } = await cliente.query(
    `SELECT table_schema, table_name, column_name
       FROM information_schema.columns
      WHERE table_schema NOT IN (${[...ESQUEMAS_AJENOS]
        .map((_, i) => `$${i + 1}`)
        .join(', ')})
      ORDER BY table_schema, table_name, ordinal_position`,
    [...ESQUEMAS_AJENOS],
  );
  const real = new Map();
  for (const fila of rows) {
    const clave = `${fila.table_schema}.${fila.table_name}`;
    if (!real.has(clave)) real.set(clave, new Set());
    real.get(clave).add(fila.column_name);
  }
  return real;
}

/**
 * Contrasta lo declarado contra lo real.
 *
 * @param {Map<string, Set<string>>} declarado - Esquema del DDL versionado.
 * @param {Map<string, Set<string>>} real - Esquema de la base viva.
 * @returns {{tablasFaltantes: string[], columnasFaltantes: string[], columnasNoDeclaradas: string[], tablasNoDeclaradas: string[]}}
 */
function comparar(declarado, real) {
  const tablasFaltantes = [];
  const columnasFaltantes = [];
  const columnasNoDeclaradas = [];
  const tablasNoDeclaradas = [];

  for (const [tabla, columnas] of declarado) {
    const reales = real.get(tabla);
    if (!reales) {
      tablasFaltantes.push(tabla);
      continue;
    }
    for (const columna of columnas) {
      if (!reales.has(columna)) columnasFaltantes.push(`${tabla}.${columna}`);
    }
    for (const columna of reales) {
      if (!columnas.has(columna)) {
        columnasNoDeclaradas.push(`${tabla}.${columna}`);
      }
    }
  }
  for (const tabla of real.keys()) {
    if (!declarado.has(tabla)) tablasNoDeclaradas.push(tabla);
  }
  return {
    tablasFaltantes,
    columnasFaltantes,
    columnasNoDeclaradas,
    tablasNoDeclaradas,
  };
}

/**
 * Imprime una lista acotada, diciendo cuántas quedaron sin mostrar.
 *
 * @param {string} titulo - Encabezado de la sección.
 * @param {string[]} items - Elementos a listar.
 * @param {string} explicacion - Qué significa que esta lista no esté vacía.
 */
function listar(titulo, items, explicacion) {
  if (items.length === 0) return;
  console.log(`\n${titulo} (${items.length})`);
  console.log(`  ${explicacion}`);
  for (const item of items.slice(0, 40)) console.log(`    - ${item}`);
  if (items.length > 40) {
    console.log(`    … y ${items.length - 40} más`);
  }
}

/** Punto de entrada. */
async function main() {
  const declarado = leerDdlVersionado();
  if (declarado.size === 0) {
    console.error(
      'ERROR: no se encontró ninguna tabla en database/SQL/**/02_tables.sql.\n' +
        'O el DDL no está vendorizado (`yarn db:vendor`), o el generador cambió\n' +
        'de forma y este parser dejó de reconocerlo. En cualquier caso, la\n' +
        'comparación no se puede hacer: no se informa "sin deriva".',
    );
    process.exit(2);
  }

  const cliente = new pg.Client({
    host: process.env.DB_HOST ?? process.env.POSTGRES_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? process.env.POSTGRES_PORT ?? 5432),
    user: process.env.DB_USER ?? process.env.POSTGRES_USER,
    password: process.env.DB_PASSWORD ?? process.env.POSTGRES_PASSWORD,
    database: process.env.DB_NAME ?? process.env.POSTGRES_DB,
  });
  await cliente.connect();
  let real;
  try {
    real = await leerBaseViva(cliente);
  } finally {
    await cliente.end();
  }

  const deriva = comparar(declarado, real);
  const hayDeriva =
    deriva.tablasFaltantes.length > 0 || deriva.columnasFaltantes.length > 0;

  if (JSON_OUT) {
    console.log(
      JSON.stringify(
        {
          tablasDeclaradas: declarado.size,
          tablasEnLaBase: real.size,
          ...deriva,
          hayDeriva,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(
      `DDL versionado: ${declarado.size} tabla(s) · base viva: ${real.size} tabla(s)`,
    );
    listar(
      '✗ Tablas declaradas que NO están en la base',
      deriva.tablasFaltantes,
      'La base está por detrás del DDL: el init no llegó a aplicarlas.',
    );
    listar(
      '✗ Columnas declaradas que NO están en la base',
      deriva.columnasFaltantes,
      'Típicamente un parche que no se aplicó. Es lo que rompe los seeds.',
    );
    listar(
      '· Columnas en la base que el DDL versionado no declara',
      deriva.columnasNoDeclaradas,
      'La copia vendorizada va por detrás del modelo, o alguien aplicó DDL a mano.',
    );
    listar(
      '· Tablas en la base que el DDL versionado no declara',
      deriva.tablasNoDeclaradas,
      'Mismo caso; con ORM_SCHEMA_SYNC distinto de off, también las crea la app.',
    );

    console.log(
      hayDeriva
        ? '\nRESULTADO: hay deriva. La base no tiene todo lo que el DDL declara.'
        : '\nRESULTADO: sin deriva. Todo lo declarado está en la base.',
    );
    if (!ESTRICTO && hayDeriva) {
      console.log('(--strict haría que esto saliera con código 1)');
    }
  }

  process.exit(ESTRICTO && hayDeriva ? 1 : 0);
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(2);
});
