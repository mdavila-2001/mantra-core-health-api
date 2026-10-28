#!/usr/bin/env node
// =============================================================================
// Cobertura de ATC (hueco H-ATC) sobre el corpus normalizado: cuántos fármacos y
// afirmaciones tienen al menos un código ATC de nivel 5, de dónde sale (código de
// la fuente o cruce publicado) y cuántos ATC distintos hay. Solo lectura, sin base.
//
// Uso: node tools/terminology-import/drug-treatments/coverage-atc.mjs [--out archivo.json]
// =============================================================================

import { writeFileSync } from 'node:fs';

import { assertionChunks } from './load-drug-treatments.mjs';

const out = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : null;
const drugs = new Map(); // clave canónica del fármaco → { atc: Set, nonCombination }
const bySource = {};
const viaCount = {};
const atcCodes = new Set();
let total = 0;
let withAtc = 0;

for await (const { assertions } of assertionChunks()) {
  for (const a of assertions) {
    total++;
    const own = a.drug.codes.filter((c) => c.system === 'ATC');
    const viaCross = (a.crosswalk?.drug ?? []).filter((c) => c.system === 'ATC');
    const all = [...own, ...viaCross];
    const s = (bySource[a.source.key] ??= { assertions: 0, withAtc: 0, atcFromSourceCode: 0, atcFromCrosswalk: 0 });
    s.assertions++;
    if (all.length) {
      s.withAtc++;
      withAtc++;
    }
    if (own.length) s.atcFromSourceCode++;
    if (viaCross.length) s.atcFromCrosswalk++;
    for (const c of viaCross) viaCount[c.via] = (viaCount[c.via] ?? 0) + 1;
    for (const c of all) atcCodes.add(c.code);
    const key = a.pairKey.split('|')[0];
    if (!drugs.has(key)) drugs.set(key, { atc: new Set(), combination: key.startsWith('COMBINATION(') });
    for (const c of all) drugs.get(key).atc.add(c.code);
  }
}
const single = [...drugs.values()].filter((d) => !d.combination);
const report = {
  assertions: total,
  assertionsWithAtc: withAtc,
  drugsDistinct: drugs.size,
  drugsSingleIngredient: single.length,
  drugsSingleIngredientWithAtc: single.filter((d) => d.atc.size > 0).length,
  distinctAtcLevel5Codes: atcCodes.size,
  atcAddedByCrosswalkVia: viaCount,
  bySource,
};
console.log(JSON.stringify(report, null, 2));
if (out) writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
