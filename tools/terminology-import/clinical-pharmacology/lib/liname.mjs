// =============================================================================
// LINAME 2022-2024 (Bolivia) y vademécum de la app: fuentes que YA están en el
// repo. No aportan texto clínico (la LINAME no trae indicaciones, dosis ni
// contraindicaciones): aportan qué ATC 5 son esenciales en Bolivia, con su
// código LINAME y su uso restringido, y amplían el universo de ATC 5 que se
// buscan en las demás fuentes.
// =============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { API_ROOT } from '../../lib/glossary-es/common.mjs';
import { isAtc5 } from './cima.mjs';

export const LINAME_PATH = join(API_ROOT, 'tools', 'bolivia-datasets', 'data', 'liname-2022-2024.json');
export const VADEMECUM_DATASET_PATH = join(API_ROOT, 'src', 'common', 'seed', 'data', 'vademecum', 'vademecum.dataset.json');

/** LINAME → Map ATC5 → `{ source, document, presentations[] }` con los valores literales del archivo. */
export function linameByAtc(doc) {
  const f = doc.fuente ?? {};
  const map = new Map();
  for (const m of doc.medicamentos ?? []) {
    if (!isAtc5(m.atc)) continue;
    if (!map.has(m.atc)) {
      map.set(m.atc, {
        source: 'liname-bo',
        document: { title: f.nombre ?? null, owner: f.organismo ?? null, url: f.url ?? null, sha256: f.sha256 ?? null, license: f.licencia ?? null },
        repoPath: 'tools/bolivia-datasets/data/liname-2022-2024.json',
        presentations: [],
      });
    }
    map.get(m.atc).presentations.push({
      code: m.codigo,
      name: m.nombre,
      form: m.forma ?? null,
      strength: m.concentracion ?? null,
      restrictedUse: m.usoRestringido ?? null,
      atcPublished: m.atcPublicado ?? null,
      atcCorrected: m.atcCorregido ?? null,
    });
  }
  return map;
}

export function loadLiname(path = LINAME_PATH) {
  return linameByAtc(JSON.parse(readFileSync(path, 'utf8')));
}

/** ATC 5 del code system `vademecum` (dataset sembrado por la app) → `{ id, display }`. */
export function loadVademecumAtc(path = VADEMECUM_DATASET_PATH) {
  const d = JSON.parse(readFileSync(path, 'utf8'));
  return new Map(d.concepts.filter((c) => isAtc5(c.code)).map((c) => [c.code, { id: c.id, display: c.display }]));
}
