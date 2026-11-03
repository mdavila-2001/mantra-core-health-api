// =============================================================================
// MRCOC (NLM MEDLINE Co-Occurrences) → relaciones enfermedad → síntoma T4
// (TAREA-41 F3.5). Puro: no toca red ni base.
//
// Entrada: el TSV filtrado que deja `mrcoc/fetch-mrcoc.mjs` (pares MeSH
// síntoma × enfermedad con el nº de artículos de MEDLINE en que coocurren),
// las frecuencias por encabezado (`MH_freq_counts_2024`) y el cruce MeSH ↔ HPO
// de Wikidata (P486 ↔ P3841).
//
// Medida: *lift* = coocurrencias observadas / esperadas por azar, con
//   esperadas = N(enfermedad) · N(síntoma) / N(citas de MEDLINE).
// Umbrales (F3.5): coocurrencia ≥ `MIN_ARTICLES` (20) y lift ≥ `MIN_LIFT` (3). El lift
// se guarda en `statistic_value` y `strength.mjs` lo convierte en fuerza T4
// (0,25·(1 − 1/lift), techo 0,25: la literatura nunca supera a una norma).
//
// Reglas:
//  - Dirección y tipo: enfermedad → síntoma, SYMPTOM, nivel T4
//    `STATISTICAL_LITERATURE`, sin frecuencia (la coocurrencia no es
//    prevalencia) y sin `ordinal`.
//  - Sólo se carga lo que se puede identificar: la enfermedad con la identidad
//    MONDO de F3.1 (`MESH:<dui>`); el síntoma, sólo si Wikidata declara su HPO.
//    Nada se adivina por nombre.
//  - Varios descriptores MeSH que caen en el mismo par de conceptos se suman
//    (observadas y esperadas) antes de calcular el lift.
//  - Una sola `source_reference` por par: `mrcoc-2024 articles=<n>`.
// =============================================================================

import { RELATION_TYPE } from './load-plan.mjs';
import { hpoPhenotypeConceptId } from './hpo.mjs';

export const MRCOC_TIER = 'STATISTICAL_LITERATURE';
export const MIN_ARTICLES = 20;
/**
 * La ficha propone empezar en 2 y ajustar mirando 50 pares. Con 2 la muestra trae
 * ruido (hirsutismo × carcinoma, obesidad × hiperhomocisteinemia); desde 3 se lee
 * coherente. Pasar de 2 a 3 quita 1 447 de 12 472 filas (evidencia/F3.5).
 */
export const MIN_LIFT = 3;
/** Citas indexadas en MEDLINE (el mismo denominador que usa el AI Service). */
export const MEDLINE_CITATIONS = 36_555_430;
export const MRCOC_SOURCE_TAG = 'mrcoc-2024';
const LIFT_DECIMALS = 4;

const tsvRows = (text, minColumns) =>
  String(text)
    .split('\n')
    .slice(1)
    .filter(Boolean)
    .map((line) => line.split('\t'))
    .filter((cols) => cols.length >= minColumns);

/** `MH_freq_counts_2024` (`DUI|CUI|Total|…`, ya descomprimido) → Map dui → total. */
export function parseMeshFrequencies(text) {
  const out = new Map();
  for (const line of String(text).trim().split('\n').slice(1)) {
    const [dui, , total] = line.split('|');
    const n = Number(total);
    if (dui && Number.isFinite(n)) out.set(dui, n);
  }
  return out;
}

/** TSV del filtro de MRCOC → `{ symptom, disease, articles }[]`. */
export function parseMrcocPairs(text) {
  return tsvRows(text, 3).map(([symptom, disease, articles]) => ({ symptom, disease, articles: Number(articles) }));
}

/** TSV de Wikidata (`mesh`, `hpo`) → Map dui → HP[] (en orden, sin repetidos). */
export function parseMeshHpoCrosswalk(text) {
  const out = new Map();
  for (const [mesh, hpo] of tsvRows(text, 2)) {
    if (!/^D\d+$/.test(mesh)) continue;
    const id = /^HP:\d{7}$/.test(hpo) ? hpo : /^\d{7}$/.test(hpo) ? `HP:${hpo}` : null;
    if (!id) continue;
    const list = out.get(mesh) ?? [];
    if (!list.includes(id)) list.push(id);
    out.set(mesh, list);
  }
  return out;
}

