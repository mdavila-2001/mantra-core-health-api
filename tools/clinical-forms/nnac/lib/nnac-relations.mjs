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
import { conceptId } from '../../../terminology-import/lib/glossary-es/load-plan.mjs';

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
});

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
 * @param {Iterable<{conceptId: string, text: string, categoryKey: string|null}>} designations - Las que
 *   no tienen categoría sólo registran el concepto (para la búsqueda por CIE-10).
 */
export function buildDesignationIndex(designations) {
  const byText = new Map();
  const conceptIds = new Set();
  for (const { conceptId: id, text, categoryKey } of designations) {
    conceptIds.add(id);
    const key = normalizeOption(text);
    // Sin categoría del glosario no es un término que el mapa pueda mostrar:
    // no compite como candidato (sí cuenta para encontrar la enfermedad por CIE-10).
    if (!key || !categoryKey) continue;
    const list = byText.get(key) ?? [];
    if (!list.some((c) => c.conceptId === id)) list.push({ conceptId: id, categoryKey: categoryKey ?? null });
    byText.set(key, list);
  }
  return { byText, conceptIds };
}

/**
 * Concepto de una opción, o el motivo por el que no se mapea.
 * Sólo coincidencia exacta; la opción compuesta «Estudio: hallazgo» se mapea al
 * estudio si el texto antes de los dos puntos es exactamente un estudio.
 */
export function resolveOption(index, option, relationType) {
  const allowed = ALLOWED_CATEGORIES[relationType];
  const exact = (index.byText.get(normalizeOption(option)) ?? []).filter((c) => !allowed || allowed.has(c.categoryKey));
  if (exact.length === 1) return { conceptId: exact[0].conceptId, matchedBy: 'exact' };
  if (exact.length > 1) return { reason: 'ambiguous', candidates: exact.map((c) => c.conceptId) };
  const colon = option.indexOf(':');
  if (colon > 0 && (relationType === 'REQUIRED_TEST' || relationType === 'DIAGNOSTIC_CRITERION')) {
    const studies = (index.byText.get(normalizeOption(option.slice(0, colon))) ?? []).filter((c) =>
      STUDY_CATEGORIES.has(c.categoryKey),
    );
    if (studies.length === 1) return { conceptId: studies[0].conceptId, matchedBy: 'study-prefix' };
  }
  return { reason: 'no-match', candidates: [] };
}

/**
 * Filas de evidencia normativa de una ficha y su cola de revisión.
 *
 * @returns {{ rows: object[], unmapped: object[], blocker: string|null, diseaseConceptId: string|null }}
 */
export function nnacRelations(form, index) {
  const edition = editionOf(form);
  if (!edition) return { rows: [], unmapped: [], blocker: 'sin-fecha-de-vigencia', diseaseConceptId: null };
  const disease = icd10CodesOf(form)
    .map(icd10ConceptId)
    .find((id) => index.conceptIds.has(id));
  if (!disease) return { rows: [], unmapped: [], blocker: 'sin-concepto-cie10', diseaseConceptId: null };

  const rows = [];
  const unmapped = [];
  const seen = new Set();
  const push = (type, other, fromDisease, ordinal, option, fieldName) => {
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
    });
  };

  for (const field of form.fields) {
    const relation = NNAC_FIELD_RELATIONS[field.code];
    if (!relation) continue;
    (field.options ?? []).forEach((option, i) => {
      const resolved = resolveOption(index, option, relation.type);
      if (resolved.conceptId) {
        push(relation.type, resolved.conceptId, relation.fromDisease, i + 1, option, field.code);
      } else {
        unmapped.push({ form: form.code, field: field.code, option, reason: resolved.reason, candidates: resolved.candidates });
      }
    });
  }

  if (form.specialty?.display) {
    const specialty = (index.byText.get(normalizeOption(form.specialty.display)) ?? []).filter(
      (c) => c.categoryKey === 'specialty',
    );
    if (specialty.length === 1) push('SPECIALTY', specialty[0].conceptId, true, 1, form.specialty.display, 'specialty');
    else unmapped.push({ form: form.code, field: 'specialty', option: form.specialty.display, reason: specialty.length ? 'ambiguous' : 'no-match', candidates: specialty.map((c) => c.conceptId) });
  }

  return { rows, unmapped, blocker: null, diseaseConceptId: disease };
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
