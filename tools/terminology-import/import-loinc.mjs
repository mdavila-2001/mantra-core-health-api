#!/usr/bin/env node
// =============================================================================
// IMPORTADOR ETL: LOINC (subconjunto público vía NLM Clinical Table Search
// Service) -> terminology.catalog_concepts / concept_properties
// =============================================================================
//
// Fuente: https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search
// Sin cuenta, sin API key. Tabla pública "loinc_items" (subconjunto público
// derivado del catálogo LOINC de Regenstrief Institute / NLM), distinta de la
// licencia completa que requeriría cuenta separada.
//
// ---------------------------------------------------------------------------
// DESCUBRIMIENTO EMPÍRICO (documentado aquí porque condiciona el diseño):
//
//   1. `terms=` con `sf=LOINC_NUM` hace matching por PREFIJO (no substring):
//      terms=100 con sf=LOINC_NUM devuelve SOLO códigos que EMPIEZAN con
//      "100" (verificado: dígito '0' como prefijo -> total 0, porque ningún
//      LOINC_NUM empieza con '0'). Esto permite enumerar el espacio completo
//      de códigos vía un árbol de prefijos SIN duplicados ni huecos.
//
//   2. `maxList` tiene un tope duro de 500 (pedir más no cambia el resultado).
//
//   3. `offset` tiene un tope duro de servicio en ~7493 para valores grandes
//      (offset=7494 -> HTTP 400 "Bad request"), PERO además —y esto es más
//      grave y se descubrió sólo tras una primera corrida completa con
//      cobertura del 46.53%— el parámetro `offset` está efectivamente ROTO
//      para paginar de forma fiable: para CUALQUIER `offset >= 1` (probado
//      exhaustivamente con distintos `terms`, `sf`, `ef` y `maxList`,
//      incluso `maxList=1`), la API devuelve SIEMPRE un lote fijo de
//      aproximadamente 7 resultados, IGNORANDO el `maxList` solicitado y sin
//      continuar de forma consistente/secuencial la lista de `offset=0`. Es
//      decir: `offset=0` con `maxList=500` es fiable y devuelve hasta 500
//      resultados reales que empiezan por el prefijo pedido, pero NO hay
//      forma fiable de pedir "la página siguiente" de una consulta con más
//      de 500 resultados. Por lo tanto este importador NO usa `offset`
//      en absoluto: en vez de paginar dentro de una hoja, se subdivide el
//      árbol de prefijos recursivamente hasta que CADA hoja tenga un total
//      <= 500 (LEAF_MAX_SINGLE_PAGE), de modo que una única llamada con
//      `offset=0` la capture por completo.
//
//   4. El código LOINC_NUM tiene el formato `NNNNN-N` (dígitos, guión, un
//      dígito de verificación). Al construir el árbol de prefijos por
//      dígitos, los códigos "cortos" (p.ej. "1-8") NO son alcanzados por
//      ningún hijo NNN+dígito (el carácter tras el prefijo es '-', no un
//      dígito). Por eso, al expandir un nodo, además de los 10 hijos por
//      dígito (0-9) se consulta también `prefix + '-'` como hoja terminal
//      (captura los códigos cuya parte numérica termina exactamente ahí;
//      cuenta siempre 0 ó 1 porque el dígito de verificación es único).
//      Verificado matemáticamente: total("1") = 22089 == sum(total("1"+d)
//      para d en 0-9) [22088] + total("1-") [1].
//
//   5. IMPORTANTE — el total real del catálogo es MAYOR que el ejemplo base
//      `terms=a` (sin `sf=`) usado para validar que la API funciona. Ese
//      `terms=a` busca en campos de texto (nombres cortos/largos) que para
//      una fracción grande de códigos NO contienen la letra "a" (p.ej.
//      "Glucose", "Chloride", "Hemoglobin" no tienen 'a'... en realidad sí
//      tienen 'a' en shortname abreviado tipo "Hct", "WBC#", "pH" que no la
//      tienen). El total real, obtenido sumando las hojas del árbol de
//      prefijos sobre LOINC_NUM (que cubre TODOS los códigos sin excepción,
//      dado que sf=LOINC_NUM ancla la búsqueda al propio identificador), es
//      sustancialmente mayor (~109k en la exploración empírica previa a
//      este script, puede variar levemente con actualizaciones de NLM). Este
//      script calcula su propio total real (suma de los `total` reportados
//      por la API en cada hoja del árbol) y lo usa como referencia de
//      cobertura, en vez del número de ejemplo `terms=a`.
//
//   6. Campos extra verificados vía `ef=` (no fallan, aunque puedan venir
//      null): LOINC_NUM, SHORTNAME, LONG_COMMON_NAME, COMPONENT, PROPERTY,
//      TIME_ASPCT, SYSTEM, SCALE_TYP, METHOD_TYP, CLASS.
// ---------------------------------------------------------------------------
//
// Convención de idempotencia (igual que SQL/patches/2026-07-30_vademecum_dev_seed.sql):
//   - UUIDs deterministas: md5('mantra:loinc:...clave-unica...')::uuid,
//     calculados EN SQL (misma función md5 que usa Postgres) para garantizar
//     bit-a-bit el mismo resultado que si se hubiera escrito a mano.
//   - `ON CONFLICT ... DO NOTHING` en terminology_sources, code_systems,
//     code_system_versions y concept_properties.
//   - catalog_concepts usa `ON CONFLICT ... DO UPDATE ... WHERE ... IS
//     DISTINCT FROM ...` (ver comentario junto a insertConceptsBatch): sigue
//     siendo idempotente (una vez el dato es correcto, no se toca nada más),
//     pero además autocorrige display/definition si en algún momento se
//     insertaron con un valor incorrecto (como pasó por un bug real de
//     parseo de `ef=` en la primera corrida de este script).
//   - state_concept_id = NULL.
//
// Uso:
//   node tools/terminology-import/import-loinc.mjs
//
// Variables de entorno (mismas que test/integration/vademecum.int-spec.ts):
//   DB_HOST (default localhost), DB_PORT (default 5434), DB_USER (default
//   mantra), DB_PASSWORD, DB_NAME (default mantra_redesa_health)
// =============================================================================

