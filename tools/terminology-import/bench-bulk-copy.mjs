// =============================================================================
// Benchmark SINTÉTICO del cargador masivo (TAREA-41 F1.3).
//
// ⚠ Los datos que carga este script NO son clínicos: son aristas inventadas
// entre conceptos reales del glosario, para medir tiempo, idempotencia y el
// plan del vecindario con ~1 M de aristas. Van en una fuente, code system y
// versión propios (`SYNTHETIC_BENCH_F13`) para poder borrarlos enteros con
// `--cleanup`. Jamás correr contra una base que no sea de desarrollo.
//
// Uso (con DB_* del .env):
//   node tools/terminology-import/bench-bulk-copy.mjs --load [--count 1000000] [--dry-run]
//   node tools/terminology-import/bench-bulk-copy.mjs --cleanup
//
// Para no colisionar con el glosario, se saltean las aristas cuya clave natural
// ya existe; así toda relación con evidencia sintética es sintética y el
// `--cleanup` puede borrarla sin tocar nada real.
// =============================================================================

import 'dotenv/config';
import pg from 'pg';

import { bulkLoadRelationships } from './lib/bulk-copy.mjs';
import { CONCEPT, md5uuid } from './lib/glossary-es/load-plan.mjs';
import { DB_CONFIG, ensureCodeSystem } from './symptoms/lib/db.mjs';

const SYNTHETIC_CODE = 'SYNTHETIC_BENCH_F13';
const FOCUS_SLUG = 'fiebre';
const HUB_INCOMING = 3000;
const HUB_OUTGOING = 300;
const SLUG_PROPERTY = 'glossary-slug';
const NEIGHBORHOOD_TYPE_CODES = ['RELATED_TERM', 'REL_DISEASE', 'REL_TREATMENT', 'REL_SPECIALTY', 'REL_SYMPTOM', 'REL_DIAGNOSTIC_TEST', 'REL_ANATOMY'];
const TIER_WEIGHTS = [
  ['NATIONAL_STANDARD', 0.05],
  ['CURATED_REFERENCE', 0.35],
  ['COLLABORATIVE_KNOWLEDGE', 0.4],
  ['STATISTICAL_LITERATURE', 0.2],
];
const FREQUENCIES = ['OBLIGATE', 'VERY_FREQUENT', 'FREQUENT', 'OCCASIONAL', 'VERY_RARE', 'EXCLUDED'];

const SYNTHETIC_PLAN = {
  source: {
    id: md5uuid(`mantra:${SYNTHETIC_CODE}:source`),
    code: SYNTHETIC_CODE,
    name: 'SINTÉTICO — benchmark del cargador masivo (TAREA-41 F1.3). Borrar con --cleanup.',
    owner: 'Mantra Core (benchmark, no clínico)',
    officialUrl: 'urn:mantra:synthetic:bench-f13',
    license: 'Datos sintéticos, sin valor clínico',
  },
  codeSystem: {
    id: md5uuid(`mantra:${SYNTHETIC_CODE}:code-system`),
    internalCode: SYNTHETIC_CODE,
    name: 'SINTÉTICO — benchmark F1.3',
    canonicalUrl: 'urn:mantra:synthetic:bench-f13',
    caseSensitive: true,
  },
  version: { id: md5uuid(`mantra:${SYNTHETIC_CODE}:version:1`), version: 'bench-1' },
};

const args = process.argv.slice(2);
const arg = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);

function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function readUniverse(client) {
  const { rows: concepts } = await client.query(
    `SELECT c.id, p.value_json #>> '{}' AS slug
       FROM terminology.catalog_concepts c
       JOIN terminology.concept_properties p ON p.concept_id = c.id AND p.property_code = $1
      WHERE c.state_concept_id = $2
      ORDER BY c.id`,
    [SLUG_PROPERTY, CONCEPT.TERM_ACTIVE],
  );
  const focus = concepts.find((c) => c.slug === FOCUS_SLUG);
  if (!focus) throw new Error(`No está el término «${FOCUS_SLUG}» en el glosario.`);
  const { rows: types } = await client.query('SELECT id, code FROM terminology.catalog_concepts WHERE code = ANY($1::text[])', [NEIGHBORHOOD_TYPE_CODES]);
  // Las aristas reales (sin evidencia sintética): las de una corrida anterior
  // del benchmark NO se evitan, para que la segunda pasada sea el mismo lote.
  const { rows: existing } = await client.query(
    `SELECT r.source_concept_id s, r.target_concept_id t, r.relationship_type_concept_id r
       FROM terminology.concept_relationships r
      WHERE NOT EXISTS (SELECT 1
                          FROM terminology.concept_relationship_evidence e
                          JOIN terminology.terminology_sources ts ON ts.id = e.terminology_source_id
                         WHERE e.concept_relationship_id = r.id AND ts.code = $1)`,
    [SYNTHETIC_CODE],
  );
  return {
    ids: [...new Set(concepts.map((c) => c.id))],
    focusId: focus.id,
    types: new Map(types.map((t) => [t.code, t.id])),
    existing: new Set(existing.map((e) => `${e.s}|${e.t}|${e.r}`)),
  };
}

