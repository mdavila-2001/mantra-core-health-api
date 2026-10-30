#!/usr/bin/env node
// =============================================================================
// TAREA-41 F4 — completa un `cima.ndjson` ya bajado con las secciones 4.5
// (interacciones) y 4.6 (fertilidad, embarazo y lactancia) de la ficha técnica.
//
// Por qué existe: el `cima.ndjson` del 2026-09-30 se bajó antes de que 4.5 y 4.6
// estuvieran en la lista blanca, y no hay caché para reanudar. Correr
// `import-cima.mjs` entero repetiría ~19 000 peticiones (listados, detalles y
// las 7 secciones); acá se piden SÓLO las dos que faltan, del producto de
// referencia que cada fila ya declara (~2 x nº de VTM).
//
// Reglas: sólo secciones de la lista blanca (`sectionUrl` lanza para la 4.2);
// la política de peticiones es la de `sources.json` («aemps-cima».rateLimit.policy);
// todo se cachea en `<GLOSSARY_BUILD_DIR>/cache/cima/sections/<nregistro>/<sec>.json`,
// así que una corrida interrumpida se reanuda donde quedó. No toca el archivo de
// entrada: escribe uno nuevo.
//
//   GLOSSARY_BUILD_DIR=<dir> node tools/terminology-import/import-cima-sections.mjs
//        --from <cima.ndjson sin 4.2> --out <cima.ndjson nuevo> [--sections 4.5,4.6] [--limit N]
// =============================================================================

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { HttpClient, cacheDir, ensureDir, nowIso } from './lib/glossary-es/common.mjs';
import { assertAllowedSection, sectionRequests, toSection } from './lib/glossary-es/cima.mjs';
import { missingSections, referenceOf } from './lib/glossary-es/cima-sections.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, def) => (args.includes(name) ? args[args.indexOf(name) + 1] : def);
const FROM = resolve(opt('--from', ''));
const TO = resolve(opt('--out', ''));
const WANTED = opt('--sections', '4.5,4.6').split(',').map((s) => assertAllowedSection(s.trim()));
const LIMIT = Number(opt('--limit', 0));
if (!args.includes('--from') || !args.includes('--out')) throw new Error('Faltan --from y --out.');

const policy = JSON.parse(readFileSync(join(HERE, 'sources.json'), 'utf8')).sources['aemps-cima'].rateLimit.policy;
const http = new HttpClient({ concurrency: policy.concurrency, minDelayMs: policy.minIntervalMs });
const CACHE = cacheDir('cima');

const rows = readFileSync(FROM, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const retrievedAt = nowIso();
const stats = { rows: rows.length, withoutReference: 0, requested: 0, added: {}, empty: {} };
let done = 0;

for (const row of rows) {
  if (LIMIT && done >= LIMIT) break;
  done += 1;
  const ref = referenceOf(row);
  if (!ref) {
    stats.withoutReference += 1;
    continue;
  }
  const missing = new Set(missingSections(row, WANTED));
  for (const { section, url } of sectionRequests(ref.nregistro)) {
    if (!missing.has(section)) continue;
    stats.requested += 1;
    const resp = await http.getJsonCached(url, join(CACHE, 'sections', ref.nregistro, `${section}.json`), { allow404: true });
    const sec = toSection(section, resp, ref, retrievedAt);
    if (sec) {
      row.drugFacts.sections.push(sec);
      stats.added[section] = (stats.added[section] ?? 0) + 1;
    } else stats.empty[section] = (stats.empty[section] ?? 0) + 1;
  }
  if (done % 100 === 0) console.log(`[cima-sections] ${done}/${rows.length} filas · ${stats.requested} peticiones · +${JSON.stringify(stats.added)}`);
}

ensureDir(dirname(TO));
writeFileSync(TO, `${rows.map((r) => JSON.stringify(r)).join('\n')}\n`);
writeFileSync(TO.replace(/\.ndjson$/, '.sections.meta.json'), `${JSON.stringify({ source: 'aemps-cima', sections: WANTED, retrievedAt, ...stats, http: http.stats }, null, 2)}\n`);
console.log('[cima-sections] listo', JSON.stringify({ ...stats, http: http.stats }));
