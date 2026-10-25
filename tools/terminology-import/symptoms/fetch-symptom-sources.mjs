#!/usr/bin/env node
// =============================================================================
// ETL de síntomas, etapa 0 (fetch): baja las fuentes de `lib/sources.mjs` a
// `<GLOSSARY_BUILD_DIR>/symptoms-sources/` (fuera de git) y escribe
// `manifest.json` con URL, SHA-256, bytes, fecha de descarga y la versión que
// declara cada archivo. Reanudable: un archivo ya presente no se vuelve a pedir
// salvo con `--refresh`.
//
// Uso:
//   node tools/terminology-import/symptoms/fetch-symptom-sources.mjs
//   node tools/terminology-import/symptoms/fetch-symptom-sources.mjs --refresh
// =============================================================================

import { createReadStream, createWriteStream, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { USER_AGENT, ensureDir, nowIso, writeJson } from '../lib/glossary-es/common.mjs';
import { SOURCES_DIR, SOURCE_FILES, sourcePath } from './lib/sources.mjs';
import { readDeclaredVersion } from './lib/versions.mjs';

const REFRESH = process.argv.includes('--refresh');

function sha256(path) {
  return new Promise((ok, fail) => {
    const h = createHash('sha256');
    createReadStream(path).on('data', (c) => h.update(c)).on('end', () => ok(h.digest('hex'))).on('error', fail);
  });
}

async function download(url, path) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      ensureDir(dirname(path));
      await pipeline(Readable.fromWeb(res.body), createWriteStream(path));
      return;
    } catch (err) {
      if (attempt === 4) throw new Error(`${url}: ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000 * 2 ** (attempt - 1)));
    }
  }
}

async function main() {
  const manifest = { generatedAt: nowIso(), dir: SOURCES_DIR, files: [] };
  for (const s of SOURCE_FILES) {
    const path = sourcePath(s.file);
    const fresh = REFRESH || !existsSync(path);
    try {
      if (fresh) {
        console.log(`[fetch] ${s.key} ← ${s.url}`);
        await download(s.url, path);
      } else {
        console.log(`[fetch] ${s.key}: ya está (${s.file}); --refresh para volver a bajar`);
      }
    } catch (err) {
      if (!s.optional) throw err;
      console.warn(`[fetch] ${s.key} (opcional) no se pudo bajar: ${err.message}`);
      manifest.files.push({ key: s.key, url: s.url, error: err.message });
      continue;
    }
    const st = statSync(path);
    manifest.files.push({
      key: s.key,
      file: s.file,
      url: s.url,
      owner: s.owner,
      license: s.license,
      bytes: st.size,
      sha256: await sha256(path),
      retrievedAt: (fresh ? new Date() : st.mtime).toISOString(),
      declaredVersion: readDeclaredVersion(s, path),
    });
  }
  writeJson(join(SOURCES_DIR, 'manifest.json'), manifest, true);
  console.log(JSON.stringify(manifest.files.map((f) => ({ key: f.key, version: f.declaredVersion, bytes: f.bytes, error: f.error })), null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-symptom-sources:', err);
  process.exitCode = 1;
});
