#!/usr/bin/env node
// =============================================================================
// Etapa 1c (descarga): NCI Thesaurus OFICIAL (NCI EVS REST API) → procedimientos con sus roles.
//
// La edición OBO que se usaba (NCIt 24.04e, mayo de 2024) es un derivado de terceros; el EVS
// publica la oficial (hoy 26.09d). Se lee, sin cuenta ni clave:
//   1. /metadata/ncit/roles                      los roles que existen (confirma R180 o su ausencia)
//   2. /concept/ncit/C25218/descendants          todos los conceptos bajo «Intervention or Procedure»
//   3. /concept/ncit?list=<códigos>&include=roles  sus roles, en lotes
//
// Salida (fuera de git): cache/ncit-evs/ncit-procedures.ndjson (una línea por concepto con sus
// roles tal como los devuelve el EVS), roles.json y meta.json (versión, fecha, conteos, SHA-256).
// 1 pedido cada ≥ 1,2 s y User-Agent identificable.
//
// Uso: node tools/terminology-import/procedures-treatments/fetch-evs.mjs
// =============================================================================

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { cacheDir, ensureDir, nowIso, sha256File, writeJson } from './lib/common.mjs';

const API = 'https://api-evsrest.nci.nih.gov/api/v1';
const UA = 'mantra-core-health-terminology-import/1.0 (+contacto: pabliarca@gmail.com)';
export const NCIT_ROOT_PROCEDURE = 'C25218';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function get(path, params = {}) {
  const args = ['-sS', '-G', '--retry', '5', '--retry-all-errors', '--retry-delay', '5', '--max-time', '120', '-A', UA, '--fail'];
  for (const [k, v] of Object.entries(params)) args.push('--data-urlencode', `${k}=${v}`);
  args.push(`${API}${path}`);
  return JSON.parse(execFileSync('curl', args, { encoding: 'utf8', maxBuffer: 1 << 28 }));
}

async function main() {
  const dir = ensureDir(cacheDir('ncit-evs'));
  const retrievedAt = nowIso();
  const roles = get('/metadata/ncit/roles');
  writeJson(`${dir}/roles.json`, roles);
  await sleep(1200);
  const codes = [];
  for (let from = 0; ; from += 1000) {
    const page = get(`/concept/ncit/${NCIT_ROOT_PROCEDURE}/descendants`, { pageSize: 1000, fromRecord: from, include: 'minimal' });
    if (!page.length) break;
    codes.push(...page.map((c) => c.code));
    await sleep(1200);
  }
  const unique = [...new Set([NCIT_ROOT_PROCEDURE, ...codes])];
  console.log(`[evs] ${unique.length} conceptos bajo ${NCIT_ROOT_PROCEDURE}`);
  const out = `${dir}/ncit-procedures.ndjson`;
  writeFileSync(out, '');
  let version = null;
  const lines = [];
  for (let i = 0; i < unique.length; i += 100) {
    const batch = get('/concept/ncit', { list: unique.slice(i, i + 100).join(','), include: 'roles' });
    for (const c of batch) {
      version ??= c.version;
      if (c.version !== version) throw new Error(`El EVS devolvió dos versiones en la misma corrida: ${version} y ${c.version}`);
      lines.push(JSON.stringify({ code: c.code, name: c.name, active: c.active, conceptStatus: c.conceptStatus, roles: (c.roles ?? []).map((r) => ({ code: r.code, type: r.type, relatedCode: r.relatedCode, relatedName: r.relatedName })) }));
    }
    if ((i / 100) % 10 === 0) console.log(`[evs] ${Math.min(i + 100, unique.length)}/${unique.length}`);
    await sleep(1200);
  }
  lines.sort();
  writeFileSync(out, `${lines.join('\n')}\n`);
  writeJson(`${dir}/meta.json`, {
    source: 'ncit-evs',
    name: 'NCI Thesaurus — edición oficial del NCI EVS (REST API)',
    publisher: 'National Cancer Institute — Enterprise Vocabulary Services',
    license: 'CC BY 4.0 (https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/ThesaurusTermsofUse.htm). «NCI Thesaurus» es marca: sólo lo publicado por el NCI puede llamarse así.',
    licenseUrl: 'https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/ThesaurusTermsofUse.htm',
    homepage: 'https://evsexplore.semantics.cancer.gov/',
    retrievedAt,
    tag: `ncit ${version}`,
    version,
    root: NCIT_ROOT_PROCEDURE,
    concepts: lines.length,
    files: {
      'ncit-procedures.ndjson': { url: `${API}/concept/ncit?list=<códigos>&include=roles`, fileUrl: `${API}/concept/ncit/${NCIT_ROOT_PROCEDURE}/descendants`, sha256: sha256File(out), bytes: readFileSync(out).length },
      'roles.json': { url: `${API}/metadata/ncit/roles`, fileUrl: `${API}/metadata/ncit/roles`, sha256: sha256File(`${dir}/roles.json`), bytes: readFileSync(`${dir}/roles.json`).length },
    },
  });
  console.log(`[evs] listo: ${lines.length} conceptos, NCIt ${version}`);
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) main().catch((e) => { console.error(e); process.exitCode = 1; });
