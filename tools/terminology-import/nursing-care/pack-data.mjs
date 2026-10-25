#!/usr/bin/env node
// =============================================================================
// Etapa 2b (sin red): copia los datos normalizados de `glossary-data-build/nursing-care/`
// al repo (`nursing-care/data/`), gzip y en partes, con `MANIFEST.json`.
//
// Se versionan los NORMALIZADOS (lo que carga `load-nursing-care.mjs`), no los
// crudos: los crudos se reproducen con `fetch-sources.mjs` desde commits fijos y
// un tarball npm con integridad (ver `sources.meta.json`). Los crudos de CKM no se
// suben además porque incluyen el contenido con copyright de terceros de escalas
// (Braden, Waterlow…) que el importador deja afuera.
//
// Uso: node tools/terminology-import/nursing-care/pack-data.mjs
// =============================================================================

import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { ensureDir } from '../lib/glossary-es/common.mjs';
import { CODE_SYSTEM } from './lib/ckm.mjs';
import { MSSSI_CODE_SYSTEM } from './lib/msssi.mjs';
import { NURSING_OUT, SOURCES_META } from './lib/paths.mjs';
import { REGISTRY_CODE_SYSTEM } from './lib/registry.mjs';
import { MANIFEST, PART_MAX_BYTES, REPO_DATA_DIR, sha256, splitNdjson } from './lib/repo-data.mjs';

/** Conjuntos que se versionan: nombre → archivo en `NURSING_OUT` (o ruta absoluta). */
const DATASETS = {
  [CODE_SYSTEM]: `${CODE_SYSTEM}.ndjson`,
  [MSSSI_CODE_SYSTEM]: `${MSSSI_CODE_SYSTEM}.ndjson`,
  [REGISTRY_CODE_SYSTEM]: `${REGISTRY_CODE_SYSTEM}.ndjson`,
  coverage: 'coverage.json',
  'link-check': 'link-check.json',
  'sources-meta': SOURCES_META,
};

/** Quita rutas locales del contenedor (`dir`) de los metadatos de fuentes. */
function scrubMeta(text) {
  const meta = JSON.parse(text);
  for (const v of Object.values(meta)) if (v && typeof v === 'object') delete v.dir;
  return `${JSON.stringify(meta, null, 2)}\n`;
}

function main() {
  ensureDir(REPO_DATA_DIR);
  for (const f of readdirSync(REPO_DATA_DIR)) if (f.endsWith('.gz')) rmSync(join(REPO_DATA_DIR, f));
  const manifest = { partMaxUncompressedBytes: PART_MAX_BYTES, datasets: {} };
  for (const [name, file] of Object.entries(DATASETS)) {
    const src = file.startsWith('/') ? file : join(NURSING_OUT, file);
    if (!existsSync(src)) throw new Error(`Falta ${src}: corré fetch-sources, build-nursing-care y link-check antes`);
    let text = readFileSync(src, 'utf8');
    if (name === 'sources-meta') text = scrubMeta(text);
    const isNdjson = src.endsWith('.ndjson');
    const ext = isNdjson ? 'ndjson' : 'json';
    const chunks = isNdjson ? splitNdjson(text) : [text];
    const parts = chunks.map((chunk, i) => {
      const fileName = chunks.length > 1 || isNdjson ? `${name}.part-${String(i + 1).padStart(3, '0')}.${ext}.gz` : `${name}.${ext}.gz`;
      const raw = Buffer.from(chunk, 'utf8');
      const gz = gzipSync(raw, { level: 9 });
      if (gz.length >= 50 * 1024 * 1024) throw new Error(`${fileName} supera 50 MB comprimido`);
      writeFileSync(join(REPO_DATA_DIR, fileName), gz);
      return { file: fileName, rows: isNdjson ? chunk.split('\n').filter(Boolean).length : null, bytes: raw.length, sha256: sha256(raw), gzBytes: gz.length, gzSha256: sha256(gz) };
    });
    manifest.datasets[name] = { source: file.startsWith('/') ? 'sources.meta.json' : file, rows: isNdjson ? parts.reduce((n, p) => n + p.rows, 0) : null, parts };
  }
  writeFileSync(join(REPO_DATA_DIR, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(Object.fromEntries(Object.entries(manifest.datasets).map(([k, v]) => [k, { rows: v.rows, parts: v.parts.map((p) => `${p.file} (${p.gzBytes} B)`) }])), null, 2));
}

main();
