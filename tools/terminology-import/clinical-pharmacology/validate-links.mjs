#!/usr/bin/env node
// =============================================================================
// Farmacología clínica · validación de enlaces POR CÓDIGO contra lo que cargan
// otras sesiones (catálogo de productos, vademecum, `justin/seed-drug-treatments`,
// `justin/seed-diseases`). Sólo lee la base; no escribe.
//
//   1. vademecum: cada ATC 5 tiene concepto en clinical-pharmacology y concept_map
//   2. catálogo de productos: cada `medicine_atc` tiene monografía
//   3. relaciones de cualquier code system cuyo extremo es un concepto con código
//      ATC 5 (p. ej. fármaco → enfermedad): ¿ese ATC tiene monografía?
//   4. RxCUI del puente RxNav: ¿existen en `rxnorm_full`/`rxterms` por código?
//
// Uso: node tools/terminology-import/clinical-pharmacology/validate-links.mjs   (.env DB_*)
// Salida: out/validate-links.json
// =============================================================================

import 'dotenv/config';
import pg from 'pg';

import { writeJson } from '../lib/glossary-es/common.mjs';
import { CODE_SYSTEM, PROPERTY } from './lib/load-plan.mjs';
import { cpOut } from './lib/paths.mjs';

const ATC5_SQL = '^[A-Z][0-9]{2}[A-Z]{2}[0-9]{2}$';

const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

const CONCEPTS_OF = (cs) => `
  SELECT cc.id, cc.code FROM terminology.catalog_concepts cc
    JOIN terminology.code_system_versions v ON v.id = cc.code_system_version_id
    JOIN terminology.code_systems s ON s.id = v.code_system_id
   WHERE s.internal_code = '${cs}'`;

async function main() {
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  const report = { generatedAt: new Date().toISOString() };
  try {
    const q = async (sql, params = []) => (await client.query(sql, params)).rows;
    const [{ n: cpCount }] = await q(`SELECT count(*)::int n FROM (${CONCEPTS_OF(CODE_SYSTEM)}) x WHERE x.code ~ $1`, [ATC5_SQL]);
    report.monographConcepts = cpCount;

    const vad = await q(
      `SELECT v.code, cp.id IS NOT NULL has_concept, m.id IS NOT NULL has_map
         FROM (${CONCEPTS_OF('vademecum')}) v
         LEFT JOIN (${CONCEPTS_OF(CODE_SYSTEM)}) cp ON cp.code = v.code
         LEFT JOIN terminology.concept_maps m ON m.source_concept_id = cp.id AND m.target_concept_id = v.id`,
    );
    report.vademecum = { atc5: vad.length, withMonograph: vad.filter((r) => r.has_concept).length, withMap: vad.filter((r) => r.has_map).length, withoutMonograph: vad.filter((r) => !r.has_concept).map((r) => r.code).sort() };

    const prod = await q(
      `SELECT s.internal_code cs, a.atc, EXISTS (SELECT 1 FROM (${CONCEPTS_OF(CODE_SYSTEM)}) cp WHERE cp.code = a.atc) has_monograph, count(*)::int products
         FROM terminology.concept_properties p
         JOIN terminology.catalog_concepts cc ON cc.id = p.concept_id
         JOIN terminology.code_system_versions v ON v.id = cc.code_system_version_id
         JOIN terminology.code_systems s ON s.id = v.code_system_id
         CROSS JOIN LATERAL jsonb_array_elements_text(p.value_json) a(atc)
        WHERE p.property_code = 'medicine_atc' AND jsonb_typeof(p.value_json) = 'array'
        GROUP BY 1, 2, 3`,
    );
    report.productCatalog = {};
    for (const r of prod) {
      const e = (report.productCatalog[r.cs] ??= { atc5: 0, withMonograph: 0, productsWithoutMonograph: 0 });
      e.atc5++;
      if (r.has_monograph) e.withMonograph++;
      else e.productsWithoutMonograph += r.products;
    }

    const rels = await q(
      `WITH atc AS (
         SELECT cc.id, cc.code, s.internal_code cs FROM terminology.catalog_concepts cc
           JOIN terminology.code_system_versions v ON v.id = cc.code_system_version_id
           JOIN terminology.code_systems s ON s.id = v.code_system_id
          WHERE cc.code ~ $1 AND s.internal_code <> $2)
       SELECT a.cs, rt.code rel_type, a.code,
              EXISTS (SELECT 1 FROM (${CONCEPTS_OF(CODE_SYSTEM)}) cp WHERE cp.code = a.code) has_monograph
         FROM terminology.concept_relationships r
         JOIN atc a ON a.id IN (r.source_concept_id, r.target_concept_id)
         JOIN terminology.catalog_concepts rt ON rt.id = r.relationship_type_concept_id`,
      [ATC5_SQL, CODE_SYSTEM],
    );
    report.relationshipsTouchingAtc5 = {};
    for (const r of rels) {
      const e = (report.relationshipsTouchingAtc5[`${r.cs} · ${r.rel_type}`] ??= { relationships: 0, withMonograph: 0, atc5WithoutMonograph: new Set() });
      e.relationships++;
      if (r.has_monograph) e.withMonograph++;
      else e.atc5WithoutMonograph.add(r.code);
    }
    for (const e of Object.values(report.relationshipsTouchingAtc5)) e.atc5WithoutMonograph = [...e.atc5WithoutMonograph].sort();

    const rx = await q(
      `SELECT DISTINCT c->>'rxcui' rxcui,
              EXISTS (SELECT 1 FROM terminology.catalog_concepts cc
                        JOIN terminology.code_system_versions v ON v.id = cc.code_system_version_id
                        JOIN terminology.code_systems s ON s.id = v.code_system_id
                       WHERE s.internal_code IN ('rxnorm_full', 'rxterms') AND cc.code = c->>'rxcui') present
         FROM terminology.concept_properties p
         CROSS JOIN LATERAL jsonb_array_elements(p.value_json->'rxcuis') c
        WHERE p.property_code = $1`,
      [PROPERTY.RXNORM],
    );
    report.rxnorm = { rxcuis: rx.length, presentInRxnormCodeSystems: rx.filter((r) => r.present).length };
  } finally {
    await client.end();
  }
  writeJson(cpOut('validate-links.json'), report, true);
  console.log(JSON.stringify(report, (k, v) => (Array.isArray(v) && v.length > 20 ? [...v.slice(0, 20), `… (${v.length})`] : v), 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en validate-links:', err);
  process.exitCode = 1;
});
