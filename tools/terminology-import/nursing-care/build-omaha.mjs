#!/usr/bin/env node
// =============================================================================
// Etapa 2 (sin red) del Omaha System: archivos de `fetch-omaha.mjs` → NDJSON normalizado.
//
//   glossary-data-build/nursing-care/omaha-system.ndjson
//   glossary-data-build/nursing-care/coverage-omaha.json
//
// Requiere `pdftotext` (poppler-utils) para leer el PDF del MOSUG. Aborta si un conteo
// no coincide con lo que el propio sitio declara (4 dominios, 42 problemas, 4 categorías,
// 75 objetivos + «other»), si un problema del MOSUG no se puede unir al del sitio, o si la
// PRSO transcripta no coincide con las respuestas de LOINC (cuando hay copia de LOINC en cache).
// =============================================================================

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nowIso, writeJson, writeNdjson } from '../lib/glossary-es/common.mjs';
import {
  OMAHA_CODE_SYSTEM, OMAHA_VERSION, buildOmahaRows, interventionTargetClaim, parseFaqLicense, parseInterventionScheme, parseMosugModifiers, parseMosugProblemPages, parseMosugProblems, parseProblemClassification, parseProblemModifiers,
} from './lib/omaha.mjs';
import { NURSING_OUT, OMAHA_CACHE, OMAHA_META } from './lib/paths.mjs';

const count = (rows, fn) => rows.reduce((m, r) => ((m[fn(r)] = (m[fn(r)] ?? 0) + 1), m), {});

async function main() {
  const meta = JSON.parse(readFileSync(OMAHA_META, 'utf8'));
  const read = (key) => readFileSync(join(OMAHA_CACHE, meta.files[key].file), 'utf8');
  const problems = parseProblemClassification(read('site-problems'));
  const modifiers = parseProblemModifiers(read('site-problems'));
  const interventionsHtml = read('site-interventions');
  const interventions = parseInterventionScheme(interventionsHtml);
  const faq = parseFaqLicense(read('site-faq'));
  const pdfText = execFileSync('pdftotext', ['-layout', join(OMAHA_CACHE, meta.files['mosug-kbs-supplement'].file), '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const mosugPages = parseMosugProblemPages(pdfText);
  const mosugProblems = parseMosugProblems(pdfText);
  const mosugModifierDefs = parseMosugModifiers(pdfText);

  // Conteos que declara el propio sitio.
  const claimedTargets = interventionTargetClaim(interventionsHtml);
  const nProblems = problems.domains.reduce((n, d) => n + d.problems.length, 0);
  if (problems.domains.length !== 4) throw new Error(`Se esperaban 4 dominios y hay ${problems.domains.length}`);
  if (nProblems !== 42) throw new Error(`El sitio declara 42 problemas y se leyeron ${nProblems}`);
  if (interventions.categories.length !== 4) throw new Error(`Se esperaban 4 categorías y hay ${interventions.categories.length}`);
  if (claimedTargets !== 75 || interventions.targets.length !== claimedTargets + 1) throw new Error(`Objetivos: el sitio declara ${claimedTargets} + «other»; se leyeron ${interventions.targets.length}`);

  const rows = buildOmahaRows({ problems, modifiers, interventions, faq, mosugProblems, mosugPages, mosugModifierDefs }, meta);
  await writeNdjson(join(NURSING_OUT, `${OMAHA_CODE_SYSTEM}.ndjson`), rows);

  const ss = rows.filter((r) => r.kind === 'sign-symptom');
  const coverage = {
    generatedAt: nowIso(),
    codeSystem: OMAHA_CODE_SYSTEM,
    version: OMAHA_VERSION,
    files: Object.fromEntries(Object.entries(meta.files).map(([k, v]) => [k, { url: v.url, sha256: v.sha256, retrievedAt: v.retrievedAt, role: v.role }])),
    concepts: rows.length,
    byKind: count(rows, (r) => r.kind),
    problemsWithDefinition: rows.filter((r) => r.kind === 'problem' && r.descriptionOriginal).length,
    problemsWithSignsSymptoms: new Set(ss.map((r) => r.parentCode)).size,
    signsSymptomsByProblem: count(ss, (r) => r.parentCode),
    problemsWithoutSignsSymptoms: rows.filter((r) => r.kind === 'problem' && !ss.some((x) => x.parentCode === r.code)).map((r) => r.nameOriginal),
    mosugModifierDefinitions: Object.keys(mosugModifierDefs),
    gaps: [
      'Signos/síntomas de 24 de los 42 problemas: sólo están en el libro de 2005 (Apéndice A); ninguna fuente abierta alcanzable los publica completos.',
      'Definiciones de los 76 objetivos y de los modificadores individuo/familia/comunidad: sólo en el libro de 2005.',
      'Códigos numéricos oficiales (dominio, problema, categoría, objetivo, signo/síntoma): sólo en el libro; el sitio no los publica. Se guarda el orden de publicación (source_order), no un código inventado.',
    ],
  };
  writeJson(join(NURSING_OUT, 'coverage-omaha.json'), coverage, true);
  console.log(JSON.stringify({ ...coverage, files: undefined, signsSymptomsByProblem: coverage.signsSymptomsByProblem }, null, 2));
}

main().catch((err) => {
  console.error('ERROR en build-omaha:', err);
  process.exitCode = 1;
});