import 'dotenv/config';
import pg from 'pg';

const API_BASE = 'https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search';
const EF_FIELDS = [
  'LOINC_NUM',
  'SHORTNAME',
  'LONG_COMMON_NAME',
  'COMPONENT',
  'PROPERTY',
  'TIME_ASPCT',
  'SYSTEM',
  'SCALE_TYP',
  'METHOD_TYP',
  'CLASS',
];

const PAGE_SIZE = 500; // tope duro observado de maxList
// `offset` no es fiable (ver nota arriba): cada hoja debe resolverse en una
// única llamada offset=0, así que el umbral de hoja es el propio maxList.
const LEAF_MAX_SINGLE_PAGE = PAGE_SIZE;
const MAX_DEPTH = 12; // profundidad máxima defensiva del árbol de prefijos (el código LOINC_NUM real nunca pasa de ~8 caracteres, así que esto nunca debería alcanzarse)
const MIN_REQUEST_INTERVAL_MS = 130; // buen ciudadano de la API pública
const MAX_RETRIES = 6;

const SOURCE_CODE = 'LOINC';
const CODE_SYSTEM_INTERNAL_CODE = 'loinc';
const CODE_SYSTEM_VERSION = '2026.1';

// -----------------------------------------------------------------------------
// Cliente HTTP con rate limiting + reintentos con backoff (429 / 5xx)
// -----------------------------------------------------------------------------
let lastRequestAt = 0;
let httpCalls = 0;

