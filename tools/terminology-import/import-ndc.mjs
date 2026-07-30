#!/usr/bin/env node
// =============================================================================
// IMPORTADOR ETL: FDA NDC Directory (openFDA) -> terminology.*
// =============================================================================
//
// Importa el National Drug Code (NDC) Directory de la FDA -- catálogo real de
// PRODUCTOS COMERCIALES farmacéuticos comercializados en EE.UU. (marca,
// fabricante/labeler, forma farmacéutica, vía de administración, ingredientes
// activos con concentración, tipo de producto) -- usando la API pública
// openFDA. No requiere cuenta ni API key para este volumen.
//
//   Docs:  https://open.fda.gov/apis/drug/ndc/
//          https://open.fda.gov/apis/query-syntax/
//   Base:  https://api.fda.gov/drug/ndc.json
//
// Es DISTINTO y complementario a terminology internal_code='rxterms'
// (concepto clínico genérico RxNorm curado): aquí cada catalog_concepts es un
// PRODUCTO COMERCIAL real identificado por su NDC de 10-11 dígitos
// (product_ndc, formato labeler-producto, p. ej. "0078-1525").
//
// -----------------------------------------------------------------------------
// Límite de paginación profunda de openFDA (verificado empíricamente,
// 2026-07-28, ver reporte de la tarea):
//
//   * El total reportado por la API es 137,468 productos, pero el parámetro
//     `skip` de la API (Elasticsearch subyacente) rechaza con HTTP 400
//     ("Skip value must 25000 or less.") cualquier valor > 25000,
//     independientemente del total real. Con `limit` máximo de 1000, esto
//     deja alcanzable como máximo el rango [0, 25999] (26,000 resultados)
//     POR CADA BÚSQUEDA/FILTRO DISTINTO -- no por el dataset completo.
//
//   * Estrategia de particionamiento (verificada empíricamente con
//     `count=product_type.exact` + rangos de fecha, sumas exactas
//     confirmadas contra el total global de 137,468, sin huecos ni
//     solapamientos):
//
//       1) Partición primaria por `product_type` (10 categorías vía
//          `count=product_type.exact`). 8 de las 10 ya caben bajo el tope de
//          26,000 en una sola partición:
//            BULK INGREDIENT (15,766), DRUG FOR FURTHER PROCESSING (5,740),
//            NON-STANDARDIZED ALLERGENIC (2,197), PLASMA DERIVATIVE (318),
//            VACCINE (149), STANDARDIZED ALLERGENIC (125),
//            CELLULAR THERAPY (23), LICENSED VACCINE BULK INTERMEDIATE (11).
//
//       2) Las 2 categorías restantes -- HUMAN OTC DRUG (56,621) y
//          HUMAN PRESCRIPTION DRUG (56,518) -- se subparticionan además por
//          rango de `marketing_start_date` (campo de fecha, admite sintaxis
//          de rango `[YYYYMMDD TO YYYYMMDD]`) en 6 sub-rangos cada una:
//          [00000000|19000101..20051231], [20060101..20141231],
//          [20150101..20191231], [20200101..20211231], [20220101..20231231],
//          [20240101..99991231]. Todas las sub-particiones resultantes caen
//          por debajo de 26,000 (la mayor observada: 17,418).
//
//     Total: 20 particiones (8 + 6 + 6). La suma de conteos de las 20
//     particiones = 137,468 EXACTO (verificado con curl antes de escribir
//     este script), confirmando cobertura completa sin huecos.
//
// -----------------------------------------------------------------------------
// Buen ciudadano de la API pública (sin API key, límite ~40 req/min):
//   * REQUEST_DELAY_MS entre requests (~1.6s) + backoff exponencial en 429/5xx.
//
// -----------------------------------------------------------------------------
// Modelo de datos de destino (terminology.*, ver database/SQL/03_terminology):
//
//   * 1 terminology_sources: code='FDA_NDC'.
//   * 1 code_systems: internal_code='ndc'.
//   * 1 code_system_versions: version='YYYY.MM' del día de ejecución,
//     is_default=true.
//   * 1 catalog_concepts POR product_ndc único: code=product_ndc,
//     display=brand_name (o generic_name si no hay marca),
//     definition=genérico + forma + vía.
//   * concept_properties (data_type='json'): 'manufacturer' (labeler_name),
//     'dosage_form', 'route' (array), 'active_ingredients' (array completo
//     con strengths tal cual viene de la API), 'product_type'.
//
// Idempotencia: IDs deterministas (md5('mantra:ndc:...clave...')::uuid,
// mismo patrón que database/SQL/98_seeds/vademecum_medications.sql y
// tools/terminology-import/import-rxterms.mjs) + `ON CONFLICT DO NOTHING` en
// todos los INSERT. Volver a ejecutar el script no duplica filas.
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

