// =============================================================================
// Ensamblado del artículo de UN término (contrato §12.3).
//
// Función pura: recibe la fila de la semilla y las fuentes ya leídas (Wikidata,
// HPO, MeSH, Commons) y devuelve `{ article, rejections }`. Todo lo que no cumple
// el contrato (sección sin procedencia, posible dosis, licencia no permitida,
// identidad que no concuerda…) NO se publica y queda en `rejections` con su
// motivo: nada se descarta en silencio.
// =============================================================================

import { conceptRefOf, wikidataIdOf } from './terms.mjs';
import { allowedKinds, validateFact, validateSection } from './contract.mjs';
import {
  claimFacts,
  claimSections,
  definitionSection,
  describedByReferences,
  imageFiles,
  reverseRelationSections,
  wikidataUrl,
} from './wikidata-sections.mjs';
import { toImage } from './commons.mjs';
import { HPO_LICENSE, hpoTermUrl, labelAgrees } from './hpo.mjs';
import { MESH_ATTRIBUTION, MESH_LICENSE, meshLabelAgrees, meshRecordUrl } from './mesh.mjs';
import { stringValues, labelIn } from './wikidata-api.mjs';
import { MAX_IMAGES_PER_ARTICLE } from './wikidata-properties.mjs';

/** Fuentes que S4 NO toma: texto propio del proyecto sin procedencia externa verificable. */
const NO_EXTERNAL_SOURCE = new Set(['alovida-curated']);

/**
 * INLASA publica el listado «de carácter informativo» con «© 2026 INLASA» y SIN
 * ninguna licencia de reutilización (leído el 2026-10-08). Por la regla de la
 * ficha §12.5.2 («lo que no se pudo verificar queda NO VERIFICADO y no se carga»)
 * sus artículos salen a `held.ndjson`, no a `articles.ndjson`, hasta que el
 * propietario decida.
 */
export const HOLD_UNVERIFIED_LICENSE_INLASA = 'licencia-no-verificada:inlasa';

const SECTION_ORDER = [
  'definition', 'overview', 'location', 'structure', 'function', 'blood_supply', 'innervation',
  'related_structures', 'clinical_relevance', 'associated_conditions', 'purpose', 'scope',
  'subspecialties', 'conditions_treated',
];

const rejection = (row, level, reason, detail = null) => ({ level, conceptRef: conceptRefOf(row), reason, ...(detail ? { detail } : {}) });

function orderSections(sections) {
  const rank = (k) => (SECTION_ORDER.includes(k) ? SECTION_ORDER.indexOf(k) : SECTION_ORDER.length);
  return sections.map((s, i) => [s, i]).sort((a, b) => rank(a[0].kind) - rank(b[0].kind) || a[1] - b[1]).map(([s]) => s);
}

/** Secciones de texto de HPO y MeSH para un ítem de Wikidata, con control de identidad. */
function terminologySections({ row, qid, entity, hpo, mesh, retrievedAt, rejections }) {
  const sections = [];
  // Etiqueta inglesa del ítem y sus alias ingleses: la equivalencia la declara Wikidata, esto solo la confirma.
  const labelEn = [labelIn(entity, 'en'), ...(entity.aliases?.en ?? []).map((a) => a.value)].filter(Boolean);

  if (row.categoryKey === 'signs-symptoms' && hpo) {
    for (const hpId of stringValues(entity, 'P3841')) {
      const term = hpo.terms.get(hpId);
      if (!term?.definition || term.deprecated) continue;
      if (!labelAgrees(labelEn, term)) {
        rejections.push(rejection(row, 'section', 'hpo-etiqueta-no-concuerda', { hpId, wikidataEn: labelEn[0] ?? null, hpoLabel: term.label }));
        continue;
      }
      sections.push({
        kind: 'definition',
        text: term.definition,
        lang: 'en',
        source: 'hpo',
        sourceUrl: hpoTermUrl(hpId),
        license: HPO_LICENSE,
        retrievedAt,
        sourceVersion: `HPO ${hpo.version}`,
        locator: `${hpId} «${term.label}» — definición (Human Phenotype Ontology; Wikidata P3841 declara la equivalencia)`,
      });
    }
  }

  if (mesh) {
    for (const descriptorId of stringValues(entity, 'P486')) {
      const descriptor = mesh.get(descriptorId);
      if (!descriptor?.scopeNote) continue;
      if (!meshLabelAgrees(labelEn, descriptor)) {
        rejections.push(rejection(row, 'section', 'mesh-etiqueta-no-concuerda', { descriptorId, wikidataEn: labelEn[0] ?? null, meshLabel: descriptor.label }));
        continue;
      }
      sections.push({
        kind: 'definition',
        text: descriptor.scopeNote,
        lang: 'en',
        source: 'nlm-mesh',
        sourceUrl: meshRecordUrl(descriptorId),
        license: MESH_LICENSE,
        retrievedAt,
        sourceVersion: `MeSH, descriptor actualizado ${descriptor.lastUpdated ?? 'sin fecha'}; consulta ${retrievedAt}`,
        locator: `Descriptor ${descriptorId} «${descriptor.label}» — nota de alcance. ${MESH_ATTRIBUTION}`,
      });
    }
  }
  return sections;
}