async function throttle() {
  const now = Date.now();
  const wait = lastRequestAt + MIN_REQUEST_INTERVAL_MS - now;
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  let attempt = 0;
  for (;;) {
    await throttle();
    httpCalls += 1;
    let res;
    try {
      res = await fetch(url);
    } catch (err) {
      attempt += 1;
      if (attempt > MAX_RETRIES) throw new Error(`Fallo de red tras ${MAX_RETRIES} reintentos: ${err.message}`);
      const backoff = Math.min(500 * 2 ** attempt, 15000);
      await sleep(backoff);
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      attempt += 1;
      if (attempt > MAX_RETRIES) {
        throw new Error(`HTTP ${res.status} tras ${MAX_RETRIES} reintentos para ${url}`);
      }
      const backoff = Math.min(500 * 2 ** attempt, 15000);
      await sleep(backoff);
      continue;
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} inesperado para ${url}: ${await res.text()}`);
    }
    return res.json();
  }
}

function buildUrl(prefix, offset) {
  const params = new URLSearchParams({
    terms: prefix,
    sf: 'LOINC_NUM',
    ef: EF_FIELDS.join(','),
    maxList: String(PAGE_SIZE),
    offset: String(offset),
  });
  return `${API_BASE}?${params.toString()}`;
}

// -----------------------------------------------------------------------------
// Crawler: árbol de prefijos sobre LOINC_NUM
// -----------------------------------------------------------------------------
const seen = new Map(); // code -> record
let sumOfLeafTotals = 0; // "total real" derivado, suma de los `total` de cada hoja
let leavesVisited = 0;
let branchesExpanded = 0;

function ingestPage(json) {
  // Forma de la respuesta CUANDO se pasa `ef=`: [total, codes, efObject, displayList].
  // (Sin `ef=` sería [total, codes, null, displayPairs] — pero este importador
  // siempre pide `ef=`, así que el objeto de campos extra va en el índice 2,
  // no en el 3. Verificado empíricamente contra la API real.)
  const [, codes, ef] = json;
  if (!codes || codes.length === 0) return;
  for (let i = 0; i < codes.length; i += 1) {
    const code = codes[i];
    if (seen.has(code)) continue; // dedup (ramas terminales '-' pueden solaparse en teoría con 0 coste)
    seen.set(code, {
      code,
      shortname: ef.SHORTNAME?.[i] ?? null,
      long_common_name: ef.LONG_COMMON_NAME?.[i] ?? null,
      component: ef.COMPONENT?.[i] ?? null,
      property: ef.PROPERTY?.[i] ?? null,
      time_aspct: ef.TIME_ASPCT?.[i] ?? null,
      system: ef.SYSTEM?.[i] ?? null,
      scale_typ: ef.SCALE_TYP?.[i] ?? null,
      method_typ: ef.METHOD_TYP?.[i] ?? null,
      class: ef.CLASS?.[i] ?? null,
    });
  }
}

async function crawl(prefix, depth) {
  const page = await fetchJson(buildUrl(prefix, 0));
  const total = page[0];
  if (total === 0) return;

  if (total <= LEAF_MAX_SINGLE_PAGE || depth >= MAX_DEPTH) {
    if (depth >= MAX_DEPTH && total > LEAF_MAX_SINGLE_PAGE) {
      console.warn(
        `[WARN] prefijo "${prefix}" excede LEAF_MAX_SINGLE_PAGE (${total}) en profundidad máxima ${MAX_DEPTH}; sólo se capturan los primeros ${PAGE_SIZE} (pérdida de cobertura localizada, no debería ocurrir con LOINC_NUM real).`,
      );
    }
    leavesVisited += 1;
    sumOfLeafTotals += total;
    // Nota: NO se pagina con `offset` (ver cabecera del archivo: offset>=1 no
    // es fiable en esta API). Cada hoja se resuelve en una única llamada
    // offset=0 porque su total ya cabe en una página (<= LEAF_MAX_SINGLE_PAGE).
    ingestPage(page);
    if (leavesVisited % 50 === 0) {
      console.log(
        `[crawl] hojas=${leavesVisited} ramas=${branchesExpanded} códigos únicos=${seen.size} llamadas HTTP=${httpCalls} (último prefijo hoja: "${prefix}", total=${total})`,
      );
    }
    return;
  }

  // Total > una página: la hoja no es fiable vía offset, así que se subdivide
  // el árbol de prefijos en vez de paginar. Los datos de `page` (primeros
  // ${PAGE_SIZE}) se descartan aquí a propósito: se recapturan completos y
  // correctamente particionados por los hijos.
  branchesExpanded += 1;
  for (const d of '0123456789') {
    await crawl(prefix + d, depth + 1);
  }
  // rama terminal: códigos cuya parte numérica termina exactamente en `prefix`
  await crawl(`${prefix}-`, depth + 1);
}

async function crawlAll() {
  console.log('[crawl] iniciando enumeración exhaustiva del espacio de códigos LOINC_NUM...');
  for (const d of '0123456789') {
    await crawl(d, 1);
  }
  console.log(
    `[crawl] completo. códigos únicos=${seen.size} · suma de totales de hoja (API)=${sumOfLeafTotals} · hojas=${leavesVisited} · ramas expandidas=${branchesExpanded} · llamadas HTTP=${httpCalls}`,
  );
}

// -----------------------------------------------------------------------------
// Escritura a la base de datos (batches parametrizados vía `pg`)
// -----------------------------------------------------------------------------
const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

const PROPERTY_FIELDS = [
  ['component', 'component'],
  ['property', 'property'],
  ['time_aspct', 'time_aspct'],
  ['system', 'system'],
  ['scale_typ', 'scale_typ'],
  ['method_typ', 'method_typ'],
  ['class', 'class'],
];

async function upsertSourceAndVersion(db) {
  await db.query(
    `INSERT INTO terminology.terminology_sources
       (id, code, name, owner, official_url, license, created_at, updated_at, row_version)
     VALUES
       (md5('mantra:loinc:source:' || $1)::uuid, $1, $2, $3, $4, $5, now(), now(), 1)
     ON CONFLICT (code) DO NOTHING`,
    [
      SOURCE_CODE,
      'LOINC (public subset via NLM Clinical Table Search Service)',
      'Regenstrief Institute / U.S. National Library of Medicine',
      'https://loinc.org/',
      'LOINC license (public search subset, no account required for this endpoint)',
    ],
  );

  await db.query(
    `INSERT INTO terminology.code_systems
       (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition,
        created_at, updated_at, row_version)
     SELECT md5('mantra:loinc:cs:' || $1)::uuid, ts.id, $1, $2, $3, true, false, now(), now(), 1
     FROM terminology.terminology_sources ts
     WHERE ts.code = $4
     ON CONFLICT (internal_code) DO NOTHING`,
    [CODE_SYSTEM_INTERNAL_CODE, 'LOINC', 'http://loinc.org', SOURCE_CODE],
  );

  await db.query(
    `INSERT INTO terminology.code_system_versions
       (id, code_system_id, version, published_at, is_default, created_at, updated_at, row_version)
     SELECT md5('mantra:loinc:csv:' || $1)::uuid, cs.id, $1, now(), true, now(), now(), 1
     FROM terminology.code_systems cs
     WHERE cs.internal_code = $2
     ON CONFLICT (code_system_id, version) DO NOTHING`,
    [CODE_SYSTEM_VERSION, CODE_SYSTEM_INTERNAL_CODE],
  );

  const { rows } = await db.query(
    `SELECT csv.id
     FROM terminology.code_system_versions csv
     JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
     WHERE cs.internal_code = $1 AND csv.version = $2`,
    [CODE_SYSTEM_INTERNAL_CODE, CODE_SYSTEM_VERSION],
  );
  if (rows.length !== 1) {
    throw new Error(`No se pudo resolver code_system_version_id para ${CODE_SYSTEM_INTERNAL_CODE}/${CODE_SYSTEM_VERSION}`);
  }
  return rows[0].id;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function insertConceptsBatch(db, csvId, records) {
  if (records.length === 0) return 0;
  const params = [csvId];
  const valueRows = records.map((r) => {
    const codeIdx = params.push(r.code);
    const displayIdx = params.push(r.shortname && r.shortname.length > 0 ? r.shortname : r.code);
    const definitionIdx = params.push(r.long_common_name ?? null);
    return `(md5('mantra:loinc:concept:' || $${codeIdx})::uuid, $1, $${codeIdx}, $${displayIdx}, $${definitionIdx}, false, true, NULL, now(), now(), 1)`;
  });
  // NOTA: se usa DO UPDATE (condicionado a que el dato realmente cambie) en
  // lugar de DO NOTHING puro. Motivo: una corrida anterior de este mismo
  // script tenía un bug de parseo de la respuesta de la API (el objeto de
  // campos extra `ef` quedaba mal indexado) que hizo que 109,325 filas se
  // insertaran con `display = code` en vez del SHORTNAME real. Este UPDATE
  // condicional autocorrige esas filas la próxima vez que se corra el
  // importador ya arreglado, sin necesitar un DELETE masivo (que además
  // tumbó el contenedor de Postgres por OOM al intentarlo sobre 109k filas
  // con joins). Sigue siendo idempotente en el sentido que importa: una vez
  // que los datos están correctos, `IS DISTINCT FROM` hace que no se toque
  // ninguna fila en corridas posteriores (rowCount = 0), igual que con DO
  // NOTHING.
  const sql = `INSERT INTO terminology.catalog_concepts
      (id, code_system_version_id, code, display, definition, abstract, selectable, state_concept_id,
       created_at, updated_at, row_version)
    VALUES ${valueRows.join(',')}
    ON CONFLICT (code_system_version_id, code) DO UPDATE SET
      display = EXCLUDED.display,
      definition = EXCLUDED.definition,
      updated_at = now()
    WHERE terminology.catalog_concepts.display IS DISTINCT FROM EXCLUDED.display
       OR terminology.catalog_concepts.definition IS DISTINCT FROM EXCLUDED.definition`;
  const res = await db.query(sql, params);
  return res.rowCount ?? 0;
}

async function insertPropertiesBatch(db, rows) {
  if (rows.length === 0) return 0;
  const params = [];
  const valueRows = rows.map((r) => {
    const codeIdx = params.push(r.code);
    const propIdx = params.push(r.propertyCode);
    const valueIdx = params.push(JSON.stringify(r.value));
    return `(md5('mantra:loinc:property:' || $${codeIdx} || ':' || $${propIdx})::uuid,
              md5('mantra:loinc:concept:' || $${codeIdx})::uuid,
              $${propIdx}, 'json'::terminology.technical_data_type, $${valueIdx}::jsonb, now(), now(), 1)`;
  });
  const sql = `INSERT INTO terminology.concept_properties
      (id, concept_id, property_code, data_type, value_json, created_at, updated_at, row_version)
    VALUES ${valueRows.join(',')}
    ON CONFLICT (id) DO NOTHING`;
  const res = await db.query(sql, params);
  return res.rowCount ?? 0;
}

async function writeToDatabase(db, csvId) {
  const allRecords = Array.from(seen.values());
  const conceptChunks = chunk(allRecords, 500);

  let conceptsInserted = 0;
  for (const [i, batch] of conceptChunks.entries()) {
    conceptsInserted += await insertConceptsBatch(db, csvId, batch);
    if ((i + 1) % 20 === 0 || i === conceptChunks.length - 1) {
      console.log(`[db] catalog_concepts: batch ${i + 1}/${conceptChunks.length} (insertadas hasta ahora: ${conceptsInserted})`);
    }
  }

  // Propiedades: aplanar (code, propertyCode, value) sólo para valores no nulos/no vacíos.
  const propertyRows = [];
  for (const r of allRecords) {
    for (const [attr, propertyCode] of PROPERTY_FIELDS) {
      const value = r[attr];
      if (value === null || value === undefined) continue;
      if (typeof value === 'string' && value.trim() === '') continue;
      propertyRows.push({ code: r.code, propertyCode, value });
    }
  }
  const propertyChunks = chunk(propertyRows, 500);
  let propertiesInserted = 0;
  for (const [i, batch] of propertyChunks.entries()) {
    propertiesInserted += await insertPropertiesBatch(db, batch);
    if ((i + 1) % 20 === 0 || i === propertyChunks.length - 1) {
      console.log(`[db] concept_properties: batch ${i + 1}/${propertyChunks.length} (insertadas hasta ahora: ${propertiesInserted})`);
    }
  }

  return { conceptsInserted, propertiesInserted, totalCandidateConcepts: allRecords.length, totalCandidateProperties: propertyRows.length };
}

// -----------------------------------------------------------------------------
// main
// -----------------------------------------------------------------------------
async function main() {
  const startedAt = Date.now();

  await crawlAll();

  const db = new pg.Client(DB_CONFIG);
  await db.connect();
  try {
    console.log('[db] upsert de terminology_sources / code_systems / code_system_versions...');
    const csvId = await upsertSourceAndVersion(db);
    console.log(`[db] code_system_version_id = ${csvId}`);

    console.log('[db] insertando catalog_concepts + concept_properties en batches...');
    const result = await writeToDatabase(db, csvId);

    const { rows: countRows } = await db.query(
      `SELECT count(*)::int AS n
       FROM terminology.catalog_concepts cc
       JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
       JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
       WHERE cs.internal_code = $1`,
      [CODE_SYSTEM_INTERNAL_CODE],
    );
    const dbCount = countRows[0].n;

    const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
    const coveragePct = ((dbCount / sumOfLeafTotals) * 100).toFixed(2);

    console.log('');
    console.log('==================== RESUMEN IMPORTACIÓN LOINC ====================');
    console.log(`Códigos únicos enumerados vía API (árbol de prefijos): ${seen.size}`);
    console.log(`Suma de totales reportados por la API en cada hoja del árbol: ${sumOfLeafTotals}`);
    console.log(`Candidatos a insertar (concept rows preparados): ${result.totalCandidateConcepts}`);
    console.log(`Filas nuevas o corregidas en catalog_concepts esta corrida (insert + update condicional): ${result.conceptsInserted}`);
    console.log(`Filas realmente insertadas en concept_properties (nuevas esta corrida): ${result.propertiesInserted}`);
    console.log(`Total actual en DB para code_system='loinc': ${dbCount}`);
    console.log(`Cobertura vs. total real derivado del árbol de prefijos: ${coveragePct}%`);
    console.log(`Llamadas HTTP realizadas: ${httpCalls}`);
    console.log(`Tiempo total: ${elapsedSec}s`);
    console.log('====================================================================');
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exitCode = 1;
});
