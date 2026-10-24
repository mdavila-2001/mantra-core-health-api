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

/** Página de una API guardada en el caché (gzip o JSON plano de corridas viejas). */
export function readPageFile(path) {
  const buf = readFileSync(path);
  return JSON.parse(
    (path.endsWith('.gz') ? gunzipSync(buf) : buf).toString('utf8'),
  );
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
// Formato común: lo define `../README.md` (escrito por la sesión `master`; acá
// solo se respeta). Todos los campos presentes; lo que la fuente no publica va
// en null; la cita de la fila y el fabricante nunca son null.
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

const NOT_NULL = [
  'source',
  'sourceRecordId',
  'sourceUrl',
  'sourceVersion',
  'retrievedAt',
  'manufacturerName',
];
const SOURCE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATETIME_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const REGISTRY_ID_RE = /^[a-z][a-z0-9-]*:\S/;
const SYSTEM_RE =
  /^(?:fda-product-code|emdn|gmdn|gmdn-pt|jmdn|cnd|[a-z]{2}:[a-z0-9-]+)$/;

/** Fila que no cumple el formato común: se cuenta y se descarta, nunca se rellena. */
export class RowError extends Error {}

/** Texto limpio o null: nunca cadena vacía, nunca "null" literal. */
export function clean(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).replace(/\s+/g, ' ').trim();
  return s === '' || s.toLowerCase() === 'null' ? null : s;
}

/** Fecha ISO (con o sin hora) → `YYYY-MM-DD`; cualquier otra forma → null. */
export function isoDate(value) {
  const m = /^(\d{4}-\d{2}-\d{2})(?:$|[T ])/.exec(clean(value) ?? '');
  return m ? m[1] : null;
}

function compactExtra(extra = {}) {
  return Object.fromEntries(
    Object.entries(extra).filter(
      ([, v]) => v !== null && v !== undefined && v !== '',
    ),
  );
}

