// =============================================================================
// ETL: Importador REAL del catálogo ICD-10-CM (CMS / NLM Clinical Table
// Search Service) hacia terminology.catalog_concepts.
// =============================================================================
//
// Fuente: https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search (API
// pública, sin cuenta ni API key). Formato de respuesta:
//   [totalCount, [codes...], null, [[code, name], ...]]
//
// Comportamiento REAL de la API descubierto empíricamente antes de escribir
// este script (ver reporte de la sesión que lo construyó):
//   * `maxList` está capado por el servidor en 500, sin importar el valor
//     pedido (probado hasta 2000).
//   * Con `offset=0` la API respeta `maxList` y devuelve hasta 500 filas.
//   * Con `offset>0` la API IGNORA `maxList` y devuelve como máximo 7 filas
//     (o menos si quedan menos de 7 hasta el final del conjunto), sin
//     importar qué `maxList` se pida. Esto hace que la paginación por
//     `offset` sea inútil para volúmenes grandes.
//   * `terms=` con `sf=code` filtra por PREFIJO del código (no substring):
//     `terms=11` no matchea "E11.9". `terms=A0` matchea sólo códigos que
//     EMPIEZAN con "A0".
//   * Sumando el conteo (`total`, primer elemento de la respuesta) de cada
//     letra A-Z por separado (`terms=A`, `terms=B`, ...) da exactamente
//     74719, el total reportado por la API sin filtro — confirma que la
//     partición por letra inicial cubre el 100% del espacio de códigos sin
//     solapamientos.
//   * Algunas categorías de 3 caracteres superan largamente el cap de 500
//     (ej. S72 = fractura de fémur → 2466 códigos; S82 → 3096 códigos),
//     por lo que hace falta subdividir recursivamente por prefijo hasta que
//     cada "bucket" quede en <=500 filas y se pueda leer completo con una
//     sola llamada `offset=0`.
//
// Estrategia de enumeración (sin usar nunca `offset>0`, que es inútil):
//   1. 26 llamadas raíz, una por letra inicial (A-Z).
//   2. Si el total de un prefijo es 0 → no existe, se descarta.
//   3. Si el total de un prefijo es <=500 → la respuesta de esa llamada YA
//      contiene el bucket completo (offset=0 respeta maxList=500), se
//      insertan esos códigos y no se recursa más.
//   4. Si el total supera 500 → se subdivide agregando un carácter más al
//      prefijo y se repite el proceso. El alfabeto de candidatos depende de
//      la posición dentro del código ICD-10-CM (gramática real del
//      estándar, no un dato clínico inventado):
//        - longitud 1 o 2 (justo tras la letra) → dígitos 0-9 (categoría es
//          siempre Letra+2 dígitos).
//        - longitud 3 (categoría completa, ej. "S72") → sólo '.' (el punto
//          decimal es la única extensión posible tras la categoría).
//        - longitud 4 (tras el punto) → dígitos 0-9 (primer decimal).
//        - longitud >=5 → dígitos + letras (hay sufijos alfabéticos como
//          'X' de relleno o 'A'/'D'/'S' de tipo de encuentro).
//
// Idempotencia: UUIDs deterministas `md5('mantra:icd10cm:...')::uuid` +
// `ON CONFLICT DO NOTHING` en todas las inserciones, siguiendo el mismo
// patrón que `database/SQL/98_seeds/vademecum_medications.sql`.
// =============================================================================

import 'dotenv/config';
import pg from 'pg';

const NLM_SEARCH_URL = 'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search';
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
// Permite restringir el conjunto de letras raíz vía env var, únicamente para
// pruebas de humo rápidas del pipeline (por defecto corre las 26 letras).
const LETTERS = process.env.ICD10_TEST_LETTERS
  ? process.env.ICD10_TEST_LETTERS.split(',').map((s) => s.trim().toUpperCase())
  : ALL_LETTERS;
