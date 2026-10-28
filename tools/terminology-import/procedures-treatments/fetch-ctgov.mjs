#!/usr/bin/env node
// =============================================================================
// Etapa 1b (descarga): ClinicalTrials.gov API v2 → estudios con intervención no
// farmacológica que tienen términos MeSH de intervención y de condición.
//
//   filtro:  AREA[InterventionType](PROCEDURE OR RADIATION OR BEHAVIORAL OR DIAGNOSTIC_TEST)
//   campos:  NCTId, OverallStatus, Phase, StartDate, LastUpdatePostDate, InterventionType,
//            ConditionMesh, InterventionMesh (los términos MeSH los DERIVA ClinicalTrials.gov
//            del texto del registro; son su mapeo publicado, no uno nuestro)
//
// Salida (fuera de git): cache/clinicaltrials-gov/studies.ndjson (una línea compacta por
// estudio con ambos juegos de MeSH) y meta.json (dataTimestamp y apiVersion que informa la
// API, consulta exacta, conteos y SHA-256). La API cambia a diario: el corpus se fija por ese
// dataTimestamp y por el SHA-256 del archivo.
//
// Buena ciudadanía: User-Agent identificable, 1 pedido cada ≥ 1,5 s (el límite publicado es
// ~50 por minuto por IP), reintentos con espera creciente, reanudable por token de página.
//
// Uso: node tools/terminology-import/procedures-treatments/fetch-ctgov.mjs [--resume]
// =============================================================================

import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { cacheDir, ensureDir, nowIso, sha256File, writeJson } from './lib/common.mjs';

export const CTGOV_QUERY = 'AREA[InterventionType](PROCEDURE OR RADIATION OR BEHAVIORAL OR DIAGNOSTIC_TEST)';
export const CTGOV_FIELDS = 'NCTId,OverallStatus,Phase,StartDate,LastUpdatePostDate,InterventionType,InterventionMesh,ConditionMesh';
const UA = 'mantra-core-health-terminology-import/1.0 (+contacto: pabliarca@gmail.com)';
const API = 'https://clinicaltrials.gov/api/v2';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function get(path, params) {
  const args = ['-sS', '-G', '--retry', '5', '--retry-all-errors', '--retry-delay', '5', '--max-time', '120', '-A', UA, '--fail'];
  for (const [k, v] of Object.entries(params ?? {})) args.push('--data-urlencode', `${k}=${v}`);
  args.push(`${API}${path}`);
  return JSON.parse(execFileSync('curl', args, { encoding: 'utf8', maxBuffer: 1 << 28 }));
}

/** Estudio crudo de la API → línea compacta, o null si no sirve (sin MeSH de intervención o de condición). */
export function compactStudy(s) {
  const nct = s.protocolSection?.identificationModule?.nctId;
  const cond = (s.derivedSection?.conditionBrowseModule?.meshes ?? []).map((m) => ({ id: m.id, term: m.term }));
  const intv = (s.derivedSection?.interventionBrowseModule?.meshes ?? []).map((m) => ({ id: m.id, term: m.term }));
  if (!nct || !cond.length || !intv.length) return null;
  const st = s.protocolSection.statusModule ?? {};
  return {
    nct,
    status: st.overallStatus ?? null,
    phases: s.protocolSection.designModule?.phases ?? [],
    startDate: st.startDateStruct?.date ?? null,
    lastUpdate: st.lastUpdatePostDateStruct?.date ?? null,
    interventionTypes: [...new Set((s.protocolSection.armsInterventionsModule?.interventions ?? []).map((i) => i.type))].sort(),
    conditionMeshes: cond,
    interventionMeshes: intv,
  };
}

async function main() {
  const dir = ensureDir(cacheDir('clinicaltrials-gov'));
  const out = `${dir}/studies.ndjson`;
  const state = `${dir}/crawl-state.json`;
  const resume = process.argv.includes('--resume') && existsSync(state);
  if (!resume) {
    rmSync(out, { force: true });
    rmSync(state, { force: true });
  }
  const version = get('/version');
  let { token, pages, scanned, kept, total } = resume ? JSON.parse(readFileSync(state, 'utf8')) : { token: null, pages: 0, scanned: 0, kept: 0, total: null };
  if (resume) console.log(`[ctgov] reanudo en la página ${pages + 1}`);
  const startedAt = nowIso();
  for (;;) {
    const params = { 'filter.advanced': CTGOV_QUERY, pageSize: '1000', fields: CTGOV_FIELDS, ...(token ? { pageToken: token } : { countTotal: 'true' }) };
    const page = get('/studies', params);
    if (total == null) total = page.totalCount;
    const lines = [];
    for (const s of page.studies ?? []) {
      scanned += 1;
      const c = compactStudy(s);
      if (c) {
        kept += 1;
        lines.push(JSON.stringify(c));
      }
    }
    if (lines.length) appendFileSync(out, `${lines.join('\n')}\n`);
    pages += 1;
    token = page.nextPageToken ?? null;
    writeFileSync(state, JSON.stringify({ token, pages, scanned, kept, total }));
    if (pages % 10 === 0 || !token) console.log(`[ctgov] página ${pages}: ${scanned}/${total} estudios leídos, ${kept} con MeSH de intervención y condición`);
    if (!token) break;
    await sleep(1600);
  }
  writeJson(`${dir}/meta.json`, {
    source: 'clinicaltrials-gov',
    name: 'ClinicalTrials.gov API v2 (intervenciones no farmacológicas ↔ condición, solo «en estudio»)',
    publisher: 'U.S. National Library of Medicine (NLM)',
    license: 'Dominio público (NLM). Términos de uso de ClinicalTrials.gov: https://clinicaltrials.gov/about-site/terms-conditions',
    licenseUrl: 'https://clinicaltrials.gov/about-site/terms-conditions',
    homepage: 'https://clinicaltrials.gov/data-api/api',
    retrievedAt: startedAt,
    finishedAt: nowIso(),
    apiVersion: version.apiVersion,
    dataTimestamp: version.dataTimestamp,
    query: CTGOV_QUERY,
    fields: CTGOV_FIELDS,
    totalCount: total,
    scanned,
    kept,
    files: { 'studies.ndjson': { url: `${API}/studies`, fileUrl: `${API}/studies`, sha256: sha256File(out), bytes: readFileSync(out).length } },
  });
  rmSync(state, { force: true });
  console.log(`[ctgov] listo: ${kept} de ${scanned} estudios (dataTimestamp ${version.dataTimestamp})`);
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) main().catch((e) => { console.error(e); process.exitCode = 1; });
