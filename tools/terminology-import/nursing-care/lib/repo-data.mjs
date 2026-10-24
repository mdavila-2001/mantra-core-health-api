// =============================================================================
// Datos normalizados versionados en el repo (`nursing-care/data/`), para que no
// dependan del contenedor donde se generaron (orden del propietario, 2026-10-24:
// «que terminen su trabajo y lo lleven todo a la nube»).
//
// Cada conjunto (NDJSON o JSON) se guarda gzip, partido por filas en partes de a
// lo sumo `PART_MAX_BYTES` sin comprimir (los .gz quedan muy por debajo de 50 MB).
// `MANIFEST.json` guarda, por parte, filas, bytes y SHA-256 del .gz y del texto,
// y se verifica al leer. El gzip de Node escribe mtime 0: misma entrada, mismos bytes.
// =============================================================================

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

export const REPO_DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
export const MANIFEST = 'MANIFEST.json';
export const PART_MAX_BYTES = 40 * 1024 * 1024;

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/** Parte un NDJSON por filas en trozos de a lo sumo `max` bytes. */
export function splitNdjson(text, max = PART_MAX_BYTES) {
  const lines = text.split('\n').filter((l) => l !== '');
  const parts = [];
  let cur = [];
  let size = 0;
  for (const l of lines) {
    const n = Buffer.byteLength(l, 'utf8') + 1;
    if (cur.length && size + n > max) {
      parts.push(cur);
      cur = [];
      size = 0;
    }
    cur.push(l);
    size += n;
  }
  if (cur.length) parts.push(cur);
  return parts.map((p) => `${p.join('\n')}\n`);
}

export function readManifest(dir = REPO_DATA_DIR) {
  const p = join(dir, MANIFEST);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
}

/** Texto de un conjunto versionado, verificando cada parte contra el manifiesto. */
export function readRepoDataset(name, dir = REPO_DATA_DIR) {
  const manifest = readManifest(dir);
  const entry = manifest?.datasets?.[name];
  if (!entry) throw new Error(`No hay «${name}» en ${join(dir, MANIFEST)}`);
  const texts = entry.parts.map((part) => {
    const gz = readFileSync(join(dir, part.file));
    if (sha256(gz) !== part.gzSha256) throw new Error(`SHA-256 distinto en ${part.file}`);
    const text = gunzipSync(gz).toString('utf8');
    if (sha256(Buffer.from(text, 'utf8')) !== part.sha256) throw new Error(`Contenido distinto en ${part.file}`);
    return text;
  });
  return texts.join('');
}

export const parseNdjsonText = (text) => text.split('\n').filter((l) => l.trim() !== '').map((l) => JSON.parse(l));
