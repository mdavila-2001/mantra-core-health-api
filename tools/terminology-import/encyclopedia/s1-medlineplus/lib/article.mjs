// =============================================================================
// Ensamblado del artículo (TAREA-41 §12.3) de un término de MedlinePlus.
//
// Nada de lo que sale de acá lo escribe esta canalización: el texto de cada
// sección es el de la fuente (cortado por sus propios encabezados), con su
// cita. Lo que no se puede publicar con garantías NO se arregla ni se resume:
// se devuelve en `rejected` con el motivo, y el artículo sale sin esa sección.
// =============================================================================

import { adamCheck, doseCheck } from './guards.mjs';
import { KINDS_BY_FAMILY, familyOf, kindForHeading } from './kinds.mjs';
import { bulletItems, splitSections, squashedText, stripTrailingAttribution } from './sections.mjs';

export const TOPIC_SOURCE = 'nlm-medlineplus-es';
export const LAB_SOURCE = 'nlm-medlineplus-es-pruebas';
export const LICENSE_LABEL = 'Dominio público (NLM)';
export const LEAD_LOCATOR = 'Introducción';

const dateOnly = (iso) => String(iso ?? '').slice(0, 10) || null;

/** Referencia estable al término del glosario (código del sistema + slug existente). */
export function conceptRefOf(seedRow) {
  return { system: seedRow.codeSystem, code: seedRow.code, slug: seedRow.slug };
}

function rejection(scope, seedRow, reason, extra = {}) {
  return {
    scope,
    conceptRef: seedRow ? conceptRefOf(seedRow) : null,
    reason,
    ...extra,
  };
}

function sectionBase({ source, sourceUrl, retrievedAt, sourceVersion }) {
  return { lang: 'es', source, sourceUrl, license: LICENSE_LABEL, retrievedAt, sourceVersion };
}

/**
 * Toma bloques ya cortados (heading/text/flags) y devuelve secciones del contrato
 * más los rechazos por sección. `leadAs` decide qué es el texto previo al primer
 * título: `definition` si el resumen no tiene títulos o ninguno es «¿Qué es…?».
 */
export function mapBlocksToSections({ blocks, family, seedRow, base }) {
  const allowed = KINDS_BY_FAMILY[family];
  const sections = [];
  const rejected = [];
  const hasHeadings = blocks.some((b) => b.heading);
  const headingKinds = blocks.map((b) => (b.heading ? kindForHeading(family, b.heading) : null));
  const hasDefinitionHeading = headingKinds.some((k) => k?.kind === 'definition');

  blocks.forEach((block, i) => {
    const isLead = !block.heading;
    const locator = isLead ? LEAD_LOCATOR : block.heading;
    const mapped = isLead
      ? { kind: !hasHeadings || !hasDefinitionHeading ? 'definition' : 'overview', rule: 'lead' }
      : headingKinds[i];
    const where = { locator, heading: block.heading ?? null, sourceUrl: base.sourceUrl };
    if (!mapped) {
      rejected.push(rejection('section', seedRow, 'unmapped-heading', { ...where, detail: `Encabezado sin regla en la familia «${family}»` }));
      return;
    }
    if (!allowed.includes(mapped.kind)) {
      rejected.push(rejection('section', seedRow, 'kind-not-in-category-catalog', { ...where, kind: mapped.kind }));
      return;
    }
    if (!block.text) return;
    for (const flag of block.flags ?? []) {
      rejected.push(rejection('section', seedRow, flag, { ...where, kind: mapped.kind }));
      return;
    }
    const adam = adamCheck(`${block.heading ?? ''}\n${block.text}`);
    if (!adam.ok) {
      rejected.push(rejection('section', seedRow, 'adam-content-detected', { ...where, kind: mapped.kind, detail: adam.match }));
      return;
    }
    const dose = doseCheck(`${block.heading ?? ''}\n${block.text}`);
    if (!dose.ok) {
      rejected.push(rejection('section', seedRow, 'dose-or-posology', { ...where, kind: mapped.kind, detail: `${dose.pattern}: «${dose.match}»` }));
      return;
    }
    if (sections.some((s) => s.kind === mapped.kind)) {
      rejected.push(rejection('section', seedRow, 'duplicate-kind', { ...where, kind: mapped.kind }));
      return;
    }
    const items = bulletItems(block.text);
    sections.push({
      kind: mapped.kind,
      text: block.text,
      ...(items.length ? { items } : {}),
      ...base,
      locator,
    });
  });

  const order = (s) => allowed.indexOf(s.kind);
  sections.sort((a, b) => order(a) - order(b));
  return { sections, rejected };
}

