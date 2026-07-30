#!/usr/bin/env node
// =============================================================================
// IMPORTADOR ETL: RxNorm COMPLETO (todos los TTY) -> terminology.*
// =============================================================================
//
// Importa el catálogo COMPLETO de RxNorm (no el subconjunto curado RxTerms,
// que ya vive por separado bajo code_systems.internal_code='rxterms' y NO se
// toca aquí) usando la API pública gratuita RxNav REST de la U.S. National
// Library of Medicine. No requiere cuenta ni API key (a diferencia de la
// descarga RRF completa, que sí requiere licencia UMLS).
//
//   Docs: https://rxnav.nlm.nih.gov/RxNormAPIREST.html
//   Endpoint usado: GET /REST/allconcepts.json?tty=<TTY>
//     -> {"minConceptGroup":{"minConcept":[{"rxcui","name","tty"}, ...]}}
//     -> Una sola respuesta trae TODOS los conceptos de ese TTY (no pagina).
//
// -----------------------------------------------------------------------------
// Metodología de enumeración (validada empíricamente antes de escribir este
// script, con `curl` contra la API en vivo, una petición por TTY):
//
//   TTY    conceptos devueltos (medición real, ver reporte de la tarea)
//   IN     14,648   PIN   3,643   MIN    3,841   DF     126    DFG      44
//   SCDC   14,352   SCDF  7,926   SCDG   8,929    SCD  17,552
//   SBDC    8,545   SBDF  6,117   SBDG   8,255    SBD   9,696
//   BN      5,110   BPCK    740   GPCK    653
//
//   Los 16 TTY estándar de RxNorm listados en la tarea respondieron TODOS con
//   datos (ninguno vacío/inexistente en la versión actual de RxNorm servida
//   por RxNav), así que se cubren los 16 sin necesidad de ajustar la lista.
//   El tamaño de respuesta máximo observado fue ~1.66 MB (tty=SCD, 17,552
//   conceptos) — bien dentro de lo que `res.text()` + `JSON.parse` de Node
//   maneja sin problema; no hace falta un parser JSON en streaming.
//
//   Deduplicación: por RXCUI GLOBAL a través de TODOS los TTY (un mismo RXCUI
//   normalmente pertenece a un único TTY primario en RxNorm, pero por
//   robustez se deduplica igual: si un RXCUI ya fue visto bajo un TTY previo,
//   la segunda aparición se descarta y se cuenta como colisión para reporte,
//   sin sobrescribir el primero).
//
// -----------------------------------------------------------------------------
// Modelo de datos de destino (terminology.*, ver SQL/03_terminology):
//
//   * REUSA terminology_sources code='RXNORM' (creado por el seed de
//     vademécum / el importador de rxterms) — se hace SELECT de su id, NUNCA
//     se crea una fuente duplicada.
//   * Crea/reutiliza 1 code_systems (internal_code='rxnorm_full'), DISTINTO
//     del 'rxterms' ya existente — catálogo separado, sin pisar aquel.
//   * Crea/reutiliza 1 code_system_versions (version='YYYY.MM' del día de
//     ejecución, is_default=true).
//   * Un catalog_concepts POR CADA RXCUI único: code=RXCUI, display=name
//     literal devuelto por la API (el "RxNorm Name" oficial de ese concepto).
//   * concept_properties (data_type='json'): 'term_type' con el TTY (p. ej.
//     "IN", "SCD", "SBD"...) como value_json de tipo string.
//
// Namespace de UUIDs deterministas: 'mantra:rxnorm_full:...' — DISTINTO del
// namespace 'mantra:rxterms:...' usado por import-rxterms.mjs, para que
// ambos catálogos coexistan sin colisión de ids.
//
// Idempotencia: todos los IDs son deterministas
// (md5('mantra:rxnorm_full:...clave...')::uuid) y todos los INSERT usan
// ON CONFLICT DO NOTHING. Volver a ejecutar el script no duplica filas.
// =============================================================================

import 'dotenv/config';
import pg from 'pg';

// -----------------------------------------------------------------------------
// Configuración
// -----------------------------------------------------------------------------
const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

const API_BASE = 'https://rxnav.nlm.nih.gov/REST/allconcepts.json';

// Los 16 TTY estándar de RxNorm pedidos en la tarea, TODOS validados
// empíricamente con datos no vacíos antes de codificar este script (ver
// tabla de conteos arriba).
const TERM_TYPES = [
  'IN', 'PIN', 'MIN', 'DF', 'DFG',
  'SCDC', 'SCDF', 'SCDG', 'SCD',
  'SBDC', 'SBDF', 'SBDG', 'SBD',
  'BN', 'BPCK', 'GPCK',
];

