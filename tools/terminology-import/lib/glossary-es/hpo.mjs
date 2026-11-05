// =============================================================================
// HPO → relaciones enfermedad → fenotipo con evidencia (TAREA-41 F3.2). Puro.
//
// Entrada: las filas de `phenotype.hpoa` que ya parsea `symptoms/lib/
// annotations.mjs` (`parseHpoa`, PR #686). Salida: filas de
// `lib/bulk-copy.mjs` → `bulkLoadRelationships`, tipo SYMPTOM, sentido
// enfermedad → fenotipo. Nada se deduce; reglas:
//
//  - Sólo aspecto P (anomalía fenotípica). C (curso/inicio), I (herencia),
//    M (modificador) y H (historia) no son síntomas.
//  - Nivel: T2 `CURATED_REFERENCE` cuando la anotación cita un PMID (lo curó
//    una persona contra una publicación). Sin PMID la referencia es el propio
//    registro OMIM/ORPHA/DECIPHER —en su mayoría con evidencia IEA, extraída
//    de la sinopsis clínica sin revisión— y queda T3 `COLLABORATIVE_KNOWLEDGE`:
//    no hay publicación primaria detrás que la sostenga como referencia curada.
//  - Frecuencia: el término HP (HP:0040280–HP:0040285) tal cual; `n/m` y `p%`
//    se llevan a esos mismos grados con los rangos que DEFINE cada término
//    (hp.obo). Numerador/denominador SÓLO si la fuente da `n/m`. Sin
//    frecuencia en la fuente, la fila no lleva frecuencia.
//  - `NOT` (la fuente afirma que el fenotipo NO está): frecuencia `EXCLUDED`
//    (HP:0040285 «Present in 0% of the cases»). Con eso `strengthOf()` la
//    muestra como «la descarta» y no suma fuerza.
//  - Inicio → `age_min_days`/`age_max_days` sólo con los rangos que define el
//    término HPO de inicio (`ONSET_AGE_DAYS`); los prenatales y los que no
//    dan edad (puerperal, menopausia) quedan sin rango.
//  - Sexo: el id del concepto lo resuelve quien carga (`sexConceptIds`); acá no
//    se inventa ninguno. Si no se resuelve, se cuenta y el sexo sigue escrito
//    en `source_reference`.
//  - Las anotaciones con id `ORPHA:` se saltan por defecto: son el volcado de
//    Orphanet dentro de HPO y Orphanet entra directo en F3.3. Cargarlas dos
//    veces sumaría +0,05 de «fuente independiente» que no lo es.
//
// `source_reference`: el cargador deduplica la evidencia por (relación,
// fuente, source_reference) con DISTINCT ON. Dos líneas con el mismo PMID para
// la misma enfermedad y fenotipo, pero distinto sexo, inicio, modificador o
// negación, colapsarían en una. Por eso la referencia lleva el registro de
// enfermedad y los calificadores de población: `PMID:1 @OMIM:2 [onset=…; sex=…]`.
// Si aún choca (misma población, distinta frecuencia o evidencia), se agrega
// `frequency=`/`evidence=` a las filas del choque y se cuenta.
// =============================================================================

import { parseFrequency } from '../../symptoms/lib/annotations.mjs';
import { conceptId as symptomsConceptId } from '../../symptoms/lib/load-plan.mjs';
import { RELATION_TYPE } from './load-plan.mjs';

export const HPO_PHENOTYPE_ASPECT = 'P';
export const TIER_WITH_PMID = 'CURATED_REFERENCE';
export const TIER_WITHOUT_PMID = 'COLLABORATIVE_KNOWLEDGE';
export const ORPHANET_DATABASE = 'ORPHA';

/** Términos de frecuencia de HPO → código de `VS_RELATIONSHIP_FREQUENCY`. */
export const HPO_FREQUENCY_TERMS = Object.freeze({
  'HP:0040280': 'OBLIGATE', // Always present, i.e. in 100% of the cases.
  'HP:0040281': 'VERY_FREQUENT', // Present in 80% to 99% of the cases.
  'HP:0040282': 'FREQUENT', // Present in 30% to 79% of the cases.
  'HP:0040283': 'OCCASIONAL', // Present in 5% to 29% of the cases.
  'HP:0040284': 'VERY_RARE', // Present in 1% to 4% of the cases.
  'HP:0040285': 'EXCLUDED', // Present in 0% of the cases.
});

