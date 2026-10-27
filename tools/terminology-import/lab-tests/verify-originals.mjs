#!/usr/bin/env node
// =============================================================================
// Catálogo de análisis · cotejo de las redistribuciones de npm con sus ORIGINALES.
//
// Las capas TUSS y PAMI se cargaron desde paquetes npm porque los portales oficiales
// respondían 403. Ahora responden: este script compara, archivo contra archivo, lo
// que redistribuye npm con lo que publica el editor y escribe el resultado en JSON
// (stdout) para la evidencia. Sólo lee; no escribe nada en el corpus.
//
// Requiere: fetch-lab-tests-sources.mjs (npm) y fetch-open-sources.mjs pami-datos tuss-ans-original.
// Uso: node tools/terminology-import/lab-tests/verify-originals.mjs
// =============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { BUILD_DIR, sha256File } from '../lib/glossary-es/common.mjs';
import { iterDelimited, objectsOf } from './lib/delimited.mjs';
import { parsePamiOriginal } from './lib/pami-original.mjs';
import { SOURCES } from './lib/sources.mjs';
import { unzip } from './lib/xlsx-min.mjs';

const SRC = join(BUILD_DIR, 'lab-tests-sources');
const result = {};

function tuss() {
  const zip = join(SRC, SOURCES['tuss-ans-original'].dir, 'pda-049-tuss.zip');
  const pkg = join(SRC, SOURCES['tuss-ans'].dir, 'package', 'data', '2026.06.26');
  if (!existsSync(zip) || !existsSync(pkg)) return { status: 'SIN DATOS' };
  const meta = JSON.parse(readFileSync(join(pkg, 'metadata.json'), 'utf8'));
  const sha = sha256File(zip);
  const entry = [...unzip(readFileSync(zip))].find(([n]) => /tabela_22_/.test(n));
  const orig = [...objectsOf(iterDelimited(entry[1].toString('utf8'), ';'), ['CD_TERMO', 'NM_TERMO', 'DT_INICIO_VIGENCIA', 'DT_FIM_VIGENCIA', 'DT_FIM_IMPLANTACAO'], 'TUSS 22 original')];
  const npm = JSON.parse(readFileSync(join(pkg, 'tables', 'procedures.json'), 'utf8')).filter((p) => p.table === 22);
  const byOrig = new Map(orig.map((o) => [o.CD_TERMO, o]));
  let nameDiff = 0;
  let startDiff = 0;
  let endDiff = 0;
  const examples = [];
  for (const p of npm) {
    const o = byOrig.get(p.code);
    if (!o) continue;
    if (o.NM_TERMO !== p.name) { nameDiff += 1; if (examples.length < 3) examples.push({ code: p.code, original: o.NM_TERMO, npm: p.name }); }
    if ((o.DT_INICIO_VIGENCIA || null) !== (p.startsAt ?? null)) startDiff += 1;
    if ((o.DT_FIM_VIGENCIA || null) !== (p.endsAt ?? null)) endDiff += 1;
  }
  return {
    zipSha256: sha,
    npmDeclaredChecksum: meta.checksum,
    zipIdenticalToNpmSource: sha === meta.checksum,
    originalRows: orig.length,
    npmRows: npm.length,
    onlyInOriginal: orig.filter((o) => !npm.some((p) => p.code === o.CD_TERMO)).length,
    onlyInNpm: npm.filter((p) => !byOrig.has(p.code)).length,
    nameDifferences: nameDiff,
    startDateDifferences: startDiff,
    endDateDifferences: endDiff,
    examples,
  };
}

function pami() {
  const csv = join(SRC, SOURCES['pami-datos'].dir, 'nomenclador-comun.csv');
  const npmJson = join(SRC, SOURCES['pami-nomenclador'].dir, 'package', 'dist', 'assets', 'estudios.json');
  if (!existsSync(csv) || !existsSync(npmJson)) return { status: 'SIN DATOS' };
  const orig = parsePamiOriginal(readFileSync(csv));
  const npm = JSON.parse(readFileSync(npmJson, 'utf8')).map((r) => ({ code: String(r.code).padStart(6, '0'), name: r.name.replace(/\s+/g, ' ').trim() }));
  const fold = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  let caseOnly = 0;
  const different = [];
  for (const n of npm) {
    const o = orig.rows.get(n.code);
    if (!o) continue;
    if (o.officialName.replace(/\s+/g, ' ').trim() === n.name) continue;
    if (fold(o.officialName) === fold(n.name)) caseOnly += 1;
    else different.push({ code: n.code, original: o.officialName, npm: n.name });
  }
  return {
    csvSha256: sha256File(csv),
    title: orig.title,
    originalRows: orig.rows.size,
    npmRows: npm.length,
    onlyInOriginal: [...orig.rows.keys()].filter((c) => !npm.some((n) => n.code === c)).length,
    onlyInNpm: npm.filter((n) => !orig.rows.has(n.code)).length,
    namesEqualExceptCase: caseOnly,
    namesDifferingBeyondCase: different.length,
    differingExamples: different.slice(0, 10),
    note: 'Las diferencias más allá de la caja son letras griegas que el export CSV de PAMI perdió («?»); el .xlsx oficial del mismo conjunto las conserva.',
  };
}

result.tuss = tuss();
result.pami = pami();
console.log(JSON.stringify(result, null, 2));
