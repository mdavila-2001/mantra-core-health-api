#!/usr/bin/env node
// =============================================================================
// Equipos de diagnóstico · ROW · etapa 0: descargas de los portales oficiales.
//
// Baja cada archivo de `OFFICIAL_DOWNLOADS` (sources.mjs) con curl, que usa el
// proxy del entorno, a `$DX_DEVICES_BUILD_DIR/official/<grupo>/` (fuera de git)
// y anota en `official/retrieved.json` la URL, `Last-Modified`, bytes, sha256 y
// la fecha de descarga. No ejecuta nada de lo descargado.
//
// Uso: node tools/terminology-import/diagnostic-devices/row/fetch-official.mjs [--only anvisa,…] [--skip-existing]
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { BUILD_DIR, ensureDir, readJson, sha256File } from './lib/row.mjs';
import { OFFICIAL_DOWNLOADS } from './sources.mjs';

export const OFFICIAL_DIR = join(BUILD_DIR, 'official');
export const OFFICIAL_RETRIEVED = join(OFFICIAL_DIR, 'retrieved.json');

const args = process.argv.slice(2);
const onlyIndex = args.indexOf('--only');
const only = onlyIndex >= 0 ? new Set(args[onlyIndex + 1].split(',')) : null;
const skipExisting = args.includes('--skip-existing');

/** `Last-Modified` de un archivo de cabeceras de curl (`-D`), en ISO 8601. */
export function lastModifiedOf(headersText) {
  const blocks = headersText.split(/\r?\n\r?\n/).filter((b) => b.trim() !== '');
  const last = blocks[blocks.length - 1] ?? '';
  const m = /^last-modified:\s*(.+)$/im.exec(last);
  if (m === null) return null;
  const date = new Date(m[1].trim());
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Dataset Socrata (datos.gov.co, …) en páginas CSV de `pageSize` filas,
 * ordenadas por `:id` para que la paginación sea estable. Cada página queda
 * como `<name>-NNNN.csv` con su sha256; los metadatos del dataset
 * (`/api/views/<id>.json`, con `rowsUpdatedAt` y licencia) van al lado.
 */
async function fetchSocrata(dir, group, file) {
  const { domain, id, pageSize = 50000 } = file.socrata;
  const metaPath = join(dir, `${file.name}.meta.json`);
  execFileSync('curl', [
    '-sS',
    '--fail',
    '-L',
    '--retry',
    '4',
    '-m',
    '300',
    '-o',
    metaPath,
    `https://${domain}/api/views/${id}.json`,
  ]);
  const pages = [];
  for (let offset = 0; ; offset += pageSize) {
    const name = `${file.name}-${String(pages.length + 1).padStart(4, '0')}.csv`;
    const path = join(dir, name);
    const url = `https://${domain}/resource/${id}.csv?$limit=${pageSize}&$offset=${offset}&$order=:id`;
    execFileSync('curl', [
      '-sS',
      '--fail',
      '-L',
      '--retry',
      '4',
      '--retry-delay',
      '5',
      '-m',
      '1800',
      '-o',
      path,
      url,
    ]);
    const lines =
      readFileSync(path, 'utf8')
        .split('\n')
        .filter((l) => l !== '').length - 1;
    pages.push({ name, offset, sha256: await sha256File(path) });
    console.log(`${group}  ${name}  offset ${offset}`);
    if (lines < pageSize) break;
  }
  const meta = readJson(metaPath);
  return {
    group,
    path: join(group, file.name),
    dataset: `https://${domain}/d/${id}`,
    rowsUpdatedAt: meta.rowsUpdatedAt
      ? new Date(meta.rowsUpdatedAt * 1000).toISOString()
      : null,
    license: meta.license?.name ?? null,
    pages,
    retrievedAt: new Date().toISOString(),
  };
}

async function main() {
  const retrieved = existsSync(OFFICIAL_RETRIEVED)
    ? readJson(OFFICIAL_RETRIEVED)
    : {};
  for (const [group, files] of Object.entries(OFFICIAL_DOWNLOADS)) {
    if (only !== null && !only.has(group)) continue;
    const dir = ensureDir(join(OFFICIAL_DIR, group));
    for (const file of files) {
      if (file.socrata) {
        retrieved[file.socrata.url] = await fetchSocrata(dir, group, file);
        continue;
      }
      const path = join(dir, file.name);
      const headersPath = `${path}.headers`;
      if (!(skipExisting && existsSync(path) && existsSync(headersPath))) {
        execFileSync(
          'curl',
          [
            '-sS',
            '--fail',
            '-L',
            '--retry',
            '4',
            '--retry-delay',
            '5',
            '-m',
            '3600',
            '-A',
            'Mozilla/5.0 (mantra-core-health terminology import)',
            '-D',
            headersPath,
            '-o',
            path,
            file.url,
          ],
          { stdio: 'inherit' },
        );
        retrieved[file.url] = { retrievedAt: new Date().toISOString() };
      }
      const entry = {
        group,
        path: join(group, file.name),
        bytes: statSync(path).size,
        sha256: await sha256File(path),
        lastModified: lastModifiedOf(readFileSync(headersPath, 'utf8')),
        retrievedAt:
          retrieved[file.url]?.retrievedAt ??
          new Date(statSync(path).mtimeMs).toISOString(),
      };
      if (file.extract) {
        const extractDir = ensureDir(`${path}.d`);
        execFileSync('unzip', ['-o', '-q', path, '-d', extractDir]);
        entry.extractedTo = join(group, `${file.name}.d`);
      }
      retrieved[file.url] = entry;
      console.log(
        `${group}  ${file.name}  ${entry.bytes} B  ${entry.lastModified}  ${entry.sha256.slice(0, 12)}…`,
      );
    }
  }
  writeFileSync(OFFICIAL_RETRIEVED, JSON.stringify(retrieved, null, 2) + '\n');
  console.log(`retrieved.json → ${OFFICIAL_RETRIEVED}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
