// =============================================================================
// Orphanet product4 → relaciones enfermedad → fenotipo con evidencia
// (TAREA-41 F3.3). Puro: no toca red ni base.
//
// Entrada: `en_product4.xml` de Orphadata (CC BY 4.0, curado por expertos de
// Orphanet). Salida: filas de `lib/bulk-copy.mjs` → `bulkLoadRelationships`,
// tipo SYMPTOM, sentido enfermedad → fenotipo (el mismo que HPO, F3.2).
//
//  - Nivel: T2 `CURATED_REFERENCE`. Orphanet es un registro curado por
//    expertos con una publicación o un consenso detrás de cada asociación.
//  - Frecuencia: la etiqueta del archivo, con sus seis grados fijos →
//    `VS_RELATIONSHIP_FREQUENCY`. «Excluded (0%)» → `EXCLUDED`. Una etiqueta
//    que no está en la tabla NO se adivina: se cuenta y la fila queda sin
//    frecuencia. Orphanet no da numerador ni denominador.
//  - Identidad: la enfermedad (`ORPHA:<código>`) se resuelve con la misma
//    identidad MONDO de F3.1 (`resolveDisease`); sin grupo, no se carga.
//  - Fenotipo: el mismo concepto `symptoms` que usa HPO (`hpoPhenotypeConceptId`),
//    para que una asociación presente en las dos fuentes sume evidencia sobre
//    UNA arista. Las anotaciones `ORPHA:` de HPOA se saltan en `hpo.mjs`
//    justamente para no contar dos veces lo mismo: esta es su única entrada.
//  - `source_reference`: `ORPHA:<código> @orphadata-product4 #<id de la
//    asociación>`. El id de la asociación es único en el archivo, así la
//    deduplicación por (relación, fuente, referencia) no colapsa dos
//    asociaciones distintas.
// =============================================================================

import { RELATION_TYPE } from './load-plan.mjs';
import { hpoPhenotypeConceptId } from './hpo.mjs';

export const ORPHANET_TIER = 'CURATED_REFERENCE';
export const ORPHANET_SOURCE_TAG = 'orphadata-product4';

/** Etiqueta inglesa de frecuencia de Orphanet → código de `VS_RELATIONSHIP_FREQUENCY`. */
export const ORPHANET_FREQUENCY_LABELS = Object.freeze({
  'Obligate (100%)': 'OBLIGATE',
  'Very frequent (99-80%)': 'VERY_FREQUENT',
  'Frequent (79-30%)': 'FREQUENT',
  'Occasional (29-5%)': 'OCCASIONAL',
  'Very rare (<4-1%)': 'VERY_RARE',
  'Excluded (0%)': 'EXCLUDED',
});

const XML_ENTITIES = { '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&apos;': "'" };
const decodeXml = (text) => text.replace(/&(?:lt|gt|amp|quot|apos);/g, (m) => XML_ENTITIES[m]);

export function orphanetFrequency(label) {
  if (label === null || label === undefined) return null;
  return ORPHANET_FREQUENCY_LABELS[decodeXml(label).trim()] ?? null;
}

/** Fecha de la release (`<JDBOR date="…">`), sólo `YYYY-MM-DD`. */
export function parseOrphanetReleaseDate(xml) {
  const date = String(xml).slice(0, 2000).match(/<JDBOR date="(\d{4}-\d{2}-\d{2})/)?.[1];
  if (!date) throw new Error('Orphanet product4 sin <JDBOR date="…">: no se puede fijar valid_from.');
  return date;
}

/**
 * XML de product4 → asociaciones planas.
 * @returns {{ orphaCode: string, curie: string, disorderName: string|null, hpo: string,
 *   frequencyLabel: string|null, associationId: string }[]}
 */
export function parseOrphanetProduct4(xml) {
  const out = [];
  for (const block of String(xml).split('<Disorder id="').slice(1)) {
    const orphaCode = block.match(/^\d+">\s*<OrphaCode>(\d+)<\/OrphaCode>/)?.[1];
    if (!orphaCode) continue;
    const disorderName = block.match(/<Name lang="en">([^<]+)<\/Name>/)?.[1] ?? null;
    for (const assoc of block.split('<HPODisorderAssociation ').slice(1)) {
      const associationId = assoc.match(/^id="(\d+)"/)?.[1];
      const hpo = assoc.match(/<HPOId>(HP:\d{7})<\/HPOId>/)?.[1];
      if (!associationId || !hpo) continue;
      const frequencyLabel = assoc.match(/<HPOFrequency id="\d+">\s*<Name lang="en">([^<]*)<\/Name>/)?.[1] ?? null;
      out.push({
        orphaCode,
        curie: `ORPHA:${orphaCode}`,
        disorderName: disorderName ? decodeXml(disorderName) : null,
        hpo,
        frequencyLabel: frequencyLabel ? decodeXml(frequencyLabel).trim() : null,
        associationId,
      });
    }
  }
  return out;
}

/**
 * Asociaciones → filas de `bulkLoadRelationships`.
 *
 * @param {Iterable<object>} associations - Salida de `parseOrphanetProduct4`.
 * @param {object} options
 * @param {(curie: string) => { conceptId: string|null, reason?: string|null }} options.resolveDisease
 * @param {string} options.validFrom - `YYYY-MM-DD` de la release.
 * @param {(hpoId: string) => string|null} [options.resolvePhenotype]
 */
export function orphanetToRelationshipRows(associations, options) {
  const { resolveDisease, validFrom, resolvePhenotype = hpoPhenotypeConceptId } = options;
  if (!validFrom) throw new Error('orphanetToRelationshipRows: falta validFrom (fecha de la release).');

  const stats = {
    read: 0, diseaseUnresolved: 0, phenotypeUnresolved: 0, withFrequency: 0,
    excluded: 0, unknownFrequencyLabels: {}, rows: 0,
  };
  const unresolvedDiseases = {};
  const rows = [];

  for (const a of associations) {
    stats.read += 1;
    const disease = resolveDisease(a.curie);
    if (!disease?.conceptId) {
      stats.diseaseUnresolved += 1;
      const reason = disease?.reason ?? 'unresolved';
      unresolvedDiseases[reason] = (unresolvedDiseases[reason] ?? 0) + 1;
      continue;
    }
    const phenotypeConceptId = resolvePhenotype(a.hpo);
    if (!phenotypeConceptId) {
      stats.phenotypeUnresolved += 1;
      continue;
    }
    const frequency = orphanetFrequency(a.frequencyLabel);
    if (a.frequencyLabel && !frequency) {
      stats.unknownFrequencyLabels[a.frequencyLabel] = (stats.unknownFrequencyLabels[a.frequencyLabel] ?? 0) + 1;
    }
    if (frequency) stats.withFrequency += 1;
    if (frequency === 'EXCLUDED') stats.excluded += 1;

    rows.push({
      sourceConceptId: disease.conceptId,
      targetConceptId: phenotypeConceptId,
      relationshipTypeConceptId: RELATION_TYPE.SYMPTOM,
      evidenceTier: ORPHANET_TIER,
      sourceReference: `${a.curie} @${ORPHANET_SOURCE_TAG} #${a.associationId}`,
      validFrom,
      frequency,
      frequencyNumerator: null,
      frequencyDenominator: null,
    });
  }
  stats.rows = rows.length;
  return { rows, stats, unresolvedDiseases };
}
