// =============================================================================
// Instantánea VERSIONADA del catálogo normalizado (`diseases/data/`).
//
// El contenedor donde se construye se pierde al cerrarse; las fuentes crudas
// (~1,3 GB) no se suben —se re-bajan con `fetch-sources.mjs`, que verifica URL,
// versión y SHA-256—, pero el NDJSON normalizado sí: comprimido con gzip y
// partido para que ningún archivo pase de PART_LIMIT (GitHub rechaza > 100 MB).
// Así otras sesiones enlazan contra la rama y `load-catalog.mjs --from-snapshot`
// carga sin red y sin las fuentes.
//
// `MANIFEST.json` lista cada parte con su SHA-256, bytes y registros. El gzip de
// Node no guarda fecha en la cabecera: la misma entrada da los mismos bytes.
// =============================================================================

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';

import { ensureDir, nowIso } from '../../lib/glossary-es/common.mjs';

export const SNAPSHOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
/** Tope por parte, comprimida. Muy por debajo del límite de GitHub. */
export const PART_LIMIT = 45 * 1024 * 1024;
/** Tope de texto sin comprimir por parte; el NDJSON comprime ~10:1, así queda lejos de PART_LIMIT. */
const RAW_PART_LIMIT = 200 * 1024 * 1024;

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/** Escribe `<cs>.part-NN.ndjson.gz` por sistema, más los JSON auxiliares, y `MANIFEST.json`. */
export function writeSnapshot(byCs, extraFiles = {}, versions = {}, dir = SNAPSHOT_DIR) {
  ensureDir(dir);
  for (const f of readdirSync(dir)) if (f.endsWith('.ndjson.gz')) rmSync(join(dir, f));
  const files = [];
  for (const [cs, rows] of [...byCs.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    let part = [];
    let size = 0;
    let n = 1;
    const flush = () => {
      if (!part.length) return;
      const name = `${cs}.part-${String(n).padStart(2, '0')}.ndjson.gz`;
      const gz = gzipSync(Buffer.from(part.join(''), 'utf8'), { level: 9 });
      if (gz.length > PART_LIMIT) throw new Error(`${name} supera ${PART_LIMIT} B comprimido`);
      writeFileSync(join(dir, name), gz);
      files.push({ file: name, codeSystem: cs, records: part.length, bytes: gz.length, sha256: sha256(gz) });
      part = [];
      size = 0;
      n += 1;
    };
    for (const r of rows) {
      const line = `${JSON.stringify(r)}\n`;
      if (size + line.length > RAW_PART_LIMIT) flush();
      part.push(line);
      size += line.length;
    }
    flush();
  }
  for (const [name, src] of Object.entries(extraFiles)) {
    if (!existsSync(src)) continue;
    copyFileSync(src, join(dir, name));
    const buf = readFileSync(join(dir, name));
    files.push({ file: name, bytes: buf.length, sha256: sha256(buf) });
  }
  // Lo que agregó otro paso (p. ej. el reporte de cobertura) se conserva, con su hash recalculado.
  const manifestPath = join(dir, 'MANIFEST.json');
  const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')).files : [];
  for (const f of previous) {
    if (f.codeSystem || files.some((x) => x.file === f.file) || !existsSync(join(dir, f.file))) continue;
    const buf = readFileSync(join(dir, f.file));
    files.push({ file: f.file, bytes: buf.length, sha256: sha256(buf) });
  }
  writeFileSync(manifestPath, `${JSON.stringify({ generatedAt: nowIso(), versions, files }, null, 2)}\n`);
  return files;
}

/** Copia un archivo auxiliar a la instantánea (p. ej. el reporte de cobertura) y lo suma al manifiesto. */
export function addToSnapshot(name, src, dir = SNAPSHOT_DIR) {
  const manifestPath = join(dir, 'MANIFEST.json');
  if (!existsSync(manifestPath)) return;
  copyFileSync(src, join(dir, name));
  const buf = readFileSync(join(dir, name));
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.files = [...manifest.files.filter((f) => f.file !== name), { file: name, bytes: buf.length, sha256: sha256(buf) }];
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

/** Lee la instantánea: Map<cs, registros[]>, verificando el SHA-256 de cada parte. */
export function readSnapshot(only = null, dir = SNAPSHOT_DIR) {
  const manifest = JSON.parse(readFileSync(join(dir, 'MANIFEST.json'), 'utf8'));
  const byCs = new Map();
  for (const f of manifest.files.filter((x) => x.codeSystem && (!only || only.has(x.codeSystem)))) {
    const gz = readFileSync(join(dir, f.file));
    if (sha256(gz) !== f.sha256) throw new Error(`${f.file}: SHA-256 distinto del de MANIFEST.json`);
    const rows = gunzipSync(gz).toString('utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
    byCs.set(f.codeSystem, [...(byCs.get(f.codeSystem) ?? []), ...rows]);
  }
  return { manifest, byCs };
}
