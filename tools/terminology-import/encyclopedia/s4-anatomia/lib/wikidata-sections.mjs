// =============================================================================
// Wikidata (CC0) → secciones, hechos (`facts`) y referencias de un artículo.
//
// NADA se redacta: el texto de una sección es (a) la descripción de la fuente
// copiada tal cual, o (b) «etiqueta de la propiedad: nombres de los ítems»,
// con las etiquetas de Wikidata. Un ítem sin etiqueta en castellano se muestra
// con su etiqueta inglesa y la sección pasa a `lang: "en"` (la pantalla la marca
// «sin traducción oficial»). No hay traducción automática.
// =============================================================================

import { descriptionIn, itemValues, labelIn, stringValues } from './wikidata-api.mjs';
import {
  CLAIM_FACTS,
  CLAIM_SECTIONS,
  IDENTIFIER_FACTS,
  IMAGE_PROPERTIES,
  MAX_ITEMS_PER_SECTION,
  REVERSE_RELATION_SECTIONS,
} from './wikidata-properties.mjs';

export const WIKIDATA_LICENSE = 'CC0 1.0 (Wikidata, dominio público)';
export const wikidataUrl = (qid, anchor = '') => `https://www.wikidata.org/wiki/${qid}${anchor}`;

/** Versión citable de un ítem: número de revisión y fecha de modificación. */
export function entityVersion(entity) {
  const revision = entity?.lastrevid;
  const modified = typeof entity?.modified === 'string' ? entity.modified.slice(0, 10) : null;
  if (!revision) return null;
  return modified ? `revisión ${revision} (${modified})` : `revisión ${revision}`;
}

function provenance(qid, entity, retrievedAt, locator, anchor = '') {
  return {
    source: 'wikidata',
    sourceUrl: wikidataUrl(qid, anchor),
    license: WIKIDATA_LICENSE,
    retrievedAt,
    sourceVersion: entityVersion(entity) ?? `consulta ${retrievedAt}`,
    locator,
  };
}

/** Quita caracteres de ancho cero y espacios sobrantes que Wikidata deja en algunos textos (no cambia ninguna palabra). */
export function cleanText(text) {
  return typeof text === 'string' ? text.replace(/[\u200b-\u200d\u2060\ufeff]/g, '').replace(/\s+/g, ' ').trim() : text;
}

const upperFirst = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Nombre de un ítem: castellano si existe; si no, inglés (y se anota). */
export function nameOf(labels, id) {
  const l = labels.get(id);
  if (cleanText(l?.es)) return { text: cleanText(l.es), es: true };
  if (cleanText(l?.en)) return { text: cleanText(l.en), es: false };
  return null;
}

/** Definición: descripción en castellano de Wikidata; si falta, la inglesa (`lang: "en"`). */
export function definitionSection(qid, entity, retrievedAt) {
  const es = cleanText(descriptionIn(entity, 'es'));
  if (es) return { kind: 'definition', text: es, lang: 'es', ...provenance(qid, entity, retrievedAt, 'Descripción del ítem (es)') };
  const en = cleanText(descriptionIn(entity, 'en'));
  if (en) return { kind: 'definition', text: en, lang: 'en', ...provenance(qid, entity, retrievedAt, 'Descripción del ítem (en)') };
  return null;
}

/** Lista de nombres de ítems → `{ names, allSpanish, droppedCount }` (tope `MAX_ITEMS_PER_SECTION`). */
function namedItems(ids, labels) {
  const resolved = ids.map((id) => nameOf(labels, id)).filter(Boolean);
  const unique = [];
  for (const r of resolved) if (!unique.some((u) => u.text === r.text)) unique.push(r);
  const shown = unique.slice(0, MAX_ITEMS_PER_SECTION);
  return {
    names: shown.map((r) => r.text),
    allSpanish: shown.every((r) => r.es),
    total: unique.length,
    unlabeled: ids.length - resolved.length,
  };
}

function propertyTitle(props, property) {
  const p = props.get(property);
  return p?.es ? { text: p.es, es: true } : { text: p?.en ?? property, es: false };
}

