#!/usr/bin/env node
// =============================================================================
// Etapa 1 (red) del Omaha System: baja a `glossary-data-build/cache/nursing-care/omaha/`
// (fuera de git) lo que el sitio oficial www.omahasystem.org y el MOSUG publican, y
// escribe `omaha.meta.json` con URL, estado HTTP, tipo, tamaño, SHA-256 y fecha de
// cada archivo. Reanudable (si el archivo ya está, sólo lo re-anota) y cortés:
// un pedido por vez, ≥ 600 ms entre pedidos, User-Agent identificable, reintento
// con backoff ante 429/5xx. No elude ningún bloqueo: un 403 queda registrado como tal.
//
// Uso: node tools/terminology-import/nursing-care/fetch-omaha.mjs
// =============================================================================

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { HttpClient, USER_AGENT, ensureDir, nowIso, writeJson } from '../lib/glossary-es/common.mjs';
import { OMAHA_CACHE, OMAHA_META } from './lib/paths.mjs';

const SITE = 'https://www.omahasystem.org';
const MOSUG = 'https://www.omahasystemmn.org';
const PRSO_IMAGE = 'https://images.squarespace-cdn.com/content/v1/5e9a2090d43af50d12883b42/1592242241501-0TTQH5PTFZ83KOKX2D9D/Omaha+System+PRSO.jpg?format=2500w';

/** Qué se baja y para qué se usa. `role`: `load` entra al corpus; `crosscheck` sólo se compara (no se carga). */
export const OMAHA_FILES = [
  { key: 'site-problems', file: 'problemclassificationscheme.html', url: `${SITE}/problemclassificationscheme`, role: 'load' },
  { key: 'site-interventions', file: 'interventionscheme.html', url: `${SITE}/interventionscheme`, role: 'load' },
  { key: 'site-prso', file: 'problemratingscaleforoutcomes.html', url: `${SITE}/problemratingscaleforoutcomes`, role: 'load' },
  { key: 'site-prso-image', file: 'omaha-system-prso.webp', url: PRSO_IMAGE, role: 'load' },
  { key: 'site-faq', file: 'faq.html', url: `${SITE}/faq`, role: 'license' },
  { key: 'site-overview', file: 'overview.html', url: `${SITE}/overview`, role: 'license' },
  { key: 'mosug-kbs-supplement', file: 'OmahaSystemKBSRatingSupplement2010_8x11.pdf', url: `${MOSUG}/booklet/OmahaSystemKBSRatingSupplement2010_8x11.pdf`, role: 'load' },
  { key: 'istanbul-form-i', file: 'ProblemClassificationSchemeTurkish.pdf', url: `${MOSUG}/education/Istanbul/ProblemClassificationSchemeTurkish.pdf`, role: 'crosscheck' },
];

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

async function main() {
  ensureDir(OMAHA_CACHE);
  const http = new HttpClient({ concurrency: 1, minDelayMs: 600, maxRetries: 4, headers: { 'User-Agent': `${USER_AGENT} (Omaha System importer; +https://github.com/mdavila-2001/mantra-core-health-api)` } });
  const previous = existsSync(OMAHA_META) ? JSON.parse(readFileSync(OMAHA_META, 'utf8')) : { files: {} };
  const files = {};
  for (const f of OMAHA_FILES) {
    const path = join(OMAHA_CACHE, f.file);
    let retrievedAt = previous.files?.[f.key]?.retrievedAt ?? nowIso();
    let status = previous.files?.[f.key]?.httpStatus ?? 200;
    let contentType = previous.files?.[f.key]?.contentType ?? null;
    if (!existsSync(path)) {
      const res = await http.get(f.url);
      writeFileSync(path, res.body);
      retrievedAt = nowIso();
      status = res.status;
      contentType = res.headers.get('content-type');
      console.log(`[omaha] ${f.key}: ${res.status} ${res.body.length} B`);
    } else {
      console.log(`[omaha] ${f.key}: ya estaba, se re-anota`);
    }
    const buf = readFileSync(path);
    files[f.key] = { url: f.url.replace(/\?format=2500w$/, ''), downloadUrl: f.url, file: f.file, role: f.role, httpStatus: status, contentType, bytes: buf.length, sha256: sha256(buf), retrievedAt };
  }
  writeJson(OMAHA_META, { generatedAt: nowIso(), userAgent: http.headers['User-Agent'], files }, true);
  console.log(`Escrito ${OMAHA_META}`);
}

main().catch((err) => {
  console.error('ERROR en fetch-omaha:', err);
  process.exitCode = 1;
});
