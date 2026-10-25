// =============================================================================
// Piezas compartidas del importador de procedimientos y tratamientos no
// farmacológicos. Transporte, identidad y formato: nada de acá decide una
// relación clínica. Las relaciones salen tal cual las declara cada fuente
// (`sources/*.mjs`), con su tipo literal y su procedencia.
// =============================================================================

import { createHash } from 'node:crypto';
import {
  closeSync,
  createReadStream,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  writeFileSync,
  writeSync,
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

/**
 * NDJSON determinista: filas ordenadas por `id` para que dos corridas den el mismo archivo.
 * Se escribe por tramos: con los ensayos y revisiones de MEDLINE, `assertions.ndjson`
 * supera el largo máximo de un string de V8 y no se puede armar de una vez.
 */
export function writeNdjson(path, rows) {
  ensureDir(dirname(path));
  const sorted = [...rows].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  );
  const fd = openSync(path, 'w');
  try {
    for (let i = 0; i < sorted.length; i += 5000) {
      let chunk = '';
      for (const r of sorted.slice(i, i + 5000))
        chunk += `${JSON.stringify(r)}\n`;
      writeSync(fd, chunk);
    }
  } finally {
    closeSync(fd);
  }
  return sorted.length;
}

/** Lee un NDJSON por tramos (el archivo puede pasar el largo máximo de un string de V8). */
export function readNdjson(path) {
  if (!existsSync(path)) return [];
  const rows = [];
  const buf = Buffer.allocUnsafe(32 * 1024 * 1024);
  let carry = Buffer.alloc(0);
  const fd = openSync(path, 'r');
  try {
    for (;;) {
      const n = readSync(fd, buf, 0, buf.length, null);
      if (n === 0) break;
      const data = Buffer.concat([carry, buf.subarray(0, n)]);
      const cut = data.lastIndexOf(10);
      if (cut < 0) {
        carry = data;
        continue;
      }
      for (const l of data.subarray(0, cut).toString('utf8').split('\n'))
        if (l) rows.push(JSON.parse(l));
      carry = Buffer.from(data.subarray(cut + 1));
    }
    if (carry.length) rows.push(JSON.parse(carry.toString('utf8')));
  } finally {
    closeSync(fd);
  }
  return rows;
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

/**
 * Copia una cadena a memoria propia. V8 representa `match()`/`slice()` como
 * vistas sobre la cadena madre: guardar 200 000 nombres sacados de bloques de un
 * archivo de 750 MB retiene esos bloques enteros (se midió 1,2 GB para NCIt).
 */
export const own = (s) =>
  s == null ? s : Buffer.from(s, 'utf8').toString('utf8');

/** Clave de deduplicación: siempre por código, nunca por nombre. */
export const conceptKey = (ref) => `${ref.system}|${ref.code}`;
