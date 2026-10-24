#!/usr/bin/env node
// =============================================================================
// S3 · etapa 1b: datos CC0 de Wikidata para las sustancias (los 447 términos
// `wikidata-medicamento`): descripción en castellano, clase farmacológica
// (P2868 «sujeto tiene el rol»), código ATC (P267), CAS (P231), DrugBank (P715,
// solo como identificador) y MeSH (P486).
//
// Una llamada a `wbgetentities` por cada 50 Q-id, 1 petición por segundo, caché en
// disco. Wikidata es CC0: https://www.wikidata.org/wiki/Wikidata:Licensing
// =============================================================================

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadSeedPharmacology } from './lib/corpus.mjs';
import { CACHE_DIR, SEED_PHARMACOLOGY_DIR } from './lib/paths.mjs';
import { PoliteClient } from './lib/polite-client.mjs';

export const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
export const BATCH = 50;

export const entitiesUrl = (ids, props) =>
  `${WIKIDATA_API}?action=wbgetentities&format=json&languages=es%7Cen&props=${props}&ids=${ids.map(encodeURIComponent).join('%7C')}`;

const chunk = (xs, n) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));

async function main() {
  const client = new PoliteClient({ minIntervalMs: 1000 });
  const seed = loadSeedPharmacology(SEED_PHARMACOLOGY_DIR);
  const qids = seed.filter((r) => r.codeSystem === 'wikidata-medicamento').map((r) => r.code);
  console.log(`${qids.length} sustancias de Wikidata`);

  const main = [];
  for (const [i, ids] of chunk(qids, BATCH).entries()) {
    const res = await client.getJsonCached(entitiesUrl(ids, 'info%7Clabels%7Cdescriptions%7Cclaims'), join(CACHE_DIR, 'wikidata', `entities-${i}.json`));
    main.push(res);
  }
  const classIds = new Set();
  for (const r of main) {
    for (const e of Object.values(r.entities ?? {})) {
      for (const c of e.claims?.P2868 ?? []) {
        const id = c.mainsnak?.datavalue?.value?.id;
        if (id) classIds.add(id);
      }
    }
  }
  console.log(`${classIds.size} clases/roles distintos (P2868)`);
  for (const [i, ids] of chunk([...classIds].sort(), BATCH).entries()) {
    await client.getJsonCached(entitiesUrl(ids, 'labels%7Cdescriptions'), join(CACHE_DIR, 'wikidata', `classes-${i}.json`));
  }
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(join(CACHE_DIR, 'wikidata', 'fetch-summary.json'), JSON.stringify({ qids: qids.length, classIds: classIds.size, http: client.stats, at: new Date().toISOString() }));
  console.log(JSON.stringify(client.stats));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('ERROR FATAL en fetch-wikidata:', err);
    process.exitCode = 1;
  });
}
