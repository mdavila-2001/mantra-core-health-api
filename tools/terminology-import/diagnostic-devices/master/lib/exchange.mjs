// =============================================================================
// Formato de intercambio común de equipos de diagnóstico (ver
// `../../README.md`): validación de filas y lectura/escritura de NDJSON gzip
// partido en archivos de menos de 50 MB.
// =============================================================================

import { createGunzip, gunzipSync, gzipSync } from 'node:zlib';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { createInterface } from 'node:readline';
import { join } from 'node:path';

/** Campos obligatorios de cada fila, en el orden del README. */
export const FIELDS = Object.freeze([
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
]);

/** Campos que no pueden ser null (la cita de la fila y quién fabrica). */
const NOT_NULL = new Set([
  'source',
  'sourceRecordId',
  'sourceUrl',
  'sourceVersion',
  'retrievedAt',
  'manufacturerName',
]);

const SOURCE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATETIME_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const COUNTRY_RE = /^[A-Z]{2}$/;
const REGISTRY_ID_RE = /^[a-z][a-z0-9-]*:\S/;
const SYSTEM_RE =
  /^(?:fda-product-code|emdn|gmdn|gmdn-pt|jmdn|cnd|[a-z]{2}:[a-z0-9-]+)$/;

/** Límite por archivo .gz (GitHub rechaza > 100 MB; la regla común es < 50 MB). */
export const MAX_GZ_BYTES = 45 * 1024 * 1024;

/**
 * Errores de una fila (lista vacía = válida). No corrige nada: una fila
 * inválida se informa y se descarta en la consolidación, nunca se rellena.
 */