/**
 * Porcentaje → grado, con los límites inferiores de las definiciones de arriba.
 * Un valor entre dos rangos enteros (p. ej. 79,5 %) cae en el grado de abajo;
 * entre 0 y 1 % HPO no define grado y no se asigna ninguno.
 */
export function frequencyFromPercent(percent) {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) return null;
  if (percent === 100) return 'OBLIGATE';
  if (percent >= 80) return 'VERY_FREQUENT';
  if (percent >= 30) return 'FREQUENT';
  if (percent >= 5) return 'OCCASIONAL';
  if (percent >= 1) return 'VERY_RARE';
  if (percent === 0) return 'EXCLUDED';
  return null;
}

/**
 * La columna `frequency` de HPOA → `{ frequency, numerator, denominator, problem }`.
 * @param {string|null} raw
 */
export function normalizeHpoFrequency(raw) {
  const parsed = parseFrequency(raw);
  const none = { frequency: null, numerator: null, denominator: null, problem: null };
  if (!parsed) return none;
  if (parsed.kind === 'hpo-term') {
    const frequency = HPO_FREQUENCY_TERMS[parsed.hpo] ?? null;
    return { ...none, frequency, problem: frequency ? null : 'unknown-frequency-term' };
  }
  if (parsed.kind === 'ratio') {
    const { numerator, denominator } = parsed;
    if (denominator === 0 || numerator > denominator) return { ...none, problem: 'invalid-ratio' };
    return { frequency: frequencyFromPercent((numerator / denominator) * 100), numerator, denominator, problem: null };
  }
  if (parsed.kind === 'percent') {
    const frequency = frequencyFromPercent(parsed.percent);
    return { ...none, frequency, problem: frequency ? null : 'percent-without-grade' };
  }
  return { ...none, problem: 'unparsed-frequency' };
}

const DAYS_PER_YEAR = 365.25;
const years = (n) => Math.round(n * DAYS_PER_YEAR);

/**
 * Rango de edad por término de inicio, SÓLO donde la definición de hp.obo
 * (release 2026-09-01) da números. Días inclusivos; «antes de N años» = N años
 * menos un día; año = 365,25 días. `null` = sin límite por ese lado.
 */
export const ONSET_AGE_DAYS = Object.freeze({
  'HP:0003577': { min: 0, max: 0 }, // Congenital: "present at birth".
  'HP:0003623': { min: 0, max: 28 }, // Neonatal: "within the first 28 days of life".
  'HP:0003593': { min: 28, max: years(1) }, // Infantile: "between 28 days to one year of life".
  'HP:0011463': { min: years(1), max: years(5) }, // Childhood: "between 1 and 5 years".
  'HP:0003621': { min: years(5), max: years(15) }, // Juvenile: "between the age of 5 and 15 years".
  'HP:0410280': { min: 28, max: years(16) - 1 }, // Pediatric: "before the age of 16 years, but excluding neonatal or congenital".
  'HP:0003581': { min: years(16), max: null }, // Adult: "at the age of 16 years or later".
  'HP:0011462': { min: years(16), max: years(40) }, // Young adult: "between 16 and 40 years".
  'HP:0025708': { min: years(16), max: years(19) - 1 }, // Early young adult: ">= 16 to under 19 years".
  'HP:0025709': { min: years(19), max: years(25) - 1 }, // Intermediate young adult: ">= 19 to under 25 years".
  'HP:0025710': { min: years(25), max: years(40) - 1 }, // Late young adult: ">= 25 to under 40 years".
  'HP:0003596': { min: years(40), max: years(60) }, // Middle age: "at the age of 40 to 60 years".
  'HP:0003584': { min: years(60), max: null }, // Late: "after the age of 60 years".
});