/** Definición de MedlinePlus ya presente en la fila CIE-10 por «mismo concepto» según Wikidata. */
function sameConceptMedlineplusSection(row, retrievedAt) {
  if (row.definitionKind !== 'same-concept-medlineplus' || !row.definition || !row.definitionSource?.url) return null;
  return {
    kind: 'definition',
    text: row.definition,
    lang: 'es',
    source: 'nlm-medlineplus-es',
    sourceUrl: row.definitionSource.url,
    license: 'Dominio público (NLM); citar «Source: MedlinePlus, National Library of Medicine»',
    retrievedAt,
    sourceVersion: `MedlinePlus en español, consulta ${String(row.definitionSource.retrievedAt ?? retrievedAt).slice(0, 10)}`,
    locator: row.definitionSource.name,
  };
}

/** Hechos y secciones de INLASA (aranceles): SOLO código y nombre oficial (+ área). Nunca el precio. */
function inlasaParts(row, retrievedAt) {
  const base = { source: 'INLASA — Listado de Servicios y Aranceles 2026', sourceUrl: row.sourceUrl };
  const facts = [{ label: 'Código INLASA', value: row.code, ...base }];
  if (row.officialName) facts.push({ label: 'Nombre oficial (INLASA)', value: row.officialName, ...base });
  const area = row.hierarchy?.[0]?.display;
  if (area) facts.push({ label: 'Área o laboratorio (INLASA)', value: area, ...base });
  return {
    facts,
    references: [{ title: 'Listado de Servicios y Aranceles del INLASA 2026', url: row.sourceUrl, source: 'INLASA (Ministerio de Salud y Deportes de Bolivia)' }],
    retrievedAt,
  };
}

/**
 * @param {object} row   fila de la semilla
 * @param {object} ctx   { entities: Map, labels: Map, props: Map, hpo, mesh, commons: Map, retrievedAt }
 * @returns {{ article: object|null, rejections: object[] }}
 */
export function assembleArticle(row, ctx) {
  const { retrievedAt } = ctx;
  const rejections = [];

  if (NO_EXTERNAL_SOURCE.has(row.source)) {
    return { article: null, rejections: [rejection(row, 'article', 'sin-fuente-externa', 'Texto curado del proyecto: sin URL, versión ni licencia de origen verificable; decisión del propietario')] };
  }

  let sections = [];
  let facts = [];
  // Hechos de identidad del propio término (su código CIE-10-ES): acompañan a un
  // artículo con contenido, pero por sí solos no justifican publicar uno.
  const identityFacts = [];
  let references = [];
  const images = [];
  // Motivo por el que un artículo VÁLIDO no entra a `articles.ndjson` todavía.
  let hold = null;

  if (row.codeSystem === 'inlasa-aranceles-2026') {
    hold = HOLD_UNVERIFIED_LICENSE_INLASA;
    const parts = inlasaParts(row, retrievedAt);
    facts = parts.facts;
    references = parts.references;
  } else {
    const qid = wikidataIdOf(row);
    const entity = qid ? ctx.entities.get(qid) : null;

    if (row.codeSystem.startsWith('cie10es-diagnosticos')) {
      identityFacts.push({ label: 'Código CIE-10-ES', value: row.code, source: row.sourceName, sourceUrl: row.sourceUrl });
    }
    const medlineplus = sameConceptMedlineplusSection(row, retrievedAt);
    if (medlineplus) sections.push(medlineplus);

    if (qid && !entity) {
      rejections.push(rejection(row, 'article', 'wikidata-sin-entidad', qid));
    } else if (entity) {
      const def = definitionSection(qid, entity, retrievedAt);
      if (def) sections.push(def);
      sections.push(...terminologySections({ row, qid, entity, hpo: ctx.hpo, mesh: ctx.mesh, retrievedAt, rejections }));
      sections.push(...claimSections({ qid, entity, categoryKey: row.categoryKey, labels: ctx.labels, props: ctx.props, retrievedAt }));
      sections.push(...reverseRelationSections({ qid, row, categoryKey: row.categoryKey, props: ctx.props, retrievedAt }));
      facts.push(...claimFacts({ qid, entity, categoryKey: row.categoryKey, labels: ctx.labels, props: ctx.props }));
      references.push(...describedByReferences({ qid, entity, labels: ctx.labels }));
      references.push({ title: `Wikidata ${qid}`, url: wikidataUrl(qid), source: 'wikidata' });

      for (const { file, impliedKind } of imageFiles(entity)) {
        if (images.length >= MAX_IMAGES_PER_ARTICLE) break;
        const result = toImage(ctx.commons.get(file), { termName: row.esName, impliedKind, retrievedAt });
        if (result.image) {
          if (!images.some((i) => i.url === result.image.url)) images.push(result.image);
        } else {
          rejections.push(rejection(row, 'image', result.rejected, file));
        }
      }
    }
  }

  const valid = [];
  for (const section of sections) {
    const problems = validateSection(section, row.categoryKey);
    if (problems.length > 0) rejections.push(rejection(row, 'section', problems.join(','), { kind: section.kind, locator: section.locator }));
    else valid.push(section);
  }
  const validFacts = facts.filter((fact) => {
    const problems = validateFact(fact);
    if (problems.length > 0) rejections.push(rejection(row, 'fact', problems.join(','), fact.label));
    return problems.length === 0;
  });

  const substantive = valid.length > 0 || images.length > 0 || validFacts.length > 0;
  if (substantive) validFacts.unshift(...identityFacts.filter((fact) => validateFact(fact).length === 0));
  if (!substantive) {
    rejections.push(rejection(row, 'article', 'sin-contenido-con-fuente', 'Ninguna fuente abierta aportó texto, hechos ni imágenes para este término'));
    return { article: null, rejections };
  }

  return {
    hold,
    article: {
      conceptRef: conceptRefOf(row),
      lang: 'es',
      sections: orderSections(valid),
      images,
      facts: validFacts,
      references,
    },
    rejections,
  };
}

export { allowedKinds };
