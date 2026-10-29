// =============================================================================
// Fuerza de una relación del glosario (TAREA-41 F1.4).
//
// `concept_relationships.strength_score` es DERIVADO: lo recalcula el cargador
// a partir de las evidencias de `concept_relationship_evidence`, nunca la app.
// Este módulo es la única definición de la fórmula; el `UPDATE … FROM` del
// cargador masivo (F1.3) tiene que dar el mismo número que `strengthOf()`.
//
// Reglas de la ficha (§6 F1.4), en orden:
//  - T1 (norma nacional): piso 0,9.
//  - T2 con frecuencia: obligatorio 1,0 · muy frecuente 0,9 · frecuente 0,7 ·
//    ocasional 0,4 · muy raro 0,1 · excluido → NO es relación positiva.
//  - T3 sin frecuencia: 0,3.
//  - T4: min(0,25, f(estadístico)). La co-ocurrencia nunca supera a la
//    evidencia curada.
//  - Se toma el máximo entre evidencias, +0,05 por cada fuente independiente
//    adicional, con techo en 1.
//
// Dos huecos de la ficha, decididos acá y registrados en DECISIONS.md:
//  - T2 SIN frecuencia (p. ej. una ficha técnica CIMA que nombra el efecto
//    adverso sin cuantificarlo) vale `T2_WITHOUT_FREQUENCY` = 0,5: por encima
//    de lo colaborativo (T3) y por debajo de cualquier frecuencia «frecuente».
//  - f(estadístico) para T4: F3.5 fija como medida el *lift* (umbral ≥ 2). Se
//    usa 0,25·(1 − 1/lift): 0 cuando no hay asociación (lift 1), crece con el
//    lift y se acerca a 0,25 sin alcanzarlo.
// =============================================================================

export const EVIDENCE_TIERS = Object.freeze({
  NATIONAL_STANDARD: 'T1',
  CURATED_REFERENCE: 'T2',
  COLLABORATIVE_KNOWLEDGE: 'T3',
  STATISTICAL_LITERATURE: 'T4',
});

/** Los seis grados de frecuencia de HPO (HP:0040280 a HP:0040285). */
export const FREQUENCY_SCORE = Object.freeze({
  OBLIGATORY: 1.0, // HP:0040280
  VERY_FREQUENT: 0.9, // HP:0040281
  FREQUENT: 0.7, // HP:0040282
  OCCASIONAL: 0.4, // HP:0040283
  VERY_RARE: 0.1, // HP:0040284
});
export const EXCLUDED = 'EXCLUDED'; // HP:0040285

export const T1_FLOOR = 0.9;
export const T2_WITHOUT_FREQUENCY = 0.5;
export const T3_SCORE = 0.3;
export const T4_CEILING = 0.25;
export const INDEPENDENT_SOURCE_BONUS = 0.05;

/**
 * Puntaje de UNA evidencia, o `null` si no aporta fuerza positiva.
 *
 * @param {{ tier: string, frequency?: string|null, statistic?: number|null }} evidence
 * @returns {number|null}
 */
export function evidenceScore(evidence) {
  const { tier, frequency = null, statistic = null } = evidence;
  if (frequency === EXCLUDED) return null;
  const byFrequency = frequency == null ? null : FREQUENCY_SCORE[frequency];
  if (frequency != null && byFrequency === undefined) {
    throw new Error(`Frecuencia desconocida: ${frequency}`);
  }
  switch (tier) {
    case EVIDENCE_TIERS.NATIONAL_STANDARD:
      return Math.max(T1_FLOOR, byFrequency ?? 0);
    case EVIDENCE_TIERS.CURATED_REFERENCE:
      return byFrequency ?? T2_WITHOUT_FREQUENCY;
    case EVIDENCE_TIERS.COLLABORATIVE_KNOWLEDGE:
      // La ficha sólo define T3 sin frecuencia; con frecuencia no puede
      // pasar a lo curado, así que tampoco sube.
      return T3_SCORE;
    case EVIDENCE_TIERS.STATISTICAL_LITERATURE:
      return liftScore(statistic);
    default:
      throw new Error(`Nivel de evidencia desconocido: ${tier}`);
  }
}

/** 0,25·(1 − 1/lift), acotado a [0, 0,25). Sin lift o lift ≤ 1: 0. */
export function liftScore(lift) {
  if (typeof lift !== 'number' || !Number.isFinite(lift) || lift <= 1) return 0;
  return Math.min(T4_CEILING, T4_CEILING * (1 - 1 / lift));
}

const TIER_RANK = { T1: 1, T2: 2, T3: 3, T4: 4 };

/**
 * Fuerza agregada de una relación a partir de todas sus evidencias.
 *
 * `excluded` es verdadero cuando alguna evidencia curada (T1/T2) la descarta y
 * ninguna evidencia curada la afirma: en ese caso la UI dice «la descarta» y
 * la relación no suma fuerza, aunque T3/T4 la mencionen.
 *
 * @param {Array<{ tier: string, sourceId: string, frequency?: string|null, statistic?: number|null }>} evidences
 * @returns {{ score: number, evidenceCount: number, bestTier: string|null, frequency: string|null, excluded: boolean }}
 */
export function strengthOf(evidences) {
  const curated = evidences.filter((e) => e.tier === 'T1' || e.tier === 'T2');
  const curatedExcludes = curated.some((e) => e.frequency === EXCLUDED);
  const curatedAffirms = curated.some((e) => e.frequency !== EXCLUDED);
  const excluded = curatedExcludes && !curatedAffirms;

  const positive = excluded
    ? []
    : evidences
        .map((e) => ({ e, score: evidenceScore(e) }))
        .filter((x) => x.score !== null && x.score > 0);

  let score = 0;
  if (positive.length > 0) {
    const max = Math.max(...positive.map((x) => x.score));
    const sources = new Set(positive.map((x) => x.e.sourceId)).size;
    score = Math.min(1, max + INDEPENDENT_SOURCE_BONUS * (sources - 1));
  }

  const bestTier =
    evidences.length === 0
      ? null
      : evidences.map((e) => e.tier).sort((a, b) => TIER_RANK[a] - TIER_RANK[b])[0];

  // La frecuencia que se muestra es la más fuerte entre T1 y T2 (ficha F1.1).
  const frequencies = curated.map((e) => e.frequency).filter((f) => f != null);
  const frequency = excluded
    ? EXCLUDED
    : (frequencies
        .filter((f) => f !== EXCLUDED)
        .sort((a, b) => FREQUENCY_SCORE[b] - FREQUENCY_SCORE[a])[0] ?? null);

  return {
    score: Math.round(score * 1000) / 1000,
    evidenceCount: evidences.length,
    bestTier,
    frequency,
    excluded,
  };
}
