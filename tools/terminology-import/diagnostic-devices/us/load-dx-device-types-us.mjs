#!/usr/bin/env node
// =============================================================================
// Carga los TIPOS de equipo de diagnóstico de FDA (product codes de alcance
// diagnóstico, `out/fda-product-codes.json`) en `terminology.*`, que es a
// donde apunta `diagnostic_units.diagnostic_equipment.equipment_type_concept_id`.
// Dry-run por defecto.
//
//   terminology_sources / code_systems / code_system_versions   `fda-product-code`
//   catalog_concepts      un concepto por product code (display = nombre FDA verbatim)
//   concept_properties    panel, clase, regulación 21 CFR, regla y motivo de alcance,
//                         ficha oficial, conteos de registros y fabricantes del NDJSON
//
// Fabricante, marca y modelo NO se cargan: el modelo de datos no tiene dónde
// (ver la propuesta para `mantra-core-health-model` en el reporte de la rama).
// Un product code sin nombre publicado (falta la clasificación oficial) no se
// carga: `display` no puede inventarse.
//
// Idempotente: ids deterministas `md5('mantra:dx-us:…')` + `ON CONFLICT DO
// NOTHING`; la segunda corrida inserta 0 filas. No escribe DDL.
//
//   node --max-old-space-size=8192 tools/terminology-import/diagnostic-devices/us/load-dx-device-types-us.mjs           # dry-run (lee ~1,1 M filas)
//   node --max-old-space-size=8192 tools/terminology-import/diagnostic-devices/us/load-dx-device-types-us.mjs --apply   # .env DB_*
// =============================================================================

import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import pg from 'pg';
import { manufacturerKey } from './lib/format.mjs';
import { OUT_DIR } from './lib/paths.mjs';

const DRY_RUN = !process.argv.includes('--apply');
const SOURCE_CODE = 'FDA_CDRH';
const CODE_SYSTEM = 'fda-product-code';
const CANONICAL_URL = 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPCD/classification.cfm';

const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

