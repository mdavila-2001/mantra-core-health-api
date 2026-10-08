#!/usr/bin/env node
// =============================================================================
// Baja y cachea las páginas públicas de MedlinePlus de los temas de salud
// (https://medlineplus.gov/spanish/<tema>.html) para tres usos:
//   1. verificar PÁGINA POR PÁGINA que el resumen no contiene A.D.A.M.,
//   2. leer «Última actualización» y la organización responsable (sourceVersion),
//   3. ofrecer el enlace de origen donde se verifican las muestras a mano.
// 1 petición por segundo, User-Agent identificable, caché en disco (reanudable).
// Las guías de pruebas ya las bajó `import-medlineplus-es.mjs` (no se repiten).
// =============================================================================

import { join } from 'node:path';
import { HttpClient, mapPool, progressLogger, readNdjson } from '../../lib/glossary-es/common.mjs';
import { DEFAULTS, S1_USER_AGENT } from './lib/config.mjs';
import { topicPageCachePath } from './lib/pages.mjs';

const http = new HttpClient({ concurrency: 1, minDelayMs: 1000, headers: { 'User-Agent': S1_USER_AGENT } });
const rows = readNdjson(join(DEFAULTS.corpusDir, 'medlineplus-es.ndjson'));
const failed = [];

await mapPool(
  rows,
  1,
  async (row) => {
    try {
      await http.getFileCached(row.sourceUrl, topicPageCachePath(DEFAULTS.cacheDir, row.code));
    } catch (err) {
      failed.push({ code: row.code, url: row.sourceUrl, error: err.message });
    }
  },
  progressLogger('s1:pages', 50),
);
console.log(JSON.stringify({ requests: http.stats, failed }, null, 2));
process.exitCode = failed.length ? 1 : 0;
