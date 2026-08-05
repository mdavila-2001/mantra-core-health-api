#!/usr/bin/env node
// =============================================================================
// IMPORTADOR ETL: RxTerms (NLM Clinical Table Search Service) -> terminology.*
// =============================================================================
//
// Importa el catálogo curado de medicamentos RxTerms (subconjunto clínico de
// RxNorm mantenido por la U.S. National Library of Medicine) usando la API
// pública gratuita de NLM Clinical Table Search Service. No requiere cuenta ni
// API key.
//
//   Docs:    https://clinicaltables.nlm.nih.gov/apidoc/rxterms/v3/
//   Search:  https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search
//
// -----------------------------------------------------------------------------
// Metodología de enumeración (descubierta empíricamente, ver reporte de la
// tarea para el detalle de la investigación):
//
//   * El parámetro correcto de paginación es `count` (no `maxList`: ese
//     parámetro por sí solo, combinado con `offset`, hace que el servicio
//     ignore el tamaño de página pedido y devuelva solo ~7 resultados). Con
//     `count` + `offset` la paginación es exacta y estable.
//   * El servicio limita `offset + count` a un máximo combinado de 7500
//     resultados por búsqueda (falla con "Bad request" por encima de eso).
//   * `terms=` (búsqueda vacía) reporta un total global de ~9323 conceptos de
//     nombre de fármaco, pero la paginación por offset en ese modo NO es
//     fiable (se probó y devuelve conteos inconsistentes) — no se usa aquí.
//   * La búsqueda de RxTerms hace coincidir por PREFIJO DE PALABRA/TOKEN
//     sobre DISPLAY_NAME y DISPLAY_NAME_SYNONYM (no es una simple
//     subcadena): p. ej. `terms=a` matchea "RETIN-A" porque "A" es un token
//     independiente. Esto implica que enumerar por los 26 prefijos de una
//     sola letra (a-z) más los 10 dígitos (0-9) cubre, por construcción,
//     cualquier palabra del nombre del fármaco cuyo primer carácter sea
//     alfanumérico ASCII — que es prácticamente el 100% de los nombres de
//     fármaco en inglés/latinizado del catálogo.
//   * Se verificó que ninguno de los 36 buckets de un solo carácter excede el
//     tope de 7500 (el más grande observado ronda ~4700, inflado además por
//     coincidencias espurias de tokens de forma farmacéutica como "Oral" /
//     "Pill" / "Patch" que también aparecen en DISPLAY_NAME), por lo que no
//     hace falta subdividir en prefijos de 2+ caracteres para lograr
//     cobertura completa dentro del límite de la API.
//   * La deduplicación final es por RXCUI real (no por nombre de display),
//     así que la superposición entre buckets (un mismo fármaco puede
//     matchear varios prefijos distintos por sus distintos tokens) no genera
//     duplicados en destino.
//
// -----------------------------------------------------------------------------
// Modelo de datos de destino (terminology.*, ver SQL/03_terminology):
//
//   * Reutiliza terminology_sources code='RXNORM' (creado por el seed
//     SQL/patches/2026-07-30_vademecum_dev_seed.sql) — NO crea uno nuevo.
//   * Crea/reutiliza 1 code_systems (internal_code='rxterms').
//   * Crea/reutiliza 1 code_system_versions (version='YYYY.MM' del día de
//     ejecución, is_default=true).
//   * Un catalog_concepts POR CADA RXCUI real (no se agrupan las variantes de
//     concentración/forma de un mismo "drug name concept" en un solo
//     concepto): code=RXCUI, display="<nombre> <concentración+forma>",
//     definition="<concentración+forma>".
//   * concept_designations: designación EN preferida con el nombre base del
//     fármaco, más designaciones para cada sinónimo de display (p. ej. HCTZ).
//   * concept_properties (data_type='json'): 'strength_and_form',
//     'display_name_synonym' (si aplica) y 'sxdg_rxcui' (si aplica, el RXCUI
//     del concepto de fármaco clínico semántico genérico -- dato extra útil
//     de RxNorm, no destructivo, no pedido explícitamente pero coherente con
//     el modelo).
//
// Idempotencia: TODOS los IDs son deterministas
// (md5('mantra:rxterms:...clave...')::uuid, calculado en SQL igual que en el
// seed de vademécum) y todos los INSERT usan ON CONFLICT DO NOTHING. Volver a
// ejecutar el script no duplica filas.
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

