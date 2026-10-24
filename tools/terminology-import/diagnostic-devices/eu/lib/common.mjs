// =============================================================================
// Piezas compartidas del importador de equipos de diagnóstico de Europa.
// Transporte, identidad, formato común y escritura del NDJSON: nada de acá
// decide qué es un equipo de diagnóstico (eso vive en `emdn-scope.mjs`) ni
// cómo se lee cada fuente (`sources/*.mjs`).
// =============================================================================

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';

const HERE = dirname(fileURLToPath(import.meta.url));

/** …/tools/terminology-import/diagnostic-devices/eu */
export const EU_DIR = resolve(HERE, '..');
/** Raíz del repo de la API. */
export const API_ROOT = resolve(EU_DIR, '../../../..');

/**
 * Crudos FUERA de git (hermano del repo, como `../glossary-data-build`).
 * Se redefine con `DX_DEVICES_BUILD_DIR`.
 */
export const BUILD_DIR = resolve(
  process.env.DX_DEVICES_BUILD_DIR ??
    resolve(API_ROOT, '..', 'diagnostic-devices-data'),
  'eu',
);

export const cacheDir = (...parts) => join(BUILD_DIR, 'cache', ...parts);
/** Salida normalizada DENTRO de git (comprimida, partes < 50 MB). */
export const outDir = (...parts) => join(EU_DIR, 'out', ...parts);

export function ensureDir(path) {
  mkdirSync(path, { recursive: true });
  return path;
}

export function nowIso() {
  return new Date().toISOString();
}

export function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

