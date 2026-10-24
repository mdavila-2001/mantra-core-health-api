#!/usr/bin/env node
// =============================================================================
// Farmacología clínica · etapa 1f (red): DailyMed (NLM), sólo lo que openFDA
// no deja enlazar por código.
//
//   1. Listado oficial de etiquetas de medicamentos de prescripción humanos
//      (`/services/v2/spls.json?doctype=34391-3`, 100 por página).
//   2. Cruce por `set_id` con las particiones de openFDA ya bajadas:
//      candidatas = las que openFDA no tiene + las que openFDA tiene sin UNII
//      (sin bloque `openfda` armonizado). Las demás ya entraron por openFDA.
//   3. SPL XML de cada candidata (`/services/v2/spls/<setid>.xml`): trae el UNII
//      de cada principio activo, que permite enlazar por código.
//
// Uso:
//   NODE_USE_ENV_PROXY=1 node …/fetch-dailymed.mjs --plan   # listado + cruce, sin bajar SPL
//   NODE_USE_ENV_PROXY=1 node …/fetch-dailymed.mjs          # además baja los SPL candidatos (reanudable)
// =============================================================================

import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { HttpClient, mapPool, progressLogger, writeJson } from '../lib/glossary-es/common.mjs';
import { parseArgs } from './lib/cli.mjs';
import { DAILYMED_REST, RX_HUMAN_DOCTYPE, splListUrl, splXmlUrl } from './lib/dailymed.mjs';
import { openFdaSetIndex } from './lib/inputs.mjs';
import { cpCache, splPath } from './lib/paths.mjs';

const { has } = parseArgs();
const PLAN = has('--plan');
const http = new HttpClient({ concurrency: 3, minDelayMs: 250 });
const listPath = (p) => cpCache('dailymed', 'list', `page-${p}.json`);

async function main() {
  const t0 = Date.now();
  const first = await http.getJsonCached(splListUrl(1), listPath(1));
  const pages = first.metadata.total_pages;
  const rest = await mapPool(
    Array.from({ length: pages - 1 }, (_, i) => i + 2),
    3,
    (p) => http.getJsonCached(splListUrl(p), listPath(p)),
    progressLogger('dailymed:listado', 50),
  );
  const listed = [...new Map([first, ...rest].flatMap((d) => d?.data ?? []).map((r) => [r.setid, r])).values()];
  console.log(`[dailymed] ${listed.length} etiquetas Rx humanas listadas (API informa ${first.metadata.total_elements})`);

  const ofda = await openFdaSetIndex();
  const missing = listed.filter((r) => !ofda.has(r.setid));
  const withoutUnii = listed.filter((r) => ofda.get(r.setid) === false);
  const candidates = [...missing, ...withoutUnii].map((r) => r.setid).sort();
  const pending = candidates.filter((s) => !existsSync(splPath(s)));
  console.log(`[dailymed] cruce con openFDA: ${missing.length} ausentes en openFDA, ${withoutUnii.length} sin UNII en openFDA → ${candidates.length} candidatas (${pending.length} por bajar)`);

  if (!PLAN) {
    await mapPool(pending, 3, (s) => http.getFileCached(splXmlUrl(s), splPath(s), { allow404: true }), progressLogger('dailymed:spl', 500));
  }
  const meta = {
    source: 'nlm-dailymed',
    endpoint: DAILYMED_REST,
    doctype: RX_HUMAN_DOCTYPE,
    dbPublishedDate: first.metadata.db_published_date ?? null,
    listed: listed.length,
    reported: first.metadata.total_elements,
    missingInOpenFda: missing.length,
    withoutUniiInOpenFda: withoutUnii.length,
    candidates: candidates.length,
    plan: PLAN,
    http: http.stats,
    segundos: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(join(cpCache('dailymed'), 'fetch.meta.json'), { ...meta, candidateSetIds: candidates }, true);
  console.log(JSON.stringify(meta, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-dailymed:', err);
  process.exitCode = 1;
});
