// =============================================================================
// Términos del glosario que vienen de la CIE-10-ES (`sanidad-cie10es-2026`).
// Lee la semilla del front (`public/glossary-seed/shards/*/page-*.json`); no se
// crea ningún término: el artículo se resuelve contra el slug/código existente.
// =============================================================================

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GLOSSARY_SOURCE } from './config.mjs';

/** Categorías de la semilla donde viven las 11 586 filas CIE-10-ES. */
export const SEED_CATEGORIES = Object.freeze(['disease', 'other']);

export function loadCieTerms(seedDir) {
  const terms = [];
  for (const category of SEED_CATEGORIES) {
    const dir = join(seedDir, category);
    if (!existsSync(dir)) throw new Error(`Semilla sin la categoría «${category}»: ${dir}`);
    const pages = readdirSync(dir)
      .filter((f) => /^page-\d+\.json$/.test(f))
      .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
    for (const page of pages) {
      for (const t of JSON.parse(readFileSync(join(dir, page), 'utf8'))) {
        if (t.source !== GLOSSARY_SOURCE) continue;
        terms.push({
          code: t.code,
          slug: t.slug,
          esName: t.esName,
          categoryKey: t.categoryKey,
          isFinal: t.flags?.final === true,
          hierarchy: t.hierarchy ?? [],
          wikidataId: t.externalIds?.wikidata ?? null,
          hadDefinition: Boolean(t.definition),
        });
      }
    }
  }
  const seen = new Set();
  for (const t of terms) {
    if (seen.has(t.code)) throw new Error(`Código CIE-10-ES repetido en la semilla: ${t.code}`);
    seen.add(t.code);
  }
  return terms;
}
