#!/usr/bin/env node
// =============================================================================
// EUDAMED Public API v1.0 (Data Lake de DG SANTE): recorrido COMPLETO de /udi,
// reanudable, con el recorte a diagnóstico hecho en el momento (los crudos de
// EUDAMED pesan ~14 GB: no caben en disco, así que se conserva solo lo que
// entra por alcance EMDN y se cuentan las demás por categoría).
//
// Verificado contra el servicio real el 2026-10-27:
//  - sin clave de suscripción; `api-version=v1.0` es obligatorio (sin él, 404);
//  - 1 000 filas por página, sin parámetro de tamaño ni compresión;
//  - los filtros (NOMENCLATURE_CODE, MF_SRN, …) son de IGUALDAD EXACTA y
//    NOMENCLATURE_CODE trae un espacio inicial (« L031299») y, a veces, varios
//    códigos separados por coma («Y061203,Y063303»): filtrar por código dejaría
//    afuera los equipos con más de un código; por eso se recorre todo `/udi`
//    por `nextLink` y se filtra en el cliente.
//
//   node fetch-eudamed.mjs [--max-pages=N] [--delay-ms=700]
//   node fetch-eudamed.mjs --name=ivdr --filter=APPLICABLE_LEGISLATION_ID=-198
//
// Con `--filter` (parámetros de igualdad exacta del servicio, separados por
// coma) se recorre solo esa partición, con estado propio (`state-<name>.json`,
// `chunk-<name>-NNNNN.json.gz`). Sirve para conseguir antes un subconjunto
// (p. ej. IVDR / IVDD) mientras el recorrido completo sigue. `build-official.mjs`
// une todos los chunks y deduplica por UUID.
//
// Estado en <BUILD>/cache/eudamed/udi-scan/: state.json (cursor), chunk-NNNNN.json.gz
// (filas crudas en alcance con su URL de página) y stats.json.
// =============================================================================

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import {
  cacheDir,
  ensureDir,
  httpFetch,
  nowIso,
  readJson,
  writeJson,
} from './lib/common.mjs';
import { classifyEmdn } from './lib/emdn-scope.mjs';
import {
  assertSafeNext,
  buildUrl,
  parsePage,
  splitNomenclature,
} from './lib/sources/eudamed-datalake.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const MAX_PAGES = args['max-pages'] ? Number(args['max-pages']) : Infinity;
const DELAY_MS = Number(args['delay-ms'] ?? 700);
const PAGES_PER_CHUNK = 50;
const NAME = args.name && args.name !== true ? String(args.name) : null;
const FILTER = args.filter
  ? Object.fromEntries(String(args.filter).split(',').map((kv) => kv.split('=')))
  : {};
if (Object.keys(FILTER).length && !NAME) throw new Error('--filter exige --name');
const SUFFIX = NAME ? `-${NAME}` : '';