export function validateRow(row) {
  const errors = [];
  if (row === null || typeof row !== 'object' || Array.isArray(row))
    return ['la fila no es un objeto'];
  for (const f of FIELDS) {
    if (!(f in row)) errors.push(`falta el campo ${f}`);
    else if (row[f] !== null && typeof row[f] !== 'string')
      errors.push(`${f} debe ser string o null`);
    else if (NOT_NULL.has(f) && (row[f] === null || row[f].trim() === ''))
      errors.push(`${f} no puede ser null ni vacío`);
  }
  if (errors.length) return errors;
  if (!SOURCE_RE.test(row.source))
    errors.push(`source inválido: ${row.source}`);
  if (!/^https?:\/\//.test(row.sourceUrl))
    errors.push(`sourceUrl no es una URL http(s): ${row.sourceUrl}`);
  if (!ISO_DATETIME_RE.test(row.retrievedAt))
    errors.push(`retrievedAt no es ISO 8601 con zona: ${row.retrievedAt}`);
  if (
    row.authorizationDate !== null &&
    !ISO_DATE_RE.test(row.authorizationDate)
  )
    errors.push(`authorizationDate no es YYYY-MM-DD: ${row.authorizationDate}`);
  if (
    row.manufacturerCountry !== null &&
    !COUNTRY_RE.test(row.manufacturerCountry)
  )
    errors.push(
      `manufacturerCountry no es ISO alfa-2: ${row.manufacturerCountry}`,
    );
  if (
    row.manufacturerRegistryId !== null &&
    !REGISTRY_ID_RE.test(row.manufacturerRegistryId)
  )
    errors.push(
      `manufacturerRegistryId sin prefijo de esquema: ${row.manufacturerRegistryId}`,
    );
  if (row.deviceTypeSystem !== null && !SYSTEM_RE.test(row.deviceTypeSystem))
    errors.push(`deviceTypeSystem desconocido: ${row.deviceTypeSystem}`);
  if (
    (row.deviceTypeCode === null) !== (row.deviceTypeSystem === null) &&
    row.deviceTypeSystem !== 'gmdn-pt'
  ) {
    errors.push(
      'deviceTypeCode y deviceTypeSystem van juntos (salvo gmdn-pt, que no tiene código)',
    );
  }
  if (
    'extra' in row &&
    (row.extra === null ||
      typeof row.extra !== 'object' ||
      Array.isArray(row.extra))
  )
    errors.push('extra debe ser un objeto');
  if (row.extra?.deviceTypes !== undefined) {
    if (!Array.isArray(row.extra.deviceTypes))
      errors.push('extra.deviceTypes debe ser una lista');
    else {
      for (const t of row.extra.deviceTypes) {
        if (!t || typeof t.system !== 'string' || !SYSTEM_RE.test(t.system))
          errors.push(`extra.deviceTypes: system inválido (${t?.system})`);
      }
    }
  }
  return errors;
}

/** Clave estable de una fila: `source` + `sourceRecordId`. */
export const rowKey = (row) => `${row.source}\u0000${row.sourceRecordId}`;

/** Lee un .ndjson.gz línea por línea (sin cargar el archivo entero). */
export async function* readNdjsonGz(path) {
  const rl = createInterface({
    input: createReadStream(path).pipe(createGunzip()),
    crlfDelay: Infinity,
  });
  let n = 0;
  for await (const line of rl) {
    n++;
    if (!line.trim()) continue;
    try {
      yield JSON.parse(line);
    } catch (err) {
      throw new Error(`${path}:${n}: JSON inválido (${err.message})`);
    }
  }
}

/** Igual que `readNdjsonGz` pero desde un buffer ya en memoria (git show). */
export function* parseNdjsonGzBuffer(buffer, label) {
  const text = gunzipSync(buffer).toString('utf8');
  let n = 0;
  for (const line of text.split('\n')) {
    n++;
    if (!line.trim()) continue;
    try {
      yield JSON.parse(line);
    } catch (err) {
      throw new Error(`${label}:${n}: JSON inválido (${err.message})`);
    }
  }
}

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/**
 * Escribe `rows` como `<base>.ndjson.gz` o, si no entra en `maxBytes`,
 * `<base>-0001.ndjson.gz`, `-0002`, … sin cortar líneas. Borra antes los
 * archivos viejos de la misma base. Devuelve las entradas para el manifest.
 */
export function writeNdjsonGzSharded(
  dir,
  base,
  rows,
  { maxBytes = MAX_GZ_BYTES, rawChunkBytes = 160 * 1024 * 1024 } = {},
) {
  mkdirSync(dir, { recursive: true });
  const shardRe = new RegExp(
    `^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:-\\d{4})?\\.ndjson\\.gz$`,
  );
  for (const f of readdirSync(dir))
    if (shardRe.test(f)) unlinkSync(join(dir, f));

  // Primero se arman bloques de texto; si un bloque comprimido no entra, se
  // parte por la mitad (por filas) hasta que entre.
  const lines = rows.map((r) => JSON.stringify(r));
  const chunks = [];
  let start = 0;
  let size = 0;
  for (let i = 0; i < lines.length; i++) {
    size += Buffer.byteLength(lines[i]) + 1;
    if (size >= rawChunkBytes) {
      chunks.push([start, i + 1]);
      start = i + 1;
      size = 0;
    }
  }
  if (start < lines.length || lines.length === 0)
    chunks.push([start, lines.length]);

  const blobs = [];
  const pack = (a, b) => {
    const gz = gzipSync(
      Buffer.from(
        lines
          .slice(a, b)
          .map((l) => `${l}\n`)
          .join(''),
        'utf8',
      ),
      { level: 9 },
    );
    if (gz.length > maxBytes && b - a > 1) {
      const mid = a + Math.floor((b - a) / 2);
      pack(a, mid);
      pack(mid, b);
    } else {
      blobs.push({ gz, rows: b - a });
    }
  };
  for (const [a, b] of chunks) pack(a, b);

  const files = blobs.map((blob, i) => {
    const name =
      blobs.length === 1
        ? `${base}.ndjson.gz`
        : `${base}-${String(i + 1).padStart(4, '0')}.ndjson.gz`;
    writeFileSync(join(dir, name), blob.gz);
    return {
      path: name,
      rows: blob.rows,
      bytes: blob.gz.length,
      sha256: sha256(blob.gz),
    };
  });
  return files;
}

/** Archivos de datos de un `out/` (todo `.ndjson.gz`), ordenados. */
export function listOutFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.ndjson.gz'))
    .sort();
}