const API_BASE = 'https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search';
const EXTRA_FIELDS = 'STRENGTHS_AND_FORMS,RXCUIS,DISPLAY_NAME_SYNONYM,SXDG_RXCUI';
const PAGE_SIZE = 500;
const API_CAP = 7500; // offset + count no puede superar este total combinado
const REQUEST_DELAY_MS = 130; // buen-ciudadano de la API pública gratuita
const MAX_RETRIES = 6;
const DB_BATCH_SIZE = 2000;

const EN_LANGUAGE_CONCEPT_ID = '9907bae2-1a46-5346-8d92-4d1d5ca3ec7b';

// Prefijos de un solo carácter: 26 letras + 10 dígitos = 36 buckets.
const PREFIXES = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');

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
async function fetchPage(term, offset) {
  const url = new URL(API_BASE);
  url.searchParams.set('terms', term);
  url.searchParams.set('count', String(PAGE_SIZE));
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('ef', EXTRA_FIELDS);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let res;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      const backoff = Math.min(1000 * 2 ** attempt, 15000);
      console.warn(`  [retry ${attempt}/${MAX_RETRIES}] error de red term="${term}" offset=${offset}: ${err.message}; esperando ${backoff}ms`);
      await sleep(backoff);
      continue;
    }

    if (res.status === 429 || res.status >= 500) {
      if (attempt === MAX_RETRIES) {
        throw new Error(`HTTP ${res.status} tras ${MAX_RETRIES} reintentos para term="${term}" offset=${offset}`);
      }
      const backoff = Math.min(1000 * 2 ** attempt, 15000);
      console.warn(`  [retry ${attempt}/${MAX_RETRIES}] HTTP ${res.status} term="${term}" offset=${offset}; esperando ${backoff}ms`);
      await sleep(backoff);
      continue;
    }

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} para term="${term}" offset=${offset}: ${text.slice(0, 200)}`);
    }
    if (text.startsWith('Bad request')) {
      throw new Error(`Bad request de la API para term="${term}" offset=${offset} (posible tope de 7500 excedido): ${text}`);
    }
    return JSON.parse(text);
  }
  throw new Error('unreachable');
}

// -----------------------------------------------------------------------------
// Enumeración sistemática vía prefijos de 1 carácter (a-z, 0-9)
// -----------------------------------------------------------------------------
async function enumerateAllConcepts() {
  const conceptsByRxcui = new Map();
  let requestCount = 0;
  let conflictingDisplayCount = 0;

  for (const prefix of PREFIXES) {
    let offset = 0;
    let total = null;
    let bucketNew = 0;
    let bucketSeen = 0;
    let cappedWarning = false;

    for (;;) {
      if (offset + PAGE_SIZE > API_CAP) {
        if (!cappedWarning && total !== null && total > API_CAP) {
          console.warn(`  [cap] prefix "${prefix}": total=${total} excede el tope combinado de ${API_CAP}; cobertura parcial para este bucket.`);
          cappedWarning = true;
        }
        break;
      }

      const page = await fetchPage(prefix, offset);
      requestCount++;
      const [pageTotal, displayNames, extra] = page;
      total = pageTotal;

      const strengthsAndForms = extra?.STRENGTHS_AND_FORMS ?? [];
      const rxcuisLists = extra?.RXCUIS ?? [];
      const synonymLists = extra?.DISPLAY_NAME_SYNONYM ?? [];
      const sxdgList = extra?.SXDG_RXCUI ?? [];

      for (let i = 0; i < displayNames.length; i++) {
        const displayName = displayNames[i];
        const rxcuis = rxcuisLists[i] ?? [];
        const forms = strengthsAndForms[i] ?? [];
        const synonyms = (synonymLists[i] ?? []).filter(Boolean);
        const sxdgRxcui = sxdgList[i] || null;

        for (let j = 0; j < rxcuis.length; j++) {
          const rxcui = rxcuis[j];
          if (!rxcui) continue;
          bucketSeen++;
          if (conceptsByRxcui.has(rxcui)) {
            const existing = conceptsByRxcui.get(rxcui);
            if (existing.displayName !== displayName) conflictingDisplayCount++;
            continue;
          }
          bucketNew++;
          const strengthAndForm = (forms[j] ?? '').trim() || null;
          conceptsByRxcui.set(rxcui, { rxcui, displayName, strengthAndForm, synonyms, sxdgRxcui });
        }
      }

      offset += PAGE_SIZE;
      await sleep(REQUEST_DELAY_MS);

      if (displayNames.length === 0 || offset >= total) break;
    }

    console.log(`  prefijo "${prefix}": total_api=${total ?? 0}, +${bucketNew} RXCUIs nuevos (acumulado: ${conceptsByRxcui.size})`);
  }

  console.log(`\nSolicitudes HTTP totales a la API: ${requestCount}`);
  if (conflictingDisplayCount > 0) {
    console.warn(`Aviso: ${conflictingDisplayCount} RXCUIs aparecieron con más de un display name distinto entre buckets (se conservó el primero visto).`);
  }
  return conceptsByRxcui;
}

// -----------------------------------------------------------------------------
// Preparación de filas destino + inserts en batch
// -----------------------------------------------------------------------------
function buildRows(conceptsByRxcui) {
  const concepts = [];
  const designations = [];
  const properties = [];

  for (const c of conceptsByRxcui.values()) {
    const display = c.strengthAndForm ? `${c.displayName} ${c.strengthAndForm}` : c.displayName;
    const definition = c.strengthAndForm;

    concepts.push({ rxcui: c.rxcui, display, definition });

    designations.push({
      rxcui: c.rxcui,
      tag: 'EN',
      langId: EN_LANGUAGE_CONCEPT_ID,
      value: c.displayName,
      preferred: true,
    });
    for (const syn of c.synonyms) {
      designations.push({ rxcui: c.rxcui, tag: 'SYN', langId: '', value: syn, preferred: false });
    }

    if (c.strengthAndForm) {
      properties.push({ rxcui: c.rxcui, code: 'strength_and_form', valueJson: JSON.stringify(c.strengthAndForm) });
    }
    if (c.synonyms.length > 0) {
      properties.push({ rxcui: c.rxcui, code: 'display_name_synonym', valueJson: JSON.stringify(c.synonyms) });
    }
    if (c.sxdgRxcui) {
      properties.push({ rxcui: c.rxcui, code: 'sxdg_rxcui', valueJson: JSON.stringify(c.sxdgRxcui) });
    }
  }

  return { concepts, designations, properties };
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function ensureRxnormSource(client) {
  await client.query(`
    INSERT INTO terminology.terminology_sources
      (id, code, name, owner, official_url, license, created_at, updated_at, row_version)
    VALUES
      (md5('mantra:vademecum:source:RXNORM')::uuid, 'RXNORM',
       'RxNorm (NLM)',
       'U.S. National Library of Medicine',
       'https://www.nlm.nih.gov/research/umls/rxnorm/',
       'Public domain (UMLS Metathesaurus license applies to some sources)',
       now(), now(), 1)
    ON CONFLICT (code) DO NOTHING
  `);
  const { rows } = await client.query(`SELECT id FROM terminology.terminology_sources WHERE code = 'RXNORM'`);
  if (rows.length === 0) throw new Error('No se pudo resolver terminology_sources code=RXNORM');
  return rows[0].id;
}

async function ensureCodeSystem(client, sourceId) {
  await client.query(
    `
    INSERT INTO terminology.code_systems
      (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition, created_at, updated_at, row_version)
    VALUES
      (md5('mantra:rxterms:cs:rxterms')::uuid, $1, 'rxterms',
       'RxTerms (NLM curated RxNorm subset)',
       'http://www.nlm.nih.gov/research/umls/rxnorm',
       false, false, now(), now(), 1)
    ON CONFLICT (internal_code) DO NOTHING
  `,
    [sourceId],
  );
  const { rows } = await client.query(`SELECT id FROM terminology.code_systems WHERE internal_code = 'rxterms'`);
  if (rows.length === 0) throw new Error('No se pudo resolver code_systems internal_code=rxterms');
  return rows[0].id;
}

async function ensureCodeSystemVersion(client, codeSystemId, version) {
  await client.query(
    `
    INSERT INTO terminology.code_system_versions
      (id, code_system_id, version, published_at, is_default, created_at, updated_at, row_version)
    VALUES
      (md5('mantra:rxterms:csv:' || $2)::uuid, $1, $2, now(), true, now(), now(), 1)
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
    SELECT md5('mantra:rxterms:concept:' || x.rxcui)::uuid,
           $1::uuid, x.rxcui, x.display, x.definition, false, true, NULL, now(), now(), 1
    FROM unnest($2::text[], $3::text[], $4::text[]) AS x(rxcui, display, definition)
    ON CONFLICT (code_system_version_id, code) DO NOTHING
  `,
    [csvId, batch.map((b) => b.rxcui), batch.map((b) => b.display), batch.map((b) => b.definition)],
  );
  return res.rowCount ?? 0;
}

async function insertDesignationsBatch(client, batch) {
  const res = await client.query(
    `
    INSERT INTO terminology.concept_designations
      (id, concept_id, language_concept_id, designation_type_concept_id, value, preferred, created_at, updated_at, row_version)
    SELECT md5('mantra:rxterms:designation:' || x.rxcui || ':' || x.tag || ':' || x.value)::uuid,
           md5('mantra:rxterms:concept:' || x.rxcui)::uuid,
           NULLIF(x.lang_id, '')::uuid,
           NULL, x.value, x.preferred, now(), now(), 1
    FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::boolean[]) AS x(rxcui, tag, lang_id, value, preferred)
    ON CONFLICT (id) DO NOTHING
  `,
    [
      batch.map((d) => d.rxcui),
      batch.map((d) => d.tag),
      batch.map((d) => d.langId),
      batch.map((d) => d.value),
      batch.map((d) => d.preferred),
    ],
  );
  return res.rowCount ?? 0;
}

async function insertPropertiesBatch(client, batch) {
  const res = await client.query(
    `
    INSERT INTO terminology.concept_properties
      (id, concept_id, property_code, data_type, value_json, created_at, updated_at, row_version)
    SELECT md5('mantra:rxterms:property:' || x.rxcui || ':' || x.property_code)::uuid,
           md5('mantra:rxterms:concept:' || x.rxcui)::uuid,
           x.property_code, 'json'::terminology.technical_data_type, x.value_json::jsonb,
           now(), now(), 1
    FROM unnest($1::text[], $2::text[], $3::text[]) AS x(rxcui, property_code, value_json)
    ON CONFLICT (id) DO NOTHING
  `,
    [batch.map((p) => p.rxcui), batch.map((p) => p.code), batch.map((p) => p.valueJson)],
  );
  return res.rowCount ?? 0;
}

// -----------------------------------------------------------------------------
// main
// -----------------------------------------------------------------------------
async function main() {
  console.log('=== Importador RxTerms -> terminology.* ===\n');
  console.log('1) Enumerando conceptos vía la API pública de NLM Clinical Table Search Service...\n');

  const conceptsByRxcui = await enumerateAllConcepts();
  console.log(`\nTotal de RXCUIs únicos descubiertos: ${conceptsByRxcui.size}\n`);

  const { concepts, designations, properties } = buildRows(conceptsByRxcui);
  console.log(`Filas a upsertar: ${concepts.length} conceptos, ${designations.length} designaciones, ${properties.length} propiedades.\n`);

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    console.log('2) Resolviendo source/code_system/version...');
    const sourceId = await ensureRxnormSource(client);
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

    console.log('4) Insertando concept_designations en batches...');
    let insertedDesignations = 0;
    for (const batch of chunk(designations, DB_BATCH_SIZE)) {
      insertedDesignations += await insertDesignationsBatch(client, batch);
    }
    console.log(`   ${insertedDesignations} designaciones nuevas insertadas (de ${designations.length} consideradas).\n`);

    console.log('5) Insertando concept_properties en batches...');
    let insertedProperties = 0;
    for (const batch of chunk(properties, DB_BATCH_SIZE)) {
      insertedProperties += await insertPropertiesBatch(client, batch);
    }
    console.log(`   ${insertedProperties} propiedades nuevas insertadas (de ${properties.length} consideradas).\n`);

    console.log('=== Resumen ===');
    console.log(`RXCUIs únicos descubiertos:      ${conceptsByRxcui.size}`);
    console.log(`catalog_concepts nuevos:          ${insertedConcepts}`);
    console.log(`concept_designations nuevas:       ${insertedDesignations}`);
    console.log(`concept_properties nuevas:         ${insertedProperties}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('\nERROR FATAL:', err);
  process.exitCode = 1;
});