const ALNUM = DIGITS.concat(ALL_LETTERS);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Candidatos de extensión de prefijo según la gramática real de ICD-10-CM. */
function candidatesFor(prefix) {
  const len = prefix.length;
  // NOTA: una corrida real de descubrimiento reveló que la asunción inicial
  // "categoría = Letra+2 dígitos" es FALSA para un subconjunto de categorías
  // más nuevas que usan una letra en la 2ª o 3ª posición para no agotar el
  // espacio numérico (ej. "M1A" = gota crónica, "O9A" = secuelas del
  // embarazo, "Z3A" = semanas de gestación). Esas categorías quedaron fuera
  // de la primera corrida (cobertura 99.651%, 261 códigos faltantes) porque
  // sólo se probaban dígitos en las posiciones 2 y 3. Se corrige usando el
  // alfabeto alfanumérico completo en TODAS las posiciones salvo la longitud
  // 3 -> 4, donde el punto decimal es una regla estructural fija de
  // ICD-10-CM (ninguna excepción conocida ni encontrada).
  if (len === 3) return ['.']; // categoría completa (3 chars) -> sólo puede seguir un punto decimal
  return ALNUM; // resto de posiciones: dígitos o letras (categoría alfanumérica, sufijos X/A/D/S, etc.)
}

let apiCallCount = 0;
let retryCount = 0;

/** Llama a la API de NLM para un prefijo dado, con reintentos/backoff. */
async function apiCall(prefix) {
  const url = `${NLM_SEARCH_URL}?sf=code&terms=${encodeURIComponent(prefix)}&maxList=${MAX_LIST}&offset=0`;
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
    return { total: data[0], pairs: data[3] ?? [] };
  }
}

