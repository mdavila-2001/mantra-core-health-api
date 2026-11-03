#!/usr/bin/env node
// =============================================================================
// Equipos de diagnóstico · ROW · etapa 0: maestro JMDN del 医療機器基準データベース
// (https://www.std.pmda.go.jp/).
//
// La base no ofrece descarga masiva: solo un formulario de búsqueda. Para cubrir
// las 一般的名称 sin filtros inventados se busca por cada clase (Ⅰ–Ⅳ), que juntas
// suman el total publicado en la portada de la base, y se piden las fichas de
// detalle en lotes de 100, con pausa entre pedidos. Cada página se guarda tal
// cual (Shift_JIS) en `$DX_DEVICES_BUILD_DIR/official/pmda-jmdn/` y queda
// anotada en `official/retrieved.json` con su sha256. El sitio no publica
// robots.txt (404 al 2026-10-24).
//
// Uso: node tools/terminology-import/diagnostic-devices/row/fetch-pmda-jmdn.mjs
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { TextDecoder } from 'node:util';

import { BUILD_DIR, ensureDir, readJson, sha256File } from './lib/row.mjs';

const BASE = 'https://www.std.pmda.go.jp/scripts/stdDB/JMDN';
const DIR = ensureDir(join(BUILD_DIR, 'official', 'pmda-jmdn'));
const RETRIEVED = join(BUILD_DIR, 'official', 'retrieved.json');
const CLASSES = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'];
const BATCH = 100;
const PAUSE_MS = 2000;
const UA = 'Mozilla/5.0 (mantra-core-health terminology import)';

const sjis = new TextDecoder('shift_jis');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Codifica en Shift_JIS para la query string (el CGI no acepta UTF-8). */
function sjisPercent(text) {
  return execFileSync(
    'python3',
    [
      '-I',
      '-c',
      'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1],encoding="cp932"))',
      text,
    ],
    { encoding: 'utf8' },
  ).trim();
}

function curl(args) {
  return execFileSync('curl', [
    '-sS',
    '--fail',
    '-L',
    '--retry',
    '4',
    '--retry-delay',
    '5',
    '-m',
    '300',
    '-A',
    UA,
    ...args,
  ]);
}

async function main() {
  const retrieved = existsSync(RETRIEVED) ? readJson(RETRIEVED) : {};
  const ids = new Set();
  for (const klass of CLASSES) {
    const query =
      new URLSearchParams({ andor: 'and', allchk: '', mode: '1' }).toString() +
      `&Q_JMDN_class=${sjisPercent(klass)}`;
    const html = sjis.decode(curl([`${BASE}/stdDB_jmdn_resl.cgi?${query}`]));
    const m = /name="SearchedJMDN_no" value="([^"]*)"/.exec(html);
    if (m === null)
      throw new Error(`clase ${klass}: la respuesta no trae SearchedJMDN_no`);
    const found = m[1].split(',').filter((v) => v !== '' && v !== '0');
    for (const id of found) ids.add(id);
    console.log(`clase ${klass}: ${found.length}`);
    await sleep(PAUSE_MS);
  }
  const all = [...ids].sort((a, b) => Number(a) - Number(b));
  console.log(`total: ${all.length} jmdn_no`);
  const pages = [];
  for (let i = 0; i < all.length; i += BATCH) {
    const batch = all.slice(i, i + BATCH);
    const name = `resr-${String(i / BATCH + 1).padStart(3, '0')}.html`;
    const path = join(DIR, name);
    const body = [
      'Sig=1',
      'all=',
      'allView=',
      ...batch.map((id) => `jmdn_no=${id}`),
    ].join('&');
    writeFileSync(
      path,
      curl(['-X', 'POST', '--data', body, `${BASE}/stdDB_jmdn_resr.cgi`]),
    );
    pages.push({ name, ids: batch, sha256: await sha256File(path) });
    process.stdout.write(`\r${pages.length} páginas`);
    await sleep(PAUSE_MS);
  }
  process.stdout.write('\n');
  writeFileSync(
    join(DIR, 'index.json'),
    JSON.stringify({ classes: CLASSES, total: all.length, pages }, null, 2) +
      '\n',
  );
  retrieved[`${BASE}/stdDB_jmdn_resr.cgi`] = {
    group: 'pmda-jmdn',
    path: 'pmda-jmdn',
    pages: pages.length,
    total: all.length,
    indexSha256: await sha256File(join(DIR, 'index.json')),
    retrievedAt: new Date().toISOString(),
  };
  writeFileSync(RETRIEVED, JSON.stringify(retrieved, null, 2) + '\n');
  console.log(`index.json → ${join(DIR, 'index.json')}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