/** Aristas sintéticas: un hub en «fiebre» más una banda permutada sobre el glosario. */
function* syntheticRows({ ids, focusId, types, existing }, count) {
  const rand = seeded(1_000_041);
  const perm = ids.filter((id) => id !== focusId);
  for (let i = perm.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  const typeIds = NEIGHBORHOOD_TYPE_CODES.map((c) => types.get(c)).filter(Boolean);
  const pickTier = () => {
    let x = rand();
    for (const [tier, w] of TIER_WEIGHTS) {
      if ((x -= w) < 0) return tier;
    }
    return TIER_WEIGHTS[0][0];
  };
  let emitted = 0;
  const emit = (sourceConceptId, targetConceptId, relationshipTypeConceptId) => {
    if (existing.has(`${sourceConceptId}|${targetConceptId}|${relationshipTypeConceptId}`)) return null;
    const evidenceTier = pickTier();
    const curated = evidenceTier === 'NATIONAL_STANDARD' || evidenceTier === 'CURATED_REFERENCE';
    emitted += 1;
    return {
      sourceConceptId,
      targetConceptId,
      relationshipTypeConceptId,
      evidenceTier,
      sourceReference: `SYNTHETIC:${emitted}`,
      frequency: curated && rand() < 0.6 ? FREQUENCIES[Math.floor(rand() * FREQUENCIES.length)] : null,
      statisticValue: evidenceTier === 'STATISTICAL_LITERATURE' ? Math.round((1 + rand() * 9) * 1000) / 1000 : null,
      validFrom: '2026-10-25',
    };
  };
  const symptom = types.get('REL_SYMPTOM');
  const related = types.get('RELATED_TERM');
  for (let k = 0; k < HUB_INCOMING && emitted < count; k += 1) {
    const row = emit(perm[k], focusId, symptom);
    if (row) yield row;
  }
  for (let k = 0; k < HUB_OUTGOING && emitted < count; k += 1) {
    const row = emit(focusId, perm[perm.length - 1 - k], related);
    if (row) yield row;
  }
  const n = perm.length;
  for (let i = 0; emitted < count; i += 1) {
    const offset = 1 + Math.floor(i / n);
    if (offset >= n) throw new Error('No alcanzan los conceptos para tantas aristas distintas.');
    const row = emit(perm[i % n], perm[(i % n + offset) % n], typeIds[i % typeIds.length]);
    if (row) yield row;
  }
}

async function load(client) {
  const count = Number(arg('--count', 1_000_000));
  const ids = await ensureCodeSystem(client, SYNTHETIC_PLAN, CONCEPT.TERM_ACTIVE);
  const universe = await readUniverse(client);
  console.log(`[bench] universo: ${universe.ids.length} términos del glosario, foco «${FOCUS_SLUG}» = ${universe.focusId}, ${universe.existing.size} aristas reales a evitar`);
  const t0 = Date.now();
  const result = await bulkLoadRelationships(client, {
    terminologySourceId: ids.sourceId,
    codeSystemVersionId: ids.versionId,
    rows: syntheticRows(universe, count),
    dryRun: args.includes('--dry-run'),
    log: (m) => console.log(m),
  });
  const seconds = (Date.now() - t0) / 1000;
  console.log(JSON.stringify(result, null, 2));
  console.log(`[bench] ${result.read} filas en ${seconds.toFixed(1)} s (${Math.round(result.read / seconds)} filas/s)`);
}

async function cleanup(client) {
  await client.query('BEGIN');
  try {
    const { rows: src } = await client.query('SELECT id FROM terminology.terminology_sources WHERE code = $1', [SYNTHETIC_CODE]);
    if (src.length === 0) {
      console.log('[cleanup] no hay fuente sintética: nada que borrar');
      await client.query('ROLLBACK');
      return;
    }
    const sourceId = src[0].id;
    await client.query(
      'CREATE TEMP TABLE synthetic_relationship_ids ON COMMIT DROP AS SELECT DISTINCT concept_relationship_id AS id FROM terminology.concept_relationship_evidence WHERE terminology_source_id = $1',
      [sourceId],
    );
    const evidence = await client.query('DELETE FROM terminology.concept_relationship_evidence WHERE terminology_source_id = $1', [sourceId]);
    const relationships = await client.query(
      `DELETE FROM terminology.concept_relationships r
        USING synthetic_relationship_ids s
        WHERE r.id = s.id
          AND NOT EXISTS (SELECT 1 FROM terminology.concept_relationship_evidence e WHERE e.concept_relationship_id = r.id)`,
    );
    const batches = await client.query('DELETE FROM terminology.catalog_import_batches WHERE source_id = $1', [sourceId]);
    const versions = await client.query(
      'DELETE FROM terminology.code_system_versions v USING terminology.code_systems cs WHERE v.code_system_id = cs.id AND cs.source_id = $1',
      [sourceId],
    );
    const codeSystems = await client.query('DELETE FROM terminology.code_systems WHERE source_id = $1', [sourceId]);
    await client.query('DELETE FROM terminology.terminology_sources WHERE id = $1', [sourceId]);
    await client.query('COMMIT');
    console.log(
      `[cleanup] borradas: evidencias ${evidence.rowCount} · relaciones ${relationships.rowCount} · lotes ${batches.rowCount} · versiones ${versions.rowCount} · code systems ${codeSystems.rowCount} · fuente 1`,
    );
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

const client = new pg.Client(DB_CONFIG);
await client.connect();
try {
  if (args.includes('--cleanup')) await cleanup(client);
  else if (args.includes('--load')) await load(client);
  else console.log('Use --load [--count N] [--dry-run] o --cleanup.');
} finally {
  await client.end();
}