export function makeDeviceRecord(input) {
  const r = {};
  for (const f of DEVICE_FIELDS) r[f] = clean(input[f]);
  const fail = (msg) => {
    throw new RowError(
      `${msg} (${r.source ?? '¿fuente?'}:${r.sourceRecordId ?? '¿id?'})`,
    );
  };
  for (const f of NOT_NULL) if (!r[f]) fail(`${f} no puede ser null`);
  if (!SOURCE_RE.test(r.source)) fail(`source inválido: ${r.source}`);
  if (!/^https?:\/\//.test(r.sourceUrl)) fail(`sourceUrl no es http(s)`);
  if (!ISO_DATETIME_RE.test(r.retrievedAt))
    fail(`retrievedAt no es ISO 8601 con zona: ${r.retrievedAt}`);
  if (r.authorizationDate && !ISO_DATE_RE.test(r.authorizationDate))
    fail(`authorizationDate no es YYYY-MM-DD: ${r.authorizationDate}`);
  if (r.manufacturerCountry && !/^[A-Z]{2}$/.test(r.manufacturerCountry))
    fail(`manufacturerCountry no es ISO alfa-2: ${r.manufacturerCountry}`);
  if (
    r.manufacturerRegistryId &&
    !REGISTRY_ID_RE.test(r.manufacturerRegistryId)
  )
    fail(
      `manufacturerRegistryId sin prefijo de esquema: ${r.manufacturerRegistryId}`,
    );
  if (r.deviceTypeSystem && !SYSTEM_RE.test(r.deviceTypeSystem))
    fail(`deviceTypeSystem desconocido: ${r.deviceTypeSystem}`);
  if ((r.deviceTypeCode === null) !== (r.deviceTypeSystem === null))
    fail('deviceTypeCode y deviceTypeSystem van juntos');
  r.extra = compactExtra(input.extra);
  return r;
}

/** Clave estable de una fila (la misma que usa `master/`). */
export const rowKey = (r) => `${r.source}\u0000${r.sourceRecordId}`;

// -----------------------------------------------------------------------------
// Deduplicación exacta (nunca difusa): misma fila de la misma fuente, mismo
// UDI-DI, mismo certificado + modelo, o mismo fabricante + modelo + marca
// normalizados (mayúsculas, espacios colapsados).
// -----------------------------------------------------------------------------

export const normKey = (s) =>
  clean(s)?.normalize('NFKC').toUpperCase().replace(/\s+/g, ' ') ?? null;

/**
 * Claves de deduplicación. `check` son las que pueden marcar una fila como
 * duplicada; `register` las que deja anotadas para las siguientes. Si la fila
 * tiene UDI-DI, solo cuenta como duplicada por fila o por UDI-DI: dos UDI-DI
 * distintos con el mismo fabricante + modelo (variantes de tamaño o de
 * presentación de una misma Basic UDI-DI) son equipos distintos. Fabricante +
 * modelo y certificado + modelo solo deciden cuando la fila no trae UDI-DI.
 */
export function dedupeKeys(r) {
  const row = `row:${rowKey(r)}`;
  const udi = r.udiDi ? `udi:${normKey(r.udiDi)}` : null;
  const soft = [];
  if (r.authorizationId && r.model)
    soft.push(`cert+model:${normKey(r.authorizationId)}|${normKey(r.model)}`);
  if (r.model)
    soft.push(
      `mf+model:${normKey(r.manufacturerRegistryId ?? r.manufacturerName)}|${normKey(r.model)}|${normKey(r.brandName) ?? ''}`,
    );
  return udi
    ? { check: [row, udi], register: [row, udi, ...soft] }
    : { check: [row, ...soft], register: [row, ...soft] };
}

export function dedupe(records) {
  const seen = new Map();
  const kept = [];
  const duplicates = [];
  for (const r of records) {
    const { check, register } = dedupeKeys(r);
    const hit = check.find((k) => seen.has(k));
    if (hit) {
      duplicates.push({
        row: rowKey(r),
        duplicateOf: seen.get(hit),
        key: hit.split(':')[0],
      });
      continue;
    }
    for (const k of register) if (!seen.has(k)) seen.set(k, rowKey(r));
    kept.push(r);
  }
  return { kept, duplicates };
}

// -----------------------------------------------------------------------------
// NDJSON gzip partido (`<base>-0001.ndjson.gz`, …): orden determinista, partes
// < maxBytes comprimidos, sin cortar líneas; las partes viejas que sobran se
// borran. Devuelve path, filas y sha256 de cada parte para el manifest.
// -----------------------------------------------------------------------------

export function writeNdjsonGzParts(
  baseName,
  rows,
  { dir = outDir(), maxBytes = 45 * 1024 * 1024, sortKey = rowKey } = {},
) {
  ensureDir(dir);
  const sorted = rows
    .map((r) => [sortKey(r), r])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([, r]) => r);
  const parts = [];
  let chunk = [];
  let chunkBytes = 0;
  // Se corta por tamaño crudo con margen (el NDJSON comprime ~8:1).
  const rawBudget = maxBytes * 6;
  const flush = () => {
    const name = `${baseName}-${String(parts.length + 1).padStart(4, '0')}.ndjson.gz`;
    const buf = gzipSync(Buffer.from(chunk.join(''), 'utf8'), { level: 9 });
    if (buf.length >= maxBytes)
      throw new Error(
        `${name} pesa ${buf.length} B comprimido: bajar maxBytes`,
      );
    writeFileSync(join(dir, name), buf);
    parts.push({
      path: name,
      rows: chunk.length,
      bytes: buf.length,
      sha256: createHash('sha256').update(buf).digest('hex'),
    });
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
  const keep = new Set(parts.map((p) => p.path));
  for (const f of readdirSync(dir))
    if (
      new RegExp(`^${baseName}-\\d{4}\\.ndjson\\.gz$`).test(f) &&
      !keep.has(f)
    )
      unlinkSync(join(dir, f));
  return parts;
}

export function readNdjsonGzParts(baseName, { dir = outDir() } = {}) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => new RegExp(`^${baseName}-\\d{4}\\.ndjson\\.gz$`).test(f))
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
  // Sin el sufijo entre paréntesis («TERM EMDN (v.2026)» → «TERM EMDN»).
  const norm = (h) =>
    String(h)
      .replace(/\([^)]*\)/g, '')
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
