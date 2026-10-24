#!/usr/bin/env node
// =============================================================================
// Descarga las fuentes OFICIALES completas de FDA/NLM a
// `$DX_DEVICES_US_RAW_DIR/official/` y escribe `manifest.json` (URL, fecha de
// exportación, bytes, sha256, fecha de descarga). Reanudable: un archivo con
// el mismo tamaño publicado no se vuelve a bajar.
//
//   openFDA (índice https://api.fda.gov/download.json):
//     device/udi · device/510k · device/pma · device/classification ·
//     device/registrationlisting   → official/openfda/<endpoint>/*.json.zip
//   AccessGUDID Delimited Full Release → official/accessgudid/*.zip
//     (sólo si se pide `--gudid-delimited`; openFDA device/udi es el mismo
//      GUDID y alcanza para el normalizador)
//
//   node tools/terminology-import/diagnostic-devices/us/fetch-official.mjs [--dry-run] [--only device/udi] [--gudid-delimited]
//
// Si la red no alcanza un host, lo informa y termina con código 2 (no
// inventa nada ni prueba hosts alternativos). Detrás de un proxy HTTP, Node
// 22 necesita `NODE_USE_ENV_PROXY=1` para que `fetch` use `HTTPS_PROXY`.
// =============================================================================

import { createWriteStream, existsSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { ensureDir, readJsonIfExists, sha256File } from './lib/io.mjs';
import { OFFICIAL_DIR } from './lib/paths.mjs';
import { OFFICIAL_SOURCES } from './lib/sources.mjs';

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const GUDID_DELIMITED = args.includes('--gudid-delimited');
const UA = 'AloVida-DxDevicesImporter/1.0 (Mantra Core Health; terminology import)';

const manifestPath = join(OFFICIAL_DIR, 'manifest.json');
const manifest = readJsonIfExists(manifestPath, { files: [] });
const blocked = [];

async function get(url) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } catch (err) {
    const host = new URL(url).host;
    blocked.push({ host, url, error: String(err.cause?.message ?? err.message) });
    return null;
  }
}

async function download(url, dest, meta) {
  const path = join(OFFICIAL_DIR, dest);
  const prev = manifest.files.find((f) => f.dest === dest);
  if (prev && existsSync(path) && (!meta.bytes || statSync(path).size === meta.bytes)) {
    console.log(`  = ${dest} (ya descargado)`);
    return;
  }
  if (DRY) {
    console.log(`  ↓ ${url} → ${dest}${meta.bytes ? ` (${(meta.bytes / 1e6).toFixed(1)} MB)` : ''}`);
    return;
  }
  const res = await get(url);
  if (!res) return;
  ensureDir(dirname(path));
  await pipeline(Readable.fromWeb(res.body), createWriteStream(path));
  const entry = { url, dest, exportDate: meta.exportDate ?? null, bytes: statSync(path).size, sha256: await sha256File(path), fetchedAt: new Date().toISOString() };
  manifest.files = manifest.files.filter((f) => f.dest !== dest).concat(entry);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`  ✓ ${dest} ${(entry.bytes / 1e6).toFixed(1)} MB sha256 ${entry.sha256.slice(0, 12)}…`);
}

ensureDir(OFFICIAL_DIR);
const index = OFFICIAL_SOURCES.find((s) => s.id === 'openfda-download-index');
const res = await get(index.url);
if (res) {
  const idx = await res.json();
  for (const ep of index.endpoints) {
    if (ONLY && ep !== ONLY) continue;
    const [group, name] = ep.split('/');
    const node = idx.results?.[group]?.[name];
    if (!node) {
      console.warn(`! ${ep}: no figura en download.json`);
      continue;
    }
    console.log(`${ep}: ${node.partitions.length} particiones, export ${node.export_date}`);
    for (const p of node.partitions) {
      const file = new URL(p.file).pathname.split('/').pop();
      await download(p.file, join('openfda', group, name, file), { exportDate: node.export_date });
    }
  }
}

if (GUDID_DELIMITED) {
  const page = OFFICIAL_SOURCES.find((s) => s.id === 'accessgudid-delimited-full');
  const r = await get(page.url);
  if (r) {
    const html = await r.text();
    const links = [...html.matchAll(/href="([^"]*AccessGUDID_Delimited_Full_Release_(\d{8})\.zip)"/g)].map((m) => ({ href: new URL(m[1], page.url).href, date: m[2] }));
    const latest = links.sort((a, b) => b.date.localeCompare(a.date))[0];
    if (latest) await download(latest.href, join('accessgudid', latest.href.split('/').pop()), { exportDate: latest.date });
    else console.warn('! AccessGUDID: no se encontró el enlace del Full Release delimitado en la página');
  }
}

if (blocked.length) {
  console.error('\nHosts no alcanzables desde esta red (no se probaron alternativas):');
  for (const b of blocked) console.error(`  ${b.host}  ${b.error}  (${b.url})`);
  console.error('Habilitarlos en la política de red del entorno: https://code.claude.com/docs/en/cloud-environments#network-access');
  process.exitCode = 2;
}
