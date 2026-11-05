#!/usr/bin/env node
// =============================================================================
// Cruce HPO ↔ Wikidata (propiedad P3841, «Human Phenotype Ontology ID»), para
// que `load-symptoms.mjs` no sume al glosario un fenotipo de HPO que ya está
// como ficha `wikidata-sintoma-*` (ver lib/glossary-dedupe.mjs).
//
// Una consulta SPARQL a query.wikidata.org (CC0). Antes de usarla contrasta la
// etiqueta inglesa de P3841: un id equivocado aborta. Escribe
//   symptoms/crosswalk/hpo-wikidata-p3841.ndjson.gz   (una fila {q, hpo} por par)
//   symptoms/crosswalk/MANIFEST.json                  (fecha, filas, SHA-256)
// Va versionado en git (~30 KB): la corrida de carga no necesita red.
//
//   node tools/terminology-import/symptoms/fetch-hpo-wikidata-crosswalk.mjs
// =============================================================================

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { gzipSync } from 'node:zlib';
import { HttpClient, nowIso } from '../lib/glossary-es/common.mjs';
import {
  SPARQL_ENDPOINT,
  assertEntityLabels,
  entityLabelsUrl,
} from '../lib/glossary-es/wikidata.mjs';
import {
  CROSSWALK_DIR,
  CROSSWALK_FILE,
  CROSSWALK_MANIFEST,
} from './lib/sources.mjs';
import {
  HPO_ID_PROPERTY,
  HPO_ID_PROPERTY_LABEL,
  HPO_WIKIDATA_SPARQL,
  crosswalkRows,
} from './lib/glossary-dedupe.mjs';

async function main() {
  const http = new HttpClient({ concurrency: 1, minDelayMs: 1500 });
  const labels = await http.get(entityLabelsUrl([HPO_ID_PROPERTY]), {
    accept: 'application/json',
  });
  assertEntityLabels(JSON.parse(labels.body.toString('utf8')), {
    [HPO_ID_PROPERTY]: HPO_ID_PROPERTY_LABEL,
  });

  const res = await http.get(
    `${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(HPO_WIKIDATA_SPARQL)}`,
    { accept: 'application/sparql-results+json' },
  );
  const { rows, invalid } = crosswalkRows(
    JSON.parse(res.body.toString('utf8')),
  );
  if (!rows.length)
    throw new Error(
      'Wikidata no devolvió ningún par P3841: no se escribe un cruce vacío.',
    );

  const gz = gzipSync(
    Buffer.from(rows.map((r) => JSON.stringify(r)).join('\n') + '\n'),
    { level: 9 },
  );
  mkdirSync(CROSSWALK_DIR, { recursive: true });
  writeFileSync(CROSSWALK_FILE, gz);
  const manifest = {
    source: 'Wikidata',
    endpoint: SPARQL_ENDPOINT,
    property: `${HPO_ID_PROPERTY} (${HPO_ID_PROPERTY_LABEL})`,
    query: HPO_WIKIDATA_SPARQL,
    license: 'CC0 1.0',
    retrievedAt: nowIso(),
    rows: rows.length,
    hpoIds: new Set(rows.map((r) => r.hpo)).size,
    wikidataItems: new Set(rows.map((r) => r.q)).size,
    discardedInvalid: invalid,
    file: basename(CROSSWALK_FILE),
    gzSha256: createHash('sha256').update(gz).digest('hex'),
  };
  writeFileSync(CROSSWALK_MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-hpo-wikidata-crosswalk:', err);
  process.exitCode = 1;
});
