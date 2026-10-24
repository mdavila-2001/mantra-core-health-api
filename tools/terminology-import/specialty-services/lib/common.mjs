// =============================================================================
// Servicios por especialidad · utilidades de transporte e identidad.
//
// Nada de acá decide contenido clínico: normalización de texto para comparar,
// rutas fuera de git, descarga con caché y verificación de SHA-256, un lector
// de tar mínimo para abrir el paquete npm sin dependencias nuevas, y la copia
// comprimida del corpus que sí se versiona (`data/`).
// =============================================================================

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';

import { BUILD_DIR as GLOSSARY_BUILD_DIR } from '../../lib/glossary-es/common.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Raíz del repo de la API (…/tools/terminology-import/specialty-services/lib → ../../../..). */
export const API_ROOT = resolve(HERE, '../../../..');

/** Datos curados (reglas de evidencia, foto del value set del modelo): versionados en git. */
export const CURATED_DIR = join(API_ROOT, 'src/common/seed/data/specialty-services');

/**
 * Carpeta de trabajo FUERA de git: caché de las descargas y corpus NDJSON.
 * Por defecto `<glossary-data-build>/specialty-services`; se redefine con
 * `SPECIALTY_SERVICES_BUILD_DIR`.
 */
export const BUILD_DIR = process.env.SPECIALTY_SERVICES_BUILD_DIR ?? join(GLOSSARY_BUILD_DIR, 'specialty-services');

export const CORPUS_PATH = () => join(BUILD_DIR, 'specialty-services.ndjson');
export const META_PATH = () => join(BUILD_DIR, 'specialty-services.meta.json');

/**
 * Copia versionada del corpus normalizado: `.gz` partido en archivos de menos
 * de 50 MB (GitHub rechaza los de más de 100 MB). Los bytes de las fuentes
 * crudas NO van acá: se bajan de nuevo con URL, versión y SHA-256 fijos
 * (`lib/sources.mjs`, `SOURCES.md`).
 */
export const REPO_DATA_DIR = join(HERE, '..', 'data');

/** Tope de texto sin comprimir por parte: muy por debajo de 50 MB aun sin compresión. */
const PART_MAX_BYTES = 40 * 1024 * 1024;

export function ensureDir(path) {
  mkdirSync(path, { recursive: true });
  return path;
}

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Forma de comparación: mayúsculas, sin tildes, espacios simples. Sólo sirve
 * para comparar; lo que se guarda y se muestra es siempre el texto de la fuente.
 */
export function norm(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Texto visible: el de la fuente, con los espacios repetidos colapsados. */
export function clean(text) {
  return String(text).replace(/\s+/g, ' ').trim();
}

/**
 * Baja una URL a la caché (una vez) y verifica su SHA-256. Un hash distinto al
 * declarado aborta: el corpus se arma sólo con bytes que alguien revisó.
 */
export async function fetchCached(url, { sha256: expected, name }) {
  const dir = ensureDir(join(BUILD_DIR, 'cache'));
  const path = join(dir, name);
  if (!existsSync(path)) {
    const res = await fetch(url, { headers: { 'User-Agent': 'AloVida-SpecialtyServicesImporter/1.0 (Mantra Core Health)' } });
    if (!res.ok) throw new Error(`GET ${url} → HTTP ${res.status}`);
    writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  }
  const bytes = readFileSync(path);
  const actual = sha256(bytes);
  if (expected && actual !== expected) {
    throw new Error(`SHA-256 de ${url} no coincide: esperado ${expected}, obtenido ${actual}. Borrá ${path} si la fuente cambió a propósito y actualizá SOURCES.md.`);
  }
  return { path, bytes, sha256: actual };
}

/** Extrae un miembro de un .tgz (formato ustar). Sin dependencias. */
export function readTarGzMember(tgzBytes, memberName) {
  const tar = gunzipSync(tgzBytes);
  for (let off = 0; off + 512 <= tar.length; ) {
    const header = tar.subarray(off, off + 512);
    if (header.every((b) => b === 0)) break;
    const field = (start, len) => header.subarray(start, start + len).toString('utf8').replace(/\0.*$/s, '');
    const name = (field(345, 155) ? `${field(345, 155)}/` : '') + field(0, 100);
    const size = parseInt(field(124, 12).trim() || '0', 8);
    const body = off + 512;
    if (name === memberName) return tar.subarray(body, body + size);
    off = body + Math.ceil(size / 512) * 512;
  }
  throw new Error(`El paquete no contiene ${memberName}`);
}

/**
 * Escribe `lines` como `<name>.part-NNN.ndjson.gz` en `dir`, borrando antes las
 * partes viejas de ese nombre. gzip con mtime 0: el mismo contenido da los
 * mismos bytes, así que re-armar sin cambios no ensucia el diff.
 *
 * @returns las partes escritas, con su SHA-256 y cantidad de líneas.
 */
export function writeGzParts(dir, name, lines) {
  ensureDir(dir);
  for (const f of readdirSync(dir)) if (f.startsWith(`${name}.part-`)) rmSync(join(dir, f));
  const parts = [];
  let chunk = [];
  let size = 0;
  const flush = () => {
    if (chunk.length === 0) return;
    const file = `${name}.part-${String(parts.length + 1).padStart(3, '0')}.ndjson.gz`;
    const bytes = gzipSync(Buffer.from(chunk.join('\n') + '\n', 'utf8'), { level: 9 });
    writeFileSync(join(dir, file), bytes);
    parts.push({ file, lines: chunk.length, sha256: sha256(bytes), bytes: bytes.length });
    chunk = [];
    size = 0;
  };
  for (const line of lines) {
    const n = Buffer.byteLength(line, 'utf8') + 1;
    if (size + n > PART_MAX_BYTES) flush();
    chunk.push(line);
    size += n;
  }
  flush();
  return parts;
}

/** Lee las partes que lista el manifiesto, verificando el SHA-256 de cada una. */
export function readGzParts(dir, parts) {
  const lines = [];
  for (const part of parts) {
    const bytes = readFileSync(join(dir, part.file));
    if (sha256(bytes) !== part.sha256) throw new Error(`${part.file}: SHA-256 distinto al del manifiesto`);
    lines.push(...gunzipSync(bytes).toString('utf8').split('\n').filter((l) => l.trim() !== ''));
  }
  return lines;
}