/** Igual que `md5('…')::uuid` de PostgreSQL. */
export function md5Uuid(key) {
  const h = createHash('md5').update(key, 'utf8').digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * Versión del code system = la de la clasificación que dio los nombres de los
 * product codes: el export oficial de openFDA si está, si no la del espejo.
 */
export function codeSystemVersion(manifest) {
  const official = (manifest.official ?? []).find((f) => /device\/classification\//.test(f.dest ?? ''));
  if (official) return `openFDA device/classification export ${official.exportDate ?? 'desconocida'}`;
  const input = (manifest.inputs ?? []).find((i) => /classification|foiclass/i.test(i.source));
  return input?.version ?? 'desconocida';
}

export function buildPlan(productCodes, ndjsonRows, version) {
  const stats = new Map();
  for (const r of ndjsonRows) {
    if (!r.deviceTypeCode) continue;
    const s = stats.get(r.deviceTypeCode) ?? { records: 0, manufacturers: new Set(), bySource: {} };
    s.records++;
    s.bySource[r.source] = (s.bySource[r.source] ?? 0) + 1;
    const mk = manufacturerKey(r.manufacturerName);
    if (mk) s.manufacturers.add(mk);
    stats.set(r.deviceTypeCode, s);
  }
  const csvId = md5Uuid(`mantra:dx-us:csv:${version}`);
  const included = productCodes.filter((p) => p.include);
  const loadable = included.filter((p) => p.deviceName);
  const concepts = [];
  const properties = [];
  for (const p of loadable) {
    const id = md5Uuid(`mantra:dx-us:concept:${p.productCode}`);
    concepts.push([id, csvId, p.productCode, p.deviceName, null]);
    const s = stats.get(p.productCode);
    const props = {
      fda_review_panel: ['code', p.panel],
      fda_device_class: ['code', p.deviceClass],
      cfr_regulation_number: ['code', p.regulationNumber],
      diagnostic_scope_rule: ['code', p.rule],
      diagnostic_scope_reason: ['text', p.reason],
      official_record_url: ['string', p.url],
      registry_record_count: ['integer', s?.records ?? 0],
      registry_records_by_source: ['json', s?.bySource ?? {}],
      manufacturer_count: ['integer', s?.manufacturers.size ?? 0],
    };
    for (const [code, [type, value]] of Object.entries(props)) {
      if (value === null || value === undefined) continue;
      properties.push([md5Uuid(`mantra:dx-us:property:${p.productCode}:${code}`), id, code, type, JSON.stringify(value)]);
    }
  }
  return { csvId, version, included: included.length, skippedWithoutName: included.length - loadable.length, concepts, properties };
}

function readNdjson() {
  return readdirSync(OUT_DIR)
    .filter((f) => /^fda-[a-z0-9-]+-\d{4}\.ndjson\.gz$/.test(f))
    .sort()
    .flatMap((f) => gunzipSync(readFileSync(join(OUT_DIR, f))).toString('utf8').split('\n').filter(Boolean).map(JSON.parse));
}

async function insert(client, sql, tuples, width) {
  let n = 0;
  for (let i = 0; i < tuples.length; i += 1000) {
    const chunk = tuples.slice(i, i + 1000);
    const params = chunk.flat();
    const values = chunk.map((_, j) => `(${Array.from({ length: width }, (__, k) => `$${j * width + k + 1}`).join(', ')})`).join(', ');
    const res = await client.query(sql.replace('$VALUES', values), params);
    n += res.rowCount ?? 0;
  }
  return n;
}

async function main() {
  const productCodes = JSON.parse(readFileSync(join(OUT_DIR, 'fda-product-codes.json'), 'utf8'));
  const manifest = JSON.parse(readFileSync(join(OUT_DIR, 'manifest.json'), 'utf8'));
  const version = codeSystemVersion(manifest);
  const plan = buildPlan(productCodes, readNdjson(), version);
  console.log(`Product codes en alcance: ${plan.included} · cargables: ${plan.concepts.length} · sin nombre publicado (no se cargan): ${plan.skippedWithoutName}`);
  console.log(`Propiedades: ${plan.properties.length} · versión: ${version}`);
  if (DRY_RUN) {
    console.log('Dry-run: no se tocó la base. Usar --apply para cargar.');
    return;
  }
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO terminology.terminology_sources (id, code, name, owner, official_url, license, created_at, updated_at, row_version)
       VALUES ($1, $2, $3, $4, $5, $6, now(), now(), 1) ON CONFLICT DO NOTHING`,
      [md5Uuid(`mantra:dx-us:source:${SOURCE_CODE}`), SOURCE_CODE, 'FDA Center for Devices and Radiological Health', 'U.S. Food and Drug Administration', 'https://www.fda.gov/medical-devices', 'Dominio público (17 U.S.C. § 105); openFDA: CC0'],
    );
    await client.query(
      `INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition, created_at, updated_at, row_version)
       SELECT $1, ts.id, $2, $3, $4, true, false, now(), now(), 1 FROM terminology.terminology_sources ts WHERE ts.code = $5
       ON CONFLICT DO NOTHING`,
      [md5Uuid(`mantra:dx-us:cs:${CODE_SYSTEM}`), CODE_SYSTEM, 'FDA Product Classification — product codes', CANONICAL_URL, SOURCE_CODE],
    );
    await client.query(
      `INSERT INTO terminology.code_system_versions (id, code_system_id, version, published_at, is_default, created_at, updated_at, row_version)
       SELECT $1, cs.id, $2, now(), true, now(), now(), 1 FROM terminology.code_systems cs WHERE cs.internal_code = $3
       ON CONFLICT DO NOTHING`,
      [plan.csvId, version, CODE_SYSTEM],
    );
    const c = await insert(
      client,
      `INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, definition, abstract, selectable, created_at, updated_at, row_version)
       SELECT v.id::uuid, v.csv::uuid, v.code, v.display, v.def, false, true, now(), now(), 1 FROM (VALUES $VALUES) AS v(id, csv, code, display, def)
       ON CONFLICT DO NOTHING`,
      plan.concepts,
      5,
    );
    const p = await insert(
      client,
      `INSERT INTO terminology.concept_properties (id, concept_id, property_code, data_type, value_json, created_at, updated_at, row_version)
       SELECT v.id::uuid, v.cid::uuid, v.code, v.t::terminology.technical_data_type, v.val::jsonb, now(), now(), 1 FROM (VALUES $VALUES) AS v(id, cid, code, t, val)
       ON CONFLICT DO NOTHING`,
      plan.properties,
      5,
    );
    await client.query('COMMIT');
    console.log(`Insertados: ${c} conceptos · ${p} propiedades (el resto ya existía).`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
