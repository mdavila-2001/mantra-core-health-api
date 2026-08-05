// =============================================================================
// ETL: Importador REAL del catálogo HCPCS Level II (CMS / NLM Clinical Table
// Search Service) hacia terminology.catalog_concepts.
// =============================================================================
//
// Fuente: https://clinicaltables.nlm.nih.gov/api/hcpcs/v3/search (API pública,
// sin cuenta ni API key, misma familia NLM Clinical Table Search Service que
// ICD-10-CM/LOINC/RxTerms en este repo). Formato de respuesta:
//   [totalCount, [codes...], null, [[code, name], ...]]
//
// HCPCS Level II es el catálogo de códigos de procedimientos, insumos,
// equipo médico duradero y servicios NO cubiertos por CPT (que es propiedad
// de la AMA y no está disponible públicamente). Es intrínsecamente pequeño
// comparado con ICD-10-CM: el total real reportado por la API es 8893
// (confirmado empíricamente antes de escribir este script). NO se debe
// esperar ni inflar un conteo mayor — esa es la escala real de la fuente.
//
// Comportamiento REAL de /api/hcpcs/v3/search verificado empíricamente
// (no asumido a partir de ICD-10-CM, aunque resultó ser análogo):
//   * `maxList` está capado por el servidor en 500 (probado hasta 2000,
//     igual que ICD-10-CM).
//   * Con `offset=0` la API respeta `maxList` y devuelve hasta 500 filas.
//   * Con `offset>0` la API IGNORA `maxList` y devuelve como máximo 7 filas,
//     igual que ICD-10-CM — por lo tanto la paginación por `offset` es
//     inútil aquí también y se usa la misma estrategia de partición
//     recursiva por prefijo de código.
//   * `terms=` con `sf=code` filtra por PREFIJO del código (no substring):
//     se confirmó que `terms=9` (un dígito solo) da 0 resultados porque
//     ningún código HCPCS Level II empieza con un dígito.
//   * IMPORTANTE — duplicados internos de la fuente: la tabla subyacente
//     tiene, para un subconjunto de códigos, DOS filas físicas con el mismo
//     código (verificado con B4185, B9998, B9999 dentro del prefijo "B":
//     total=54 pero sólo 51 códigos únicos). El campo `name`/`display` por
//     defecto (`df` no especificado) es ambiguo entre esas dos filas: una
//     trae la descripción CORTA ("Pn soln nos 10 grams lipids") y la otra la
//     descripción LARGA/oficial ("Parenteral nutrition solution, not
//     otherwise specified, 10 grams lipids"). Se resuelve pidiendo
//     explícitamente `df=code,long_desc`: ambas filas duplicadas devuelven
//     entonces el MISMO `long_desc` (verificado), así que el `Map` de
//     deduplicación por código converge al mismo valor sin importar cuál
//     fila se procese primero o última. El total reportado por la API
//     (8893) por lo tanto incluye estas filas físicamente duplicadas; el
//     conteo de códigos ÚNICOS real será algo menor que 8893 — no es un
//     fallo del importador, es un artefacto de la tabla fuente de NLM.
//   * Sumando el conteo (`total`) de cada letra inicial A-Z por separado
//     (`terms=A`, `terms=B`, ...) da exactamente 8893 — el total reportado
//     por la API sin filtro — confirmando que la partición por letra
//     inicial cubre el 100% del espacio de códigos sin solapamientos ni
//     huecos.
//   * Todos los códigos observados (muestra de 500 vía `terms=` sin filtro)
//     tienen longitud fija de 5 caracteres: 1 letra + 4 dígitos (p. ej.
//     "A0021", "G9001"). Esto es consistente con la gramática pública
//     conocida de HCPCS Level II. Algunas letras raíz superan el cap de 500
//     (ej. G=2020, J=1270, L=953, A=889, C=623, E=681, Q=655, S=553) y se
//     subdividen agregando dígitos; se verificó con G (2020) que la suma de
//     sus 10 subdivisiones por dígito (G0..G9) da exactamente 2020, y que la
//     subdivisión de G9 (887, aún > 500) en G90..G99 da exactamente 887.
//   * Por robustez ante excepciones no vistas en la muestra (igual que el
//     importador de ICD-10-CM encontró categorías alfanuméricas inesperadas
//     en producción), la recursión usa el alfabeto alfanumérico completo
//     (dígitos + letras) en vez de asumir "sólo dígitos" tras la letra
//     inicial — el costo extra son unas pocas llamadas HTTP que devuelven 0
//     resultados, no un riesgo de cobertura.
//
// Estrategia de enumeración (sin usar nunca `offset>0`, que es inútil):
//   1. 26 llamadas raíz, una por letra inicial (A-Z).
//   2. Si el total de un prefijo es 0 → no existe, se descarta.
//   3. Si el total de un prefijo es <=500 → la respuesta de esa llamada YA
//      contiene el bucket completo (offset=0 respeta maxList=500), se
//      insertan esos códigos y no se recursa más.
//   4. Si el total supera 500 → se subdivide agregando un carácter más
//      (alfanumérico) al prefijo y se repite el proceso.
//
// Idempotencia: UUIDs deterministas `md5('mantra:hcpcs:...')::uuid` +
// `ON CONFLICT DO NOTHING` en todas las inserciones, siguiendo el mismo
// patrón que `SQL/patches/2026-07-30_vademecum_dev_seed.sql` y
// `tools/terminology-import/import-icd10cm.mjs`.
// =============================================================================

