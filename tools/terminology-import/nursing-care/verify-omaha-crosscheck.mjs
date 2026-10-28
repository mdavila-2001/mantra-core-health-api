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
  // Ítems del formulario: texto entre «NN.» sucesivos (01, 02, …) hasta que la numeración vuelve a «01».
  const marks = [];
  let run = 0;
  for (const m of seg.matchAll(/(?<![\d.])(\d{2})(?:\.\s?|(?=\p{L}))/gu)) {
    if (Number(m[1]) === run + 1) {
      run += 1;
      marks.push({ n: run, from: m.index + m[0].length, at: m.index });
    } else if (run > 0 && Number(m[1]) === 1) break;
  }
  const items = marks.map((mk, k) => seg.slice(mk.from, k + 1 < marks.length ? marks[k + 1].at : seg.length).replace(/\s+/g, ' ').trim());
  // Asignación signo → problema: (1) mismo total, (2) el último ítem es «otro» en ambos (Other / diğer), (3) los números
  // (p. ej. percentiles, IMC) de cada ítem coinciden posición por posición. El texto no se compara (el formulario está en turco).
  // 25.0 y 25 son el mismo número; el último ítem («otro») arrastra el texto siguiente del formulario y no se compara por números.
  const digits = (t) => (t.match(/\d+(?:[.,]\d+)?/g) ?? []).map((x) => String(Number(x.replace(',', '.')))).join(',');
  const digitMismatches = mine.slice(0, -1).flatMap((r, k) => {
    const d1 = digits(r.nameOriginal);
    const d2 = k < items.length ? digits(items[k].replace(/\s*\d{2}\.?\s*$/, '')) : '';
    return d1 !== d2 && (d1 || d2) ? [{ index: k + 1, mosug: d1, form: d2 }] : [];
  });
  const lastOther = mine.at(-1)?.nameOriginal === 'Other' && /di[ğg]er/i.test(items.at(-1) ?? '');
  const parentOk = mine.every((r) => r.parentCode === site.code);
  result.signsSymptoms.push({ problem: site.nameOriginal, number: h.n, mosug: mine.length, form: run, equal: mine.length === run, lastIsOther: lastOther, parentOk, digitMismatches });
}
result.problemsCrosschecked = result.headersFound - result.orderMismatches.length;
result.signsSymptomsCompared = result.signsSymptoms.length;
result.signsSymptomsEqual = result.signsSymptoms.filter((x) => x.equal).length;
result.assignmentChecks = { problems: result.signsSymptoms.length, lastIsOther: result.signsSymptoms.filter((x) => x.lastIsOther).length, parentOk: result.signsSymptoms.filter((x) => x.parentOk).length, numericMismatches: result.signsSymptoms.reduce((n, x) => n + x.digitMismatches.length, 0), note: 'No verifica el texto de cada signo (el formulario está en turco): verifica total, orden por columnas (último = otro), problema padre y números por posición.' };
writeJson(join(NURSING_OUT, 'omaha-crosscheck.json'), result, true);
console.log(JSON.stringify(result, null, 2));
if (result.orderMismatches.length || result.assignmentChecks.numericMismatches || result.signsSymptomsEqual !== result.signsSymptomsCompared) process.exitCode = 1;
