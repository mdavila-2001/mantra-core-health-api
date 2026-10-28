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
  EVIDENCE_TABLE,
  EXTRA_SOURCES,
  EVIDENCE_TIER_CODES,
  EVIDENCE_TIER_VERSION,
  OWNED_CODE_SYSTEMS,
  PINNED_SYSTEMS,
  PROVENANCE_SOURCE_CODE,
  PROVENANCE_TABLE,
  TIER_OF_ASSERTION,
  alternateRelationshipId,
  buildLoadPlan,
  citationTextOf,
  conceptRowId,
  evidenceBlockedReason,
  propertyRowId,
  relationshipsBlockedReason,
  validFromOf,
} from './lib/load-plan.mjs';
import { deterministicId } from '../lib/glossary-es/common.mjs';

const args = process.argv.slice(2);
if (args.includes('--dry-run') && args.includes('--apply'))
  throw new Error('Use --dry-run o --apply, no ambos.');
const DRY_RUN = !args.includes('--apply');
const LANGUAGE_CONCEPT = { es: deterministicId('terminology:language:es') };
const DESIGNATION_TYPE = { preferred: deterministicId('terminology:designation-type:preferred'), synonym: deterministicId('terminology:designation-type:synonym') };
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
async function resolveConcepts(client, refs, pinned = new Map()) {
  const bySystem = new Map();
  for (const r of refs)
    (
      bySystem.get(r.system) ?? bySystem.set(r.system, new Set()).get(r.system)
    ).add(r.code);
  const out = new Map();
  for (const [system, codes] of bySystem) {
    if (pinned.has(system)) {
      // Sistemas con varias versiones cargadas por distintas importaciones (PCS): se usa la de esta importación.
      for (let i = 0; i < [...codes].length; i += 20000) {
        const { rows: pr } = await client.query(
          'SELECT cc.code, cc.id FROM terminology.catalog_concepts cc WHERE cc.code_system_version_id = $1 AND cc.code = ANY($2::text[])',
          [pinned.get(system), [...codes].slice(i, i + 20000)],
        );
        for (const r of pr) out.set(`${system}|${r.code}`, r.id);
      }
      continue;
    }
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
    designations: plan.concepts.reduce((n, c) => n + (c.designations?.length ?? 0), 0),
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
    designations: 0,
    unresolvedEndpoints: 0,
    unresolvedByObjectSystem: {},
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
      // Designaciones oficiales (p. ej. CIE-10-ES para ICD-10-PCS): se escriben tal cual las trae la fuente.
      const desig = list.flatMap((c) =>
        (c.designations ?? []).map((d, i) => [
          md5uuid(`mantra:procedures-treatments:designation:${idByCode.get(c.code)}:${d.lang}:${d.type}:${i}`),
          idByCode.get(c.code),
          LANGUAGE_CONCEPT[d.lang] ?? (() => { throw new Error(`idioma sin concepto interno: ${d.lang}`); })(),
          DESIGNATION_TYPE[d.type],
          d.value,
          d.type === 'preferred',
        ]),
      );
      if (desig.length)
        result.designations += await insertMany(
          client,
          'concept_designations',
          ['id', 'concept_id', 'language_concept_id', 'designation_type_concept_id', 'value', 'preferred'],
          desig,
          ['uuid', 'uuid', 'uuid', 'uuid', null, null],
        );
    }

    const colsOf = async (table) =>
      (
        await client.query(
          "SELECT column_name FROM information_schema.columns WHERE table_schema = 'terminology' AND table_name = $1",
          [table],
        )
      ).rows.map((c) => c.column_name);
    // Modo de procedencia: la tabla de evidencia del modelo v4.2.50 (preferida) o la tabla propuesta
    // `concept_relationship_assertions`; si no hay ninguna, no se escribe ninguna relación.
    const evidenceBlock = evidenceBlockedReason(await colsOf(EVIDENCE_TABLE));
    const legacyBlock = relationshipsBlockedReason(await colsOf(PROVENANCE_TABLE));
    let tiers = null;
    if (!evidenceBlock) {
      const { rows: tr } = await client.query(
        `SELECT cc.code, cc.id FROM terminology.catalog_concepts cc JOIN terminology.code_system_versions v ON v.id = cc.code_system_version_id WHERE v.version = $1 AND cc.code = ANY($2)`,
        [EVIDENCE_TIER_VERSION, EVIDENCE_TIER_CODES],
      );
      tiers = new Map(tr.map((r) => [r.code, r.id]));
      const lacking = EVIDENCE_TIER_CODES.filter((c) => !tiers.has(c));
      if (lacking.length) {
        result.relationshipsBlocked = `BLOQUEADO POR LOS SEEDS: faltan miembros de vs_evidence_tier (${lacking.join(', ')}) en la versión ${EVIDENCE_TIER_VERSION}; los siembra gen_seeds.py (load_seeds.py --skip-prod --refresh).`;
      }
    } else if (legacyBlock) {
      result.relationshipsBlocked = `${evidenceBlock} / ${legacyBlock}`;
    }
    if (result.relationshipsBlocked) {
      console.warn(`[load] RELACIONES NO CARGADAS: ${result.relationshipsBlocked}`);
    } else {
      const pinned = new Map(PINNED_SYSTEMS.filter((cs) => versionBySystem[cs]).map((cs) => [cs, versionBySystem[cs].versionId]));
      const refs = plan.relationships.flatMap((r) => [
        r.subject,
        r.object,
        ...r.objectAlternates,
        { system: 'procedure-relationship-types', code: r.typeCode },
      ]);
      const ids = await resolveConcepts(client, refs, pinned);
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
          result.unresolvedByObjectSystem[r.object.system] = (result.unresolvedByObjectSystem[r.object.system] ?? 0) + 1;
          continue;
        }
        if (!resolvedAs.has(r.id)) rels.push([id, s, o, t, null]);
        resolvedAs.set(r.id, { id, via, subjectSystem: r.subject.system });
      }
      result.relationships = await insertMany(
        client,
        'concept_relationships',
        ['id', 'source_concept_id', 'target_concept_id', 'relationship_type_concept_id', 'ordinal'],
        rels,
        ['uuid', 'uuid', 'uuid', 'uuid', null],
      );
      for (const [code, def] of Object.entries(EXTRA_SOURCES))
        await client.query(
          `INSERT INTO terminology.terminology_sources (id, code, name, owner, official_url, license, state_concept_id, created_at, updated_at, row_version)
           VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
          [md5uuid(`mantra:procedures-treatments:source:${code}`), code, def.name, def.owner, def.officialUrl, def.license, stateId],
        );
      const { rows: srcRows } = await client.query('SELECT code, id FROM terminology.terminology_sources');
      const srcByCode = new Map(srcRows.map((r) => [r.code, r.id]));
      if (!evidenceBlock) {
        const ev = plan.provenance
          .filter((p) => resolvedAs.has(p.relationshipId))
          .map((p) => {
            const { id, via, subjectSystem } = resolvedAs.get(p.relationshipId);
            const tier = tiers.get(TIER_OF_ASSERTION[p.assertionKind]);
            if (!tier) throw new Error(`Clase de afirmación sin nivel de evidencia: ${p.assertionKind}`);
            const text = citationTextOf(p) + (via ? ` | sitio_vía_mapeo_publicado=${via.source}:${via.sourceRecordId}` : '');
            return [
              p.id,
              id,
              srcByCode.get(PROVENANCE_SOURCE_CODE[p.source]),
              versionBySystem[subjectSystem].versionId,
              tier,
              p.sourceRecordId.slice(0, 250),
              text,
              p.sourceUri,
              validFromOf(p).date,
            ];
          });
        result.provenance = await insertMany(
          client,
          EVIDENCE_TABLE,
          ['id', 'concept_relationship_id', 'terminology_source_id', 'code_system_version_id', 'evidence_tier_concept_id', 'source_reference', 'citation_text', 'citation_locator', 'valid_from'],
          ev,
          ['uuid', 'uuid', 'uuid', 'uuid', 'uuid', null, null, null, 'date'],
        );
      } else {
        const prov = plan.provenance
          .filter((p) => resolvedAs.has(p.relationshipId))
          .map((p) => {
            const { id, via } = resolvedAs.get(p.relationshipId);
            const evidence = via ? { ...(p.evidence ?? {}), objectMappedVia: via } : p.evidence;
            return [p.id, id, srcByCode.get(PROVENANCE_SOURCE_CODE[p.source]), p.sourceRecordId, p.sourceVersion, p.sourceUri, p.sourcePredicate, p.assertionKind, JSON.stringify(evidence), p.retrievedAt];
          });
        result.provenance = await insertMany(
          client,
          PROVENANCE_TABLE,
          ['id', 'concept_relationship_id', 'source_id', 'source_record_id', 'source_version', 'source_uri', 'source_predicate', 'assertion_kind', 'evidence_json', 'retrieved_at'],
          prov,
          ['uuid', 'uuid', 'uuid', null, null, null, null, null, 'jsonb', 'timestamptz'],
        );
      }
    }

    const main = versionBySystem.maxo;
    const total =
      result.concepts +
      result.properties +
      result.designations +
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
