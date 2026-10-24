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

async function main() {
  const retrieved = existsSync(OFFICIAL_RETRIEVED)
    ? readJson(OFFICIAL_RETRIEVED)
    : {};
  for (const [group, files] of Object.entries(OFFICIAL_DOWNLOADS)) {
    if (only !== null && !only.has(group)) continue;
    const dir = ensureDir(join(OFFICIAL_DIR, group));
    for (const file of files) {
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
