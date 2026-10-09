// =============================================================================
// Universo de términos del corte S4: lee la semilla del glosario (solo lectura)
// y separa lo que le toca a S4 de lo que cubre S1.
//
// `conceptRef` = código del sistema + slug EXISTENTE de la fila. Este corte no
// crea términos: un artículo cuyo término no esté en el universo va a
// `rejected.ndjson`.
// =============================================================================

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { S1_CODE_SYSTEMS, S4_CATEGORIES, SEED_DIR } from './config.mjs';

/** Lee todas las páginas `shards/<categoría>/page-N.json` de las categorías dadas. */
export function loadSeedRows(seedDir = SEED_DIR, categories = S4_CATEGORIES) {
  const rows = [];
  for (const category of categories) {
    const dir = join(seedDir, 'shards', category);
    if (!existsSync(dir)) throw new Error(`No existe la categoría de la semilla: ${dir}`);
    const pages = readdirSync(dir)
      .filter((f) => /^page-\d+\.json$/.test(f))
      .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
    for (const page of pages) rows.push(...JSON.parse(readFileSync(join(dir, page), 'utf8')));
  }
  return rows;
}

/** ¿La cubre S1? (MedlinePlus en español, por el `codeSystem` de la fila.) */
export function isS1Row(row) {
  return S1_CODE_SYSTEMS.includes(row.codeSystem);
}

/** Q-id de Wikidata de una fila: `externalIds.wikidata`, o el propio código si el sistema es `wikidata-*`. */
export function wikidataIdOf(row) {
  const fromExternal = row.externalIds?.wikidata;
  if (typeof fromExternal === 'string' && /^Q\d+$/.test(fromExternal)) return fromExternal;
  if (typeof row.codeSystem === 'string' && row.codeSystem.startsWith('wikidata-') && /^Q\d+$/.test(row.code)) return row.code;
  return null;
}

/** Referencia de concepto del contrato §12.3. */
export function conceptRefOf(row) {
  return { system: row.codeSystem, code: row.code, slug: row.slug };
}

/**
 * Parte el universo en `{ mine, excludedS1 }` y construye el índice por
 * `system|code|slug` con el que se resuelve `conceptRef`.
 */
export function buildUniverse(rows) {
  const mine = [];
  const excludedS1 = [];
  for (const row of rows) (isS1Row(row) ? excludedS1 : mine).push(row);
  const bySlug = new Map(mine.map((r) => [r.slug, r]));
  return { mine, excludedS1, bySlug };
}

/** Resuelve un `conceptRef` contra el universo; `null` si no coincide exactamente (sistema+código+slug). */
export function resolveConceptRef(ref, universe) {
  const row = universe.bySlug.get(ref?.slug);
  if (!row) return null;
  return row.codeSystem === ref.system && row.code === ref.code ? row : null;
}
