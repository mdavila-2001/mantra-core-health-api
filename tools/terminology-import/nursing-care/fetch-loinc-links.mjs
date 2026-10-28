#!/usr/bin/env node
// =============================================================================
// LOINC ↔ enfermería (2026-10-27), sin tocar loinc.org (da 403): sólo el subconjunto público del NLM Clinical
// Table Search Service, el mismo desde el que `import-loinc.mjs` carga el code system `loinc`.
//
//   1. Códigos LOINC que los arquetipos de openEHR CKM declaran en sus term_binding (126 enlaces, 101 códigos):
//      se busca cada uno por LOINC_NUM exacto y se anota si el subconjunto público lo resuelve.
//   2. Términos LOINC con método «Observed.OMAHA» (los que LOINC publica para el Omaha System: conocimiento,
//      conducta y estado × problema × individuo/familia/comunidad, y el panel «Omaha System 2005 panel»),
//      con las listas de respuesta (LA6495-1 …) que sirven de contraste de la PRSO.
//
// Escribe `loinc-links.ndjson` (y `loinc-omaha-terms.json`) en `glossary-data-build/nursing-care/`, y `loinc-links-report.json`.
// ≤ 2 pedidos por segundo, un pedido a la vez, User-Agent identificable, reintento con backoff.
// =============================================================================

import { join } from 'node:path';
import { HttpClient, USER_AGENT, nowIso, writeJson, writeNdjson } from '../lib/glossary-es/common.mjs';
import { NURSING_OUT } from './lib/paths.mjs';
import { parseNdjsonText, readRepoDataset } from './lib/repo-data.mjs';

const API = 'https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search';
const DF = 'LOINC_NUM,LONG_COMMON_NAME,SHORTNAME,COMPONENT,PROPERTY,TIME_ASPCT,SYSTEM,SCALE_TYP,METHOD_TYP,CLASS';
const FIELDS = DF.split(',');
const http = new HttpClient({ concurrency: 1, minDelayMs: 600, maxRetries: 4, headers: { 'User-Agent': `${USER_AGENT} (LOINC links; +https://github.com/mdavila-2001/mantra-core-health-api)` } });

const asRecord = (row) => Object.fromEntries(FIELDS.map((f, i) => [f, row[i] === '' ? null : row[i]]));

async function lookup(code) {
  const url = `${API}?terms=${encodeURIComponent(code)}&sf=LOINC_NUM&maxList=10&df=${DF}`;
  const { body } = await http.get(url, { accept: 'application/json' });
  const d = JSON.parse(body.toString('utf8'));
  const hit = (d[3] ?? []).map(asRecord).find((r) => r.LOINC_NUM === code);
  return hit ?? null;
}

async function main() {
  const ckm = parseNdjsonText(readRepoDataset('openehr-ckm'));
  const bound = new Map();
  for (const r of ckm) for (const b of r.bindings ?? []) if (/^(LOINC|LNC)/i.test(b.terminology) && b.code) bound.set(b.code, (bound.get(b.code) ?? 0) + 1);
  // LA… = respuesta (answer) y LL… = lista de respuestas de LOINC: no son términos de `loinc_items`; se anotan aparte.
  const isAnswerCode = (c) => /^L[AL]\d/.test(c);
  const answerCodes = [...bound.keys()].filter(isAnswerCode).sort();
  const codes = [...bound.keys()].filter((c) => !isAnswerCode(c)).sort();
  const fetchedAt = nowIso();
  const rows = [];
  for (const code of codes) {
    const hit = await lookup(code);
    rows.push({ loincNum: code, bindingsInCkm: bound.get(code), resolved: Boolean(hit), ...(hit ?? {}), source: 'NLM Clinical Table Search Service, tabla loinc_items (subconjunto público de LOINC)', url: `${API}?terms=${code}&sf=LOINC_NUM` }); // sin fecha en la fila: va en loinc-links-report
  }
  await writeNdjson(join(NURSING_OUT, 'loinc-links.ndjson'), rows);

  // Términos LOINC del Omaha System (método Observed.OMAHA) con sus respuestas.
  const url = `${API}?terms=omaha&maxList=500&df=${DF}&ef=answers,AnswerList`;
  const { body } = await http.get(url, { accept: 'application/json' });
  const d = JSON.parse(body.toString('utf8'));
  const omaha = d[1].map((code, i) => ({ ...asRecord(d[3][i]), answers: d[2].answers?.[i] ?? null }));
  writeJson(join(NURSING_OUT, 'loinc-omaha-terms.json'), { fetchedAt, url, total: d[0], terms: omaha }, true);

  const answerSets = new Map();
  for (const t of omaha) if (t.answers) answerSets.set(t.answers.map((a) => `${a.AnswerStringID}=${a.DisplayText}`).join(' | '), (answerSets.get(t.answers.map((a) => `${a.AnswerStringID}=${a.DisplayText}`).join(' | ')) ?? 0) + 1);
  const report = {
    fetchedAt,
    boundCodesTotal: bound.size,
    bindingsTotal: [...bound.values()].reduce((a, b) => a + b, 0),
    answerCodesNotLookedUp: { count: answerCodes.length, bindings: answerCodes.reduce((n, c) => n + bound.get(c), 0), note: 'LA…/LL… son respuestas y listas de respuestas de LOINC (parte de las respuestas de un ítem), no términos de loinc_items' },
    boundTermCodes: codes.length,
    termBindings: codes.reduce((n, c) => n + bound.get(c), 0),
    resolvedInPublicSubset: rows.filter((r) => r.resolved).length,
    notResolved: rows.filter((r) => !r.resolved).map((r) => r.loincNum),
    omahaTerms: { total: omaha.length, byMethod: omaha.reduce((m, t) => ((m[t.METHOD_TYP ?? '∅'] = (m[t.METHOD_TYP ?? '∅'] ?? 0) + 1), m), {}), answerLists: Object.fromEntries(answerSets) },
    requests: http.stats.requests,
  };
  writeJson(join(NURSING_OUT, 'loinc-links-report.json'), report, true);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error('ERROR en fetch-loinc-links:', err);
  process.exitCode = 1;
});
