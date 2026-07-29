// =============================================================================
// ETL: Importador REAL del catálogo NUCC Health Care Provider Taxonomy
// (especialidades médicas / tipos de proveedor) hacia
// terminology.catalog_concepts.
// =============================================================================
//
// Fuente: CSV público descargable sin cuenta, publicado por el National
// Uniform Claim Committee (NUCC): https://www.nucc.org/. El código HIPAA de
// tipo de proveedor (taxonomy code) es el estándar usado en EE.UU. para
// clasificar la especialidad de un profesional/organización de salud en
// transacciones administrativas (837, NPPES, etc.).
//
// Este catálogo es intrínsecamente pequeño comparado con ICD-10-CM/RxTerms/
// HCPCS: NO existen "cientos de miles" de especialidades médicas reales.
// La corrida real de este importador descubrió y cargó ~880 conceptos — esa
// es la escala correcta y esperada de la fuente, no un fallo del importador.
//
// -----------------------------------------------------------------------------
// Versión del CSV: el enunciado original de esta tarea asumía la versión
// "251" (nucc_taxonomy_251.csv, ~870 filas). Se verificó en vivo contra
// https://www.nucc.org/index.php/code-sets-mainmenu-41/provider-taxonomy-mainmenu-40/csv-mainmenu-57
// que la versión vigente al momento de esta corrida es la "26.1" (efectiva
// 7/1/2026, archivo nucc_taxonomy_261.csv) — 251 ya es una versión anterior
// ("25.1"). Este script usa por defecto la URL de la versión 261 (vigente),
// con NUCC_CSV_URL como override explícito si hiciera falta apuntar a otra.
//
// -----------------------------------------------------------------------------
// Formato del CSV (verificado leyendo el archivo real antes de escribir el
// parser, no asumido): cabecera exacta
//   Code,Grouping,Classification,Specialization,Definition,Notes,Display Name,Section
// 883 filas de datos (corrida real). Puede tener campos con comillas RFC4180
// (comas y comillas escapadas `""` dentro de Definition/Notes) — se usa un
// parser RFC4180 propio (no hay dependencia csv-parse en el repo). No se
// encontraron saltos de línea embebidos en campos en la corrida real, pero
// el parser los soporta de todas formas por robustez.
//
// -----------------------------------------------------------------------------
// Modelo de datos de destino:
//   * code    = columna "Code" (código de taxonomía NUCC, 10 caracteres,
//               p. ej. "207R00000X").
//   * display = columna "Display Name" si no está vacía; si está vacía (no
//               se observó ningún caso en la corrida real, pero se cubre por
//               robustez) se compone como "Classification > Specialization"
//               (o sólo "Classification" si Specialization está vacío).
//   * definition = columna "Definition" (puede ser NULL si el CSV la trae
//               vacía; se observaron 8 filas así en la corrida real, todas
//               agrupadores de alto nivel sin definición clínica propia).
//
// Idempotencia: UUIDs deterministas `md5('mantra:nucc:...')::uuid` (namespace
// separado del de HCPCS/ICD-10-CM/RxTerms) + `ON CONFLICT DO NOTHING`.
// =============================================================================

import 'dotenv/config';
import pg from 'pg';

const DEFAULT_CSV_URL = 'https://www.nucc.org/images/stories/CSV/nucc_taxonomy_261.csv';
const CSV_URL = process.env.NUCC_CSV_URL ?? DEFAULT_CSV_URL;
const CSV_VERSION = process.env.NUCC_CSV_VERSION ?? '26.1';
const BATCH_SIZE = 500;

const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

const SOURCE_CODE = 'NUCC';
const CODE_SYSTEM_INTERNAL_CODE = 'nucc_taxonomy';

// -----------------------------------------------------------------------------
// Parser CSV RFC4180 mínimo (sin dependencias externas: no hay csv-parse en
// el repo). Soporta campos entre comillas dobles con comas, comillas
// escapadas (`""`) y saltos de línea embebidos.
// -----------------------------------------------------------------------------
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\r') {
      // ignorar; el CRLF real se maneja al ver \n
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const EXPECTED_HEADER = [
  'Code',
  'Grouping',
  'Classification',
  'Specialization',
  'Definition',
  'Notes',
  'Display Name',
  'Section',
];