const DIR = ensureDir(cacheDir('eudamed', 'udi-scan'));
const STATE = join(DIR, `state${SUFFIX}.json`);
const STATS = join(DIR, `stats${SUFFIX}.json`);
const TMP = join(DIR, `page${SUFFIX}.tmp.json`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** ¿Alguna de las codificaciones de la fila está en alcance de diagnóstico? */
export function rowScope(row) {
  const codes = splitNomenclature(row.NOMENCLATURE_CODE);
  if (!codes.length) return { inScope: false, rule: 'sin-codigo-emdn' };
  const verdicts = codes.map((c) => classifyEmdn(c));
  return verdicts.find((v) => v.inScope) ?? verdicts[0];
}

const state = existsSync(STATE)
  ? readJson(STATE)
  : {
      name: NAME,
      filter: FILTER,
      firstUrl: buildUrl('udi', FILTER),
      nextUrl: buildUrl('udi', FILTER),
      pages: 0,
      rowsSeen: 0,
      rowsKept: 0,
      chunks: 0,
      startedAt: nowIso(),
      completedAt: null,
    };
const stats = existsSync(STATS)
  ? readJson(STATS)
  : { byCategory: {}, byRule: {}, legislation: {}, idMin: null, idMax: null };

let pending = []; // { rows, pageUrl, retrievedAt } desde el último chunk

function flushChunk() {
  if (!pending.length) return;
  state.chunks += 1;
  const name = `chunk${SUFFIX}-${String(state.chunks).padStart(5, '0')}.json.gz`;
  writeFileSync(
    join(DIR, name),
    gzipSync(Buffer.from(JSON.stringify(pending)), { level: 9 }),
  );
  pending = [];
}

function save() {
  writeJson(STATE, state);
  writeJson(STATS, stats);
}

async function getPage(url) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = httpFetch(url, {
      headers: { Accept: 'application/json' },
      outFile: TMP,
      timeoutS: 180,
    });
    if (res.ok) {
      try {
        return parsePage(JSON.parse(readFileSync(TMP, 'utf8')));
      } catch (err) {
        console.warn(`[intento ${attempt}] página ilegible: ${err.message}`);
      }
    } else
      console.warn(
        `[intento ${attempt}] ${res.status ?? res.error ?? 'sin respuesta'} — ${url.slice(0, 140)}`,
      );
    await sleep(Math.min(60_000, 2_000 * 2 ** attempt)); // backoff exponencial con tope
  }
  throw new Error(`EUDAMED: 6 intentos fallidos en ${url.slice(0, 200)}`);
}

async function main() {
  const t0 = Date.now();
  let done = 0;
  while (state.nextUrl && done < MAX_PAGES) {
    const url = state.nextUrl;
    const retrievedAt = nowIso();
    const { rows, nextLink } = await getPage(url);
    const kept = [];
    for (const r of rows) {
      const s = rowScope(r);
      const cat = splitNomenclature(r.NOMENCLATURE_CODE)[0]?.[0] ?? '—';
      stats.byCategory[cat] = (stats.byCategory[cat] ?? 0) + 1;
      stats.byRule[s.rule] = (stats.byRule[s.rule] ?? 0) + 1;
      const leg = String(r.APPLICABLE_LEGISLATION_ID ?? 'null');
      stats.legislation[leg] = (stats.legislation[leg] ?? 0) + 1;
      if (typeof r.ID === 'number') {
        stats.idMin = stats.idMin === null ? r.ID : Math.min(stats.idMin, r.ID);
        stats.idMax = stats.idMax === null ? r.ID : Math.max(stats.idMax, r.ID);
      }
      if (s.inScope) kept.push(r);
    }
    if (kept.length) pending.push({ rows: kept, pageUrl: url, retrievedAt });
    state.pages += 1;
    state.rowsSeen += rows.length;
    state.rowsKept += kept.length;
    state.nextUrl = nextLink ? assertSafeNext(nextLink, url) : null;
    if (!state.nextUrl) state.completedAt = nowIso();
    done += 1;
    if (state.pages % PAGES_PER_CHUNK === 0 || !state.nextUrl) flushChunk();
    // El estado se guarda DESPUÉS del chunk que contiene sus filas.
    if (state.pages % PAGES_PER_CHUNK === 0 || !state.nextUrl) save();
    if (state.pages % 10 === 0)
      console.log(
        `páginas ${state.pages} · vistas ${state.rowsSeen} · en alcance ${state.rowsKept} · ${(((Date.now() - t0) / 1000) | 0)} s`,
      );
    await sleep(DELAY_MS);
  }
  flushChunk();
  save();
  console.log(
    state.completedAt
      ? `COMPLETO: ${state.pages} páginas, ${state.rowsSeen} filas, ${state.rowsKept} en alcance`
      : `Detenido en la página ${state.pages} (reanudable).`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`)
  main().catch((err) => {
    flushChunk();
    save();
    console.error('ERROR FATAL en eu/fetch-eudamed:', err);
    process.exitCode = 1;
  });
