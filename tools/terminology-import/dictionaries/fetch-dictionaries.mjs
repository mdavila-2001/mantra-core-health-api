#!/usr/bin/env node
// =============================================================================
// ETL etapa 1 (fetch) de los diccionarios médicos generales: baja cada archivo
// fuente de `lib/sources.mjs` a `glossary-data-build/dictionaries-sources/<id>/`
// (fuera de git) y deja `manifest.json` con URL, SHA-256, bytes y fecha.
//
// Reanudable: un archivo que ya está en disco no se vuelve a pedir y conserva
// su fecha de descarga original (es la versión que leyó el build).
//
// Uso:
//   node tools/terminology-import/dictionaries/fetch-dictionaries.mjs            # todas
//   node tools/terminology-import/dictionaries/fetch-dictionaries.mjs uberon cl   # algunas
//   node tools/terminology-import/dictionaries/fetch-dictionaries.mjs --refresh hgnc   # re-descarga
// =============================================================================

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { HttpClient, nowIso, sha256File, writeJson } from '../lib/glossary-es/common.mjs';
import { ABBREVIATION_SOURCE, ABREMES_SOURCE, C7_OBO_SOURCES, EMDN_SOURCE, FMA_SOURCE, HGNC_SOURCE, MESH_SOURCE, OBO_SOURCES, ORGANISM_SOURCES } from './lib/sources.mjs';
import { SOURCES_DIR, MANIFEST_PATH } from './lib/paths.mjs';

const args = process.argv.slice(2);
const refresh = args.includes('--refresh');
const only = args.filter((a) => !a.startsWith('--'));

function fileList() {
  const out = [];
  for (const s of [...OBO_SOURCES, FMA_SOURCE, HGNC_SOURCE, ABBREVIATION_SOURCE, ...C7_OBO_SOURCES, MESH_SOURCE, EMDN_SOURCE, ABREMES_SOURCE]) for (const f of s.files) out.push({ sourceId: s.id, ...f });
  for (const f of Object.values(ORGANISM_SOURCES.files)) out.push({ sourceId: ORGANISM_SOURCES.id, ...f });
  return only.length ? out.filter((f) => only.includes(f.sourceId)) : out;
}

async function main() {
  const http = new HttpClient({ concurrency: 3, minDelayMs: 200 });
  const manifest = existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) : { files: {} };
  const failures = [];
  for (const f of fileList()) {
    const path = join(SOURCES_DIR, f.sourceId, f.name);
    const key = `${f.sourceId}/${f.name}`;
    const known = manifest.files[key];
    if (existsSync(path) && !refresh && known?.url === f.url) {
      console.log(`[fetch] en caché: ${key}`);
      continue;
    }
    try {
      const { body } = await http.get(f.url);
      mkdirSync(join(SOURCES_DIR, f.sourceId), { recursive: true });
      writeFileSync(path, body);
      manifest.files[key] = { url: f.url, bytes: statSync(path).size, sha256: sha256File(path), retrievedAt: nowIso() };
      console.log(`[fetch] ${key}: ${manifest.files[key].bytes} bytes`);
    } catch (err) {
      failures.push({ key, url: f.url, error: err.message });
      console.error(`[fetch] FALLÓ ${key}: ${err.message}`);
    }
    writeJson(MANIFEST_PATH, manifest, true);
  }
  writeJson(MANIFEST_PATH, { ...manifest, lastRun: nowIso(), http: http.stats, failures }, true);
  console.log(JSON.stringify({ http: http.stats, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-dictionaries:', err);
  process.exitCode = 1;
});