async function downloadCSV() {
  console.log(`Descargando CSV NUCC desde: ${CSV_URL}`);
  const res = await fetch(CSV_URL);
  if (!res.ok) {
    throw new Error(`Descarga del CSV NUCC falló: HTTP ${res.status} para ${CSV_URL}`);
  }
  const text = await res.text();
  console.log(`Descarga completa: ${text.length} bytes.`);
  return text;
}

function parseAndValidate(text) {
  const rows = parseCSV(text).filter((r) => !(r.length === 1 && r[0] === ''));
  if (rows.length === 0) {
    throw new Error('CSV NUCC vacío tras el parseo.');
  }
  const header = rows[0];
  for (let i = 0; i < EXPECTED_HEADER.length; i++) {
    if (header[i] !== EXPECTED_HEADER[i]) {
      throw new Error(
        `Cabecera del CSV NUCC inesperada en la columna ${i}: esperaba "${EXPECTED_HEADER[i]}", vino "${header[i]}". ` +
          `El formato pudo haber cambiado entre versiones del CSV; revisar antes de continuar.`,
      );
    }
  }

  const dataRows = rows.slice(1);
  const idx = {
    code: header.indexOf('Code'),
    grouping: header.indexOf('Grouping'),
    classification: header.indexOf('Classification'),
    specialization: header.indexOf('Specialization'),
    definition: header.indexOf('Definition'),
    displayName: header.indexOf('Display Name'),
    section: header.indexOf('Section'),
  };

  const concepts = [];
  const malformed = [];
  const seenCodes = new Set();
  let duplicateCodes = 0;
  let emptyDefinitions = 0;
  let composedDisplays = 0;

  for (const r of dataRows) {
    if (r.length !== header.length) {
      malformed.push(r);
      continue;
    }
    const code = r[idx.code].trim();
    if (!code) {
      malformed.push(r);
      continue;
    }
    if (seenCodes.has(code)) {
      duplicateCodes++;
      continue;
    }
    seenCodes.add(code);

    const classification = r[idx.classification].trim();
    const specialization = r[idx.specialization].trim();
    const displayNameRaw = r[idx.displayName].trim();
    const definitionRaw = r[idx.definition].trim();

    let display = displayNameRaw;
    if (!display) {
      composedDisplays++;
      display = specialization ? `${classification} - ${specialization}` : classification;
    }

    concepts.push({
      code,
      display,
      definition: definitionRaw || null,
      grouping: r[idx.grouping].trim(),
      classification,
      specialization,
      section: r[idx.section].trim(),
    });

    if (!definitionRaw) emptyDefinitions++;
  }

  return { concepts, malformed, duplicateCodes, emptyDefinitions, composedDisplays, totalDataRows: dataRows.length };
}

// -----------------------------------------------------------------------------
// Persistencia en base de datos
// -----------------------------------------------------------------------------

