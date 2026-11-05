// =============================================================================
// Fichas NNAC → relaciones normativas del grafo (TAREA-41 F2.1 y F2.2).
//
// Puro: no lee archivos ni la base. Recibe la ficha ya parseada y un índice
// de conceptos, y devuelve las filas que espera `bulkLoadRelationships`
// (`tools/terminology-import/lib/bulk-copy.mjs`) más la cola de revisión.
//
// Reglas que no se negocian (TAREA-41 §3 y F2.2):
//   - una opción se mapea SOLO por coincidencia exacta normalizada contra una
//     designación del glosario; si no hay una única coincidencia, va a la cola
//     de revisión humana, nunca por similitud;
//   - la cita es la opción literal de la ficha, que a su vez es la viñeta
//     literal de la norma;
//   - el tratamiento no genera relaciones (es texto libre y la regla de las
//     fichas prohíbe convertirlo en opciones o dosis).
// =============================================================================

import { deterministicId, foldForSearch, slugify } from '../../../terminology-import/lib/glossary-es/common.mjs';
import { conceptId, md5uuid } from '../../../terminology-import/lib/glossary-es/load-plan.mjs';

export const NATIONAL_STANDARD = 'NATIONAL_STANDARD';

/** Campo de la ficha → tipo de relación y sentido respecto de la enfermedad. */
export const NNAC_FIELD_RELATIONS = Object.freeze({
  criterios_clinicos: { type: 'DIAGNOSTIC_CRITERION', fromDisease: true },
  examenes_solicitados: { type: 'REQUIRED_TEST', fromDisease: true },
  complicaciones: { type: 'COMPLICATION', fromDisease: true },
  // El factor apunta a la enfermedad (concepts.ts: «RISK_FACTOR: factor → enfermedad»).
  factores_de_riesgo: { type: 'RISK_FACTOR', fromDisease: false },
  criterios_de_referencia: { type: 'REFERRAL_CRITERION', fromDisease: true },
});

/** Tipo de relación → concepto `terminology:relationship:*` (mismos ids que `src/common/constants/concepts.ts`). */
export const RELATION_TYPE_CONCEPT_ID = Object.freeze({
  DIAGNOSTIC_CRITERION: deterministicId('terminology:relationship:diagnostic-criterion'),
  REQUIRED_TEST: deterministicId('terminology:relationship:required-test'),
  COMPLICATION: deterministicId('terminology:relationship:complication'),
  RISK_FACTOR: deterministicId('terminology:relationship:risk-factor'),
  REFERRAL_CRITERION: deterministicId('terminology:relationship:referral-criterion'),
  SPECIALTY: deterministicId('terminology:relationship:specialty'),
  CARE_LEVEL: deterministicId('terminology:relationship:care-level'),
});

/** Opción de `nivel_de_atencion` → código de `VS_CARE_LEVEL`. */
const CARE_LEVEL_CODE = Object.freeze({ 'nivel i': 'FIRST_LEVEL', 'nivel ii': 'SECOND_LEVEL', 'nivel iii': 'THIRD_LEVEL' });

/**
 * Entre homónimos (el mismo nombre en varias fuentes del glosario), qué fuente
 * gana. Decisión del propietario (2026-10-26): elegir el mejor sin borrar los
 * demás; la fusión real es por equivalencia declarada (F3.1), nunca por nombre.
 * Más bajo = mejor; lo que no figura va al final.
 */
const SOURCE_RANK = Object.freeze([
  'glossary-curated-es',
  'cie10es-',
  'wikidata-',
  'medlineplus-es',
  'loinc-es',
  'inlasa-',
  'cima',
]);

export function sourceRank(codeSystem) {
  const i = SOURCE_RANK.findIndex((prefix) => (codeSystem ?? '').startsWith(prefix));
  return i === -1 ? SOURCE_RANK.length : i;
}

/** Para criterios y referencia, qué categoría describe mejor un hallazgo. */
const FINDING_CATEGORY_RANK = Object.freeze(['signs-symptoms', 'lab', 'imaging', 'diagnostic-test', 'anatomy', 'other']);