/** Hechos y referencias comunes a todo artículo de MedlinePlus. */
function factsAndReferences({ seedRow, pageUrl, source, extraFacts = [], references = [] }) {
  const facts = [
    { label: 'Identificador de MedlinePlus (español)', value: String(seedRow.code), source, sourceUrl: pageUrl },
    ...extraFacts,
  ];
  return {
    facts,
    references: [{ title: `MedlinePlus: ${seedRow.esName}`, url: pageUrl, source }, ...references],
  };
}

/**
 * Artículo de un tema de salud (XML de la NLM + página verificada).
 * @param {object} input
 * @param {object} input.seedRow       fila del glosario (conceptRef, categoría)
 * @param {object} input.corpusRow     fila de `medlineplus-es.ndjson`
 * @param {object} input.topic         tema parseado del XML (fullSummaryHtml, mapped, mesh)
 * @param {object|null} input.page     resultado de `parseTopicPage` (null = página no verificada)
 * @param {{ retrievedAt: string, xmlVersion: string }} input.snapshot
 */
export function buildTopicArticle({ seedRow, corpusRow, topic, page, snapshot }) {
  const pageUrl = corpusRow.sourceUrl;
  if (!page) return { article: null, rejected: [rejection('article', seedRow, 'page-not-verified', { sourceUrl: pageUrl })] };
  if (page.adamInPage || page.adamInSummary) {
    return { article: null, rejected: [rejection('article', seedRow, 'adam-content-detected', { sourceUrl: pageUrl, detail: 'La página nombra a A.D.A.M.' })] };
  }

  const { html, attribution } = stripTrailingAttribution(topic.fullSummaryHtml, page.attributions);
  if (page.summarySquashed != null && squashedText(html) !== page.summarySquashed) {
    return { article: null, rejected: [rejection('article', seedRow, 'source-text-differs-from-live-page', { sourceUrl: pageUrl, detail: 'El resumen del XML del 2026-09-30 no es idéntico al de la página actual' })] };
  }

  const sourceVersion = page.lastUpdatedIso ?? snapshot.xmlVersion;
  const base = sectionBase({ source: TOPIC_SOURCE, sourceUrl: pageUrl, retrievedAt: dateOnly(snapshot.retrievedAt), sourceVersion });
  const family = familyOf(seedRow.categoryKey);
  const { sections, rejected } = mapBlocksToSections({ blocks: splitSections(html), family, seedRow, base });
  if (!sections.length) {
    return { article: null, rejected: [...rejected, rejection('article', seedRow, 'no-publishable-sections', { sourceUrl: pageUrl })] };
  }

  const extraFacts = [];
  const english = topic.mapped;
  if (english?.title) extraFacts.push({ label: 'Nombre en inglés (MedlinePlus)', value: english.title, source: TOPIC_SOURCE, sourceUrl: english.url ?? pageUrl });
  for (const m of topic.mesh ?? []) {
    extraFacts.push({ label: 'Descriptor MeSH', value: `${m.id} (${m.name})`, source: TOPIC_SOURCE, sourceUrl: english?.url ?? pageUrl });
  }
  for (const g of topic.groups ?? []) {
    extraFacts.push({ label: 'Grupo temático de MedlinePlus', value: g.name, source: TOPIC_SOURCE, sourceUrl: g.url ?? pageUrl });
  }
  if (corpusRow.esSynonyms?.length) extraFacts.push({ label: 'Otros nombres', value: corpusRow.esSynonyms.join(', '), source: TOPIC_SOURCE, sourceUrl: pageUrl });
  if (attribution) extraFacts.push({ label: 'Organismo que redactó el resumen', value: attribution, source: TOPIC_SOURCE, sourceUrl: pageUrl });
  if (page.lastUpdated) extraFacts.push({ label: 'Última actualización de la página', value: page.lastUpdated, source: TOPIC_SOURCE, sourceUrl: pageUrl });

  const references = english?.url ? [{ title: `MedlinePlus (inglés): ${english.title}`, url: english.url, source: TOPIC_SOURCE }] : [];
  const { facts, references: refs } = factsAndReferences({ seedRow, pageUrl, source: TOPIC_SOURCE, extraFacts, references });
  return {
    article: { conceptRef: conceptRefOf(seedRow), lang: 'es', sections, images: [], facts, references: refs },
    rejected,
  };
}

