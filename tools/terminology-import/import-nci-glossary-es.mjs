#!/usr/bin/env node
// =============================================================================
// ETL etapa 1 (fetch → NDJSON): diccionarios del NCI en castellano (cáncer y
// genética) → glosario ES.
//
// Fuente: API pública de glosarios del NCI, https://webapis.cancer.gov/glossary/v1/
// (sin cuenta, sin clave). Texto del NCI «free of copyright» salvo indicación.
// 1 pedido a la vez, 1 s entre pedidos, caché en disco (reanudable).
// Salida: `ndjson/nci-diccionario-cancer-es.ndjson` y `ndjson/nci-diccionario-genetica-es.ndjson`
// + `nci-glossary.meta.json`.
// =============================================================================

import { join } from 'node:path';
import { HttpClient, assertRow, cacheDir, ndjsonPath, nowIso, writeJson, writeNdjson } from './lib/glossary-es/common.mjs';
import { NCI_API, NCI_DICTIONARIES, nciRow, termsUrl } from './lib/glossary-es/nci.mjs';

const http = new HttpClient({ concurrency: 1, minDelayMs: 1000 });
const CACHE = cacheDir('nci-glossary');
const SIZE = 200;

async function main() {
  const t0 = Date.now();
  const retrievedAt = nowIso();
  console.log('=== Diccionarios del NCI en español → glosario ES ===');
  const byCs = new Map();
  const perDictionary = [];
  for (const d of NCI_DICTIONARIES) {
    const key = `${d.dictionary}-${d.audience}`;
    const count = Number(await (await http.get(`${NCI_API}/Terms/count/${d.dictionary}/${d.audience}/es`)).body.toString('utf8'));
    const terms = [];
    for (let from = 0; from < count; from += SIZE) {
      const page = await http.getJsonCached(termsUrl(d, from, SIZE), join(CACHE, key, `from-${String(from).padStart(6, '0')}.json`));
      terms.push(...page.results);
    }
    const seen = new Set();
    let skipped = 0;
    let duplicated = 0;
    for (const t of terms) {
      if (seen.has(t.termId)) { duplicated++; continue; }
      seen.add(t.termId);
      const row = nciRow(t, d, { retrievedAt });
      if (!row) { skipped++; continue; }
      if (!byCs.has(d.codeSystem)) byCs.set(d.codeSystem, new Map());
      const bucket = byCs.get(d.codeSystem);
      // Un mismo término puede estar en pacientes y en profesionales: gana el primero (orden de NCI_DICTIONARIES).
      if (bucket.has(row.slug)) { duplicated++; continue; }
      bucket.set(row.slug, assertRow(row));
    }
    perDictionary.push({ dictionary: d.dictionary, audience: d.audience, reportedCount: count, fetched: terms.length, sinNombreODefinicion: skipped, repetidos: duplicated });
    console.log(`[nci] ${key}: ${count} informados, ${terms.length} bajados, ${skipped} sin nombre/definición, ${duplicated} repetidos`);
  }
  const meta = { source: 'nci-glossary', endpoint: NCI_API, retrievedAt, perDictionary, layers: {}, http: http.stats, segundos: 0 };
  for (const [cs, bucket] of byCs) {
    const rows = [...bucket.values()].sort((a, b) => a.esName.localeCompare(b.esName, 'es') || a.slug.localeCompare(b.slug));
    await writeNdjson(ndjsonPath(cs), rows);
    meta.layers[cs] = { terms: rows.length, conNombreEnIngles: rows.filter((r) => r.enDisplay).length };
  }
  meta.segundos = Math.round((Date.now() - t0) / 1000);
  writeJson(ndjsonPath('nci-glossary').replace(/\.ndjson$/, '.meta.json'), meta, true);
  console.log(JSON.stringify(meta, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en import-nci-glossary-es:', err);
  process.exitCode = 1;
});
