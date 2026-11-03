#!/usr/bin/env node
// =============================================================================
// Inverso de pack-data.mjs: restaura el corpus normalizado versionado en
// `data/` a `<GLOSSARY_BUILD_DIR>/symptoms/`, verificando el SHA-256 de cada
// parte y del archivo reconstruido. Con eso los cargadores
// (load-symptoms.mjs, load-disease-phenotypes.mjs) corren sin re-bajar ni
// re-construir nada.
//
// Uso: node tools/terminology-import/symptoms/unpack-data.mjs
// =============================================================================

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { DATA_DIR, OUT_DIR } from './lib/sources.mjs';

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

const manifest = JSON.parse(readFileSync(join(DATA_DIR, 'MANIFEST.json'), 'utf8'));
mkdirSync(join(OUT_DIR, 'ndjson'), { recursive: true });
for (const f of manifest.files) {
  const chunks = f.parts.map((p) => {
    const gz = readFileSync(join(DATA_DIR, p.file));
    if (sha256(gz) !== p.gzSha256) throw new Error(`SHA-256 distinto en ${p.file}`);
    return gunzipSync(gz);
  });
  const raw = Buffer.concat(chunks);
  if (sha256(raw) !== f.sha256) throw new Error(`SHA-256 distinto al reconstruir ${f.name}`);
  const target = f.name.endsWith('.ndjson') ? join(OUT_DIR, 'ndjson', f.name) : join(OUT_DIR, f.name);
  writeFileSync(target, raw);
  console.log(`[unpack] ${f.name}${f.rows != null ? ` (${f.rows} filas)` : ''} → ${target}`);
}