/** `{ ageMinDays, ageMaxDays }` del término de inicio; ambos `null` si HPO no da edad. */
export function onsetAgeRange(onsetTerm) {
  const range = onsetTerm ? ONSET_AGE_DAYS[onsetTerm] : undefined;
  return { ageMinDays: range?.min ?? null, ageMaxDays: range?.max ?? null, known: Boolean(range) };
}

/** T2 si alguna referencia es un PMID; si no, T3 (ver cabecera). */
export function evidenceTierFor(references) {
  return references.some((r) => /^PMID:\d+$/.test(r)) ? TIER_WITH_PMID : TIER_WITHOUT_PMID;
}

/** Concepto del fenotipo: el mismo id con que `symptoms/load-symptoms.mjs` carga HPO. */
export const hpoPhenotypeConceptId = (hpoId) => symptomsConceptId('hpo', hpoId);

const populationQualifiers = (r) =>
  [
    r.negated ? 'not' : null,
    r.onset ? `onset=${r.onset}` : null,
    r.sex ? `sex=${r.sex.toUpperCase()}` : null,
    r.modifiers?.length ? `modifier=${[...r.modifiers].sort().join(',')}` : null,
  ].filter(Boolean);

const referenceOf = (r, extra = []) => {
  const refs = r.references.length > 0 ? r.references.join(',') : r.disease.curie;
  const qualifiers = [...populationQualifiers(r), ...extra];
  return `${refs} @${r.disease.curie}${qualifiers.length ? ` [${qualifiers.join('; ')}]` : ''}`;
};

const payloadOf = (row) =>
  JSON.stringify([row.evidenceTier, row.frequency, row.frequencyNumerator, row.frequencyDenominator, row.sexConceptId, row.ageMinDays, row.ageMaxDays]);

/**
 * Filas HPOA (de `parseHpoa`) → filas de `bulkLoadRelationships`.
 *
 * @param {Iterable<object>} hpoaRows
 * @param {object} options
 * @param {(curie: string) => { conceptId: string|null, reason?: string|null }} options.resolveDisease - p. ej. `buildIdentity(...).resolve`.
 * @param {string} options.validFrom - Fecha de la release de HPOA (`#version`), `YYYY-MM-DD`.
 * @param {(hpoId: string) => string|null} [options.resolvePhenotype] - Por defecto, el id de `symptoms`.
 * @param {Map<string, string>} [options.sexConceptIds] - `MALE`/`FEMALE` → concepto de sexo.
 * @param {string[]} [options.skipDatabases] - Prefijos de enfermedad que no se cargan desde HPO.
 */
