// Prueba de `load-taxonomy.mjs` contra una base PostgreSQL real y desechable
// (issue #848: la carga debe actualizar las propiedades de conceptos ya
// cargados, ser idempotente y no borrar nada).
//
//   node --test "tools/terminology-import/diagnostic-devices/master/test/load-taxonomy.test.mjs"
//
// Base que usa, por orden:
//   1. DX_TEST_PG_PORT (+ DX_TEST_PG_HOST, DX_TEST_PG_USER; confianza local):
//      un servidor ya levantado; la prueba crea y borra su propia base.
//   2. Si no hay variable y el usuario no es root, levanta un clúster temporal
//      con initdb/pg_ctl (PATH o /usr/lib/postgresql/*/bin) y lo apaga.
//   3. Sin ninguna de las dos, se omite diciendo por qué.
// El esquema sale de database/SQL (tipo compartido y 03_terminology: schema,
// tablas e índices; sin FKs, que no hacen falta para probar la carga).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

import { writeNdjsonGzSharded } from '../lib/exchange.mjs';
import { INTERNAL } from '../lib/load-plan.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'load-taxonomy.mjs');
const SQL = join(HERE, '..', '..', '..', '..', '..', 'database', 'SQL');

const freePort = () =>
  new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });

function pgBin() {
  const dirs = [];
  if (existsSync('/usr/lib/postgresql'))
    for (const v of readdirSync('/usr/lib/postgresql'))
      dirs.push(join('/usr/lib/postgresql', v, 'bin'));
  for (const d of [...(process.env.PATH ?? '').split(':'), ...dirs])
    if (d && existsSync(join(d, 'initdb')) && existsSync(join(d, 'pg_ctl')))
      return d;
  return null;
}

