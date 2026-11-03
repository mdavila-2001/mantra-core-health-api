import { evidenceTierFor, normalizeHpoFrequency, onsetAgeRange } from '../../lib/glossary-es/hpo.mjs';

/** Contrato del modelo v4.2.50+, no el de la propuesta histórica de síntomas. */
export const EVIDENCE_COLUMNS = Object.freeze([
  'id', 'concept_relationship_id', 'terminology_source_id', 'code_system_version_id',
  'evidence_tier_concept_id', 'source_reference', 'citation_text', 'citation_locator',
  'frequency_concept_id', 'frequency_numerator', 'frequency_denominator', 'statistic_value',
  'sex_concept_id', 'age_min_days', 'age_max_days', 'valid_from', 'valid_to',
]);

/**
 * Adapta el plan interno al cargador canónico. La cita conserva el registro de
 * origen completo como JSON textual: no se pierden NOT, evidencia, calificadores
 * ni frecuencias que el modelo no representa en columnas propias.
 */
export function canonicalEvidenceBatches(plan, { validFromBySource = {} } = {}) {
  const relationships = new Map(plan.relationships.map((r) => [r[0], r]));
  const batches = new Map();
  for (const evidence of plan.evidence) {
    const qualifiers = JSON.parse(evidence[17]);
    const source = qualifiers.source;
    const version = evidence[4];
    const release = validFromBySource[source] ?? version?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    const date = typeof release === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(release)
      ? new Date(`${release}T00:00:00Z`) : null;
    if (!date || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== release) {
      throw new Error(`La fuente ${source} no declara una fecha de release válida: ${version ?? '(sin versión)'}. Indicá la fecha publicada con --source-release-dates.`);
    }
    const relationship = relationships.get(evidence[1]);
    if (!relationship) throw new Error('La evidencia no tiene una relación en el plan');
    const references = JSON.parse(evidence[16]);
    const frequency = normalizeHpoFrequency(evidence[8]);
    if (frequency.problem) throw new Error(`Frecuencia de origen no representable: ${frequency.problem}`);
    const age = onsetAgeRange(qualifiers.onset);
    const row = {
      sourceConceptId: relationship[1], targetConceptId: relationship[2],
      relationshipTypeConceptId: relationship[3], ordinal: relationship[4],
      evidenceTier: evidence[13] === 'ITM' ? 'STATISTICAL_LITERATURE' : evidenceTierFor(references),
      sourceReference: evidence[3],
      citationText: JSON.stringify({
        ...qualifiers, sourceRecordKey: evidence[3], sourceVersion: version,
        sourceUri: evidence[5], retrievedAt: evidence[6], negated: evidence[7],
        frequencyText: evidence[8], evidenceCode: evidence[13], sex: evidence[15], references,
      }),
      citationLocator: evidence[5] ? `${evidence[5]}#record=${encodeURIComponent(evidence[3])}` : evidence[3],
      frequency: evidence[7] ? 'EXCLUDED' : frequency.frequency,
      frequencyNumerator: frequency.numerator, frequencyDenominator: frequency.denominator,
      // statistic_value es una medida de asociación del motor (p. ej. odds ratio), no prevalencia.
      statisticValue: null,
      ageMinDays: age.ageMinDays, ageMaxDays: age.ageMaxDays,
      // El código publicado queda en la cita; no se inventa un concepto de sexo.
      sexConceptId: null, validFrom: release, validTo: null,
    };
    const key = JSON.stringify([source, version]);
    if (!batches.has(key)) batches.set(key, { source, version, rows: [] });
    batches.get(key).rows.push(row);
  }
  return [...batches.values()];
}