import 'dotenv/config';
import pg from 'pg';

const NLM_SEARCH_URL = 'https://clinicaltables.nlm.nih.gov/api/hcpcs/v3/search';
const REQUEST_DELAY_MS = 130; // buen ciudadano de la API pública
const MAX_RETRIES = 6;
const MAX_LIST = 500; // cap real del servidor (verificado empíricamente)
const BATCH_SIZE = 500; // filas por INSERT multi-VALUES

const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

const DIGITS = '0123456789'.split('');
const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ALNUM = DIGITS.concat(ALL_LETTERS);
// Permite restringir el conjunto de letras raíz vía env var, únicamente para
// pruebas de humo rápidas del pipeline (por defecto corre las 26 letras).
const LETTERS = process.env.HCPCS_TEST_LETTERS
  ? process.env.HCPCS_TEST_LETTERS.split(',').map((s) => s.trim().toUpperCase())
  : ALL_LETTERS;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let apiCallCount = 0;
let retryCount = 0;

/**
 * Llama a la API de NLM para un prefijo dado, con reintentos/backoff.
 *
 * Pide EXPLÍCITAMENTE `short_desc` (vía `df`) y `long_desc` (vía `ef`), no la
 * columna ambigua `name`/`display` por defecto. Se descubrió empíricamente
 * (corrida real contra la DB) que un subconjunto de códigos HCPCS 2024-2026
 * nuevos (p. ej. G0019 "Community health integration services...") tienen
 * `long_desc` de HASTA 3398 CARACTERES — muy por encima del límite físico de
 * un índice btree de Postgres (~2704 bytes, 1/3 de página), lo que hace
 * fallar el INSERT/UPDATE con "index row size exceeds btree version 4
 * maximum" si se usa como `display` (columna indexada). CMS garantiza que
 * `short_desc` cabe siempre en 28 caracteres (es el campo usado en
 * reclamaciones/facturación), así que se usa como `display` (columna
 * indexada, corta) y `long_desc` como `definition` (columna `text`, sin
 * índice btree, sin límite práctico de tamaño).
 */
async function apiCall(prefix) {
  const url = `${NLM_SEARCH_URL}?sf=code&df=code,short_desc&ef=long_desc&terms=${encodeURIComponent(prefix)}&maxList=${MAX_LIST}&offset=0`;
  let attempt = 0;
  for (;;) {
    attempt++;
    let res;
    try {
      res = await fetch(url);
    } catch (err) {
      if (attempt > MAX_RETRIES) {
        throw new Error(`Fallo de red tras ${MAX_RETRIES} reintentos para prefix="${prefix}": ${err.message}`);
      }
      retryCount++;
      await sleep(REQUEST_DELAY_MS * 2 ** attempt);
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      if (attempt > MAX_RETRIES) {
        throw new Error(`NLM API devolvió ${res.status} tras ${MAX_RETRIES} reintentos para prefix="${prefix}"`);
      }
      retryCount++;
      await sleep(REQUEST_DELAY_MS * 2 ** attempt);
      continue;
    }
    if (!res.ok) {
      throw new Error(`NLM API devolvió status inesperado ${res.status} para prefix="${prefix}"`);
    }
    const data = await res.json();
    apiCallCount++;
    await sleep(REQUEST_DELAY_MS);
    const pairs = data[3] ?? []; // [[code, short_desc], ...]
    const longDescArr = data[2]?.long_desc ?? [];
    return { total: data[0], pairs, longDescArr };
  }
}