const API_BASE = 'https://api.fda.gov/drug/ndc.json';
const PAGE_SIZE = 1000; // máximo permitido por openFDA
const MAX_SKIP = 25000; // tope de paginación profunda verificado empíricamente
const REQUEST_DELAY_MS = 1600; // ~40 req/min sin API key
const MAX_RETRIES = 6;
const DB_BATCH_SIZE = 1000; // batches conservadores (contenedor con memoria limitada)

// Particiones (ver comentario de cabecera para la metodología y verificación).
// Categorías simples de product_type que ya caben bajo el tope de 26,000.
const SIMPLE_PRODUCT_TYPES = [
  'BULK INGREDIENT',
  'DRUG FOR FURTHER PROCESSING',
  'NON-STANDARDIZED ALLERGENIC',
  'PLASMA DERIVATIVE',
  'VACCINE',
  'STANDARDIZED ALLERGENIC',
  'CELLULAR THERAPY',
  'LICENSED VACCINE BULK INTERMEDIATE',
];

// Categorías grandes que requieren sub-partición adicional por fecha.
const LARGE_PRODUCT_TYPES = ['HUMAN OTC DRUG', 'HUMAN PRESCRIPTION DRUG'];
const DATE_RANGES = [
  ['00000000', '20051231'],
  ['20060101', '20141231'],
  ['20150101', '20191231'],
  ['20200101', '20211231'],
  ['20220101', '20231231'],
  ['20240101', '99991231'],
];

