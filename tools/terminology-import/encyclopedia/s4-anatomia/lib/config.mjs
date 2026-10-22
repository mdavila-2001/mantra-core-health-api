// =============================================================================
// Rutas, constantes y política de red del corte S4 (anatomía, síntomas,
// especialidades, pruebas, laboratorio, tratamientos y procedimientos).
//
// Nada de acá es contenido clínico: son rutas, límites de cortesía de red y los
// identificadores de las fuentes. Todo se puede redefinir por entorno para que
// las pruebas no toquen el disco real.
// =============================================================================

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Raíz del repo de la API (…/tools/terminology-import/encyclopedia/s4-anatomia/lib → 5 niveles arriba). */
export const API_ROOT = resolve(HERE, '../../../../..');

/** Raíz del workspace `Mantra Core Health/` (hermana de los repos; NO está bajo git). */
export const WORKSPACE_ROOT = process.env.S4_WORKSPACE_ROOT ?? resolve(API_ROOT, '..');

/** Carpeta de evidencia del corte: caché de red y salida viven acá (fuera de git). */
export const EVIDENCE_DIR =
  process.env.S4_EVIDENCE_DIR ?? join(WORKSPACE_ROOT, 'docs/progress/evidence/lane-41/F9/s4-anatomia');

export const CACHE_DIR = process.env.S4_CACHE_DIR ?? join(EVIDENCE_DIR, 'cache');
export const OUT_DIR = process.env.S4_OUT_DIR ?? join(EVIDENCE_DIR, 'out');

/** Semilla del glosario (solo lectura): `shards/<categoría>/page-N.json`. */
export const SEED_DIR =
  process.env.S4_SEED_DIR ?? join(WORKSPACE_ROOT, 'mantra-core-health/public/glossary-seed');

/** NDJSON del armado de catálogos (solo lectura). */
export const CATALOG_NDJSON_DIR =
  process.env.S4_CATALOG_DIR ?? join(WORKSPACE_ROOT, 'glossary-data-build-catalogos/ndjson');

/** Categorías de la semilla que cubre este corte. */
export const S4_CATEGORIES = Object.freeze([
  'anatomy',
  'signs-symptoms',
  'specialty',
  'lab',
  'diagnostic-test',
  'treatment',
  'procedure',
  'imaging',
  'care',
]);

/**
 * `codeSystem` de las filas que cubre S1 (MedlinePlus en español). El corte S4
 * las EXCLUYE: otra sesión las hace. La exclusión es por el campo de la fila,
 * no por su categoría.
 */
export const S1_CODE_SYSTEMS = Object.freeze(['medlineplus-es', 'medlineplus-es-lab']);

/** `User-Agent` identificable (política de Wikimedia / NLM). */
export const USER_AGENT =
  process.env.S4_USER_AGENT ??
  'AloVida-EncyclopediaS4/1.0 (Mantra Core Health; glossary encyclopedia S4 anatomy; contacto: equipo AloVida)';

/** Una petición por segundo como máximo (ficha §12.6). */
export const MIN_DELAY_MS = Number(process.env.S4_MIN_DELAY_MS ?? 1000);

const RETRIEVED_AT_FILE = join(CACHE_DIR, 'retrieved-at.txt');

/**
 * Fecha de la corrida (viaja en `retrievedAt` de cada sección). Se fija UNA vez,
 * al primer pedido de red, y queda en `cache/retrieved-at.txt`: reconstruir el
 * NDJSON días después da el mismo resultado byte a byte. `S4_RETRIEVED_AT` manda.
 */
export function resolveRetrievedAt() {
  if (process.env.S4_RETRIEVED_AT) return process.env.S4_RETRIEVED_AT;
  if (existsSync(RETRIEVED_AT_FILE)) return readFileSync(RETRIEVED_AT_FILE, 'utf8').trim();
  return new Date().toISOString().slice(0, 10);
}

/** Registra la fecha de la corrida si todavía no existe (lo llaman las etapas de red). */
export function pinRetrievedAt() {
  const value = resolveRetrievedAt();
  if (!existsSync(RETRIEVED_AT_FILE) && !process.env.S4_RETRIEVED_AT) {
    mkdirSync(dirname(RETRIEVED_AT_FILE), { recursive: true });
    writeFileSync(RETRIEVED_AT_FILE, value + '\n');
  }
  return value;
}

/** Hosts de imagen que admite la CSP del front (`img-src`, ficha §12.1). */
export const ALLOWED_IMAGE_HOSTS = Object.freeze(['upload.wikimedia.org', 'thumb.wikimedia.org', 'cima.aemps.es']);

/** Licencias de imagen permitidas (ficha §12.2.7). */
export const ALLOWED_IMAGE_LICENSES = Object.freeze(['public domain', 'cc0', 'cc by', 'cc by-sa']);
