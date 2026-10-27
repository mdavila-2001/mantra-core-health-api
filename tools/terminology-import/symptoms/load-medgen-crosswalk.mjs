#!/usr/bin/env node
// =============================================================================
// ETL de síntomas, etapa 2c (load de CRUCES POR CUI entre HPO, MeSH C23, NCIt y SYMP).
//
// `concept_maps` entre dos conceptos de este corpus que NCBI MedGen (MGCONSO)
// publica bajo el mismo CUI de UMLS (SYMP: el CUI que declara su propio .obo y
// que MedGen también publica). Sin equivalencia declarada
// (`equivalence_concept_id` nulo) y con el CUI en `context`: «mismo CUI» es lo que
// la fuente afirma, no una equivalencia exacta. Los pares que la fuente ya cruza
// por xref (`alsoDeclaredByXref`) no se repiten.
//
// Idempotente: ids deterministas + ON CONFLICT DO NOTHING.
// Uso: node …/load-medgen-crosswalk.mjs [--apply]
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { readNdjson } from '../lib/glossary-es/common.mjs';
import { DB_CONFIG, insertMany } from './lib/db.mjs';
import { CONCEPT, md5uuid } from './lib/load-plan.mjs';
import { OUT_DIR } from './lib/sources.mjs';

const APPLY = process.argv.includes('--apply');

/** Fila del cruce → tupla de concept_maps (orden de las columnas de insertMany). */
export function mapTupleFor(row, idOf, version) {
  const a = idOf(row.a.codeSystem, row.a.code);
  const b = idOf(row.b.codeSystem, row.b.code);
  if (!a || !b) return null;
  return [
    md5uuid(`mantra:symptoms:map:medgen:${row.cui}:${row.a.codeSystem}:${row.a.code}:${row.b.codeSystem}:${row.b.code}`),
    a,
    b,
    null,
    `UMLS CUI ${row.cui} compartido (NCBI MedGen${row.via === 'medgen+symp-xref' ? ' + CUI que declara SYMP' : ''}): ${row.a.code} ↔ ${row.b.code}`,
    version,
    CONCEPT.TERM_ACTIVE,
  ];
}

async function main() {
  const p = join(OUT_DIR, 'ndjson', 'crosswalk-medgen-cui.ndjson');
  if (!existsSync(p)) throw new Error(`Falta ${p}: corré build-gap-sources.mjs (o unpack-data.mjs)`);
  const rows = readNdjson(p).filter((r) => !r.alsoDeclaredByXref);
  const version = `NCBI MedGen MGCONSO, descarga del ${rows[0]?.retrievedAt.slice(0, 10)}`;
  console.log(`=== Cruces por CUI de MedGen (${APPLY ? 'APPLY' : 'DRY-RUN'}) — ${rows.length} pares ===`);
  if (!APPLY) return;
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    const ids = new Map();
    for (const cs of ['hpo', 'symp', 'ncit', 'mesh-c23']) {
      const terms = readNdjson(join(OUT_DIR, 'ndjson', `terms-${cs}.ndjson`));
      const { rows: found } = await client.query(
        `SELECT cc.code, cc.id FROM terminology.catalog_concepts cc
           JOIN terminology.code_system_versions v ON v.id = cc.code_system_version_id
           JOIN terminology.code_systems s ON s.id = v.code_system_id
          WHERE s.internal_code = $1 AND v.version = $2`,
        [cs, terms[0].version],
      );
      for (const f of found) ids.set(`${cs}|${f.code}`, f.id);
    }
    const tuples = rows.map((r) => mapTupleFor(r, (cs, code) => ids.get(`${cs}|${code}`), version)).filter(Boolean);
    const inserted = await insertMany(client, 'concept_maps', ['id', 'source_concept_id', 'target_concept_id', 'equivalence_concept_id', 'context', 'version', 'state_concept_id'], tuples, ['uuid', 'uuid', 'uuid', 'uuid', null, null, 'uuid']);
    console.log('\n=== RESUMEN (filas NUEVAS; 0 en la segunda corrida = idempotente) ===');
    console.log(JSON.stringify({ pairs: rows.length, withBothConcepts: tuples.length, inserted }, null, 2));
  } finally {
    await client.end();
  }
}

if (basename(process.argv[1] ?? '') === 'load-medgen-crosswalk.mjs') {
  main().catch((err) => {
    console.error('ERROR FATAL en load-medgen-crosswalk:', err);
    process.exitCode = 1;
  });
}
