#!/usr/bin/env node
// =============================================================================
// S3 · etapa 1: descarga de las secciones de la ficha técnica de CIMA (AEMPS)
// del producto de referencia de cada principio activo.
//
//   - 1 petición por segundo, una a la vez, User-Agent identificable, reintento
//     con retroceso y caché en disco (reanudable: volvé a correr el comando).
//   - Solo secciones de la LISTA BLANCA (`lib/sections.mjs`). La 4.2 no existe
//     para este script: ni URL, ni ruta de caché, ni lectura.
//   - Reutiliza la caché del importador anterior solo cuando la fecha de la
//     ficha en el listado de hoy es la misma que la de entonces; si cambió, la
//     sección se vuelve a pedir.
//
// Uso:
//   node fetch-cima.mjs --plan                 # cuenta pedidos y tiempo, no baja nada
//   node fetch-cima.mjs [--limit N] [--only 4.5,4.6]
// =============================================================================

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadVtmIndex, madridDay } from './lib/corpus.mjs';
import { CACHE_DIR, GLOSSARY_NDJSON_DIR, LEGACY_CIMA_CACHE } from './lib/paths.mjs';
import { PoliteClient } from './lib/polite-client.mjs';
import { ALLOWED_SECTIONS, CIMA_REST, assertAllowedSection, sectionUrl } from './lib/sections.mjs';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const PLAN_ONLY = args.includes('--plan');
const LIMIT = Number(opt('--limit', 0));
const ONLY = opt('--only', null)?.split(',').map((s) => assertAllowedSection(s.trim())) ?? null;

const client = new PoliteClient({ minIntervalMs: 1000 });
const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
function writeJson(p, v) {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(v));
}

/** Ruta de la caché propia de una sección. Pasa SIEMPRE por la lista blanca. */
export function sectionCachePath(nregistro, code) {
  assertAllowedSection(code);
  return join(CACHE_DIR, 'sections', String(nregistro), `${code}.json`);
}

async function fetchListing() {
  const first = await client.getJsonCached(`${CIMA_REST}/medicamentos?pagina=1`, join(CACHE_DIR, 'list', 'page-1.json'));
  const pages = Math.ceil(first.totalFilas / first.tamanioPagina);
  const rows = [...(first.resultados ?? [])];
  for (let p = 2; p <= pages; p++) {
    const d = await client.getJsonCached(`${CIMA_REST}/medicamentos?pagina=${p}`, join(CACHE_DIR, 'list', `page-${p}.json`));
    rows.push(...(d.resultados ?? []));
    if (p % 20 === 0) log(`listado ${p}/${pages}`);
  }
  const byReg = new Map();
  for (const r of rows) {
    const ft = (r.docs ?? []).find((d) => d.tipo === 1);
    byReg.set(r.nregistro, { fichaMs: typeof ft?.fecha === 'number' ? ft.fecha : null, segmented: ft?.secc === true });
  }
  return { reported: first.totalFilas, pages, byReg };
}

function legacySection(nregistro, code) {
  const p = join(LEGACY_CIMA_CACHE, 'sections', String(nregistro), `${assertAllowedSection(code)}.json`);
  return existsSync(p) ? { response: readJson(p) } : null;
}

async function main() {
  const index = await loadVtmIndex(join(GLOSSARY_NDJSON_DIR, 'cima.ndjson'));
  let targets = index.filter((v) => v.referenceNregistro);
  if (LIMIT > 0) targets = targets.slice(0, LIMIT);
  const codes = ONLY ?? ALLOWED_SECTIONS;
  log(`${index.length} principios activos; ${targets.length} con producto de referencia; secciones: ${codes.join(', ')}`);

  if (PLAN_ONLY) {
    const missing = targets.reduce((n, v) => n + codes.filter((c) => !existsSync(sectionCachePath(v.referenceNregistro, c))).length, 0);
    const legacy = targets.reduce(
      (n, v) => n + codes.filter((c) => !existsSync(sectionCachePath(v.referenceNregistro, c)) && legacySection(v.referenceNregistro, c)).length,
      0,
    );
    console.log(JSON.stringify({ secciones_sin_cache_propia: missing, reutilizables_de_cache_anterior: legacy, a_pedir_como_maximo: missing - legacy, listado_paginas: 128, segundos_estimados: (missing - legacy + 128) * 1.1 }, null, 2));
    return;
  }

  const t0 = Date.now();
  const listing = await fetchListing();
  log(`listado de hoy: ${listing.byReg.size} medicamentos (la API informa ${listing.reported})`);

  const manifestPath = join(CACHE_DIR, 'sections-manifest.json');
  const manifest = existsSync(manifestPath) ? readJson(manifestPath) : {};
  const legacyRetrievedAt = readJson(join(GLOSSARY_NDJSON_DIR, 'cima.meta.json')).retrievedAt;
  const today = new Date().toISOString();
  const tally = { reusedLegacy: 0, fetched: 0, alreadyOwnCache: 0, absent: 0, staleRefetch: 0, refMissingInListing: 0 };

  // 4.5 y 4.6 primero: son las que el corpus anterior no tenía.
  const ordered = [...codes].sort((a, b) => Number(['4.5', '4.6'].includes(b)) - Number(['4.5', '4.6'].includes(a)));
  let done = 0;
  for (const code of ordered) {
    for (const v of targets) {
      const nreg = v.referenceNregistro;
      const own = sectionCachePath(nreg, code);
      const entry = (manifest[nreg] ??= {});
      const todayRow = listing.byReg.get(nreg);
      const refInfo = v.products.find((p) => p.nregistro === nreg);
      const oldMs = refInfo?.fichaTecnicaDate ? Date.parse(refInfo.fichaTecnicaDate) : null;
      if (!todayRow) tally.refMissingInListing++;
      const currentMs = todayRow ? todayRow.fichaMs : oldMs;
      const currentDate = currentMs == null ? null : madridDay(currentMs);
      const oldDate = oldMs == null ? null : madridDay(oldMs);

      if (existsSync(own) && entry[code]?.fichaDate === currentDate) {
        tally.alreadyOwnCache++;
        continue;
      }
      const legacy = oldMs != null && currentMs === oldMs ? legacySection(nreg, code) : null;
      if (legacy) {
        writeJson(own, legacy.response);
        entry[code] = { origin: 'legacy-cache', retrievedAt: legacyRetrievedAt, fichaDate: currentDate };
        tally.reusedLegacy++;
        continue;
      }
      if (oldMs != null && currentMs !== oldMs) tally.staleRefetch++;
      const response = await client.getJsonCached(sectionUrl(nreg, code), own);
      entry[code] = { origin: 'fetched', retrievedAt: today, fichaDate: currentDate };
      if (response == null) tally.absent++;
      else tally.fetched++;
      if (++done % 50 === 0) {
        writeJson(manifestPath, manifest);
        log(`sección ${code}: ${done} pedidos hechos · ${JSON.stringify(client.stats)}`);
      }
    }
    writeJson(manifestPath, manifest);
    log(`sección ${code} completa`);
  }
  writeJson(manifestPath, manifest);
  const summary = { ...tally, http: client.stats, segundos: Math.round((Date.now() - t0) / 1000) };
  writeJson(join(CACHE_DIR, 'fetch-summary.json'), summary);
  console.log(JSON.stringify(summary, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('ERROR FATAL en fetch-cima:', err);
    process.exitCode = 1;
  });
}
