// Utilidades compartidas por los adaptadores del repositorio universal.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const API_ROOT = resolve(HERE, '../../../..');
/** Fuentes crudas (no viven en git): `$SERVICE_REPOSITORY_SOURCES_DIR` o `../servicios-build/sources`. */
export const SOURCES_DIR = process.env.SERVICE_REPOSITORY_SOURCES_DIR ?? resolve(API_ROOT, '../servicios-build/sources');
export const DATA_DIR = join(HERE, '..', 'data');

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/** Lee un archivo de la fuente y aborta si el SHA-256 no es el declarado. */
export function readVerified(sourcesDir, file) {
  const path = join(sourcesDir, file.path);
  if (!existsSync(path)) throw new Error(`Falta ${path}: bajá la fuente (ver SOURCES.md)`);
  const bytes = readFileSync(path);
  const got = sha256(bytes);
  if (got !== file.sha256) throw new Error(`${file.path}: SHA-256 ${got}, se esperaba ${file.sha256}`);
  return bytes;
}

/** Colapsa espacios; no cambia el texto. */
export const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

/** Para comparar: minúsculas, sin acentos ni puntuación. */
export const norm = (s) => clean(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

export function count(report, motivo) {
  report.excluded[motivo] = (report.excluded[motivo] ?? 0) + 1;
}

export const newReport = () => ({ read: 0, kept: 0, excluded: {} });