/** Lift observado/esperado; `null` si falta una frecuencia. */
export function liftOf({ articles, diseaseTotal, symptomTotal, citations = MEDLINE_CITATIONS }) {
  if (!(diseaseTotal > 0) || !(symptomTotal > 0) || !(articles >= 0)) return null;
  return articles / ((diseaseTotal * symptomTotal) / citations);
}

/**
 * Pares MRCOC → filas de `bulkLoadRelationships`.
 *
 * @param {{ symptom: string, disease: string, articles: number }[]} pairs
 * @param {object} options
 * @param {Map<string, number>} options.meshFrequency
 * @param {Map<string, string[]>} options.meshToHpo
 * @param {(curie: string) => { conceptId: string|null, reason?: string|null }} options.resolveDisease
 * @param {string} options.validFrom - `YYYY-MM-DD` de la release (MRCOC 2024).
 * @param {(hpoId: string) => string|null} [options.resolvePhenotype]
 * @param {number} [options.minArticles]
 * @param {number} [options.minLift]
 */
export function mrcocToRelationshipRows(pairs, options) {
  const {
    meshFrequency, meshToHpo, resolveDisease, validFrom,
    resolvePhenotype = hpoPhenotypeConceptId, minArticles = MIN_ARTICLES, minLift = MIN_LIFT,
  } = options;
  if (!validFrom) throw new Error('mrcocToRelationshipRows: falta validFrom (fecha de la release).');

  const stats = {
    read: 0, belowMinArticles: 0, missingFrequency: 0, belowMinLift: 0, symptomWithoutHpo: 0,
    phenotypeUnresolved: 0, diseaseUnresolved: 0, conceptPairs: 0, rows: 0,
  };
  const unresolvedDiseases = {};
  const grouped = new Map();

  for (const p of pairs) {
    stats.read += 1;
    if (!(p.articles >= minArticles)) {
      stats.belowMinArticles += 1;
      continue;
    }
    const diseaseTotal = meshFrequency.get(p.disease);
    const symptomTotal = meshFrequency.get(p.symptom);
    const lift = liftOf({ articles: p.articles, diseaseTotal, symptomTotal });
    if (lift === null) {
      stats.missingFrequency += 1;
      continue;
    }
    if (lift < minLift) {
      stats.belowMinLift += 1;
      continue;
    }
    const hpoIds = meshToHpo.get(p.symptom);
    if (!hpoIds?.length) {
      stats.symptomWithoutHpo += 1;
      continue;
    }
    const disease = resolveDisease(`MESH:${p.disease}`);
    if (!disease?.conceptId) {
      stats.diseaseUnresolved += 1;
      const reason = disease?.reason ?? 'unresolved';
      unresolvedDiseases[reason] = (unresolvedDiseases[reason] ?? 0) + 1;
      continue;
    }
    for (const hpo of hpoIds) {
      const target = resolvePhenotype(hpo);
      if (!target) {
        stats.phenotypeUnresolved += 1;
        continue;
      }
      const key = `${disease.conceptId}|${target}`;
      const cell = grouped.get(key) ?? { source: disease.conceptId, target, articles: 0, expected: 0, mesh: [] };
      cell.articles += p.articles;
      cell.expected += (diseaseTotal * symptomTotal) / MEDLINE_CITATIONS;
      cell.mesh.push(`${p.symptom}x${p.disease}`);
      grouped.set(key, cell);
    }
  }
  stats.conceptPairs = grouped.size;

  const rows = [];
  for (const cell of grouped.values()) {
    const lift = cell.articles / cell.expected;
    if (lift < minLift) continue;
    rows.push({
      sourceConceptId: cell.source,
      targetConceptId: cell.target,
      relationshipTypeConceptId: RELATION_TYPE.SYMPTOM,
      evidenceTier: MRCOC_TIER,
      sourceReference: `${MRCOC_SOURCE_TAG} articles=${cell.articles}`,
      validFrom,
      statisticValue: Number(lift.toFixed(LIFT_DECIMALS)),
      // No es columna de carga: sólo para rotular la muestra de revisión humana.
      meshPairs: cell.mesh,
    });
  }
  stats.rows = rows.length;
  return { rows, stats, unresolvedDiseases };
}
