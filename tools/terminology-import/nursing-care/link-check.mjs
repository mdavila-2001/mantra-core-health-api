#!/usr/bin/env node
// =============================================================================
// Validación de enlaces y duplicados con las sesiones hermanas (enfermedades,
// síntomas, diccionarios/anatomía, procedimientos). Dos niveles:
//
//  1. Git (sin base): ¿existen las ramas hermanas? Si existen, busca en su árbol
//     términos o sistemas de enfermería (openEHR, ICNP, Omaha, NANDA, categoría
//     «care» del glosario) para deduplicar por code system y clave. No mergea
//     ni pushea nada.
//  2. Base (`--db`, opcional, .env DB_*): con todo cargado, cuenta por CÓDIGO
//     (nunca por nombre):
//       - códigos de este corpus presentes en OTRO code system (posible duplicado),
//       - miembros de `glossary-category-care` que vienen de otros code systems,
//       - enlaces LOINC resueltos / pedidos,
//       - relaciones de conceptos de enfermería con enfermedades o síntomas.
//
// Uso:
//   node tools/terminology-import/nursing-care/link-check.mjs
//   node tools/terminology-import/nursing-care/link-check.mjs --db
// =============================================================================

import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import pg from 'pg';
import { readNdjson, writeJson, nowIso } from '../lib/glossary-es/common.mjs';
import { CODE_SYSTEM } from './lib/ckm.mjs';
import { NURSING_OUT } from './lib/paths.mjs';
import { MSSSI_CODE_SYSTEM } from './lib/msssi.mjs';
import { REGISTRY_CODE_SYSTEM } from './lib/registry.mjs';

export const SIBLING_BRANCHES = ['justin/seed-diseases', 'justin/seed-symptoms', 'justin/seed-medical-dictionaries', 'justin/seed-procedures-treatments'];
const BASE = 'dev';
const PATTERN = String.raw`openehr|openEHR-EHR|\bicnp\b|omaha|nanda|nursing|enfermer|glossary-category-care|categoryKey: 'care'`;

const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();

function checkBranches() {
  const out = [];
  for (const b of SIBLING_BRANCHES) {
    const head = git('ls-remote', '--heads', 'origin', b);
    if (!head) {
      out.push({ branch: b, exists: false, status: 'pendiente: la rama no existe todavía en origin' });
      continue;
    }
    git('fetch', '--quiet', 'origin', b, BASE);
    // Sólo lo que la rama agrega respecto de la base: lo que ya está en `dev` no es duplicado de nadie.
    const changed = git('diff', '--name-only', `origin/${BASE}...origin/${b}`).split('\n').filter(Boolean);
    let hits = [];
    if (changed.length) {
      try {
        hits = git('grep', '-n', '-i', '-E', PATTERN, `origin/${b}`, '--', ...changed).split('\n').filter(Boolean);
      } catch {
        hits = []; // git grep sale con 1 si no hay coincidencias
      }
    }
    out.push({ branch: b, exists: true, commit: head.split(/\s+/)[0], changedFiles: changed.length, nursingMentions: hits.length, sample: hits.slice(0, 40) });
  }
  return out;
}

async function checkDb() {
  const client = new pg.Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5433),
    user: process.env.DB_USER ?? 'mantra',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? 'mantra_redesa_health',
  });
  await client.connect();
  try {
    const ours = [CODE_SYSTEM, MSSSI_CODE_SYSTEM, REGISTRY_CODE_SYSTEM];
    const codes = [CODE_SYSTEM, MSSSI_CODE_SYSTEM].flatMap((cs) => readNdjson(join(NURSING_OUT, `${cs}.ndjson`)).map((r) => r.code));
    const q = (sql, p) => client.query(sql, p).then((r) => r.rows);
    const join3 = `terminology.catalog_concepts cc
      JOIN terminology.code_system_versions v ON v.id = cc.code_system_version_id
      JOIN terminology.code_systems cs ON cs.id = v.code_system_id`;
    return {
      sameCodeInOtherCodeSystems: await q(`SELECT cs.internal_code, count(*)::int AS n FROM ${join3} WHERE cc.code = ANY($1) AND cs.internal_code <> ALL($2) GROUP BY 1`, [codes, ours]),
      careCategoryMembersByCodeSystem: await q(
        `SELECT cs.internal_code, count(*)::int AS n FROM terminology.value_set_members m
           JOIN terminology.value_set_versions vv ON vv.id = m.value_set_version_id
           JOIN terminology.value_sets vs ON vs.id = vv.value_set_id
           JOIN ${join3} ON cc.id = m.concept_id
          WHERE vs.internal_code = 'glossary-category-care' GROUP BY 1`,
        [],
      ),
      loincMaps: await q(`SELECT count(*)::int AS n FROM terminology.concept_maps cm JOIN ${join3} ON cc.id = cm.source_concept_id WHERE cs.internal_code = ANY($1)`, [ours]),
      relationsToOtherCodeSystems: await q(
        `SELECT tcs.internal_code AS target, count(*)::int AS n FROM terminology.concept_relationships r
           JOIN ${join3} ON cc.id = r.source_concept_id
           JOIN terminology.catalog_concepts t ON t.id = r.target_concept_id
           JOIN terminology.code_system_versions tv ON tv.id = t.code_system_version_id
           JOIN terminology.code_systems tcs ON tcs.id = tv.code_system_id
          WHERE cs.internal_code = ANY($1) AND tcs.internal_code <> ALL($1) GROUP BY 1`,
        [ours],
      ),
    };
  } finally {
    await client.end();
  }
}

async function main() {
  const report = { generatedAt: nowIso(), branches: checkBranches() };
  if (process.argv.includes('--db')) report.db = await checkDb();
  writeJson(join(NURSING_OUT, 'link-check.json'), report, true);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error('ERROR en link-check:', err);
  process.exitCode = 1;
});