// Cap defensivo del display: aunque CMS garantiza short_desc <= 28 chars, se
// deja margen amplio (200 chars) por si un futuro código raro lo excede; si
// short_desc viniera vacío se usa el inicio de long_desc como respaldo.
const MAX_DISPLAY_LEN = 200;

/** Recorre recursivamente el espacio de códigos y acumula (code -> {display, definition}) en `sink`. */
async function crawl(prefix, sink, stats) {
  const { total, pairs, longDescArr } = await apiCall(prefix);
  if (total === 0) return;
  if (total <= MAX_LIST) {
    for (let i = 0; i < pairs.length; i++) {
      const [code, shortDescRaw] = pairs[i];
      const longDesc = (longDescArr[i] ?? '').trim() || null;
      const shortDesc = (shortDescRaw ?? '').trim();
      const existing = sink.get(code);
      // Fuente tiene filas físicamente duplicadas para algunos códigos (p. ej.
      // B4185/B9998/B9999): una trae short_desc vacío. Nos quedamos siempre
      // con el valor NO vacío visto para cada campo, sin importar el orden.
      let display = shortDesc || existing?.display || '';
      const definition = longDesc || existing?.definition || null;
      if (!display) {
        display = (definition ?? code).slice(0, MAX_DISPLAY_LEN);
      } else if (display.length > MAX_DISPLAY_LEN) {
        stats.longDisplays = stats.longDisplays ?? [];
        stats.longDisplays.push({ code, len: display.length });
        display = display.slice(0, MAX_DISPLAY_LEN);
      }
      sink.set(code, { display, definition });
    }
    if (pairs.length !== total) {
      stats.mismatches.push({ prefix, total, got: pairs.length });
    }
    return;
  }
  // Subdividir: el bucket es demasiado grande para una sola llamada offset=0.
  for (const c of ALNUM) {
    await crawl(prefix + c, sink, stats);
  }
}

async function discoverAllCodes() {
  const sink = new Map();
  const stats = { mismatches: [] };
  const startedAt = Date.now();

  for (const letter of LETTERS) {
    await crawl(letter, sink, stats);
    const elapsedS = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(
      `[discover] letra ${letter} completada. códigos únicos acumulados: ${sink.size}. ` +
        `llamadas API: ${apiCallCount} (reintentos: ${retryCount}). tiempo transcurrido: ${elapsedS}s`,
    );
  }

  if (stats.mismatches.length > 0) {
    console.warn(`[discover] ADVERTENCIA: ${stats.mismatches.length} prefijos con pairs.length != total:`);
    for (const m of stats.mismatches) console.warn(`  prefix=${m.prefix} total=${m.total} got=${m.got}`);
  }
  if (stats.longDisplays?.length > 0) {
    console.warn(`[discover] ADVERTENCIA: ${stats.longDisplays.length} códigos con short_desc > ${MAX_DISPLAY_LEN} chars, truncados:`);
    for (const m of stats.longDisplays.slice(0, 10)) console.warn(`  code=${m.code} len=${m.len}`);
  }

  return { codes: sink, apiCallCount, retryCount, elapsedS: (Date.now() - startedAt) / 1000 };
}

async function fetchGrandTotal() {
  const { total } = await apiCall('');
  return total;
}

// -----------------------------------------------------------------------------
// Persistencia en base de datos
// -----------------------------------------------------------------------------

const SOURCE_CODE = 'HCPCS';
const CODE_SYSTEM_INTERNAL_CODE = 'hcpcs';