/** Categorías del glosario que cuentan como «estudio» para las opciones compuestas (F2.2 paso 4). */
const STUDY_CATEGORIES = new Set(['diagnostic-test', 'lab', 'imaging']);

/**
 * Qué puede ser el otro extremo según el tipo: un examen exigido es un estudio
 * y una complicación es una enfermedad. Un homónimo de otra categoría (el
 * «Hemograma completo» catalogado como enfermedad) no es candidato.
 */
const ALLOWED_CATEGORIES = Object.freeze({
  REQUIRED_TEST: new Set([...STUDY_CATEGORIES, 'procedure']),
  COMPLICATION: new Set(['disease']),
});

/**
 * Inicio de vigencia de la edición 2012. La ficha NNAC 2012 no trae resolución
 * ministerial en su `provenance.note`; la fecha es la que fija TAREA-41 F2.1
 * para la edición, no una leída de la norma (ver DECISIONS del carril 41).
 */
export const NNAC_2012_VALID_FROM = '2012-01-01';

/** Concepto de enfermedad de un código CIE-10, con el mismo slug que el importador CIE-10-ES. */
export const icd10ConceptId = (code) => conceptId(`cie10es-dx-${slugify(code)}`);

/** Texto normalizado para comparar: sin tildes, minúsculas, sin puntuación final ni espacios dobles. */
export function normalizeOption(text) {
  return foldForSearch(text)
    .replace(/\s+/g, ' ')
    .replace(/[\s.;:,]+$/u, '')
    .trim();
}

/**
 * Edición, vigencia y ubicación de la cita a partir de `provenance.note`.
 * Devuelve `null` si la nota no permite fecharla (va a BLOCKERS, no se inventa).
 */
export function editionOf(form) {
  const note = form.provenance?.note ?? '';
  const locator = note.split(';')[0].trim();
  const edition = /NNAC (2012|2025)/.exec(note)?.[1];
  if (edition === '2012') return { edition, validFrom: NNAC_2012_VALID_FROM, validTo: null, locator };
  if (edition === '2025') {
    const rm = /RM (\d+), (\d{2})\/(\d{2})\/(\d{4})/.exec(note);
    if (!rm) return null;
    return { edition, resolution: `RM ${rm[1]}`, validFrom: `${rm[4]}-${rm[3]}-${rm[2]}`, validTo: null, locator };
  }
  return null;
}

/** Códigos CIE-10 de la ficha, en el orden de sus opciones, más el de la nota si no estaba. */
export function icd10CodesOf(form) {
  const field = form.fields.find((f) => f.code === 'codigo_cie10');
  const codes = (field?.options ?? []).map((o) => o.split(':')[0].trim()).filter(Boolean);
  const fromNote = /CIE-10 ([A-Z]\d{2}(?:\.\d+)?)/.exec(form.provenance?.note ?? '')?.[1];
  if (fromNote && !codes.includes(fromNote)) codes.push(fromNote);
  return codes;
}

/**
 * Índice de designaciones: texto normalizado → conceptos que lo llevan.
 *
 * @param {Iterable<{conceptId: string, text: string, categoryKey: string|null, codeSystem?: string, relationCount?: number}>} designations
 *   Las que no tienen categoría sólo registran el concepto (para la búsqueda por CIE-10).
 */
export function buildDesignationIndex(designations) {
  const byText = new Map();
  const conceptIds = new Set();
  for (const { conceptId: id, text, categoryKey, codeSystem, relationCount } of designations) {
    conceptIds.add(id);
    const key = normalizeOption(text);
    // Sin categoría del glosario no es un término que el mapa pueda mostrar:
    // no compite como candidato (sí cuenta para encontrar la enfermedad por CIE-10).
    if (!key || !categoryKey) continue;
    const list = byText.get(key) ?? [];
    if (!list.some((c) => c.conceptId === id)) {
      list.push({ conceptId: id, categoryKey, rank: sourceRank(codeSystem), relationCount: relationCount ?? 0 });
    }
    byText.set(key, list);
  }
  return { byText, conceptIds };
}