async function upsertSourceCodeSystemVersion(client, version) {
  await client.query('BEGIN');
  try {
    await client.query(
      `INSERT INTO terminology.terminology_sources
         (id, code, name, owner, official_url, license, created_at, updated_at, row_version)
       VALUES
         (md5('mantra:nucc:source:' || $1)::uuid, $1, $2, $3, $4, $5, now(), now(), 1)
       ON CONFLICT (code) DO NOTHING`,
      [
        SOURCE_CODE,
        'NUCC Health Care Provider Taxonomy',
        'National Uniform Claim Committee',
        'https://www.nucc.org/',
        'Public use per NUCC terms',
      ],
    );

    await client.query(
      `INSERT INTO terminology.code_systems
         (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition,
          created_at, updated_at, row_version)
       SELECT md5('mantra:nucc:cs:' || $1)::uuid, ts.id, $1, $2, $3, true, false, now(), now(), 1
       FROM terminology.terminology_sources ts
       WHERE ts.code = $4
       ON CONFLICT (internal_code) DO NOTHING`,
      [
        CODE_SYSTEM_INTERNAL_CODE,
        'NUCC Health Care Provider Taxonomy (medical specialties)',
        'http://nucc.org/provider-taxonomy',
        SOURCE_CODE,
      ],
    );

    await client.query(
      `INSERT INTO terminology.code_system_versions
         (id, code_system_id, version, published_at, is_default, created_at, updated_at, row_version)
       SELECT md5('mantra:nucc:csv:' || $1)::uuid, cs.id, $1, now(), true, now(), now(), 1
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
    throw new Error(`No se pudo resolver code_system_version_id para nucc_taxonomy/${version}`);
  }
  return rows[0].id;
}

async function insertConceptsBatch(client, codeSystemVersionId, batch) {
  const res = await client.query(
    `
    INSERT INTO terminology.catalog_concepts
      (id, code_system_version_id, code, display, definition, abstract, selectable, state_concept_id, created_at, updated_at, row_version)
    SELECT md5('mantra:nucc:concept:' || x.code)::uuid,
           $1::uuid, x.code, x.display, x.definition, false, true, NULL, now(), now(), 1
    FROM unnest($2::text[], $3::text[], $4::text[]) AS x(code, display, definition)
    ON CONFLICT (code_system_version_id, code) DO NOTHING
  `,
    [codeSystemVersionId, batch.map((c) => c.code), batch.map((c) => c.display), batch.map((c) => c.definition)],
  );
  return res.rowCount ?? 0;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main() {
  console.log('=== Importador NUCC Health Care Provider Taxonomy (especialidades médicas) ===');
  console.log(`DB destino: ${DB_CONFIG.database}@${DB_CONFIG.host}:${DB_CONFIG.port}`);
  console.log('NOTA: esta fuente es intrínsecamente pequeña (~870-900 especialidades). No se');
  console.log('debe esperar ni inflar un conteo mayor: esa es la escala real de la fuente.\n');

  const csvText = await downloadCSV();
  const { concepts, malformed, duplicateCodes, emptyDefinitions, composedDisplays, totalDataRows } =
    parseAndValidate(csvText);

  console.log(`\nFilas de datos en el CSV: ${totalDataRows}`);
  console.log(`Conceptos válidos parseados: ${concepts.length}`);
  console.log(`Filas malformadas descartadas (columna count distinta): ${malformed.length}`);
  console.log(`Códigos duplicados en el CSV (se conservó la 1a aparición): ${duplicateCodes}`);
  console.log(`Definiciones vacías en el CSV: ${emptyDefinitions}`);
  console.log(`Displays compuestos (Display Name vacío en el CSV): ${composedDisplays}`);

  if (malformed.length > 0) {
    console.warn('ADVERTENCIA: filas malformadas (primeras 3):', malformed.slice(0, 3));
  }

  console.log('\nMuestra de 3 conceptos parseados (verificación manual antes de insertar):');
  for (const c of concepts.slice(0, 3)) {
    console.log(`  ${c.code} | ${c.display} | def: ${(c.definition ?? '').slice(0, 60)}...`);
  }
  const known = concepts.find((c) => c.code === '207R00000X');
  console.log(`  [control conocido] 207R00000X -> ${known ? known.display : 'NO ENCONTRADO'}`);

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    console.log('\n[1/2] Upsert de terminology_sources / code_systems / code_system_versions...');
    const codeSystemVersionId = await upsertSourceCodeSystemVersion(client, CSV_VERSION);
    console.log(`code_system_version_id (nucc_taxonomy/${CSV_VERSION}) = ${codeSystemVersionId}`);

    console.log('\n[2/2] Insertando catalog_concepts en batches...');
    let inserted = 0;
    for (const batch of chunk(concepts, BATCH_SIZE)) {
      inserted += await insertConceptsBatch(client, codeSystemVersionId, batch);
    }
    console.log(`Filas NUEVAS insertadas en esta corrida: ${inserted} (el resto ya existía o fue duplicado por ON CONFLICT DO NOTHING).`);

    const { rows } = await client.query(
      `SELECT count(*)::bigint AS n
       FROM terminology.catalog_concepts cc
       JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
       JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
       WHERE cs.internal_code = $1`,
      [CODE_SYSTEM_INTERNAL_CODE],
    );
    const dbCount = Number(rows[0].n);

    console.log('\n=== RESUMEN FINAL ===');
    console.log(`Filas de datos en el CSV fuente:      ${totalDataRows}`);
    console.log(`Conceptos únicos parseados:            ${concepts.length}`);
    console.log(`Filas nuevas insertadas esta corrida:  ${inserted}`);
    console.log(`Conteo total en DB (nucc_taxonomy):     ${dbCount}`);
    if (dbCount < concepts.length) {
      console.log(`ADVERTENCIA: faltan ${concepts.length - dbCount} conceptos para el 100% de cobertura.`);
    } else {
      console.log('Cobertura del 100% de los conceptos parseados.');
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('\nERROR FATAL en el importador NUCC:', err);
  process.exitCode = 1;
});
