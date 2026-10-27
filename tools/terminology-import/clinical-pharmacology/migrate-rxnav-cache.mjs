#!/usr/bin/env node
// Migra la caché de RxNav de la disposición v1 (cache/rxnav/<ATC>/{by-atc,properties-N,related-in-N,unii-N}.json)
// a la v2 (by-atc/<ATC>.json y rxcui/<N>/<tipo>.json). Sólo mueve archivos ya descargados; no pide nada.
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { cpCache, rxnavByAtcPath, rxnavConceptPath } from './lib/paths.mjs';

const root = cpCache('rxnav');
let moved = 0;
for (const atc of readdirSync(root)) {
  const dir = join(root, atc);
  if (!/^[A-Z]\d{2}[A-Z]{2}\d{2}$/.test(atc) || !statSync(dir).isDirectory()) continue;
  for (const name of readdirSync(dir)) {
    const m = /^(by-atc|properties|related-in|unii)(?:-(\d+))?\.json$/.exec(name);
    if (!m) continue;
    const to = m[1] === 'by-atc' ? rxnavByAtcPath(atc) : rxnavConceptPath(m[2], m[1]);
    mkdirSync(dirname(to), { recursive: true });
    if (!existsSync(to)) renameSync(join(dir, name), to);
    moved++;
  }
  rmSync(dir, { recursive: true, force: true });
}
console.log(`[migrate-rxnav] ${moved} archivos a la disposición v2`);