/**
 * El mejor de varios homónimos: la categoría que mejor describe el campo, la
 * fuente mejor rankeada, el que más relaciones tiene y, para que sea total, el id.
 */
function bestCandidate(candidates, relationType) {
  const findingField = relationType === 'DIAGNOSTIC_CRITERION' || relationType === 'REFERRAL_CRITERION';
  const categoryRank = (c) => {
    if (!findingField) return 0;
    const i = FINDING_CATEGORY_RANK.indexOf(c.categoryKey);
    return i === -1 ? FINDING_CATEGORY_RANK.length : i;
  };
  return [...candidates].sort(
    (a, b) =>
      categoryRank(a) - categoryRank(b) ||
      a.rank - b.rank ||
      b.relationCount - a.relationCount ||
      a.conceptId.localeCompare(b.conceptId),
  )[0];
}

/**
 * Concepto de una opción, o el motivo por el que no se mapea.
 * Sólo coincidencia exacta del nombre. Entre homónimos se elige el mejor
 * (`bestCandidate`) y se informa cuántos había. La opción compuesta
 * «Estudio: hallazgo» de un examen exigido se mapea al estudio; en un criterio
 * no, porque el hallazgo es lo que importa (va como término literal).
 */
export function resolveOption(index, option, relationType) {
  const allowed = ALLOWED_CATEGORIES[relationType];
  const exact = (index.byText.get(normalizeOption(option)) ?? []).filter((c) => !allowed || allowed.has(c.categoryKey));
  if (exact.length === 1) return { conceptId: exact[0].conceptId, matchedBy: 'exact' };
  if (exact.length > 1) {
    return { conceptId: bestCandidate(exact, relationType).conceptId, matchedBy: 'best-of-homonyms', candidates: exact.map((c) => c.conceptId) };
  }
  const colon = option.indexOf(':');
  if (colon > 0 && relationType === 'REQUIRED_TEST') {
    const studies = (index.byText.get(normalizeOption(option.slice(0, colon))) ?? []).filter((c) =>
      STUDY_CATEGORIES.has(c.categoryKey),
    );
    if (studies.length > 0) return { conceptId: bestCandidate(studies, relationType).conceptId, matchedBy: 'study-prefix' };
  }
  return { reason: 'no-match', candidates: [] };
}

/**
 * Término literal de una viñeta de la norma que no tiene un término exacto en
 * el glosario. No se recorta ni se parafrasea: el texto es la viñeta. La misma
 * viñeta en varias fichas es UN término, y por eso une a las enfermedades que
 * la comparten. Id determinista por el texto normalizado.
 */
export function literalFinding(option) {
  const key = normalizeOption(option);
  const id = md5uuid(`mantra:nnac:finding:${key}`);
  return { conceptId: id, code: `nnac-finding-${id.slice(0, 8)}`, display: option.trim() };
}

/**
 * Filas de evidencia normativa de una ficha y su cola de revisión.
 *
 * @param {object} [options]
 * @param {boolean} [options.literalFindings=false] - Crear un término literal
 *   para cada viñeta sin término exacto, en vez de mandarla a revisión.
 * @param {Map<string, string>} [options.careLevelIds] - Código de `VS_CARE_LEVEL` → concepto.
 * @returns {{ rows: object[], unmapped: object[], literals: Map<string, object>, blocker: string|null, diseaseConceptId: string|null }}
 */