export function hpoaToRelationshipRows(hpoaRows, options) {
  const {
    resolveDisease,
    validFrom,
    resolvePhenotype = hpoPhenotypeConceptId,
    sexConceptIds = new Map(),
    skipDatabases = [ORPHANET_DATABASE],
  } = options;
  if (!validFrom) throw new Error('hpoaToRelationshipRows: falta validFrom (fecha de la release de HPOA).');

  const stats = {
    read: 0, notPhenotypeAspect: 0, skippedDatabase: 0, diseaseUnresolved: 0, phenotypeUnresolved: 0,
    negated: 0, withFrequency: 0, withRatio: 0, frequencyProblems: {}, onsetWithRange: 0, onsetWithoutRange: 0,
    sexResolved: 0, sexUnresolved: 0, tierT2: 0, tierT3: 0, referenceCollisions: 0, exactDuplicates: 0, rows: 0,
  };
  const unresolvedDiseases = {};
  const prepared = [];

  for (const r of hpoaRows) {
    stats.read += 1;
    if (r.aspect !== HPO_PHENOTYPE_ASPECT) {
      stats.notPhenotypeAspect += 1;
      continue;
    }
    if (skipDatabases.includes(r.disease.prefix)) {
      stats.skippedDatabase += 1;
      continue;
    }
    const disease = resolveDisease(r.disease.curie);
    if (!disease?.conceptId) {
      stats.diseaseUnresolved += 1;
      const reason = disease?.reason ?? 'unresolved';
      unresolvedDiseases[reason] = (unresolvedDiseases[reason] ?? 0) + 1;
      continue;
    }
    const phenotypeConceptId = resolvePhenotype(r.phenotype);
    if (!phenotypeConceptId) {
      stats.phenotypeUnresolved += 1;
      continue;
    }

    const freq = normalizeHpoFrequency(r.frequency?.raw ?? null);
    if (freq.problem) stats.frequencyProblems[freq.problem] = (stats.frequencyProblems[freq.problem] ?? 0) + 1;
    const frequency = r.negated ? 'EXCLUDED' : freq.frequency;
    if (r.negated) stats.negated += 1;
    if (frequency) stats.withFrequency += 1;
    if (freq.numerator !== null) stats.withRatio += 1;

    const age = onsetAgeRange(r.onset);
    if (r.onset) stats[age.known ? 'onsetWithRange' : 'onsetWithoutRange'] += 1;

    const sexCode = r.sex ? r.sex.toUpperCase() : null;
    const sexConceptId = sexCode ? (sexConceptIds.get(sexCode) ?? null) : null;
    if (sexCode) stats[sexConceptId ? 'sexResolved' : 'sexUnresolved'] += 1;

    const evidenceTier = evidenceTierFor(r.references);
    stats[evidenceTier === TIER_WITH_PMID ? 'tierT2' : 'tierT3'] += 1;

    prepared.push({
      source: r,
      row: {
        sourceConceptId: disease.conceptId,
        targetConceptId: phenotypeConceptId,
        relationshipTypeConceptId: RELATION_TYPE.SYMPTOM,
        evidenceTier,
        sourceReference: referenceOf(r),
        validFrom,
        frequency,
        frequencyNumerator: freq.numerator,
        frequencyDenominator: freq.denominator,
        sexConceptId,
        sexCode,
        ageMinDays: age.ageMinDays,
        ageMaxDays: age.ageMaxDays,
      },
    });
  }

  // Choques de la clave natural de evidencia que la población no separa.
  const byKey = new Map();
  for (const p of prepared) {
    const key = `${p.row.sourceConceptId}|${p.row.targetConceptId}|${p.row.sourceReference}`;
    const list = byKey.get(key) ?? [];
    list.push(p);
    byKey.set(key, list);
  }
  const rows = [];
  for (const list of byKey.values()) {
    const distinct = new Map(list.map((p) => [payloadOf(p.row), p]));
    stats.exactDuplicates += list.length - distinct.size;
    if (distinct.size === 1) {
      rows.push(list[0].row);
      continue;
    }
    stats.referenceCollisions += distinct.size;
    for (const p of distinct.values()) {
      const extra = [`frequency=${p.source.frequency?.raw ?? 'none'}`, `evidence=${p.source.evidence ?? 'none'}`];
      rows.push({ ...p.row, sourceReference: referenceOf(p.source, extra) });
    }
  }
  stats.rows = rows.length;
  return { rows, stats, unresolvedDiseases };
}

/**
 * `hp-es.babelon.tsv` → Map HP → etiqueta en castellano, SÓLO `rdfs:label` con
 * `translation_status` = `OFFICIAL` (el único estado aprobado del archivo).
 */
export function parseBabelonOfficialLabels(text) {
  const labels = new Map();
  let cols = null;
  for (const line of String(text).split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const f = line.split('\t');
    if (!cols) {
      cols = Object.fromEntries(f.map((name, i) => [name.trim(), i]));
      for (const c of ['subject_id', 'predicate_id', 'translation_value', 'translation_status', 'translation_language']) {
        if (!(c in cols)) throw new Error(`hp-es.babelon sin columna ${c}`);
      }
      continue;
    }
    if (f[cols.predicate_id] !== 'rdfs:label') continue;
    if (f[cols.translation_status]?.trim() !== 'OFFICIAL') continue;
    if (f[cols.translation_language]?.trim() !== 'es') continue;
    const value = f[cols.translation_value]?.trim();
    if (value) labels.set(f[cols.subject_id].trim(), value);
  }
  return labels;
}
