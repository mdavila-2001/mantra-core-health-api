#!/usr/bin/env node
// =============================================================================
// Etapa 2b (sin red) del Omaha System y los enlaces LOINC: copia los NORMALIZADOS de
// `glossary-data-build/nursing-care/` a `nursing-care/data/` (gzip determinista, partes < 45 MB, SHA-256 en
// `MANIFEST.json`) SIN tocar los conjuntos que ya estaban (a diferencia de `pack-data.mjs`, que los regenera todos).
//
// Uso: node tools/terminology-import/nursing-care/pack-omaha.mjs
// =============================================================================

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { NURSING_OUT, OMAHA_META } from './lib/paths.mjs';
import { MANIFEST, PART_MAX_BYTES, REPO_DATA_DIR, readManifest, sha256, splitNdjson } from './lib/repo-data.mjs';

/** nombre en el manifiesto → archivo de origen. */
const DATASETS = {
  'omaha-system': join(NURSING_OUT, 'omaha-system.ndjson'),
  'omaha-meta': OMAHA_META,
  'omaha-coverage': join(NURSING_OUT, 'coverage-omaha.json'),
  'omaha-crosscheck': join(NURSING_OUT, 'omaha-crosscheck.json'),
  'loinc-links': join(NURSING_OUT, 'loinc-links.ndjson'),
  'loinc-links-report': join(NURSING_OUT, 'loinc-links-report.json'),
  'loinc-omaha-terms': join(NURSING_OUT, 'loinc-omaha-terms.json'),
};

const manifest = readManifest() ?? { partMaxUncompressedBytes: PART_MAX_BYTES, datasets: {} };
for (const [name, src] of Object.entries(DATASETS)) {
  if (!existsSync(src)) throw new Error(`Falta ${src}`);
  const text = readFileSync(src, 'utf8');
  const isNdjson = src.endsWith('.ndjson');
  const ext = isNdjson ? 'ndjson' : 'json';
  const chunks = isNdjson ? splitNdjson(text) : [text];
  const parts = chunks.map((chunk, i) => {
    const file = isNdjson ? `${name}.part-${String(i + 1).padStart(3, '0')}.${ext}.gz` : `${name}.${ext}.gz`;
    const raw = Buffer.from(chunk, 'utf8');
    const gz = gzipSync(raw, { level: 9 });
    if (gz.length >= 45 * 1024 * 1024) throw new Error(`${file} supera 45 MB comprimido`);
    writeFileSync(join(REPO_DATA_DIR, file), gz);
    return { file, rows: isNdjson ? chunk.split('\n').filter(Boolean).length : null, bytes: raw.length, sha256: sha256(raw), gzBytes: gz.length, gzSha256: sha256(gz) };
  });
  manifest.datasets[name] = { source: src.split('/').pop(), rows: isNdjson ? parts.reduce((n, p) => n + p.rows, 0) : null, parts };
}
writeFileSync(join(REPO_DATA_DIR, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
for (const [k, v] of Object.entries(manifest.datasets)) if (k in DATASETS) console.log(k, v.rows ?? '-', v.parts.map((p) => `${p.file} ${p.gzBytes} B sha256(gz)=${p.gzSha256.slice(0, 16)}…`).join(' '));
