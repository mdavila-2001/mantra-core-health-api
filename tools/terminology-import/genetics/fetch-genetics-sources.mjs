#!/usr/bin/env node
// =============================================================================
// ETL de genética, etapa 0 (fetch): baja las fuentes de `lib/sources.mjs` a
// `<GLOSSARY_BUILD_DIR>/genetics-sources/` (fuera de git) y escribe
// `manifest.json` con URL, SHA-256, bytes, fecha de descarga, `Last-Modified` y
// la versión que declara cada archivo. Descarga en streaming, de a un pedido
// (≤ 1 pedido/s por host), con reintentos exponenciales. Reanudable: un archivo
// ya presente y con entrada en el manifest no se vuelve a pedir salvo con
// `--refresh`.
//
// Uso:
//   GLOSSARY_BUILD_DIR=… node tools/terminology-import/genetics/fetch-genetics-sources.mjs
//   node tools/terminology-import/genetics/fetch-genetics-sources.mjs --refresh
// =============================================================================

import { createReadStream, createWriteStream, existsSync, readFileSync, renameSync, rmSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { USER_AGENT, ensureDir, nowIso, writeJson } from '../lib/glossary-es/common.mjs';
import { SOURCES_DIR, SOURCE_FILES, sourcePath } from './lib/sources.mjs';
import { readDeclaredVersion } from './lib/versions.mjs';

const REFRESH = process.argv.includes('--refresh');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sha256(path) {
  return new Promise((ok, fail) => {
    const h = createHash('sha256');
    createReadStream(path).on('data', (c) => h.update(c)).on('end', () => ok(h.digest('hex'))).on('error', fail);
  });
}

async function download(url, path) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const tmp = `${path}.part`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      ensureDir(dirname(path));
      await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
      renameSync(tmp, path);
      return { lastModified: res.headers.get('last-modified'), etag: res.headers.get('etag') };
    } catch (err) {
      rmSync(tmp, { force: true });
      if (attempt === 5) throw new Error(`${url}: ${err.message}`);
      await sleep(2000 * 2 ** (attempt - 1));
    }
  }
}

async function main() {
  const manifestPath = join(SOURCES_DIR, 'manifest.json');
  const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { files: [] };
  const prevByKey = new Map(previous.files.map((f) => [f.key, f]));
  const manifest = { generatedAt: nowIso(), dir: SOURCES_DIR, files: [] };
  for (const s of SOURCE_FILES) {
    const path = sourcePath(s.file);
    const prev = prevByKey.get(s.key);
    const reuse = !REFRESH && existsSync(path) && prev && !prev.error;
    if (reuse) {
      console.log(`[fetch] ${s.key}: ya está (${s.file}); --refresh para volver a bajar`);
      manifest.files.push(prev);
      continue;
    }
    console.log(`[fetch] ${s.key} ← ${s.url}`);
    const got = await download(s.url, path);
    await sleep(1000);
    const st = statSync(path);
    const declared = readDeclaredVersion(s, path, got.lastModified);
    if (!declared.version) {
      // Ni el archivo ni el servidor dicen versión: queda la fecha de bajada y el SHA-256 identifica el contenido.
      declared.version = `bajado ${new Date().toISOString().slice(0, 10)} (sin versión declarada ni Last-Modified)`;
      declared.kind = 'fecha de bajada';
    }
    manifest.files.push({
      key: s.key,
      file: s.file,
      url: s.url,
      owner: s.owner,
      license: s.license,
      bytes: st.size,
      sha256: await sha256(path),
      retrievedAt: new Date().toISOString(),
      lastModified: got.lastModified,
      etag: got.etag,
      declaredVersion: declared.version,
      versionKind: declared.kind,
      note: s.note ?? null,
    });
  }
  writeJson(manifestPath, manifest, true);
  console.log(JSON.stringify(manifest.files.map((f) => ({ key: f.key, version: f.declaredVersion, bytes: f.bytes, sha: f.sha256.slice(0, 12) })), null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-genetics-sources:', err);
  process.exitCode = 1;
});
