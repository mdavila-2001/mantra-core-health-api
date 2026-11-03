#!/usr/bin/env node
// =============================================================================
// Etapa 3 (carga): corpus NDJSON → `terminology.*`. Sin DDL (ADR-0021).
//
//   dry-run (por defecto)  imprime el plan y lo escribe en out/load-plan.dry-run.json
//   --apply                inserta con `ON CONFLICT DO NOTHING`; la 2.ª corrida inserta 0
//
// Con --apply escribe:
//   terminology_sources / code_systems / code_system_versions de los code
//   systems propios (se buscan por internal_code; se crean solo si faltan),
//   catalog_concepts de los procedimientos propios y de los tipos de relación,
//   concept_properties de procedencia, y un catalog_import_batches por corrida.
// Relaciones: solo si existe `terminology.concept_relationship_assertions` con
// las columnas propuestas; si no, se informa el bloqueo y no se escribe nada
// en concept_relationships (la consigna prohíbe perder la procedencia).
//
// Uso:
//   node tools/terminology-import/procedures-treatments/load.mjs
//   node tools/terminology-import/procedures-treatments/load.mjs --apply      # .env DB_*
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import {
  conceptKey,
  md5uuid,
  nowIso,
  outDir,
  readNdjson,
  writeJson,
} from './lib/common.mjs';
import {
  OWNED_CODE_SYSTEMS,
  PROVENANCE_SOURCE_CODE,
  PROVENANCE_TABLE,
  RELATION_ONLY_SOURCES,
  alternateRelationshipId,
  buildLoadPlan,
  conceptRowId,
  propertyRowId,
  relationshipsBlockedReason,
} from './lib/load-plan.mjs';

const args = process.argv.slice(2);
if (args.includes('--dry-run') && args.includes('--apply'))
  throw new Error('Use --dry-run o --apply, no ambos.');
const DRY_RUN = !args.includes('--apply');
const BATCH = 1000;

const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

async function insertMany(
  client,
  table,
  columns,
  tuples,
  casts,
  { audit = true } = {},
) {
  let inserted = 0;
  for (let i = 0; i < tuples.length; i += BATCH) {
    const params = [];
    const values = tuples.slice(i, i + BATCH).map((t) => {
      const ph = t.map((v, j) => {
        params.push(v);
        return `$${params.length}${casts[j] ? `::${casts[j]}` : ''}`;
      });
      return `(${ph.join(', ')}${audit ? ', now(), now(), 1' : ''})`;
    });
    const cols = `${columns.join(', ')}${audit ? ', created_at, updated_at, row_version' : ''}`;
    const res = await client.query(
      `INSERT INTO terminology.${table} (${cols}) VALUES ${values.join(',\n')} ON CONFLICT DO NOTHING`,
      params,
    );
    inserted += res.rowCount;
  }
  return inserted;
}