/** Mismo patrón que el resto de `tools/terminology-import/`: md5 de una clave legible, con guiones. */
export function md5uuid(key) {
  const h = createHash('md5').update(key, 'utf8').digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function writeJson(path, value) {
  ensureDir(dirname(path));
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

// -----------------------------------------------------------------------------
// Transporte: curl respeta HTTPS_PROXY y el bundle de CA del entorno sin
// configuración extra, y distingue un bloqueo del proxy (exit 56) de un error
// del servidor.
// -----------------------------------------------------------------------------

/**
 * @returns {{ ok: boolean, status: number|null, blocked: boolean, error: string|null, file: string|null, bytes: number }}
 */
export function httpFetch(
  url,
  {
    method = 'GET',
    headers = {},
    body = null,
    outFile = null,
    timeoutS = 120,
  } = {},
) {
  const args = [
    '-sS',
    '-L',
    '--max-time',
    String(timeoutS),
    '-X',
    method,
    '-w',
    '%{http_code}',
    '-o',
    outFile ?? '/dev/null',
  ];
  for (const [k, v] of Object.entries(headers)) args.push('-H', `${k}: ${v}`);
  if (body !== null) args.push('--data-binary', body);
  args.push(url);
  if (outFile) ensureDir(dirname(outFile));
  try {
    const code = execFileSync('curl', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    const status = Number(code) || null;
    const bytes = outFile && existsSync(outFile) ? statSync(outFile).size : 0;
    return {
      ok: status !== null && status >= 200 && status < 300,
      status,
      blocked: false,
      error: null,
      file: outFile,
      bytes,
    };
  } catch (err) {
    const stderr = String(err.stderr ?? err.message ?? err);
    // curl 56 + "CONNECT tunnel failed, response 403": la política de red del entorno.
    const blocked = err.status === 56 && /CONNECT tunnel failed/.test(stderr);
    return {
      ok: false,
      status: null,
      blocked,
      error: stderr.trim().split('\n').pop(),
      file: null,
      bytes: 0,
    };
  }
}

// -----------------------------------------------------------------------------
// Formato común (ver ../README.md). Todos los campos presentes; lo que la
// fuente no publica va en null.
// -----------------------------------------------------------------------------

export const DEVICE_FIELDS = [
  'source',
  'sourceRecordId',
  'sourceUrl',
  'sourceVersion',
  'retrievedAt',
  'deviceTypeCode',
  'deviceTypeSystem',
  'deviceTypeName',
  'manufacturerName',
  'manufacturerCountry',
  'manufacturerRegistryId',
  'brandName',
  'model',
  'udiDi',
  'riskClass',
  'authorizationId',
  'authorizationDate',
  'status',
];

export const MANUFACTURER_FIELDS = [
  'source',
  'sourceRecordId',
  'sourceUrl',
  'sourceVersion',
  'retrievedAt',
  'manufacturerRegistryId',
  'manufacturerName',
  'manufacturerCountry',
  'actorRole',
];

const PROVENANCE_REQUIRED = [
  'source',
  'sourceRecordId',
  'sourceUrl',
  'retrievedAt',
];

/** Texto limpio o null: nunca cadena vacía, nunca "null" literal. */
export function clean(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).replace(/\s+/g, ' ').trim();
  return s === '' || s.toLowerCase() === 'null' ? null : s;
}

function build(fields, input, idPrefix) {
  const record = {};
  for (const f of fields) record[f] = clean(input[f]);
  for (const f of PROVENANCE_REQUIRED)
    if (!record[f])
      throw new Error(
        `Registro sin procedencia (${f}) de ${input.source ?? '¿fuente?'}: ${JSON.stringify(input).slice(0, 200)}`,
      );
  if (
    record.manufacturerCountry &&
    !/^[A-Z]{2}$/.test(record.manufacturerCountry)
  )
    throw new Error(
      `manufacturerCountry no es ISO alfa-2: ${record.manufacturerCountry}`,
    );
  record.id = md5uuid(
    `mantra:dx-devices:${idPrefix}:${record.source}:${record.sourceRecordId}`,
  );
  const ext = Object.fromEntries(
    Object.entries(input.extensions ?? {}).filter(
      ([, v]) => v !== null && v !== undefined && v !== '',
    ),
  );
  record.extensions = ext;
  return record;
}

export const makeDeviceRecord = (input) =>
  build(DEVICE_FIELDS, input, 'device');
export const makeManufacturerRecord = (input) =>
  build(MANUFACTURER_FIELDS, input, 'manufacturer');

// -----------------------------------------------------------------------------
// Deduplicación exacta (nunca difusa): UDI-DI, certificado, o fabricante +
// modelo normalizados. Devuelve qué fila ganó y por qué clave cayó cada
// duplicado, para que el reporte de cobertura lo muestre.
// -----------------------------------------------------------------------------

export const normKey = (s) =>
  clean(s)?.normalize('NFKC').toUpperCase().replace(/\s+/g, ' ') ?? null;

export function dedupeKeys(r) {
  const keys = [];
  if (r.udiDi) keys.push(`udi:${normKey(r.udiDi)}`);
  if (r.authorizationId && r.model)
    keys.push(`cert+model:${normKey(r.authorizationId)}|${normKey(r.model)}`);
  if ((r.manufacturerRegistryId || r.manufacturerName) && r.model)
    keys.push(
      `mf+model:${normKey(r.manufacturerRegistryId ?? r.manufacturerName)}|${normKey(r.model)}|${normKey(r.brandName) ?? ''}`,
    );
  return keys;
}

export function dedupe(records) {
  const seen = new Map();
  const kept = [];
  const duplicates = [];
  for (const r of records) {
    const keys = dedupeKeys(r);
    const hit = keys.find((k) => seen.has(k));
    if (hit) {
      duplicates.push({ id: r.id, duplicateOf: seen.get(hit), key: hit });
      continue;
    }
    for (const k of keys) seen.set(k, r.id);
    kept.push(r);
  }
  return { kept, duplicates };
}

// -----------------------------------------------------------------------------
// NDJSON comprimido y partido: orden determinista por `id`, partes < maxBytes
// comprimidos, y las partes viejas que sobran se borran.
// -----------------------------------------------------------------------------

export function writeNdjsonGzParts(
  baseName,
  rows,
  { dir = outDir(), maxBytes = 45 * 1024 * 1024 } = {},
) {
  ensureDir(dir);
  const sorted = [...rows].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  );
  const parts = [];
  let chunk = [];
  let chunkBytes = 0;
  // ~8:1 de compresión típica en NDJSON; se corta por tamaño crudo con margen.
  const rawBudget = maxBytes * 6;
  const flush = () => {
    const name = `${baseName}-${String(parts.length + 1).padStart(3, '0')}.ndjson.gz`;
    const buf = gzipSync(Buffer.from(chunk.join(''), 'utf8'), { level: 9 });
    if (buf.length >= maxBytes)
      throw new Error(
        `${name} pesa ${buf.length} B comprimido: bajar maxBytes`,
      );
    writeFileSync(join(dir, name), buf);
    parts.push({ file: name, rows: chunk.length, bytes: buf.length });
    chunk = [];
    chunkBytes = 0;
  };
  for (const r of sorted) {
    const line = `${JSON.stringify(r)}\n`;
    if (chunkBytes + line.length > rawBudget && chunk.length) flush();
    chunk.push(line);
    chunkBytes += line.length;
  }
  if (chunk.length) flush();
  const keep = new Set(parts.map((p) => p.file));
  for (const f of readdirSync(dir))
    if (
      f.startsWith(`${baseName}-`) &&
      f.endsWith('.ndjson.gz') &&
      !keep.has(f)
    )
      unlinkSync(join(dir, f));
  return parts;
}

export function readNdjsonGzParts(baseName, { dir = outDir() } = {}) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.startsWith(`${baseName}-`) && f.endsWith('.ndjson.gz'))
    .sort()
    .flatMap((f) =>
      gunzipSync(readFileSync(join(dir, f)))
        .toString('utf8')
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l)),
    );
}

// -----------------------------------------------------------------------------
// CSV mínimo (RFC 4180: comillas dobles, separador configurable, BOM).
// -----------------------------------------------------------------------------

export function parseCsv(text, { delimiter = ',' } = {}) {
  const src = text.replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delimiter) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows.filter((r) => r.some((v) => v !== ''));
  if (!header) return { header: [], records: [] };
  return {
    header,
    records: body.map((r) =>
      Object.fromEntries(header.map((h, j) => [h, r[j] ?? ''])),
    ),
  };
}

/**
 * Resuelve encabezados por alias exactos (sin distinguir mayúsculas ni
 * espacios). Si falta uno obligatorio, falla mostrando los encabezados reales:
 * nunca se rellena un campo adivinando la columna.
 */
export function resolveHeaders(header, spec, label) {
  const norm = (h) =>
    String(h)
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  const byNorm = new Map(header.map((h) => [norm(h), h]));
  const out = {};
  const missing = [];
  for (const [key, { aliases, required }] of Object.entries(spec)) {
    const hit = aliases.map(norm).find((a) => byNorm.has(a));
    if (hit) out[key] = byNorm.get(hit);
    else if (required) missing.push(`${key} (${aliases.join(' | ')})`);
  }
  if (missing.length)
    throw new Error(
      `${label}: faltan columnas obligatorias: ${missing.join('; ')}. Encabezados reales: ${JSON.stringify(header)}`,
    );
  return out;
}