function currentVersionTag() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function upsertSourceCodeSystemVersion(client, version) {
  await client.query('BEGIN');
  try {
    await client.query(
      `INSERT INTO terminology.terminology_sources
         (id, code, name, owner, official_url, license, created_at, updated_at, row_version)
       VALUES
         (md5('mantra:hcpcs:source:' || $1)::uuid, $1, $2, $3, $4, $5, now(), now(), 1)
       ON CONFLICT (code) DO NOTHING`,
      [
        SOURCE_CODE,
        'HCPCS Level II',
        'Centers for Medicare & Medicaid Services (CMS)',
        'https://www.cms.gov/medicare/coding-billing/healthcare-common-procedure-system',
        'Public domain (U.S. Government work)',
      ],
    );

    await client.query(
      `INSERT INTO terminology.code_systems
         (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition,
          created_at, updated_at, row_version)
       SELECT md5('mantra:hcpcs:cs:' || $1)::uuid, ts.id, $1, $2, $3, true, false, now(), now(), 1
       FROM terminology.terminology_sources ts
       WHERE ts.code = $4
       ON CONFLICT (internal_code) DO NOTHING`,
      [
        CODE_SYSTEM_INTERNAL_CODE,
        'HCPCS Level II',
        'http://terminology.hl7.org/CodeSystem/HCPCSLevelII',
        SOURCE_CODE,
      ],
    );

    await client.query(
      `INSERT INTO terminology.code_system_versions
         (id, code_system_id, version, published_at, is_default, created_at, updated_at, row_version)
       SELECT md5('mantra:hcpcs:csv:' || $1)::uuid, cs.id, $1, now(), true, now(), now(), 1
       FROM terminology.code_systems cs
       WHERE cs.internal_code = $2
       ON CONFLICT (code_system_id, version) DO NOTHING`,
      [version, CODE_SYSTEM_INTERNAL_CODE],
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }

  const { rows } = await client.query(
    `SELECT csv.id
     FROM terminology.code_system_versions csv
     JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
     WHERE cs.internal_code = $1 AND csv.version = $2`,
    [CODE_SYSTEM_INTERNAL_CODE, version],
  );
  if (rows.length !== 1) {
    throw new Error(`No se pudo resolver code_system_version_id para hcpcs/${version}`);
  }
  return rows[0].id;
}

async function insertConceptsBatch(client, codeSystemVersionId, batch) {
  // batch: array de [code, {display, definition}]. 5 parámetros ligados por fila.
  const PARAMS_PER_ROW = 5;
  const valuesSql = [];
  const params = [];
  batch.forEach(([code, { display, definition }], i) => {
    const base = i * PARAMS_PER_ROW;
    valuesSql.push(
      `(md5('mantra:hcpcs:concept:' || $${base + 1})::uuid, $${base + 2}::uuid, $${base + 3}::varchar, $${base + 4}::varchar, $${base + 5}::text, false, true, now(), now(), 1)`,
    );
    params.push(code, codeSystemVersionId, code, display, definition);
  });

  const sql = `
    INSERT INTO terminology.catalog_concepts
      (id, code_system_version_id, code, display, definition, abstract, selectable, created_at, updated_at, row_version)
    VALUES ${valuesSql.join(',\n')}
    ON CONFLICT (code_system_version_id, code) DO NOTHING
  `;

  await client.query('BEGIN');
  try {
    const res = await client.query(sql, params);
    await client.query('COMMIT');
    return res.rowCount;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

async function insertAllConcepts(client, codeSystemVersionId, codesMap) {
  const entries = [...codesMap.entries()];
  let inserted = 0;
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const rowCount = await insertConceptsBatch(client, codeSystemVersionId, batch);
    inserted += rowCount;
    console.log(`[insert] batch ${i / BATCH_SIZE + 1}/${Math.ceil(entries.length / BATCH_SIZE)} — filas nuevas insertadas hasta ahora: ${inserted}`);
  }
  return inserted;
}

/**
 * Repara display/definition desactualizados (p. ej. de una corrida parcial
 * anterior con una descripción distinta a la oficial) vía UPDATE selectivo,
 * NUNCA vía DELETE masivo: `catalog_concepts.id` es referenciado por FK desde
 * decenas de tablas de otros módulos (verificado empíricamente: un DELETE de
 * sólo 2061 filas de prueba de este mismo importador quedó activo varios
 * minutos adquiriendo RowShareLock/FOR KEY SHARE en tablas de insurance,
 * identity_assurance, erp, diagnostics, etc. para validar cada FK — el mismo
 * patrón que causó el incidente de OOM de un importador anterior). Un UPDATE
 * que sólo toca columnas de datos (no la PK) no dispara esa validación de FK
 * y es barato. `IS DISTINCT FROM` evita escribir filas que ya están al día
 * (no genera row_version churn innecesario).
 */
async function repairStaleDisplaysBatch(client, codeSystemVersionId, batch) {
  const res = await client.query(
    `
    UPDATE terminology.catalog_concepts cc
    SET display = x.display, definition = x.definition, updated_at = now(), row_version = cc.row_version + 1
    FROM unnest($2::text[], $3::text[], $4::text[]) AS x(code, display, definition)
    WHERE cc.code_system_version_id = $1
      AND cc.code = x.code
      AND (cc.display IS DISTINCT FROM x.display OR cc.definition IS DISTINCT FROM x.definition)
    `,
    [
      codeSystemVersionId,
      batch.map(([code]) => code),
      batch.map(([, v]) => v.display),
      batch.map(([, v]) => v.definition),
    ],
  );
  return res.rowCount ?? 0;
}

async function repairStaleDisplays(client, codeSystemVersionId, codesMap) {
  const entries = [...codesMap.entries()];
  let repaired = 0;
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    repaired += await repairStaleDisplaysBatch(client, codeSystemVersionId, batch);
  }
  return repaired;
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main() {
  console.log('=== Importador HCPCS Level II (NLM Clinical Table Search Service) ===');
  console.log(`DB destino: ${DB_CONFIG.database}@${DB_CONFIG.host}:${DB_CONFIG.port}`);

  console.log('\n[1/4] Descubriendo el total real reportado por la API...');
  const grandTotal = await fetchGrandTotal();
  console.log(`Total reportado por la API (sin filtro): ${grandTotal}`);
  console.log('NOTA: HCPCS Level II es un catálogo intrínsecamente pequeño (~8900 códigos).');
  console.log('No se debe esperar ni inflar un conteo mayor: esa es la escala real de la fuente.');

  console.log('\n[2/4] Enumerando todo el catálogo por prefijo de código (recursivo)...');
  const { codes, apiCallCount: calls, retryCount: retries, elapsedS } = await discoverAllCodes();
  console.log(`\nDescubrimiento completo: ${codes.size} códigos únicos en ${elapsedS.toFixed(1)}s (${calls} llamadas API, ${retries} reintentos).`);

  const coverage = (codes.size / grandTotal) * 100;
  console.log(`Cobertura vs. total API: ${codes.size} / ${grandTotal} = ${coverage.toFixed(3)}%`);

  const version = currentVersionTag();
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    console.log('\n[3/4] Upsert de terminology_sources / code_systems / code_system_versions...');
    const codeSystemVersionId = await upsertSourceCodeSystemVersion(client, version);
    console.log(`code_system_version_id (hcpcs/${version}) = ${codeSystemVersionId}`);

    console.log('\n[4/4] Insertando catalog_concepts en batches...');
    const insertedCount = await insertAllConcepts(client, codeSystemVersionId, codes);
    console.log(`Filas NUEVAS insertadas en esta corrida: ${insertedCount} (el resto ya existía o fue duplicado por ON CONFLICT DO NOTHING).`);

    console.log('\n[reparación] Corrigiendo displays desactualizados de filas ya existentes (UPDATE selectivo, no DELETE)...');
    const repairedCount = await repairStaleDisplays(client, codeSystemVersionId, codes);
    console.log(`Filas reparadas (display distinto al oficial actual): ${repairedCount}.`);

    const { rows } = await client.query(
      `SELECT count(*)::bigint AS n
       FROM terminology.catalog_concepts cc
       JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
       JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
       WHERE cs.internal_code = $1`,
      [CODE_SYSTEM_INTERNAL_CODE],
    );
    const dbCount = Number(rows[0].n);
    const dbCoverage = (dbCount / grandTotal) * 100;

    console.log('\n=== RESUMEN FINAL ===');
    console.log(`Total reportado por la API:        ${grandTotal}`);
    console.log(`Códigos únicos descubiertos:        ${codes.size}`);
    console.log(`Filas nuevas insertadas esta corrida: ${insertedCount}`);
    console.log(`Conteo total en DB (hcpcs):          ${dbCount}`);
    console.log(`Cobertura real (DB / API total):     ${dbCoverage.toFixed(3)}%`);
    if (dbCount < grandTotal) {
      console.log(`ADVERTENCIA: faltan ${grandTotal - dbCount} códigos para el 100% de cobertura.`);
    } else {
      console.log('Cobertura del 100% (o superior si el total de la API cambió durante la corrida).');
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('\nERROR FATAL en el importador HCPCS:', err);
  process.exitCode = 1;
});