function buildPartitions() {
  const partitions = [];
  for (const pt of SIMPLE_PRODUCT_TYPES) {
    partitions.push({
      label: pt,
      search: `product_type:"${pt}"`,
    });
  }
  for (const pt of LARGE_PRODUCT_TYPES) {
    for (const [from, to] of DATE_RANGES) {
      partitions.push({
        label: `${pt} [${from}..${to}]`,
        search: `product_type:"${pt}" AND marketing_start_date:[${from} TO ${to}]`,
      });
    }
  }
  return partitions;
}

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
async function fetchPage(search, skip) {
  const url = new URL(API_BASE);
  url.searchParams.set('search', search);
  url.searchParams.set('limit', String(PAGE_SIZE));
  url.searchParams.set('skip', String(skip));

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let res;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      const backoff = Math.min(1000 * 2 ** attempt, 20000);
      console.warn(`  [retry ${attempt}/${MAX_RETRIES}] error de red search="${search}" skip=${skip}: ${err.message}; esperando ${backoff}ms`);
      await sleep(backoff);
      continue;
    }

    if (res.status === 429 || res.status >= 500) {
      if (attempt === MAX_RETRIES) {
        throw new Error(`HTTP ${res.status} tras ${MAX_RETRIES} reintentos para search="${search}" skip=${skip}`);
      }
      const backoff = Math.min(1000 * 2 ** attempt, 20000);
      console.warn(`  [retry ${attempt}/${MAX_RETRIES}] HTTP ${res.status} search="${search}" skip=${skip}; esperando ${backoff}ms`);
      await sleep(backoff);
      continue;
    }

    const text = await res.text();
    // openFDA responde 404 con {"error":{"code":"NOT_FOUND",...}} cuando una
    // búsqueda no tiene resultados (no es un error de red/servidor real).
    if (res.status === 404) {
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        body = null;
      }
      if (body?.error?.code === 'NOT_FOUND') {
        return { meta: { results: { skip, limit: PAGE_SIZE, total: 0 } }, results: [] };
      }
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} para search="${search}" skip=${skip}: ${text.slice(0, 300)}`);
    }
    return JSON.parse(text);
  }
  throw new Error('unreachable');
}

// -----------------------------------------------------------------------------
// Enumeración sistemática por particiones
// -----------------------------------------------------------------------------
async function enumerateAllProducts() {
  const partitions = buildPartitions();
  const productsByNdc = new Map();
  let requestCount = 0;
  let duplicateAcrossPartitions = 0;

  for (const partition of partitions) {
    let skip = 0;
    let total = null;
    let partitionNew = 0;

    for (;;) {
      if (skip > MAX_SKIP) {
        console.warn(`  [cap] partición "${partition.label}": skip=${skip} excede el tope de ${MAX_SKIP}; cobertura parcial para esta partición (no debería ocurrir según el diseño de particiones).`);
        break;
      }

      const page = await fetchPage(partition.search, skip);
      requestCount++;
      total = page.meta?.results?.total ?? 0;
      const results = page.results ?? [];

      for (const r of results) {
        const ndc = r.product_ndc;
        if (!ndc) continue;
        if (productsByNdc.has(ndc)) {
          duplicateAcrossPartitions++;
          continue;
        }
        partitionNew++;
        productsByNdc.set(ndc, r);
      }

      skip += PAGE_SIZE;
      await sleep(REQUEST_DELAY_MS);

      if (results.length === 0 || skip >= total) break;
    }

    console.log(`  partición "${partition.label}": total_api=${total ?? 0}, +${partitionNew} NDCs nuevos (acumulado: ${productsByNdc.size})`);
  }

  console.log(`\nSolicitudes HTTP totales a la API: ${requestCount}`);
  if (duplicateAcrossPartitions > 0) {
    console.log(`(${duplicateAcrossPartitions} NDCs ya vistos re-encontrados entre particiones -- deduplicados, no deberían existir por diseño ya que product_type es excluyente).`);
  }
  return productsByNdc;
}

// -----------------------------------------------------------------------------
// Preparación de filas destino
// -----------------------------------------------------------------------------
function buildDefinition(r) {
  const parts = [];
  if (r.generic_name) parts.push(r.generic_name);
  if (r.dosage_form) parts.push(r.dosage_form);
  if (Array.isArray(r.route) && r.route.length > 0) parts.push(`vía: ${r.route.join(', ')}`);
  return parts.length > 0 ? parts.join(' — ') : null;
}

function buildRows(productsByNdc) {
  const concepts = [];
  const properties = [];

  for (const r of productsByNdc.values()) {
    const ndc = r.product_ndc;
    const display = r.brand_name || r.generic_name || ndc;
    const definition = buildDefinition(r);

    concepts.push({ ndc, display: display.slice(0, 255), definition });

    if (r.labeler_name) {
      properties.push({ ndc, code: 'manufacturer', valueJson: JSON.stringify(r.labeler_name) });
    }
    if (r.dosage_form) {
      properties.push({ ndc, code: 'dosage_form', valueJson: JSON.stringify(r.dosage_form) });
    }
    if (Array.isArray(r.route) && r.route.length > 0) {
      properties.push({ ndc, code: 'route', valueJson: JSON.stringify(r.route) });
    }
    if (Array.isArray(r.active_ingredients) && r.active_ingredients.length > 0) {
      properties.push({ ndc, code: 'active_ingredients', valueJson: JSON.stringify(r.active_ingredients) });
    }
    if (r.product_type) {
      properties.push({ ndc, code: 'product_type', valueJson: JSON.stringify(r.product_type) });
    }
  }

  return { concepts, properties };
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// -----------------------------------------------------------------------------
// Resolución de source / code_system / version
// -----------------------------------------------------------------------------
async function ensureNdcSource(client) {
  await client.query(`
    INSERT INTO terminology.terminology_sources
      (id, code, name, owner, official_url, license, created_at, updated_at, row_version)
    VALUES
      (md5('mantra:ndc:source:FDA_NDC')::uuid, 'FDA_NDC',
       'FDA National Drug Code Directory',
       'U.S. Food and Drug Administration',
       'https://open.fda.gov/apis/drug/ndc/',
       'Public domain (U.S. Government work), subject to openFDA Terms of Service',
       now(), now(), 1)
    ON CONFLICT (code) DO NOTHING
  `);
  const { rows } = await client.query(`SELECT id FROM terminology.terminology_sources WHERE code = 'FDA_NDC'`);
  if (rows.length === 0) throw new Error('No se pudo resolver terminology_sources code=FDA_NDC');
  return rows[0].id;
}

async function ensureCodeSystem(client, sourceId) {
  await client.query(
    `
    INSERT INTO terminology.code_systems
      (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition, created_at, updated_at, row_version)
    VALUES
      (md5('mantra:ndc:cs:ndc')::uuid, $1, 'ndc',
       'FDA National Drug Code (NDC) Directory',
       'http://hl7.org/fhir/sid/ndc',
       true, false, now(), now(), 1)
    ON CONFLICT (internal_code) DO NOTHING
  `,
    [sourceId],
  );
  const { rows } = await client.query(`SELECT id FROM terminology.code_systems WHERE internal_code = 'ndc'`);
  if (rows.length === 0) throw new Error('No se pudo resolver code_systems internal_code=ndc');
  return rows[0].id;
}

async function ensureCodeSystemVersion(client, codeSystemId, version) {
  await client.query(
    `
    INSERT INTO terminology.code_system_versions
      (id, code_system_id, version, published_at, is_default, created_at, updated_at, row_version)
    VALUES
      (md5('mantra:ndc:csv:' || $2)::uuid, $1, $2, now(), true, now(), now(), 1)
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

