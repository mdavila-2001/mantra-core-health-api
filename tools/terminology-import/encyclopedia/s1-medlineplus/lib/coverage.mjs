// =============================================================================
// Cifras de cobertura MEDIDAS sobre la salida real (`articles.ndjson` +
// `rejected.ndjson`). Pura: no lee disco. Alimenta COVERAGE.md y GAPS.md.
// =============================================================================

import { KINDS_BY_FAMILY, familyOf } from './kinds.mjs';

const bump = (map, key, n = 1) => map.set(key, (map.get(key) ?? 0) + n);

/**
 * @param {object[]} terms       filas de la semilla del glosario que entran en el corte
 * @param {object[]} articles    líneas de articles.ndjson
 * @param {object[]} rejected    líneas de rejected.ndjson
 */
export function measureCoverage({ terms, articles, rejected }) {
  const articleBySlug = new Map(articles.map((a) => [a.conceptRef.slug, a]));
  const byCategory = new Map();
  for (const t of terms) {
    const cat = t.categoryKey;
    if (!byCategory.has(cat)) {
      byCategory.set(cat, { terms: 0, withArticle: 0, withoutArticle: 0, kinds: new Map(), withImage: 0, sectionsTotal: 0 });
    }
    const row = byCategory.get(cat);
    row.terms += 1;
    const article = articleBySlug.get(t.slug);
    if (!article) {
      row.withoutArticle += 1;
      continue;
    }
    row.withArticle += 1;
    row.sectionsTotal += article.sections.length;
    if (article.images.length) row.withImage += 1;
    for (const kind of new Set(article.sections.map((s) => s.kind))) bump(row.kinds, kind);
  }

  const reasons = new Map();
  const reasonsByCategory = new Map();
  const slugCategory = new Map(terms.map((t) => [t.slug, t.categoryKey]));
  for (const r of rejected) {
    const cat = slugCategory.get(r.conceptRef?.slug) ?? 'sin-concepto';
    bump(reasons, `${r.scope}:${r.reason}`);
    bump(reasonsByCategory, `${cat}|${r.scope}:${r.reason}`);
  }

  const catalogGap = new Map();
  for (const [cat, row] of byCategory) {
    const family = familyOf(cat);
    const possible = KINDS_BY_FAMILY[family];
    catalogGap.set(cat, possible.filter((k) => !row.kinds.has(k)));
  }
  return { byCategory, reasons, reasonsByCategory, catalogGap };
}

/** Mapa→objeto ordenado, para volcar a JSON. */
export function plain(value) {
  if (value instanceof Map) return Object.fromEntries([...value.entries()].sort(([a], [b]) => String(a).localeCompare(String(b))).map(([k, v]) => [k, plain(v)]));
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plain(v)]));
  return value;
}
