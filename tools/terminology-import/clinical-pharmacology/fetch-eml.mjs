#!/usr/bin/env node
// =============================================================================
// Farmacología clínica · etapa 1g (red): Lista electrónica de Medicamentos
// Esenciales de la OMS (eEML).
//
//   1. Portada (https://list.essentialmeds.org/): lista vigente; de ahí salen
//      los ids de recomendación.
//   2. JSON-LD oficial de cada recomendación (`/recommendations/<id>.jsonld`).
//
// Se guarda en clinical-pharmacology/cache/eml/ (fuera de git) con la portada, su
// sha256 y la fecha de consulta. Reanudable: lo ya bajado no se vuelve a pedir.
// De la eEML sólo se usan identificadores y enlaces (lib/eml.mjs): el JSON-LD
// crudo de la caché no se versiona ni se carga.
//
// Uso: NODE_USE_ENV_PROXY=1 node tools/terminology-import/clinical-pharmacology/fetch-eml.mjs
// =============================================================================

import { createHash } from 'node:crypto';
import { join } from 'node:path';

import { HttpClient, mapPool, progressLogger, writeJson } from '../lib/glossary-es/common.mjs';
import { EML_ROOT, emlRecommendation, emlRecommendationJsonUrl, isCurrentRecommendation, recommendationIdsFromHome } from './lib/eml.mjs';
import { cpCache, emlRecommendationPath } from './lib/paths.mjs';

const http = new HttpClient({ concurrency: 2, minDelayMs: 300 });

async function main() {
  const t0 = Date.now();
  const home = await http.getFileCached(`${EML_ROOT}/`, join(cpCache('eml'), 'home.html'));
  const ids = recommendationIdsFromHome(home.toString('utf8'));
  console.log(`[eml] ${ids.length} recomendaciones enlazadas desde la portada`);
  const docs = await mapPool(ids, 2, (id) => http.getJsonCached(emlRecommendationJsonUrl(id), emlRecommendationPath(id)), progressLogger('eml:recomendaciones', 200));
  const recs = docs.map((d, i) => (d ? emlRecommendation(ids[i], d) : null)).filter(Boolean);
  const current = recs.filter(isCurrentRecommendation);
  const meta = {
    source: 'who-eeml',
    url: `${EML_ROOT}/`,
    homeSha256: createHash('sha256').update(home).digest('hex'),
    recommendations: ids.length,
    fetched: recs.length,
    byStatus: recs.reduce((a, r) => ({ ...a, [r.status ?? 'null']: (a[r.status ?? 'null'] ?? 0) + 1 }), {}),
    currentWithAtc5: current.filter((r) => r.atc5.length).length,
    currentWithoutAtc5: current.filter((r) => !r.atc5.length).map((r) => ({ id: r.id, atcRaw: r.atcRaw, medicines: r.medicines.map((m) => m.id) })),
    atc5: new Set(current.flatMap((r) => r.atc5)).size,
    latestGuidelineDate: current.map((r) => r.guidelineDate).filter(Boolean).sort().at(-1) ?? null,
    http: http.stats,
    segundos: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(join(cpCache('eml'), 'fetch.meta.json'), meta, true);
  console.log(JSON.stringify({ ...meta, currentWithoutAtc5: meta.currentWithoutAtc5.length }, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-eml:', err);
  process.exitCode = 1;
});