/** «Otros nombres: a, b» viene dentro del texto de la primera sección de una guía: se saca del texto y se conserva como dato. */
function splitOtherNames(text) {
  const m = String(text ?? '').match(/(?:^|\n)\s*Otros nombres:\s*([^\n]+)/);
  if (!m) return { text, otherNames: null };
  const cleaned = String(text).replace(m[0], '').replace(/\n{3,}/g, '\n\n').trim();
  return { text: cleaned, otherNames: m[1].trim() };
}

/**
 * Artículo de una guía de pruebas médicas (página de MedlinePlus ya cacheada).
 * @param {{ seedRow: object, corpusRow: object, pageHtml: string|null, snapshot: { retrievedAt: string }, updatedIso: string|null }} input
 */
export function buildLabArticle({ seedRow, corpusRow, pageHtml, updatedIso, snapshot }) {
  const pageUrl = corpusRow.sourceUrl;
  if (pageHtml == null) return { article: null, rejected: [rejection('article', seedRow, 'page-not-verified', { sourceUrl: pageUrl })] };
  if (!adamCheck(pageHtml).ok) {
    return { article: null, rejected: [rejection('article', seedRow, 'adam-content-detected', { sourceUrl: pageUrl, detail: 'La página nombra a A.D.A.M.' })] };
  }
  const squashedPage = squashedText(pageHtml);
  const base = sectionBase({ source: LAB_SOURCE, sourceUrl: pageUrl, retrievedAt: dateOnly(corpusRow.sourceRetrievedAt ?? snapshot.retrievedAt), sourceVersion: updatedIso ?? dateOnly(corpusRow.sourceRetrievedAt) });
  let otherNames = null;
  const blocks = [];
  for (const s of corpusRow.sections ?? []) {
    const { text, otherNames: names } = splitOtherNames(s.text);
    otherNames ??= names;
    const flags = [];
    if (text && !squashedPage.includes(squashedText(text.replace(/•/g, '')))) flags.push('text-not-found-in-live-page');
    blocks.push({ heading: s.title, text, flags });
  }
  const family = familyOf(seedRow.categoryKey);
  const { sections, rejected } = mapBlocksToSections({ blocks, family, seedRow, base });
  if (!sections.length) {
    return { article: null, rejected: [...rejected, rejection('article', seedRow, 'no-publishable-sections', { sourceUrl: pageUrl })] };
  }
  const extraFacts = [];
  if (otherNames) extraFacts.push({ label: 'Otros nombres', value: otherNames, source: LAB_SOURCE, sourceUrl: pageUrl });
  if (corpusRow.sourceUpdatedAt) extraFacts.push({ label: 'Última actualización de la página', value: corpusRow.sourceUpdatedAt, source: LAB_SOURCE, sourceUrl: pageUrl });
  const { facts, references } = factsAndReferences({ seedRow, pageUrl, source: LAB_SOURCE, extraFacts });
  return {
    article: { conceptRef: conceptRefOf(seedRow), lang: 'es', sections, images: [], facts, references },
    rejected,
  };
}