/** Secciones por afirmaciones de ítem (partes, irrigación, inervación…). */
export function claimSections({ qid, entity, categoryKey, labels, props, retrievedAt }) {
  const sections = [];
  for (const { property, kind } of CLAIM_SECTIONS[categoryKey] ?? []) {
    const ids = itemValues(entity, property);
    if (ids.length === 0) continue;
    const { names, allSpanish, total } = namedItems(ids, labels);
    if (names.length === 0) continue;
    const title = propertyTitle(props, property);
    const truncated = total > names.length ? `; se muestran ${names.length} de ${total}` : '';
    sections.push({
      kind,
      text: `${upperFirst(title.text)}: ${names.join('; ')}`,
      items: names,
      lang: allSpanish && title.es ? 'es' : 'en',
      ...provenance(qid, entity, retrievedAt, `Wikidata ${property} «${props.get(property)?.en ?? property}»${truncated}`, `#${property}`),
    });
  }
  return sections;
}

/** Relaciones inversas de la semilla (enfermedad → este término) como lista de enfermedades. */
export function reverseRelationSections({ qid, row, categoryKey, props, retrievedAt }) {
  const sections = [];
  const relations = row.relations ?? [];
  for (const { property, relationType, kind } of REVERSE_RELATION_SECTIONS[categoryKey] ?? []) {
    const names = [];
    for (const rel of relations) {
      if (rel.type !== relationType) continue;
      const m = String(rel.provenance ?? '').match(/^wikidata:(P\d+) Q\d+→Q\d+/);
      if (m?.[1] !== property || !rel.targetName) continue;
      if (!names.includes(rel.targetName)) names.push(rel.targetName);
    }
    if (names.length === 0) continue;
    names.sort((a, b) => a.localeCompare(b, 'es'));
    const shown = names.slice(0, MAX_ITEMS_PER_SECTION);
    const truncated = names.length > shown.length ? `; se muestran ${shown.length} de ${names.length}` : '';
    const title = propertyTitle(props, property);
    sections.push({
      kind,
      text: `Según Wikidata, enfermedades cuya «${title.text}» es este término: ${shown.join('; ')}`,
      items: shown,
      lang: title.es ? 'es' : 'en',
      source: 'wikidata',
      sourceUrl: `https://www.wikidata.org/wiki/Special:WhatLinksHere/${qid}`,
      license: WIKIDATA_LICENSE,
      retrievedAt,
      sourceVersion: `consulta ${String(row.sourceRetrievedAt ?? retrievedAt).slice(0, 10)}`,
      locator: `Wikidata ${property} «${props.get(property)?.en ?? property}» (la enfermedad declara la propiedad hacia este ítem)${truncated}`,
    });
  }
  return sections;
}

/** Hechos estructurados: afirmaciones de ítem (con etiqueta) e identificadores abiertos. */
export function claimFacts({ qid, entity, categoryKey, labels, props }) {
  const facts = [];
  for (const property of CLAIM_FACTS[categoryKey] ?? []) {
    const ids = itemValues(entity, property);
    if (ids.length === 0) continue;
    const { names } = namedItems(ids, labels);
    if (names.length === 0) continue;
    facts.push({ label: upperFirst(propertyTitle(props, property).text), value: names.join('; '), source: 'wikidata', sourceUrl: wikidataUrl(qid, `#${property}`) });
  }
  for (const { property, label } of IDENTIFIER_FACTS) {
    const values = stringValues(entity, property);
    if (values.length === 0) continue;
    facts.push({ label, value: values.join('; '), source: 'wikidata', sourceUrl: wikidataUrl(qid, `#${property}`) });
  }
  return facts;
}

/** Obras que describen el ítem (P1343) → referencias bibliográficas con enlace a su ítem de Wikidata. */
export function describedByReferences({ qid, entity, labels }) {
  const refs = [];
  for (const id of itemValues(entity, 'P1343')) {
    const name = nameOf(labels, id);
    if (name) refs.push({ title: name.text, url: wikidataUrl(id), source: 'wikidata (P1343 «descrito por»)' });
  }
  return refs;
}

/** Archivos de Commons declarados por el ítem, con la propiedad que los declara. */
export function imageFiles(entity) {
  const found = [];
  for (const { property, max, impliedKind } of IMAGE_PROPERTIES) {
    const statements = (entity?.claims?.[property] ?? []).filter((s) => s.rank !== 'deprecated' && s.mainsnak?.snaktype === 'value');
    statements.sort((a, b) => (a.rank === 'preferred' ? 0 : 1) - (b.rank === 'preferred' ? 0 : 1));
    for (const s of statements.slice(0, max)) {
      const file = s.mainsnak.datavalue?.value;
      if (typeof file === 'string' && !found.some((f) => f.file === file)) found.push({ file, property, impliedKind });
    }
  }
  return found;
}

export { labelIn };