/** Busca el code system por internal_code; si es propio y falta, lo crea con su fuente y versión. */
async function ensureCodeSystem(client, internalCode, version, stateId) {
  const def = OWNED_CODE_SYSTEMS[internalCode];
  let { rows: cs } = await client.query(
    'SELECT id FROM terminology.code_systems WHERE internal_code = $1',
    [internalCode],
  );
  if (!cs.length) {
    await client.query(
      `INSERT INTO terminology.terminology_sources (id, code, name, owner, official_url, license, state_concept_id, created_at, updated_at, row_version)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
      [
        md5uuid(`mantra:procedures-treatments:source:${def.source.code}`),
        def.source.code,
        def.source.name,
        def.source.owner,
        def.source.officialUrl,
        def.source.license,
        stateId,
      ],
    );
    const { rows: src } = await client.query(
      'SELECT id FROM terminology.terminology_sources WHERE code = $1',
      [def.source.code],
    );
    await client.query(
      `INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition, state_concept_id, created_at, updated_at, row_version)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, true, false, $6::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
      [
        md5uuid(`mantra:procedures-treatments:code-system:${internalCode}`),
        src[0].id,
        internalCode,
        def.name,
        def.canonicalUrl,
        stateId,
      ],
    );
    ({ rows: cs } = await client.query(
      'SELECT id FROM terminology.code_systems WHERE internal_code = $1',
      [internalCode],
    ));
  }
  await client.query(
    `INSERT INTO terminology.code_system_versions (id, code_system_id, version, published_at, is_default, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, now(), false, $4::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [
      md5uuid(
        `mantra:procedures-treatments:code-system-version:${internalCode}:${version}`,
      ),
      cs[0].id,
      version,
      stateId,
    ],
  );
  const { rows: v } = await client.query(
    'SELECT csv.id, cs.source_id FROM terminology.code_system_versions csv JOIN terminology.code_systems cs ON cs.id = csv.code_system_id WHERE csv.code_system_id = $1 AND csv.version = $2',
    [cs[0].id, version],
  );
  return {
    codeSystemId: cs[0].id,
    versionId: v[0].id,
    sourceId: v[0].source_id,
  };
}

/** Resuelve (internal_code, code) → concept id en cualquier versión; prefiere la versión por defecto. */
async function resolveConcepts(client, refs) {
  const bySystem = new Map();
  for (const r of refs)
    (
      bySystem.get(r.system) ?? bySystem.set(r.system, new Set()).get(r.system)
    ).add(r.code);
  const out = new Map();
  for (const [system, codes] of bySystem) {
    const { rows } = await client.query(
      `SELECT DISTINCT ON (cc.code) cc.code, cc.id FROM terminology.catalog_concepts cc
         JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
         JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
        WHERE cs.internal_code = $1 AND cc.code = ANY($2::text[])
        ORDER BY cc.code, csv.is_default DESC NULLS LAST, csv.published_at DESC NULLS LAST`,
      [system, [...codes]],
    );
    for (const r of rows) out.set(`${system}|${r.code}`, r.id);
  }
  return out;
}

async function main() {
  const t0 = Date.now();
  const procedures = readNdjson(outDir('procedures.ndjson'));
  const assertions = readNdjson(outDir('assertions.ndjson'));
  if (!procedures.length)
    throw new Error(`No hay corpus en ${outDir()}: corra build.mjs primero.`);
  const plan = buildLoadPlan({ procedures, assertions });
  const versions = Object.fromEntries(
    Object.keys(OWNED_CODE_SYSTEMS).map((cs) => [
      cs,
      procedures.find((p) => p.system === cs)?.provenance.version ?? '1',
    ]),
  );
  const summary = {
    concepts: plan.concepts.length,
    conceptsBySystem: plan.concepts.reduce(
      (a, c) => ((a[c.system] = (a[c.system] ?? 0) + 1), a),
      {},
    ),
    properties: plan.concepts.reduce((n, c) => n + c.properties.length, 0),
    relationships: plan.relationships.length,
    provenanceRows: plan.provenance.length,
    versions,
  };
  console.log(
    `=== Carga de procedimientos a terminology.* ${DRY_RUN ? '(DRY-RUN por defecto, sin base)' : '(APPLY explícito)'} ===`,
  );
  console.log(JSON.stringify(summary, null, 2));
  if (DRY_RUN) {
    writeJson(outDir('load-plan.dry-run.json'), {
      generatedAt: nowIso(),
      summary,
      sample: {
        concept: plan.concepts[0],
        relationship: plan.relationships[0],
        provenance: plan.provenance[0],
      },
    });
    console.log(
      `Plan escrito en ${outDir('load-plan.dry-run.json')}. No se tocó ninguna base.`,
    );
    return;
  }

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  const startedAt = new Date();
  const result = {
    concepts: 0,
    properties: 0,
    relationships: 0,
    provenance: 0,
    unresolvedEndpoints: 0,
    resolvedViaPublishedSiteMap: 0,
    relationshipsBlocked: null,
  };
  try {
    const stateId = null; // estado del concepto: los catálogos de referencia no usan el estado del glosario
    const versionBySystem = {};
    for (const cs of Object.keys(OWNED_CODE_SYSTEMS))
      versionBySystem[cs] = await ensureCodeSystem(
        client,
        cs,
        versions[cs],
        stateId,
      );

    for (const [system, { versionId }] of Object.entries(versionBySystem)) {
      const list = plan.concepts.filter((c) => c.system === system);
      if (!list.length) continue;
      result.concepts += await insertMany(
        client,
        'catalog_concepts',
        [
          'id',
          'code_system_version_id',
          'code',
          'display',
          'definition',
          'selectable',
        ],
        list.map((c) => [
          conceptRowId(versionId, c.code),
          versionId,
          c.code,
          c.display,
          c.definition,
          true,
        ]),
        ['uuid', 'uuid', null, null, null, null],
      );
      // Ids reales (otra sesión pudo haber creado el mismo código en esta versión).
      const { rows } = await client.query(
        'SELECT id, code FROM terminology.catalog_concepts WHERE code_system_version_id = $1 AND code = ANY($2::text[])',
        [versionId, list.map((c) => c.code)],
      );
      const idByCode = new Map(rows.map((r) => [r.code, r.id]));
      const props = list.flatMap((c) =>
        c.properties.map((p) => [
          propertyRowId(idByCode.get(c.code), p.code),
          idByCode.get(c.code),
          p.code,
          p.dataType,
          JSON.stringify(p.value),
        ]),
      );
      result.properties += await insertMany(
        client,
        'concept_properties',
        ['id', 'concept_id', 'property_code', 'data_type', 'value_json'],
        props,
        ['uuid', 'uuid', null, 'terminology.technical_data_type', 'jsonb'],
      );
    }

    const { rows: cols } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'terminology' AND table_name = $1",
      [PROVENANCE_TABLE],
    );
    result.relationshipsBlocked = relationshipsBlockedReason(
      cols.map((c) => c.column_name),
    );
    if (result.relationshipsBlocked) {
      console.warn(
        `[load] RELACIONES NO CARGADAS: ${result.relationshipsBlocked}`,
      );
    } else {
      const refs = plan.relationships.flatMap((r) => [
        r.subject,
        r.object,
        ...r.objectAlternates,
        { system: 'procedure-relationship-types', code: r.typeCode },
      ]);
      const ids = await resolveConcepts(client, refs);
      const rels = [];
      const resolvedAs = new Map(); // relationshipId del corpus → { id en la base, mapeo usado }
      for (const r of plan.relationships) {
        const s = ids.get(conceptKey(r.subject));
        const t = ids.get(`procedure-relationship-types|${r.typeCode}`);
        let o = ids.get(conceptKey(r.object));
        let id = r.id;
        let via = null;
        if (
          !o &&
          r.objectAlternates.length === 1 &&
          ids.get(conceptKey(r.objectAlternates[0]))
        ) {
          const alt = r.objectAlternates[0];
          o = ids.get(conceptKey(alt));
          id = alternateRelationshipId(r.typeCode, r.subject, alt);
          via = alt.via;
          result.resolvedViaPublishedSiteMap++;
        }
        if (!s || !o || !t) {
          result.unresolvedEndpoints++;
          continue;
        }
        if (!resolvedAs.has(r.id)) rels.push([id, s, o, t, null]);
        resolvedAs.set(r.id, { id, via });
      }
      result.relationships = await insertMany(
        client,
        'concept_relationships',
        [
          'id',
          'source_concept_id',
          'target_concept_id',
          'relationship_type_concept_id',
          'ordinal',
        ],
        rels,
        ['uuid', 'uuid', 'uuid', 'uuid', null],
      );
      for (const src of RELATION_ONLY_SOURCES) {
        await client.query(
          `INSERT INTO terminology.terminology_sources (id, code, name, owner, official_url, license, created_at, updated_at, row_version)
           VALUES ($1::uuid, $2, $3, $4, $5, $6, now(), now(), 1) ON CONFLICT DO NOTHING`,
          [
            md5uuid(`mantra:procedures-treatments:source:${src.code}`),
            src.code,
            src.name,
            src.owner,
            src.officialUrl,
            src.license,
          ],
        );
      }
      const { rows: srcRows } = await client.query(
        'SELECT code, id FROM terminology.terminology_sources',
      );
      const srcByCode = new Map(srcRows.map((r) => [r.code, r.id]));
      const prov = plan.provenance
        .filter((p) => resolvedAs.has(p.relationshipId))
        .map((p) => {
          const { id, via } = resolvedAs.get(p.relationshipId);
          const evidence = via
            ? { ...(p.evidence ?? {}), objectMappedVia: via }
            : p.evidence;
          return [
            p.id,
            id,
            srcByCode.get(PROVENANCE_SOURCE_CODE[p.source]),
            p.sourceRecordId,
            p.sourceVersion,
            p.sourceUri,
            p.sourcePredicate,
            p.assertionKind,
            JSON.stringify(evidence),
            p.retrievedAt,
          ];
        });
      result.provenance = await insertMany(
        client,
        PROVENANCE_TABLE,
        [
          'id',
          'concept_relationship_id',
          'source_id',
          'source_record_id',
          'source_version',
          'source_uri',
          'source_predicate',
          'assertion_kind',
          'evidence_json',
          'retrieved_at',
        ],
        prov,
        [
          'uuid',
          'uuid',
          'uuid',
          null,
          null,
          null,
          null,
          null,
          'jsonb',
          'timestamptz',
        ],
      );
    }

    const main = versionBySystem.maxo;
    const total =
      result.concepts +
      result.properties +
      result.relationships +
      result.provenance;
    await client.query(
      `INSERT INTO terminology.catalog_import_batches (id, source_id, code_system_version_id, started_at, finished_at, total_read, total_inserted, total_errors, checksum, recorded_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, now(), $5, $6, $7, $8, now())`,
      [
        md5uuid(
          `mantra:procedures-treatments:batch:${startedAt.toISOString()}`,
        ),
        main.sourceId,
        main.versionId,
        startedAt,
        plan.concepts.length + plan.provenance.length,
        total,
        result.unresolvedEndpoints,
        md5uuid(plan.provenance.map((p) => p.id).join('|')),
      ],
    );
  } finally {
    await client.end();
  }
  console.log(
    '\n=== RESUMEN (filas NUEVAS; 0 en la segunda corrida = idempotente) ===',
  );
  console.log(
    JSON.stringify(
      { result, segundos: Math.round((Date.now() - t0) / 1000) },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error('ERROR FATAL en procedures-treatments/load:', err);
  process.exitCode = 1;
});