/** Devuelve { admin, stop } o { skip }. */
async function acquireServer() {
  if (process.env.DX_TEST_PG_PORT)
    return {
      conn: {
        host: process.env.DX_TEST_PG_HOST ?? '127.0.0.1',
        port: Number(process.env.DX_TEST_PG_PORT),
        user: process.env.DX_TEST_PG_USER ?? 'postgres',
      },
      stop: () => {},
    };
  if (typeof process.getuid === 'function' && process.getuid() === 0)
    return { skip: 'root no puede ejecutar initdb: defina DX_TEST_PG_PORT' };
  const bin = pgBin();
  if (!bin)
    return {
      skip: 'sin initdb/pg_ctl: defina DX_TEST_PG_PORT o instale PostgreSQL',
    };
  const dir = mkdtempSync(join(tmpdir(), 'dx-taxonomy-pg-'));
  const port = await freePort();
  execFileSync(
    join(bin, 'initdb'),
    ['-D', join(dir, 'data'), '-U', 'postgres', '--auth=trust', '-E', 'UTF8'],
    { stdio: 'ignore' },
  );
  execFileSync(
    join(bin, 'pg_ctl'),
    [
      '-D',
      join(dir, 'data'),
      '-w',
      '-o',
      `-p ${port} -k ${dir} -c listen_addresses=127.0.0.1 -c fsync=off`,
      '-l',
      join(dir, 'log'),
      'start',
    ],
    { stdio: 'ignore' },
  );
  return {
    conn: { host: '127.0.0.1', port, user: 'postgres' },
    stop: () => {
      try {
        execFileSync(
          join(bin, 'pg_ctl'),
          ['-D', join(dir, 'data'), '-m', 'immediate', 'stop'],
          { stdio: 'ignore' },
        );
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    },
  };
}

const node = (key, code, attributes, sourceVersion) => ({
  key: `fda-product-code|${code}`,
  system: 'fda-product-code',
  code,
  name: `Dispositivo ${code}`,
  definition: null,
  parent: null,
  diagnostic: true,
  branch: 'ivd',
  basis: 'cfr-ivd-part',
  attributes,
  provenance: { source: 'fda-pcd', sourceVersion, sourceRecordId: code },
  names: [`Dispositivo ${code}`],
  seenIn: ['fda-pcd'],
});

const OLD_VERSION = 'git:copia-vieja-del-pcd';
const NEW_VERSION = 'openFDA device/classification export 2026-10-21';
const OLD_ATTRS = {
  deviceClass: '3',
  regulationNumber: null,
  reviewPanel: 'MG',
};
const NEW_ATTRS = {
  deviceClass: '2',
  regulationNumber: '864.1890',
  reviewPanel: 'MG',
};

const server = await acquireServer();

test(
  'load-taxonomy: actualiza las propiedades que cambian, deja la anterior registrada y es idempotente',
  { skip: server.skip },
  async (t) => {
    const dbName = `dx_taxonomy_${process.pid}_${Date.now()}`;
    const outDir = mkdtempSync(join(tmpdir(), 'dx-taxonomy-out-'));
    const admin = new pg.Client({ ...server.conn, database: 'postgres' });
    await admin.connect();
    await admin.query(`CREATE DATABASE ${dbName}`);
    const db = new pg.Client({ ...server.conn, database: dbName });
    await db.connect();
    t.after(async () => {
      await db.end();
      await admin.query(`DROP DATABASE IF EXISTS ${dbName}`);
      await admin.end();
      rmSync(outDir, { recursive: true, force: true });
      server.stop();
    });

    for (const f of [
      '00_shared/00_types.sql',
      '03_terminology/01_schema.sql',
      '03_terminology/02_tables.sql',
      '03_terminology/04_indexes.sql',
    ])
      await db.query(readFileSync(join(SQL, f), 'utf8'));
    // Conceptos internos que la API siembra y la carga exige (assertPrerequisites).
    for (const [i, id] of Object.values(INTERNAL).entries())
      await db.query(
        `INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, created_at, updated_at, row_version)
         VALUES ($1::uuid, $1::uuid, $2, $2, now(), now(), 1)`,
        [id, `internal-${i}`],
      );

    const load = (nodes) => {
      writeNdjsonGzSharded(outDir, 'taxonomy-nodes', nodes);
      writeNdjsonGzSharded(outDir, 'taxonomy-crosswalks', []);
      const res = spawnSync(process.execPath, [SCRIPT], {
        encoding: 'utf8',
        env: {
          ...process.env,
          DX_TAXONOMY_OUT: outDir,
          DB_HOST: server.conn.host,
          DB_PORT: String(server.conn.port),
          DB_USER: server.conn.user,
          DB_NAME: dbName,
          DB_PASSWORD: '',
        },
      });
      assert.equal(res.status, 0, res.stderr || res.stdout);
      const json = res.stdout.slice(res.stdout.indexOf('=== RESUMEN'));
      return JSON.parse(json.slice(json.indexOf('{'))).result[
        'fda-product-code'
      ];
    };
    const prop = async (code, propertyCode) => {
      const { rows } = await db.query(
        `SELECT p.value_json, p.row_version FROM terminology.concept_properties p
           JOIN terminology.catalog_concepts c ON c.id = p.concept_id
          WHERE c.code = $1 AND p.property_code = $2`,
        [code, propertyCode],
      );
      return rows;
    };
    const count = async (table) =>
      Number(
        (await db.query(`SELECT count(*) FROM terminology.${table}`)).rows[0]
          .count,
      );

    // 1. Carga con la copia vieja del PCD.
    const first = load([
      node('x', 'PNK', OLD_ATTRS, OLD_VERSION),
      node('x', 'AAA', { deviceClass: '2' }, OLD_VERSION),
    ]);
    assert.equal(first.concepts, 2);
    assert.equal(first.properties, 6);
    assert.equal(
      (await prop('PNK', 'dx_device_type_attributes'))[0].value_json
        .deviceClass,
      '3',
    );

    // 2. Carga con openFDA: PNK pasa a clase 2 y regulación 864.1890.
    const conceptsBefore = await count('catalog_concepts');
    const propsBefore = await count('concept_properties');
    const second = load([
      node('x', 'PNK', NEW_ATTRS, NEW_VERSION),
      node('x', 'AAA', { deviceClass: '2' }, NEW_VERSION),
    ]);
    const attrs = await prop('PNK', 'dx_device_type_attributes');
    assert.equal(attrs.length, 1);
    assert.equal(attrs[0].value_json.deviceClass, '2');
    assert.equal(attrs[0].value_json.regulationNumber, '864.1890');
    assert.equal(attrs[0].row_version, 2);
    assert.equal(second.concepts, 0);
    assert.ok(
      second.propertiesUpdated >= 1,
      'debe informar las propiedades actualizadas',
    );

    // La versión anterior queda registrada y no se borró nada.
    const prev = await prop('PNK', 'dx_device_type_attributes_previous');
    assert.equal(prev.length, 1);
    assert.deepEqual(prev[0].value_json.value, OLD_ATTRS);
    assert.equal(prev[0].value_json.version, OLD_VERSION);
    assert.equal(prev[0].value_json.supersededByVersion, NEW_VERSION);
    assert.equal(await count('catalog_concepts'), conceptsBefore);
    assert.equal(
      await count('concept_properties'),
      propsBefore + second.propertiesPrevious + second.properties,
    );
    assert.ok(second.propertiesPrevious >= 1);
    // Lo que no cambió en la fuente no se toca.
    const untouched = await prop('PNK', 'dx_device_type_decision');
    assert.equal(untouched[0].row_version, 1);

    // 3. Misma carga otra vez: 0 en todo.
    const third = load([
      node('x', 'PNK', NEW_ATTRS, NEW_VERSION),
      node('x', 'AAA', { deviceClass: '2' }, NEW_VERSION),
    ]);
    for (const [k, v] of Object.entries(third))
      assert.equal(v, 0, `${k} debe ser 0 en la segunda corrida`);
    assert.equal(
      (await prop('PNK', 'dx_device_type_attributes'))[0].row_version,
      2,
    );
  },
);
