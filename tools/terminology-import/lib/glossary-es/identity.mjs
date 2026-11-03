// =============================================================================
// Identidad de enfermedades del glosario (TAREA-41 F3.1). Puro: sin red ni base.
//
// MONDO es el pivote. Cada clase MONDO forma un GRUPO con los códigos que la
// propia fuente declara equivalentes: `skos:exactMatch` del SSSOM de Mondo y
// las equivalencias lógicas (`xref … {source="MONDO:equivalentTo"}` de
// mondo.obo, ya extraídas por la sesión de síntomas a
// `symptoms/data/disease-equivalences.ndjson`). Nunca por etiqueta.
//
// Concepto de cada grupo, en este orden:
//  1. Si un código CIE-10 del grupo (ICD-10-CM o CIE-10 OMS, misma codificación
//     que la CIE-10-ES del glosario) es una ficha del glosario, se REUSA el id
//     de esa ficha (`conceptId('cie10es-dx-<slug>')`). No se crean dos conceptos.
//  2. Si no, el concepto es la clase MONDO que ya carga el catálogo de
//     enfermedades (#688, `diseases/lib/code-systems.mjs`): tampoco se inventa
//     un id nuevo.
//
// Conflictos (van a revisión, NO se resuelven acá):
//  - un código declarado equivalente a dos o más clases MONDO: el código no
//    resuelve a ningún grupo;
//  - un grupo cuyos códigos CIE-10 caen en dos fichas distintas del glosario,
//    o una ficha del glosario reclamada por dos grupos: esos grupos quedan sin
//    concepto hasta que una persona decida.
// =============================================================================

import { foldForSearch, slugify } from './common.mjs';
import { conceptId as glossaryConceptId } from './load-plan.mjs';
import { conceptId as diseaseCatalogConceptId } from '../../diseases/lib/code-systems.mjs';

/**
 * Prefijos que se aceptan como equivalencia (ficha §F3.1: OMIM, ORPHA, DOID,
 * MeSH, CIE-10 y UMLS; DECIPHER se suma porque `phenotype.hpoa` lo usa como
 * id de enfermedad). Las grafías de cada fuente → forma canónica.
 */
export const IDENTITY_PREFIXES = Object.freeze({
  OMIM: 'OMIM',
  ORPHA: 'ORPHA',
  Orphanet: 'ORPHA',
  ORPHANET: 'ORPHA',
  DOID: 'DOID',
  MESH: 'MESH',
  mesh: 'MESH',
  ICD10CM: 'ICD10CM',
  ICD10WHO: 'ICD10WHO',
  UMLS: 'UMLS',
  DECIPHER: 'DECIPHER',
});

/** Prefijos CIE-10 cuyo código se busca como ficha CIE-10-ES del glosario. */
export const ICD10_PREFIXES = Object.freeze(['ICD10CM', 'ICD10WHO']);

export const GROUP_STATUS = Object.freeze({ CREATED: 'created', REUSED: 'reused', REVIEW: 'review' });

/** `Orphanet:58` → `ORPHA:58`; prefijo fuera de la lista → `null`. */
export function normalizeCurie(curie) {
  const text = String(curie ?? '').trim();
  const i = text.indexOf(':');
  if (i <= 0) return null;
  const prefix = IDENTITY_PREFIXES[text.slice(0, i)];
  const local = text.slice(i + 1).trim();
  if (!prefix || !local) return null;
  return `${prefix}:${prefix.startsWith('ICD10') ? local.toUpperCase() : local}`;
}

const isMondo = (curie) => /^MONDO:\d{7}$/.test(curie);

/**
 * SSSOM de Mondo → equivalencias `{ mondo, curie, via }`. Sólo `skos:exactMatch`
 * con sujeto MONDO: `broadMatch` no es identidad.
 */
export function parseMondoSssom(text) {
  const out = [];
  let cols = null;
  for (const line of String(text).split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const f = line.split('\t');
    if (!cols) {
      cols = Object.fromEntries(f.map((name, i) => [name, i]));
      for (const c of ['subject_id', 'predicate_id', 'object_id']) {
        if (!(c in cols)) throw new Error(`SSSOM de Mondo sin columna ${c}`);
      }
      continue;
    }
    if (f[cols.predicate_id] !== 'skos:exactMatch') continue;
    const mondo = f[cols.subject_id];
    if (!isMondo(mondo)) continue;
    out.push({ mondo, curie: f[cols.object_id], via: 'skos:exactMatch' });
  }
  return out;
}

const addTo = (map, key, value) => {
  const set = map.get(key) ?? new Set();
  set.add(value);
  map.set(key, set);
};

/**
 * Agrupa por MONDO y decide el concepto de cada grupo.
 *
 * @param {Iterable<{ mondo: string, curie: string }>} equivalences - Declaradas por la fuente.
 * @param {{ glossaryIcd10Codes?: Set<string> }} [options] - Códigos CIE-10-ES con ficha en el glosario.
 * @returns {{ groups: Map<string, { mondo: string, codes: string[], conceptId: string|null, status: string, glossaryCodes: string[] }>,
 *            resolve: (curie: string) => { conceptId: string|null, mondo: string|null, reason: string|null },
 *            report: object }}
 */
