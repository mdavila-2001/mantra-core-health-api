#!/usr/bin/env node
// =============================================================================
// GARD (NCATS / NIH) · etapa 0 (red): lista oficial de enfermedades + fichas.
//
// Qué baja, todo desde archivos que el propio sitio publica para descargar:
//   1. «GARD Rare Disease List <mes>.csv»  — el enlace de https://rarediseases.info.nih.gov/about
//      (ID, Display Name, Synonyms, URL: ~16 000 enfermedades).
//   2. /assets/diseases.trimmed.json       — las enfermedades con ficha pública (~6 000).
//   3. /assets/singles/<id>.json           — la ficha de cada una (los mismos datos que usa la
//      página): nombre, sinónimos, xrefs (MONDO, ORPHA, OMIM, MedGen, UMLS), nombre en castellano,
//      concepto obsoleto y reemplazo. robots.txt del sitio permite `/` (sólo veta /errors,
//      /not-found y /gard-id).
//
// Cortesía: 2 pedidos a la vez como máximo, cada uno espera ≥ 600 ms tras el anterior (≈ 1,5 pedidos/s en
// total, por debajo del tope de 2/s),
// User-Agent identificable, reintentos con backoff, reanudable (un archivo bajado y válido no se
// vuelve a pedir). Usa `curl` (respeta HTTPS_PROXY y la CA del sistema).
//
// Salida: <SOURCES_DIR>/gard/{gard-disease-list.csv, diseases.trimmed.json, singles/<id>.json, manifest.json}
// `manifest.json` lleva el SHA-256 de cada archivo y el SHA-256 combinado de las fichas.
//
// Uso: node tools/terminology-import/diseases/fetch-gard.mjs [--limit N]
// =============================================================================

import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { ensureDir, nowIso, sha256File, sleep, writeJson } from '../lib/glossary-es/common.mjs';
import { GARD } from './lib/sources.mjs';

const run = promisify(execFile);
const UA = 'mantra-core-health-terminology-import/1.0 (carga de catalogos; contacto pabliarca@gmail.com)';
const DELAY_MS = 600;
const args = process.argv.slice(2);
const LIMIT = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;

async function curl(url, dest) {
  for (let attempt = 1; ; attempt++) {
    try {
      await run('curl', ['-sSfL', '-m', '120', '-A', UA, '-o', dest, url]);
      return;
    } catch (err) {
      if (attempt >= 6) throw new Error(`GARD: ${url}: ${err.message}`);
      await sleep(1000 * 2 ** attempt);
    }
  }
}

const validJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) && true;
  } catch {
    return false;
  }
};

async function main() {
  const dir = ensureDir(join(GARD.dir));
  const singlesDir = ensureDir(join(dir, 'singles'));
  const csv = join(dir, 'gard-disease-list.csv');
  const trimmed = join(dir, 'diseases.trimmed.json');
  if (!existsSync(csv) || statSync(csv).size < 1024) {
    console.log(`[gard] lista oficial ← ${GARD.listUrl}`);
    await curl(GARD.listUrl, csv);
    await sleep(DELAY_MS);
  }
  if (!existsSync(trimmed) || !validJson(trimmed)) {
    console.log(`[gard] fichas públicas ← ${GARD.trimmedUrl}`);
    await curl(GARD.trimmedUrl, trimmed);
    await sleep(DELAY_MS);
  }
  const ids = JSON.parse(readFileSync(trimmed, 'utf8')).map((d) => d.id);
  let fetched = 0;
  let cached = 0;
  const queue = ids.slice(0, LIMIT);
  const worker = async () => {
    for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
      const dest = join(singlesDir, `${id}.json`);
      if (existsSync(dest) && validJson(dest)) {
        cached++;
        continue;
      }
      await curl(`${GARD.singlesUrl}${id}.json`, dest);
      if (!validJson(dest)) throw new Error(`GARD: la ficha ${id} no es JSON`);
      fetched++;
      if (fetched % 250 === 0) console.log(`[gard] ${fetched} fichas nuevas (${cached} ya estaban) de ${ids.length}`);
      await sleep(DELAY_MS);
    }
  };
  await Promise.all([worker(), worker()]);
  // Manifiesto: SHA-256 por archivo y combinado de las fichas (ordenadas por id).
  const index = ids
    .filter((id) => existsSync(join(singlesDir, `${id}.json`)))
    .sort((a, b) => a - b)
    .map((id) => ({ id, sha256: sha256File(join(singlesDir, `${id}.json`)) }));
  const combined = createHash('sha256').update(index.map((e) => `${e.id} ${e.sha256}`).join('\n')).digest('hex');
  writeJson(
    join(dir, 'manifest.json'),
    {
      generatedAt: nowIso(),
      userAgent: UA,
      list: { url: GARD.listUrl, sha256: sha256File(csv), bytes: statSync(csv).size },
      trimmed: { url: GARD.trimmedUrl, sha256: sha256File(trimmed), bytes: statSync(trimmed).size, diseases: ids.length },
      singles: { urlPrefix: GARD.singlesUrl, files: index.length, combinedSha256: combined },
    },
    true,
  );
  writeFileSync(join(dir, 'singles-index.txt'), `${index.map((e) => `${e.id}\t${e.sha256}`).join('\n')}\n`);
  console.log(`[gard] ${index.length}/${ids.length} fichas · nuevas ${fetched} · en caché ${cached} · SHA-256 combinado ${combined}`);
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-gard:', err);
  process.exitCode = 1;
});
