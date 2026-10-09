// =============================================================================
// Canalización del corte S4: términos → artículos + rechazos + estadísticas.
//
// Determinista e idempotente: el orden de salida depende solo de la semilla
// (categoría, slug) y el contenido, solo de la caché de red. Correrla dos veces
// con la misma caché produce archivos idénticos byte a byte.
// =============================================================================

import { assembleArticle } from './article.mjs';
import { S4_CATEGORIES } from './config.mjs';
import { buildUniverse } from './terms.mjs';

const categoryRank = (key) => S4_CATEGORIES.indexOf(key);

/** Longitud mínima para llamar «sustancial» a una definición (las descripciones de Wikidata a veces son 2–3 palabras). */
export const SUBSTANTIAL_DEFINITION_LENGTH = 30;

/**
 * Calidad de la mejor definición de un artículo, medida (no opinada):
 * `es-sustancial` · `es-corta` (castellano, < 30 caracteres) · `solo-en` (hay
 * definición pero solo en inglés) · `ninguna`.
 */
export function definitionQuality(article) {
  const definitions = article.sections.filter((s) => s.kind === 'definition');
  if (definitions.length === 0) return 'ninguna';
  const spanish = definitions.filter((s) => s.lang === 'es');
  if (spanish.length === 0) return 'solo-en';
  return spanish.some((s) => s.text.length >= SUBSTANTIAL_DEFINITION_LENGTH) ? 'es-sustancial' : 'es-corta';
}

/** Orden estable: categoría de la ficha y luego slug. */
export function sortRows(rows) {
  return [...rows].sort((a, b) => categoryRank(a.categoryKey) - categoryRank(b.categoryKey) || a.slug.localeCompare(b.slug));
}

const bump = (map, key, by = 1) => map.set(key, (map.get(key) ?? 0) + by);
const toObject = (map) => Object.fromEntries([...map].sort((a, b) => String(a[0]).localeCompare(String(b[0]))));

/**
 * @param {object[]} seedRows  filas de la semilla (todas las categorías del corte)
 * @param {object}   ctx       { entities, labels, props, hpo, mesh, commons, retrievedAt }
 */
export function runPipeline(seedRows, ctx) {
  const universe = buildUniverse(seedRows);
  const articles = [];
  const held = [];
  const heldReasons = new Map();
  const rejected = [];

  const perCategory = new Map();
  const sectionKinds = new Map();
  const sectionSources = new Map();
  const sectionLangs = new Map();
  const imageLicenses = new Map();
  const imageHosts = new Map();
  const imageKinds = new Map();
  const imageTotals = new Map();
  const rejectionReasons = new Map();

  const cat = (key) => {
    if (!perCategory.has(key)) {
      perCategory.set(key, { terms: 0, articles: 0, held: 0, withTextSection: 0, withDefinition: 0, withImage: 0, factsOnly: 0, noArticle: 0, definitionQuality: {}, kinds: {} });
    }
    return perCategory.get(key);
  };

  for (const row of sortRows(universe.mine)) {
    const stats = cat(row.categoryKey);
    stats.terms++;
    const { article, rejections, hold } = assembleArticle(row, ctx);
    for (const r of rejections) {
      rejected.push(r);
      bump(rejectionReasons, `${r.level}:${r.reason.split(':')[0]}`);
    }
    if (!article) {
      stats.noArticle++;
      continue;
    }
    if (hold) {
      held.push(article);
      bump(heldReasons, hold);
      stats.held++;
      continue;
    }
    articles.push(article);
    stats.articles++;
    if (article.sections.length > 0) stats.withTextSection++;
    else stats.factsOnly += article.images.length === 0 ? 1 : 0;
    if (article.sections.some((s) => s.kind === 'definition')) stats.withDefinition++;
    const quality = definitionQuality(article);
    stats.definitionQuality[quality] = (stats.definitionQuality[quality] ?? 0) + 1;
    if (article.images.length > 0) stats.withImage++;
    const kindsHere = new Set(article.sections.map((s) => s.kind));
    for (const kind of kindsHere) stats.kinds[kind] = (stats.kinds[kind] ?? 0) + 1;
    for (const s of article.sections) {
      bump(sectionKinds, s.kind);
      bump(sectionSources, s.source);
      bump(sectionLangs, `${s.source}/${s.lang}`);
    }
    for (const image of article.images) {
      bump(imageLicenses, image.license);
      bump(imageHosts, new URL(image.url).hostname);
      bump(imageKinds, image.kind);
      bump(imageTotals, 'total');
    }
  }

  return {
    articles,
    held,
    rejected,
    stats: {
      universe: { total: seedRows.length, s4: universe.mine.length, excludedS1: universe.excludedS1.length },
      perCategory: Object.fromEntries([...perCategory].sort((a, b) => categoryRank(a[0]) - categoryRank(b[0]))),
      sectionKinds: toObject(sectionKinds),
      sectionSources: toObject(sectionSources),
      sectionLanguages: toObject(sectionLangs),
      images: { total: imageTotals.get('total') ?? 0, byLicense: toObject(imageLicenses), byHost: toObject(imageHosts), byKind: toObject(imageKinds) },
      rejectionReasons: toObject(rejectionReasons),
      articlesTotal: articles.length,
      heldTotal: held.length,
      heldReasons: toObject(heldReasons),
      rejectedTotal: rejected.length,
    },
  };
}