/** Recorre recursivamente el espacio de códigos y acumula (code -> display) en `sink`. */
async function crawl(prefix, sink, stats) {
  const { total, pairs } = await apiCall(prefix);
  if (total === 0) return;
  if (total <= MAX_LIST) {
    for (const [code, display] of pairs) {
      sink.set(code, display);
    }
    if (pairs.length !== total) {
      stats.mismatches.push({ prefix, total, got: pairs.length });
    }
    return;
  }
  // Subdividir: el bucket es demasiado grande para una sola llamada offset=0.
  for (const c of candidatesFor(prefix)) {
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

  return { codes: sink, apiCallCount, retryCount, elapsedS: (Date.now() - startedAt) / 1000 };
}

async function fetchGrandTotal() {
  const { total } = await apiCall('');
  return total;
}

// -----------------------------------------------------------------------------
// Persistencia en base de datos
// -----------------------------------------------------------------------------

const SOURCE_CODE = 'ICD10CM_NLM';
const CODE_SYSTEM_INTERNAL_CODE = 'icd10cm';
const CODE_SYSTEM_VERSION = '2026';

async function upsertSourceCodeSystemVersion(client) {
  await client.query('BEGIN');
  try {
    await client.query(
      `INSERT INTO terminology.terminology_sources
         (id, code, name, owner, official_url, license, created_at, updated_at, row_version)
       VALUES
         (md5('mantra:icd10cm:source:' || $1)::uuid, $1, $2, $3, $4, $5, now(), now(), 1)
       ON CONFLICT (code) DO NOTHING`,
      [
        SOURCE_CODE,
        'ICD-10-CM (CMS/NLM Clinical Table Search Service)',
        'CMS / U.S. National Library of Medicine',
        'https://clinicaltables.nlm.nih.gov/apidoc/icd10cm/v3/',
        'Public domain (U.S. Government work)',
      ],
    );

    await client.query(
      `INSERT INTO terminology.code_systems
         (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition,
          created_at, updated_at, row_version)
       SELECT md5('mantra:icd10cm:cs:' || $1)::uuid, ts.id, $1, $2, $3, true, false, now(), now(), 1
       FROM terminology.terminology_sources ts
       WHERE ts.code = $4
       ON CONFLICT (internal_code) DO NOTHING`,
      [
        CODE_SYSTEM_INTERNAL_CODE,
        'ICD-10-CM (2026)',
        'http://hl7.org/fhir/sid/icd-10-cm',
        SOURCE_CODE,
      ],
    );

    await client.query(
      `INSERT INTO terminology.code_system_versions
         (id, code_system_id, version, published_at, is_default, created_at, updated_at, row_version)
       SELECT md5('mantra:icd10cm:csv:' || $1)::uuid, cs.id, $1, now(), true, now(), now(), 1
       FROM terminology.code_systems cs
       WHERE cs.internal_code = $2
       ON CONFLICT (code_system_id, version) DO NOTHING`,
      [CODE_SYSTEM_VERSION, CODE_SYSTEM_INTERNAL_CODE],
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
    [CODE_SYSTEM_INTERNAL_CODE, CODE_SYSTEM_VERSION],
  );
  if (rows.length !== 1) {
    throw new Error('No se pudo resolver code_system_version_id para icd10cm/2026');
  }
  return rows[0].id;
}

async function insertConceptsBatch(client, codeSystemVersionId, batch) {
  // batch: array de [code, display]. 4 parámetros ligados por fila.
  const PARAMS_PER_ROW = 4;
  const valuesSql = [];
  const params = [];
  batch.forEach(([code, display], i) => {
    const base = i * PARAMS_PER_ROW;
    valuesSql.push(
      `(md5('mantra:icd10cm:concept:' || $${base + 1})::uuid, $${base + 2}::uuid, $${base + 3}::varchar, $${base + 4}::varchar, false, true, now(), now(), 1)`,
    );
    params.push(code, codeSystemVersionId, code, display);
  });

  const sql = `
    INSERT INTO terminology.catalog_concepts
      (id, code_system_version_id, code, display, abstract, selectable, created_at, updated_at, row_version)
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
    if ((i / BATCH_SIZE) % 20 === 0) {
      console.log(`[insert] batch ${i / BATCH_SIZE + 1}/${Math.ceil(entries.length / BATCH_SIZE)} — filas nuevas insertadas hasta ahora: ${inserted}`);
    }
  }
  return inserted;
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main() {
  console.log('=== Importador ICD-10-CM (NLM Clinical Table Search Service) ===');
  console.log(`DB destino: ${DB_CONFIG.database}@${DB_CONFIG.host}:${DB_CONFIG.port}`);

  console.log('\n[1/4] Descubriendo el total real reportado por la API...');
  const grandTotal = await fetchGrandTotal();
  console.log(`Total reportado por la API (sin filtro): ${grandTotal}`);

  console.log('\n[2/4] Enumerando todo el catálogo por prefijo de código (recursivo)...');
  const { codes, apiCallCount: calls, retryCount: retries, elapsedS } = await discoverAllCodes();
  console.log(`\nDescubrimiento completo: ${codes.size} códigos únicos en ${elapsedS.toFixed(1)}s (${calls} llamadas API, ${retries} reintentos).`);

  const coverage = (codes.size / grandTotal) * 100;
  console.log(`Cobertura vs. total API: ${codes.size} / ${grandTotal} = ${coverage.toFixed(3)}%`);

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    console.log('\n[3/4] Upsert de terminology_sources / code_systems / code_system_versions...');
    const codeSystemVersionId = await upsertSourceCodeSystemVersion(client);
    console.log(`code_system_version_id (icd10cm/${CODE_SYSTEM_VERSION}) = ${codeSystemVersionId}`);

    console.log('\n[4/4] Insertando catalog_concepts en batches...');
    const insertedCount = await insertAllConcepts(client, codeSystemVersionId, codes);
    console.log(`Filas NUEVAS insertadas en esta corrida: ${insertedCount} (el resto ya existía o fue duplicado por ON CONFLICT DO NOTHING).`);

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
    console.log(`Conteo total en DB (icd10cm):        ${dbCount}`);
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
  console.error('\nERROR FATAL en el importador ICD-10-CM:', err);
  process.exitCode = 1;
});