export function buildIdentity(equivalences, { glossaryIcd10Codes = new Set() } = {}) {
  const codesByMondo = new Map();
  const mondosByCode = new Map();
  let ignored = 0;
  for (const e of equivalences) {
    const curie = normalizeCurie(e.curie);
    if (!isMondo(e.mondo) || !curie) {
      ignored += 1;
      continue;
    }
    addTo(codesByMondo, e.mondo, curie);
    addTo(mondosByCode, curie, e.mondo);
  }

  const conflicts = [];
  const conflictingCodes = new Set();
  for (const [code, mondos] of mondosByCode) {
    if (mondos.size < 2) continue;
    conflictingCodes.add(code);
    conflicts.push({ kind: 'code-in-several-groups', code, mondos: [...mondos].sort() });
  }

  const groups = new Map();
  const glossaryClaims = new Map();
  for (const mondo of [...codesByMondo.keys()].sort()) {
    const codes = [...codesByMondo.get(mondo)].filter((c) => !conflictingCodes.has(c)).sort();
    const glossaryCodes = [
      ...new Set(
        codes
          .filter((c) => ICD10_PREFIXES.includes(c.slice(0, c.indexOf(':'))))
          .map((c) => c.slice(c.indexOf(':') + 1))
          .filter((code) => glossaryIcd10Codes.has(code)),
      ),
    ].sort();
    const group = { mondo, codes, glossaryCodes, conceptId: null, status: GROUP_STATUS.CREATED };
    if (glossaryCodes.length > 1) {
      group.status = GROUP_STATUS.REVIEW;
      conflicts.push({ kind: 'group-spans-several-glossary-concepts', mondo, glossaryCodes });
    } else if (glossaryCodes.length === 1) {
      group.status = GROUP_STATUS.REUSED;
      group.conceptId = glossaryConceptId(`cie10es-dx-${slugify(glossaryCodes[0])}`);
      addTo(glossaryClaims, glossaryCodes[0], mondo);
    } else {
      group.conceptId = diseaseCatalogConceptId('mondo', mondo);
    }
    groups.set(mondo, group);
  }

  for (const [glossaryCode, mondos] of glossaryClaims) {
    if (mondos.size < 2) continue;
    conflicts.push({ kind: 'glossary-concept-in-several-groups', glossaryCode, mondos: [...mondos].sort() });
    for (const mondo of mondos) {
      const group = groups.get(mondo);
      group.status = GROUP_STATUS.REVIEW;
      group.conceptId = null;
    }
  }

  const groupOfCode = new Map();
  for (const group of groups.values()) for (const code of group.codes) groupOfCode.set(code, group);

  const resolve = (rawCurie) => {
    if (isMondo(rawCurie)) {
      const group = groups.get(rawCurie);
      if (!group) return { conceptId: null, mondo: null, reason: 'mondo-without-equivalences' };
      return { conceptId: group.conceptId, mondo: rawCurie, reason: group.conceptId ? null : 'group-in-review' };
    }
    const curie = normalizeCurie(rawCurie);
    if (!curie) return { conceptId: null, mondo: null, reason: 'prefix-not-accepted' };
    if (conflictingCodes.has(curie)) return { conceptId: null, mondo: null, reason: 'code-in-several-groups' };
    const group = groupOfCode.get(curie);
    if (!group) return { conceptId: null, mondo: null, reason: 'no-mondo-group' };
    return { conceptId: group.conceptId, mondo: group.mondo, reason: group.conceptId ? null : 'group-in-review' };
  };

  const count = (status) => [...groups.values()].filter((g) => g.status === status).length;
  const report = {
    groups: groups.size,
    created: count(GROUP_STATUS.CREATED),
    reused: count(GROUP_STATUS.REUSED),
    inReview: count(GROUP_STATUS.REVIEW),
    codesMapped: groupOfCode.size,
    equivalencesIgnored: ignored,
    conflicts,
  };
  return { groups, resolve, report };
}

/**
 * Tasa de duplicados por etiqueta: conceptos DISTINTOS que comparten la misma
 * etiqueta normalizada (minúsculas, sin tildes). Se informa en total y la
 * parte en que los conceptos además están en categorías distintas.
 *
 * @param {Iterable<{ conceptId: string, label: string, category: string|null }>} entries
 */
export function duplicateLabelRate(entries, { examples = 10 } = {}) {
  const byLabel = new Map();
  const concepts = new Set();
  for (const e of entries) {
    if (!e.label) continue;
    concepts.add(e.conceptId);
    const key = foldForSearch(e.label).trim().replace(/\s+/g, ' ');
    const slot = byLabel.get(key) ?? new Map();
    slot.set(e.conceptId, e.category ?? null);
    byLabel.set(key, slot);
  }
  let duplicates = 0;
  let acrossCategories = 0;
  const sample = [];
  for (const [label, members] of byLabel) {
    if (members.size < 2) continue;
    duplicates += members.size - 1;
    const categories = new Set(members.values());
    if (categories.size > 1) acrossCategories += members.size - 1;
    if (sample.length < examples) sample.push({ label, concepts: members.size, categories: [...categories].sort() });
  }
  const total = concepts.size;
  const rate = (n) => (total === 0 ? 0 : n / total);
  return {
    totalConcepts: total,
    duplicateConcepts: duplicates,
    duplicateRate: rate(duplicates),
    acrossCategoryDuplicates: acrossCategories,
    acrossCategoryRate: rate(acrossCategories),
    examples: sample,
  };
}
