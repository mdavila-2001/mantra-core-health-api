#!/usr/bin/env node
// =============================================================================
// ETL de síntomas, etapa 2b (load del CRUCE HPO ↔ Wikidata, propiedad P3841).
//
// Por cada término HPO que algún ítem de Wikidata declara con P3841:
//   concept_properties  `wikidata_items` (json): ítems que lo declaran, con el
//                       calificador P4390 si lo traen. Cruce PUBLICADO, no por nombre.
//   concept_maps        HPO → ficha del glosario `wikidata-sintoma` cuyo código es
//                       ese mismo QID (los síntomas que el glosario creó desde P780).
//                       Sin equivalencia declarada (`equivalence_concept_id` nulo):
//                       Wikidata afirma «este ítem tiene este id de HPO», no «son
//                       el mismo concepto».
// Si el glosario no está cargado en la base, no se escribe ningún mapa (se cuenta).
//
// Idempotente: ids deterministas + ON CONFLICT DO NOTHING.
// Uso:
//   node tools/terminology-import/symptoms/load-wikidata-crosswalk.mjs            # dry-run
//   node tools/terminology-import/symptoms/load-wikidata-crosswalk.mjs --apply
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { nowIso, readNdjson, writeJson } from '../lib/glossary-es/common.mjs';
import { DB_CONFIG, conceptIdsByCode, insertMany } from './lib/db.mjs';
import { CODE_SYSTEMS, CONCEPT, md5uuid } from './lib/load-plan.mjs';
import { OUT_DIR } from './lib/sources.mjs';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
export const GLOSSARY_SYSTEM = 'wikidata-sintoma';

/** Filas del cruce (con HPO vigente resuelto) → por término HPO, ítems ordenados. */
export function groupByHpo(rows) {
  const byHpo = new Map();
  for (const r of rows) {
    if (!r.hpo) continue;
    if (!byHpo.has(r.hpo)) byHpo.set(r.hpo, []);
    byHpo.get(r.hpo).push(r);
  }
  for (const list of byHpo.values()) list.sort((a, b) => a.qid.localeCompare(b.qid, 'en', { numeric: true }));
  return byHpo;
}

export function propertyTuple(hpoConceptId, hpoCode, items) {
  const value = items.map((i) => ({ qid: i.qid, uri: i.itemUri, hpoAsPublished: i.hpoAsPublished, hpoRemap: i.hpoRemap, mappingRelation: i.mappingRelation }));
  return [md5uuid(`mantra:symptoms:property:hpo:${hpoCode}:wikidata_items`), hpoConceptId, 'wikidata_items', 'json', JSON.stringify(value)];
}

export function mapTuple(hpoConceptId, hpoCode, item, glossaryConceptId, version) {
  return [
    md5uuid(`mantra:symptoms:map:hpo:${hpoCode}:${GLOSSARY_SYSTEM}:${item.qid}`),
    hpoConceptId,
    glossaryConceptId,
    null,
    `Wikidata P3841: el ítem ${item.qid} declara el id de HPO ${item.hpoAsPublished}`,
    version,
    CONCEPT.TERM_ACTIVE,
  ];
}

async function main() {
  const t0 = Date.now();
  const p = join(OUT_DIR, 'ndjson', 'crosswalk-wikidata-hpo.ndjson');
  if (!existsSync(p)) throw new Error(`Falta ${p}: corré build-gap-sources.mjs (o unpack-data.mjs)`);
  const rows = readNdjson(p);
  const byHpo = groupByHpo(rows);
  const version = `Wikidata P3841, consulta del ${rows[0].retrievedAt.slice(0, 10)}`;
  console.log(`=== Cruce HPO ↔ Wikidata (${APPLY ? 'APPLY' : 'DRY-RUN'}) — ${rows.length} filas, ${byHpo.size} términos HPO ===`);
  if (!APPLY) {
    writeJson(join(OUT_DIR, 'wikidata-crosswalk.dry-run.json', ), { generatedAt: nowIso(), rows: rows.length, hpoTerms: byHpo.size, unresolved: rows.filter((r) => !r.hpo).length }, true);
    return;
  }
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    const terms = readNdjson(join(OUT_DIR, 'ndjson', 'terms-hpo.ndjson'));
    const { rows: v } = await client.query(
      `SELECT v.id FROM terminology.code_system_versions v JOIN terminology.code_systems c ON c.id = v.code_system_id
        WHERE (c.internal_code = 'hpo' OR c.canonical_url = $1) AND v.version = $2`,
      [CODE_SYSTEMS.hpo.canonicalUrl, terms[0].version],
    );
    if (!v.length) throw new Error(`hpo ${terms[0].version} no está cargado: corré load-symptoms.mjs --apply primero.`);
    const hpoIds = await conceptIdsByCode(client, v[0].id);

    const qids = [...new Set(rows.filter((r) => r.hpo).map((r) => r.qid))];
    const { rows: gl } = await client.query(
      `SELECT cc.code, cc.id FROM terminology.catalog_concepts cc
         JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
         JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
        WHERE cs.internal_code = $1 AND cc.code = ANY($2)`,
      [GLOSSARY_SYSTEM, qids],
    );
    const glossaryByQid = new Map(gl.map((r) => [r.code, r.id]));

    const properties = [];
    const maps = [];
    let hpoMissing = 0;
    for (const [hpo, items] of byHpo) {
      const cid = hpoIds.get(hpo);
      if (!cid) {
        hpoMissing++;
        continue;
      }
      properties.push(propertyTuple(cid, hpo, items));
      for (const item of items) {
        const g = glossaryByQid.get(item.qid);
        if (g) maps.push(mapTuple(cid, hpo, item, g, version));
      }
    }
    const inserted = {
      properties: await insertMany(client, 'concept_properties', ['id', 'concept_id', 'property_code', 'data_type', 'value_json'], properties, ['uuid', 'uuid', null, 'terminology.technical_data_type', 'jsonb']),
      maps: await insertMany(client, 'concept_maps', ['id', 'source_concept_id', 'target_concept_id', 'equivalence_concept_id', 'context', 'version', 'state_concept_id'], maps, ['uuid', 'uuid', 'uuid', 'uuid', null, null, 'uuid']),
    };
    console.log('\n=== RESUMEN (filas NUEVAS; 0 en la segunda corrida = idempotente) ===');
    console.log(JSON.stringify({ hpoTermsWithItem: byHpo.size, hpoTermsNotLoaded: hpoMissing, glossaryItemsFound: glossaryByQid.size, inserted, segundos: Math.round((Date.now() - t0) / 1000) }, null, 2));
  } finally {
    await client.end();
  }
}

if (basename(process.argv[1] ?? '') === 'load-wikidata-crosswalk.mjs') {
  main().catch((err) => {
    console.error('ERROR FATAL en load-wikidata-crosswalk:', err);
    process.exitCode = 1;
  });
}
