#!/usr/bin/env node
// =============================================================================
// Fase 2: mide cuántas relaciones del corpus resuelven contra lo que cargan las
// sesiones hermanas (`justin/seed-diseases`, `justin/seed-medical-dictionaries`,
// `justin/seed-specialty-services`). No escribe nada.
//
// Dos modos:
//   --db                  consulta `terminology.catalog_concepts` (.env DB_*) en
//                         una base donde ya corrieron los importadores hermanos
//   --keys <archivo.tsv>  lista `system<TAB>code` exportada de esas sesiones
//
// Cada sesión pudo elegir otro `internal_code` u otra forma de código (con o
// sin prefijo). `--alias mondo=MONDO,uberon=uberon-2026` traduce el sistema;
// la forma del código se prueba en las dos variantes (`MONDO:0005015` y
// `0005015`). Ninguna equivalencia se inventa: solo cambia la grafía.
//
// Uso:
//   node tools/terminology-import/procedures-treatments/validate-siblings.mjs --db
//   node tools/terminology-import/procedures-treatments/validate-siblings.mjs --keys claves.tsv --alias mondo=MONDO
// =============================================================================

import 'dotenv/config';
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { outDir, readNdjson, writeJson } from './lib/common.mjs';

const args = process.argv.slice(2);
const arg = (name) =>
  args.includes(name) ? args[args.indexOf(name) + 1] : null;
const alias = Object.fromEntries(
  (arg('--alias') ?? '')
    .split(',')
    .filter(Boolean)
    .map((p) => p.split('=')),
);

/** Variantes de grafía de un código: con y sin el prefijo de CURIE. */
export function codeVariants(code) {
  const i = code.indexOf(':');
  return i > 0 ? [code, code.slice(i + 1)] : [code];
}

async function loadKeysFromDb(systems) {
  const client = new pg.Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5433),
    user: process.env.DB_USER ?? 'mantra',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? 'mantra_redesa_health',
  });
  await client.connect();
  try {
    const { rows } = await client.query(
      `SELECT cs.internal_code AS system, cc.code FROM terminology.catalog_concepts cc
         JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
         JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
        WHERE cs.internal_code = ANY($1::text[])`,
      [systems],
    );
    return rows;
  } finally {
    await client.end();
  }
}

function loadKeysFromTsv(path) {
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      const [system, code] = l.split('\t');
      return { system, code };
    });
}

async function main() {
  const assertions = readNdjson(outDir('assertions.ndjson'));
  if (!assertions.length)
    throw new Error('Sin corpus: corra build.mjs primero.');
  const endpointSystems = new Set(
    assertions.flatMap((a) => [
      a.subject.system,
      a.object.system,
      ...(a.objectAlternates ?? []).map((x) => x.system),
    ]),
  );
  const dbSystems = [...endpointSystems].map((s) => alias[s] ?? s);
  const keys = args.includes('--keys')
    ? loadKeysFromTsv(arg('--keys'))
    : await loadKeysFromDb(dbSystems);
  const have = new Set(keys.map((k) => `${k.system}|${k.code}`));
  const has = (ref) =>
    codeVariants(ref.code).some((c) =>
      have.has(`${alias[ref.system] ?? ref.system}|${c}`),
    );

  const report = {
    generatedAt: new Date().toISOString(),
    mode: args.includes('--keys') ? 'keys' : 'db',
    alias,
    keysRead: keys.length,
    byKind: {},
  };
  for (const kind of ['procedure-disease', 'procedure-site']) {
    const list = assertions.filter((a) => a.kind === kind);
    const rels = new Map(list.map((a) => [a.relationshipId, a]));
    let resolved = 0;
    let viaMap = 0;
    const missingObjects = new Map();
    for (const a of rels.values()) {
      const sOk = has(a.subject);
      const oOk = has(a.object);
      const altOk =
        !oOk &&
        (a.objectAlternates ?? []).length === 1 &&
        has(a.objectAlternates[0]);
      if (sOk && (oOk || altOk)) {
        resolved++;
        if (altOk) viaMap++;
      } else if (!oOk && !altOk) {
        missingObjects.set(
          `${a.object.system}|${a.object.code}`,
          a.object.label ?? null,
        );
      }
    }
    report.byKind[kind] = {
      relationships: rels.size,
      resolved,
      resolvedViaPublishedSiteMap: viaMap,
      unresolved: rels.size - resolved,
      objectsWithoutConcept: missingObjects.size,
      sampleObjectsWithoutConcept: [...missingObjects].slice(0, 25),
    };
  }
  writeJson(outDir('validate-siblings.json'), report);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en validate-siblings:', err);
  process.exitCode = 1;
});