const REQUEST_DELAY_MS = 150; // buen-ciudadano de la API pública gratuita
const MAX_RETRIES = 6;
const DB_BATCH_SIZE = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function currentVersionTag() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${yyyy}.${mm}`;
}

// -----------------------------------------------------------------------------
// Cliente HTTP con reintentos y backoff exponencial
// -----------------------------------------------------------------------------
async function fetchAllConcepts(tty) {
  const url = new URL(API_BASE);
  url.searchParams.set('tty', tty);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let res;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(60000) });
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      const backoff = Math.min(1000 * 2 ** attempt, 15000);
      console.warn(`  [retry ${attempt}/${MAX_RETRIES}] error de red tty="${tty}": ${err.message}; esperando ${backoff}ms`);
      await sleep(backoff);
      continue;
    }

    if (res.status === 429 || res.status >= 500) {
      if (attempt === MAX_RETRIES) {
        throw new Error(`HTTP ${res.status} tras ${MAX_RETRIES} reintentos para tty="${tty}"`);
      }
      const backoff = Math.min(1000 * 2 ** attempt, 15000);
      console.warn(`  [retry ${attempt}/${MAX_RETRIES}] HTTP ${res.status} tty="${tty}"; esperando ${backoff}ms`);
      await sleep(backoff);
      continue;
    }

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} para tty="${tty}": ${text.slice(0, 200)}`);
    }
    let json;
    try {
      json = JSON.parse(text);
    } catch (err) {
      throw new Error(`JSON inválido para tty="${tty}": ${err.message}`);
    }
    return json;
  }
  throw new Error('unreachable');
}

// -----------------------------------------------------------------------------
// Enumeración sistemática: 1 request por TTY, dedup global por RXCUI
// -----------------------------------------------------------------------------
async function enumerateAllConcepts() {
  const conceptsByRxcui = new Map();
  let requestCount = 0;
  let collisionCount = 0;
  const perTtyCount = {};
  let firstSamplePrinted = false;

  for (const tty of TERM_TYPES) {
    const json = await fetchAllConcepts(tty);
    requestCount++;
    await sleep(REQUEST_DELAY_MS);

    const minConcepts = json?.minConceptGroup?.minConcept ?? [];
    perTtyCount[tty] = minConcepts.length;
    console.log(`  tty="${tty}": ${minConcepts.length} conceptos devueltos por la API`);

    if (!firstSamplePrinted && minConcepts.length > 0) {
      console.log('  --- muestra de validación de parseo (3 registros) ---');
      for (const sample of minConcepts.slice(0, 3)) {
        console.log(`    rxcui=${sample.rxcui} tty=${sample.tty} name="${sample.name}"`);
      }
      console.log('  ------------------------------------------------------');
      firstSamplePrinted = true;
    }

    let newInTty = 0;
    for (const c of minConcepts) {
      const rxcui = c?.rxcui;
      const name = c?.name;
      if (!rxcui || !name) continue;
      if (conceptsByRxcui.has(rxcui)) {
        collisionCount++;
        continue;
      }
      conceptsByRxcui.set(rxcui, { rxcui, name, tty: c.tty || tty });
      newInTty++;
    }
    console.log(`    +${newInTty} RXCUIs nuevos (acumulado global: ${conceptsByRxcui.size})`);
  }

  console.log(`\nSolicitudes HTTP totales a la API: ${requestCount}`);
  if (collisionCount > 0) {
    console.warn(`Aviso: ${collisionCount} RXCUIs aparecieron repetidos entre TTYs distintos (se conservó la primera aparición, según orden de TERM_TYPES).`);
  }
  return { conceptsByRxcui, perTtyCount };
}

// -----------------------------------------------------------------------------
// Preparación de filas destino + inserts en batch
// -----------------------------------------------------------------------------
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function resolveRxnormSource(client) {
  const { rows } = await client.query(`SELECT id FROM terminology.terminology_sources WHERE code = 'RXNORM'`);
  if (rows.length === 0) {
    throw new Error(
      "No existe terminology.terminology_sources con code='RXNORM'. Se esperaba que ya existiera (creado por el seed de vademécum o por import-rxterms.mjs). Este importador NO crea la fuente para evitar duplicados.",
    );
  }
  return rows[0].id;
}

async function ensureCodeSystem(client, sourceId) {
  await client.query(
    `
    INSERT INTO terminology.code_systems
      (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition, created_at, updated_at, row_version)
    VALUES
      (md5('mantra:rxnorm_full:cs:rxnorm_full')::uuid, $1, 'rxnorm_full',
       'RxNorm (complete, all term types, via RxNav public API)',
       'https://rxnav.nlm.nih.gov/REST/allconcepts',
       false, false, now(), now(), 1)
    ON CONFLICT (internal_code) DO NOTHING
  `,
    [sourceId],
  );
  const { rows } = await client.query(`SELECT id FROM terminology.code_systems WHERE internal_code = 'rxnorm_full'`);
  if (rows.length === 0) throw new Error('No se pudo resolver code_systems internal_code=rxnorm_full');
  return rows[0].id;
}

