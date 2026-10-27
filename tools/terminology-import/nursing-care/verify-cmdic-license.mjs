#!/usr/bin/env node
// =============================================================================
// CMDIC del Ministerio de Sanidad (2026-10-27): lee HOY lo que el Ministerio publica sobre su licencia y contrasta
// el archivo oficial de descarga contra el corpus ya versionado.
//
//   1. Aviso legal del portal (www.sanidad.gob.es/avisoLegal/home.htm) y la página de los arquetipos: texto de
//      reutilización, verbatim, con SHA-256 de cada página.
//   2. `Arquetipos_13606.zip` (el «Fichero de descarga con los arquetipos» de la página oficial): se descomprime,
//      se parsea con el mismo parser y se compara concepto por concepto (código, nombres, definiciones, padre)
//      contra `es-msssi-cmdic-13606` de `data/` (que vino de la copia de openEHR/adl-archetypes).
//
// Escribe `cmdic-license-verification.json` en `glossary-data-build/nursing-care/` (se versiona con pack-omaha.mjs).
// Requiere `unzip`. Un pedido a la vez, ≥ 600 ms entre pedidos.
// =============================================================================

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { HttpClient, USER_AGENT, decodeEntities, ensureDir, nowIso, writeJson } from '../lib/glossary-es/common.mjs';
import { parseArchetype } from './lib/adl.mjs';
import { archetypeRows } from './lib/ckm.mjs';
import { MSSSI_CODE_SYSTEM, NURSING_REPORT_ID, msssiProfile, slotTargets } from './lib/msssi.mjs';
import { NURSING_OUT, NURSING_CACHE } from './lib/paths.mjs';
import { parseNdjsonText, readRepoDataset } from './lib/repo-data.mjs';

const BASE = 'https://www.sanidad.gob.es';
const PAGES = {
  aviso: `${BASE}/avisoLegal/home.htm`,
  arquetipos: `${BASE}/profesionales/hcdsns/areaRecursosSem/Rec_mod_clinico_arquetipos.htm`,
  zip: `${BASE}/profesionales/hcdsns/areaRecursosSem/Arquetipos_13606.zip`,
  lista: `${BASE}/profesionales/hcdsns/areaRecursosSem/Lista_arquetipos_CMDIC_v1_20022014.pdf`,
};
const sha = (b) => createHash('sha256').update(b).digest('hex');
const http = new HttpClient({ concurrency: 1, minDelayMs: 600, maxRetries: 4, headers: { 'User-Agent': `${USER_AGENT} (CMDIC license check; +https://github.com/mdavila-2001/mantra-core-health-api)` } });
const text = (buf) => decodeEntities(buf.toString('latin1').replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, '\n')).replace(/[ \t ]+/g, ' ').replace(/\n\s*\n+/g, '\n');

async function main() {
  const out = { checkedAt: nowIso(), files: {} };
  const dir = ensureDir(join(NURSING_CACHE, 'cmdic-official'));
  const bodies = {};
  for (const [k, url] of Object.entries(PAGES)) {
    const res = await http.get(url);
    bodies[k] = res.body;
    writeFileSync(join(dir, url.split('/').pop()), res.body);
    out.files[k] = { url, httpStatus: res.status, contentType: res.headers.get('content-type'), bytes: res.body.length, sha256: sha(res.body) };
  }
  const aviso = text(bodies.aviso);
  const i = aviso.indexOf('La información disponible en este sitio web');
  if (i < 0) throw new Error('El Aviso legal ya no trae la cláusula de reutilización: revisar a mano');
  const clause = aviso.slice(i, aviso.indexOf('El Ministerio de Sanidad declara su respeto', i)).split('\n').map((l) => l.trim()).filter(Boolean);
  const page = text(bodies.arquetipos);
  out.reuseClause = clause;
  out.pageStatesExceptionToReuse = /salvo indicaci[oó]n expresa en contrario|licencia|copyright|todos los derechos reservados/i.test(page.split('Recursos de Modelado Clínico (arquetipos)').slice(-1)[0].split('Subir')[0]);
  out.status = 'reuse-allowed-with-conditions';
  out.conditions = clause.filter((l) => /^(Queda prohibida|El usuario queda obligado)/.test(l));

  // Comparación del zip oficial con el corpus versionado.
  const tmp = mkdtempSync(join(tmpdir(), 'cmdic-'));
  try {
    writeFileSync(join(tmp, 'a.zip'), bodies.zip);
    execFileSync('unzip', ['-q', join(tmp, 'a.zip'), '-d', join(tmp, 'x')]);
    const parsed = readdirSync(join(tmp, 'x')).filter((n) => n.endsWith('.adl')).sort().map((n) => parseArchetype(readFileSync(join(tmp, 'x', n), 'utf8')));
    const report = parsed.find((a) => a.archetypeId === NURSING_REPORT_ID);
    const profile = msssiProfile(slotTargets(report, parsed.map((a) => a.archetypeId)));
    const official = parsed.flatMap((a) => archetypeRows(a, { path: 'x', commit: 'x', retrievedAt: 'x', repoUrl: 'x', profile }));
    const repo = parseNdjsonText(readRepoDataset(MSSSI_CODE_SYSTEM));
    const key = (r) => JSON.stringify([r.code, r.kind, r.nameEs, r.nameOriginal, r.descriptionEs, r.descriptionOriginal, r.parentCode]);
    const A = new Map(official.map((r) => [r.code, key(r)]));
    const B = new Map(repo.map((r) => [r.code, key(r)]));
    let differing = 0;
    for (const [c, k] of A) if (B.get(c) !== k) differing += 1;
    for (const c of B.keys()) if (!A.has(c)) differing += 1;
    out.zipVsCorpus = { adlFilesInZip: parsed.length, conceptsFromZip: official.length, conceptsInCorpus: repo.length, differing };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  writeJson(join(NURSING_OUT, 'cmdic-license-verification.json'), out, true);
  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error('ERROR en verify-cmdic-license:', err);
  process.exitCode = 1;
});