// -----------------------------------------------------------------------------
// Inserts en batch
// -----------------------------------------------------------------------------
async function insertConceptsBatch(client, csvId, batch) {
  const res = await client.query(
    `
    INSERT INTO terminology.catalog_concepts
      (id, code_system_version_id, code, display, definition, abstract, selectable, state_concept_id, created_at, updated_at, row_version)
    SELECT md5('mantra:ndc:concept:' || x.ndc)::uuid,
           $1::uuid, x.ndc, x.display, x.definition, false, true, NULL, now(), now(), 1
    FROM unnest($2::text[], $3::text[], $4::text[]) AS x(ndc, display, definition)
    ON CONFLICT (code_system_version_id, code) DO NOTHING
  `,
    [csvId, batch.map((b) => b.ndc), batch.map((b) => b.display), batch.map((b) => b.definition)],
  );
  return res.rowCount ?? 0;
}

async function insertPropertiesBatch(client, batch) {
  const res = await client.query(
    `
    INSERT INTO terminology.concept_properties
      (id, concept_id, property_code, data_type, value_json, created_at, updated_at, row_version)
    SELECT md5('mantra:ndc:property:' || x.ndc || ':' || x.property_code)::uuid,
           md5('mantra:ndc:concept:' || x.ndc)::uuid,
           x.property_code, 'json'::terminology.technical_data_type, x.value_json::jsonb,
           now(), now(), 1
    FROM unnest($1::text[], $2::text[], $3::text[]) AS x(ndc, property_code, value_json)
    ON CONFLICT (id) DO NOTHING
  `,
    [batch.map((p) => p.ndc), batch.map((p) => p.code), batch.map((p) => p.valueJson)],
  );
  return res.rowCount ?? 0;
}

// -----------------------------------------------------------------------------
// main
// -----------------------------------------------------------------------------
async function main() {
  console.log('=== Importador FDA NDC Directory -> terminology.* ===\n');
  console.log('1) Enumerando productos vía la API pública openFDA (particionado, ver cabecera del script)...\n');

  const productsByNdc = await enumerateAllProducts();
  console.log(`\nTotal de product_ndc únicos descubiertos: ${productsByNdc.size}\n`);

  const { concepts, properties } = buildRows(productsByNdc);
  console.log(`Filas a upsertar: ${concepts.length} conceptos, ${properties.length} propiedades.\n`);

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    console.log('2) Resolviendo source/code_system/version...');
    const sourceId = await ensureNdcSource(client);
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

    console.log('4) Insertando concept_properties en batches...');
    let insertedProperties = 0;
    for (const batch of chunk(properties, DB_BATCH_SIZE)) {
      insertedProperties += await insertPropertiesBatch(client, batch);
    }
    console.log(`   ${insertedProperties} propiedades nuevas insertadas (de ${properties.length} consideradas).\n`);

    console.log('=== Resumen ===');
    console.log(`product_ndc únicos descubiertos:   ${productsByNdc.size}`);
    console.log(`catalog_concepts nuevos:            ${insertedConcepts}`);
    console.log(`concept_properties nuevas:          ${insertedProperties}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('\nERROR FATAL:', err);
  process.exitCode = 1;
});