async function ensureCodeSystemVersion(client, codeSystemId, version) {
  await client.query(
    `
    INSERT INTO terminology.code_system_versions
      (id, code_system_id, version, published_at, is_default, created_at, updated_at, row_version)
    VALUES
      (md5('mantra:rxnorm_full:csv:' || $2)::uuid, $1, $2, now(), true, now(), now(), 1)
    ON CONFLICT (code_system_id, version) DO NOTHING
  `,
    [codeSystemId, version],
  );
  const { rows } = await client.query(
    `SELECT id FROM terminology.code_system_versions WHERE code_system_id = $1 AND version = $2`,
    [codeSystemId, version],
  );
  if (rows.length === 0) throw new Error('No se pudo resolver code_system_versions');
  return rows[0].id;
}

async function insertConceptsBatch(client, csvId, batch) {
  const res = await client.query(
    `
    INSERT INTO terminology.catalog_concepts
      (id, code_system_version_id, code, display, definition, abstract, selectable, state_concept_id, created_at, updated_at, row_version)
    SELECT md5('mantra:rxnorm_full:concept:' || x.rxcui)::uuid,
           $1::uuid, x.rxcui, x.display, NULL, false, true, NULL, now(), now(), 1
    FROM unnest($2::text[], $3::text[]) AS x(rxcui, display)
    ON CONFLICT (code_system_version_id, code) DO NOTHING
  `,
    [csvId, batch.map((b) => b.rxcui), batch.map((b) => b.name)],
  );
  return res.rowCount ?? 0;
}

async function insertPropertiesBatch(client, batch) {
  const res = await client.query(
    `
    INSERT INTO terminology.concept_properties
      (id, concept_id, property_code, data_type, value_json, created_at, updated_at, row_version)
    SELECT md5('mantra:rxnorm_full:property:' || x.rxcui || ':term_type')::uuid,
           md5('mantra:rxnorm_full:concept:' || x.rxcui)::uuid,
           'term_type', 'json'::terminology.technical_data_type, x.value_json::jsonb,
           now(), now(), 1
    FROM unnest($1::text[], $2::text[]) AS x(rxcui, value_json)
    ON CONFLICT (id) DO NOTHING
  `,
    [batch.map((p) => p.rxcui), batch.map((p) => JSON.stringify(p.tty))],
  );
  return res.rowCount ?? 0;
}

// -----------------------------------------------------------------------------
// main
// -----------------------------------------------------------------------------
async function main() {
  console.log('=== Importador RxNorm COMPLETO (RxNav REST) -> terminology.* ===\n');
  console.log('1) Enumerando conceptos vía la API pública RxNav de NLM (1 request por TTY)...\n');

  const { conceptsByRxcui, perTtyCount } = await enumerateAllConcepts();
  console.log(`\nTotal de RXCUIs únicos descubiertos (dedup global): ${conceptsByRxcui.size}\n`);

  const concepts = Array.from(conceptsByRxcui.values());

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    console.log('2) Resolviendo source/code_system/version...');
    const sourceId = await resolveRxnormSource(client);
    const codeSystemId = await ensureCodeSystem(client, sourceId);
    const version = currentVersionTag();
    const csvId = await ensureCodeSystemVersion(client, codeSystemId, version);
    console.log(`   source_id=${sourceId} code_system_id=${codeSystemId} code_system_version_id=${csvId} version=${version}\n`);

    console.log('3) Insertando catalog_concepts en batches...');
    let insertedConcepts = 0;
    for (const batch of chunk(concepts, DB_BATCH_SIZE)) {
      insertedConcepts += await insertConceptsBatch(client, csvId, batch);
    }
    console.log(`   ${insertedConcepts} conceptos nuevos insertados (de ${concepts.length} considerados).\n`);

    console.log('4) Insertando concept_properties (term_type) en batches...');
    let insertedProperties = 0;
    for (const batch of chunk(concepts, DB_BATCH_SIZE)) {
      insertedProperties += await insertPropertiesBatch(client, batch);
    }
    console.log(`   ${insertedProperties} propiedades nuevas insertadas (de ${concepts.length} consideradas).\n`);

    console.log('=== Resumen ===');
    console.log('Conteo por TTY devuelto por la API (antes de dedup):');
    for (const tty of TERM_TYPES) {
      console.log(`  ${tty}: ${perTtyCount[tty]}`);
    }
    console.log(`\nRXCUIs únicos descubiertos:      ${conceptsByRxcui.size}`);
    console.log(`catalog_concepts nuevos:          ${insertedConcepts}`);
    console.log(`concept_properties nuevas:        ${insertedProperties}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('\nERROR FATAL:', err);
  process.exitCode = 1;
});