export function nnacRelations(form, index, { literalFindings = false, careLevelIds = new Map() } = {}) {
  const edition = editionOf(form);
  const literals = new Map();
  if (!edition) return { rows: [], unmapped: [], literals, blocker: 'sin-fecha-de-vigencia', diseaseConceptId: null };
  const disease = icd10CodesOf(form)
    .map(icd10ConceptId)
    .find((id) => index.conceptIds.has(id));
  if (!disease) return { rows: [], unmapped: [], literals, blocker: 'sin-concepto-cie10', diseaseConceptId: null };

  // Nivel de atención de la ficha. Si es uno solo, califica a los exámenes
  // exigidos; si son varios, la exigencia vale en todos y no se acota.
  const levels = (form.fields.find((f) => f.code === 'nivel_de_atencion')?.options ?? [])
    .map((o) => careLevelIds.get(CARE_LEVEL_CODE[normalizeOption(o)]))
    .filter(Boolean);
  const singleLevel = levels.length === 1 ? levels[0] : undefined;

  const rows = [];
  const unmapped = [];
  const seen = new Set();
  const push = (type, other, fromDisease, ordinal, option, fieldName, matchedBy) => {
    const [source, target] = fromDisease ? [disease, other] : [other, disease];
    const key = `${type}|${source}|${target}`;
    if (source === target || seen.has(key)) return;
    seen.add(key);
    rows.push({
      sourceConceptId: source,
      targetConceptId: target,
      relationshipTypeConceptId: RELATION_TYPE_CONCEPT_ID[type],
      // Sin `ordinal`: es de la relación, no de la evidencia, y dos fichas que
      // comparten código CIE-10 se lo pisarían en cada carga. La posición de la
      // opción en su ficha queda en `sourceReference`.
      evidenceTier: NATIONAL_STANDARD,
      sourceReference: `${form.code}#${fieldName}#${ordinal}`,
      citationText: option,
      citationLocator: `${edition.locator} · ${fieldName}`,
      validFrom: edition.validFrom,
      validTo: edition.validTo,
      ...(type === 'REQUIRED_TEST' && singleLevel ? { careLevelConceptId: singleLevel } : {}),
      matchedBy,
    });
  };

  for (const field of form.fields) {
    const relation = NNAC_FIELD_RELATIONS[field.code];
    if (!relation) continue;
    (field.options ?? []).forEach((option, i) => {
      const resolved = resolveOption(index, option, relation.type);
      if (resolved.conceptId) {
        push(relation.type, resolved.conceptId, relation.fromDisease, i + 1, option, field.code, resolved.matchedBy);
      } else if (literalFindings && normalizeOption(option)) {
        const literal = literalFinding(option);
        if (!literals.has(literal.conceptId)) literals.set(literal.conceptId, literal);
        push(relation.type, literal.conceptId, relation.fromDisease, i + 1, option, field.code, 'literal');
      } else {
        unmapped.push({ form: form.code, field: field.code, option, reason: resolved.reason, candidates: resolved.candidates });
      }
    });
  }

  if (form.specialty?.display) {
    const specialty = (index.byText.get(normalizeOption(form.specialty.display)) ?? []).filter(
      (c) => c.categoryKey === 'specialty',
    );
    if (specialty.length > 0) {
      push('SPECIALTY', bestCandidate(specialty, 'SPECIALTY').conceptId, true, 1, form.specialty.display, 'specialty', 'exact');
    } else unmapped.push({ form: form.code, field: 'specialty', option: form.specialty.display, reason: specialty.length ? 'ambiguous' : 'no-match', candidates: specialty.map((c) => c.conceptId) });
  }

  const levelField = form.fields.find((f) => f.code === 'nivel_de_atencion');
  (levelField?.options ?? []).forEach((option, i) => {
    const level = careLevelIds.get(CARE_LEVEL_CODE[normalizeOption(option)]);
    if (level) push('CARE_LEVEL', level, true, i + 1, option, 'nivel_de_atencion', 'value-set');
  });

  return { rows, unmapped, literals, blocker: null, diseaseConceptId: disease };
}

/** Porcentaje de opciones mapeadas por campo, para la métrica de cierre de F2. */
export function coverageByField(results) {
  const byField = {};
  for (const { rows, unmapped } of results) {
    for (const r of rows) {
      const field = r.sourceReference.split('#')[1];
      (byField[field] ??= { mapped: 0, unmapped: 0 }).mapped++;
    }
    for (const u of unmapped) (byField[u.field] ??= { mapped: 0, unmapped: 0 }).unmapped++;
  }
  for (const v of Object.values(byField)) v.percent = Math.round((1000 * v.mapped) / (v.mapped + v.unmapped)) / 10;
  return byField;
}

/** Una línea CSV con comillas dobles escapadas. */
export function csvLine(values) {
  return values.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
}
