// =============================================================================
// Piezas compartidas del importador de procedimientos y tratamientos no
// farmacológicos. Transporte, identidad y formato: nada de acá decide una
// relación clínica. Las relaciones salen tal cual las declara cada fuente
// (`sources/*.mjs`), con su tipo literal y su procedencia.
// =============================================================================

import { createHash } from 'node:crypto';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Raíz del repo de la API (…/tools/terminology-import/procedures-treatments/lib → ../../../..). */
export const API_ROOT = resolve(HERE, '../../../..');

/**
 * Carpeta FUERA de git, hermana del repo como el resto de los importadores
 * (`../glossary-data-build`). Se puede redefinir con `PROCEDURES_BUILD_DIR`.
 */
export const BUILD_DIR =
  process.env.PROCEDURES_BUILD_DIR ??
  resolve(
    process.env.GLOSSARY_BUILD_DIR ??
      resolve(API_ROOT, '..', 'glossary-data-build'),
    'procedures-treatments',
  );

export const cacheDir = (...parts) => join(BUILD_DIR, 'cache', ...parts);
export const outDir = (...parts) => join(BUILD_DIR, 'out', ...parts);

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

/** NDJSON determinista: filas ordenadas por `id` para que dos corridas den el mismo archivo. */
export function writeNdjson(path, rows) {
  ensureDir(dirname(path));
  const sorted = [...rows].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  );
  writeFileSync(
    path,
    sorted.map((r) => JSON.stringify(r)).join('\n') +
      (sorted.length ? '\n' : ''),
  );
  return sorted.length;
}

export function readNdjson(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

export async function* readLines(path) {
  const rl = createInterface({
    input: createReadStream(path, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });
  for await (const line of rl) yield line;
}

/** TSV con cabecera; ignora líneas de comentario `#`. Devuelve filas con su número de línea (1-based). */
export function parseTsv(text) {
  const lines = text.split(/\r?\n/);
  let header = null;
  const rows = [];
  lines.forEach((line, i) => {
    if (!line || line.startsWith('#')) return;
    const cells = line.split('\t');
    if (!header) {
      header = cells;
      return;
    }
    const row = { __line: i + 1 };
    header.forEach((h, j) => {
      row[h] = cells[j] ?? '';
    });
    rows.push(row);
  });
  return rows;
}

// --- Códigos ------------------------------------------------------------------

/**
 * Forma canónica de cada código por sistema. Las ontologías OBO conservan el
 * CURIE completo (así lo publican: `MONDO:0005015`, `UBERON:0000945`); los
 * sistemas externos van sin prefijo (`C15256`, `D003920`, `E10-E14`, `7148`).
 * `validate-siblings.mjs` prueba también la otra forma al comparar con las
 * claves de las sesiones hermanas, porque cada una pudo elegir distinto.
 */
const OBO_SYSTEMS = new Set(['maxo', 'mondo', 'uberon', 'hp', 'ohd']);

/** Prefijo de CURIE de la fuente → code system interno. */
export const PREFIX_TO_SYSTEM = {
  MAXO: 'maxo',
  OHD: 'ohd',
  MONDO: 'mondo',
  UBERON: 'uberon',
  HP: 'hp',
  NCIT: 'ncit',
  MESH: 'mesh',
  MeSH: 'mesh',
  ICD10WHO: 'icd10',
  ICD10CM: 'icd10cm',
  Orphanet: 'orphanet',
  ORPHA: 'orphanet',
  OMIM: 'omim',
  DOID: 'doid',
  FMA: 'fma',
  TA2: 'ta2',
};

/** `NCIT:C15256` → `{system:'ncit', code:'C15256'}`; `MONDO:0005015` → `{system:'mondo', code:'MONDO:0005015'}`. */
export function fromCurie(curie) {
  const i = curie.indexOf(':');
  if (i < 0) return null;
  const prefix = curie.slice(0, i);
  const local = curie.slice(i + 1);
  const system = PREFIX_TO_SYSTEM[prefix];
  if (!system || !local) return null;
  return {
    system,
    code: OBO_SYSTEMS.has(system) ? `${prefix.toUpperCase()}:${local}` : local,
  };
}

/** Clave de deduplicación: siempre por código, nunca por nombre. */
export const conceptKey = (ref) => `${ref.system}|${ref.code}`;
