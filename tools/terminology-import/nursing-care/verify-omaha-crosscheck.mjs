#!/usr/bin/env node
// =============================================================================
// Contraste del orden y de los conteos del Omaha System contra una fuente independiente: el formulario
// «Problem Classification Scheme» (Form-I) que el MOSUG aloja y que usó la Univ. de Estambul (turco con el
// nombre inglés entre paréntesis y numeración 01–42 / 01–n). NO se carga nada de ese archivo (es una traducción
// y no declara licencia): sólo sirve para comprobar que (a) el orden de publicación del sitio oficial coincide
// con la numeración de problemas, y (b) los signos/síntomas del MOSUG tienen los mismos totales.
//
// Uso: node tools/terminology-import/nursing-care/verify-omaha-crosscheck.mjs   (escribe omaha-crosscheck.json)
// =============================================================================

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readNdjson, slugify, writeJson } from '../lib/glossary-es/common.mjs';
import { OMAHA_CODE_SYSTEM } from './lib/omaha.mjs';
import { NURSING_OUT, OMAHA_CACHE, OMAHA_META } from './lib/paths.mjs';

const meta = JSON.parse(readFileSync(OMAHA_META, 'utf8'));
const text = execFileSync('pdftotext', ['-layout', join(OMAHA_CACHE, meta.files['istanbul-form-i'].file), '-'], { encoding: 'utf8' }).replace(/[ \t]+/g, ' ');
const rows = readNdjson(join(NURSING_OUT, `${OMAHA_CODE_SYSTEM}.ndjson`));
const problems = rows.filter((r) => r.kind === 'problem');
const norm = (s) => slugify(s).replace(/-/g, '');

const headers = [...text.matchAll(/(\d{2})\.\s*[^\n()]{0,80}?\(\s*([A-Z][A-Z/ \-]+?)\s*\)/g)]
  .map((m) => ({ n: Number(m[1]), english: m[2].trim(), at: m.index }))
  .filter((h) => !/DOMAIN/.test(h.english));
const result = { generatedAt: new Date().toISOString(), headersFound: headers.length, orderMismatches: [], signsSymptoms: [] };
for (const [i, h] of headers.entries()) {
  const site = problems.find((p) => p.sourceOrder === h.n);
  if (!site || norm(site.nameOriginal) !== norm(h.english)) result.orderMismatches.push({ number: h.n, form: h.english, site: site?.nameOriginal ?? null });
  const mine = rows.filter((r) => r.kind === 'sign-symptom' && r.parentCode === site?.code);
  if (!mine.length) continue;
  const block = text.slice(h.at, headers[i + 1]?.at ?? text.length);
  const seg = block.slice(Math.max(0, block.indexOf('Aktüel')));
  let run = 0;
  for (const m of seg.matchAll(/(?<![\d.])(\d{2})(?:\.\s?|(?=\p{L}))/gu)) {
    if (Number(m[1]) === run + 1) run += 1;
    else if (run > 0 && Number(m[1]) === 1) break; // vuelve a «01»: empieza otro problema
  }
  result.signsSymptoms.push({ problem: site.nameOriginal, number: h.n, mosug: mine.length, form: run, equal: mine.length === run });
}
result.problemsCrosschecked = result.headersFound - result.orderMismatches.length;
result.signsSymptomsCompared = result.signsSymptoms.length;
result.signsSymptomsEqual = result.signsSymptoms.filter((x) => x.equal).length;
writeJson(join(NURSING_OUT, 'omaha-crosscheck.json'), result, true);
console.log(JSON.stringify(result, null, 2));
if (result.orderMismatches.length) process.exitCode = 1;
