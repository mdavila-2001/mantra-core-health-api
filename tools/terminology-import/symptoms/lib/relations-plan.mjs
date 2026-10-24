// =============================================================================
// Plan de carga de RELACIONES enfermedad → síntoma/fenotipo (puro, sin base).
//
// Una arista (`concept_relationships`) por par enfermedad-fenotipo y tipo; una
// fila de evidencia (`concept_relationship_evidence`, PROPUESTA al repo del
// modelo) por cada línea/axioma de la fuente que la afirma, con su frecuencia,
// evidencia, referencias, inicio, sexo y calificadores tal como vienen.
//
// La enfermedad se resuelve SIEMPRE por código contra los sistemas que carga la
// sesión hermana `seed-diseases`; si el código no está cargado pero Mondo lo
// declara equivalente a un MONDO id que sí lo está, se usa ése y se anota.
// =============================================================================

import { md5uuid } from '../../lib/glossary-es/load-plan.mjs';
import { deterministicId } from '../../lib/glossary-es/common.mjs';
import { conceptId } from './load-plan.mjs';

export const REL = {
  SYMPTOM: deterministicId('terminology:relationship:symptom'),
  SYMPTOM_EXCLUDED: deterministicId('terminology:relationship:symptom-excluded'),
};

/**
 * Dónde buscar cada prefijo de enfermedad: `internal_code` candidatos y formas
 * del código. Se puede reemplazar con `--disease-systems <json>` cuando la
 * sesión hermana fije los suyos.
 */
export const DEFAULT_DISEASE_SYSTEMS = {
  OMIM: { internalCodes: ['omim'], codes: (id) => [id, `OMIM:${id}`] },
  ORPHA: { internalCodes: ['orphanet', 'ordo', 'orpha'], codes: (id) => [id, `ORPHA:${id}`, `Orphanet:${id}`] },
  DECIPHER: { internalCodes: ['decipher'], codes: (id) => [id, `DECIPHER:${id}`] },
  MONDO: { internalCodes: ['mondo'], codes: (id) => [`MONDO:${id}`, id] },
  DOID: { internalCodes: ['doid'], codes: (id) => [`DOID:${id}`, id] },
  MESH: { internalCodes: ['mesh', 'mesh-descriptors'], codes: (id) => [id, `MESH:${id}`] },
};

/** JSON `{ "OMIM": { "internalCodes": ["omim"], "codeFormat": "local" | "curie" } }` → config. */
export function diseaseSystemsFromJson(json) {
  const out = {};
  for (const [prefix, v] of Object.entries(json)) {
    out[prefix] = { internalCodes: v.internalCodes, codes: v.codeFormat === 'curie' ? (id) => [`${prefix}:${id}`] : (id) => [id] };
  }
  return out;
}

/** ¿Qué filas del corpus son relaciones enfermedad → síntoma? (HPOA: sólo aspecto P). */
export const isPhenotypeRelation = (r) => !r.aspect || r.aspect === 'P';

export const relationshipId = (diseaseConceptId, phenotypeConceptId, typeId) => md5uuid(`mantra:symptoms:disease-phenotype:${diseaseConceptId}:${phenotypeConceptId}:${typeId}`);

/**
 * @param rows        filas del corpus (una fuente o varias)
 * @param resolveDisease (curie) → { conceptId, via } | null
 * @param resolvePhenotype (system, code) → conceptId | null
 * @param sourceIdOf  (corpusSource) → terminology_sources.id
 */
export function relationsPlan(rows, { resolveDisease, resolvePhenotype, sourceIdOf, excludedTypeAvailable }) {
  const relationships = new Map();
  const evidence = [];
  const stats = { read: rows.length, notPhenotype: 0, negatedSkipped: 0, diseaseUnresolved: 0, phenotypeUnresolved: 0, viaMondo: 0, evidence: 0 };
  const unresolvedDiseases = new Map();
  for (const r of rows) {
    if (!isPhenotypeRelation(r)) {
      stats.notPhenotype++;
      continue;
    }
    if (r.negated && !excludedTypeAvailable) {
      stats.negatedSkipped++;
      continue;
    }
    const d = resolveDisease(r.disease.curie);
    if (!d) {
      stats.diseaseUnresolved++;
      unresolvedDiseases.set(r.disease.prefix, (unresolvedDiseases.get(r.disease.prefix) ?? new Set()).add(r.disease.curie));
      continue;
    }
    const p = resolvePhenotype(r.phenotypeSystem, r.phenotype);
    if (!p) {
      stats.phenotypeUnresolved++;
      continue;
    }
    if (d.via) stats.viaMondo++;
    const type = r.negated ? REL.SYMPTOM_EXCLUDED : REL.SYMPTOM;
    const relId = relationshipId(d.conceptId, p, type);
    if (!relationships.has(relId)) relationships.set(relId, [relId, d.conceptId, p, type, null]);
    const f = r.frequency;
    evidence.push([
      md5uuid(`mantra:symptoms:evidence:${relId}:${r.source}:${r.key}`),
      relId,
      sourceIdOf(r.source),
      r.key,
      r.version,
      r.sourceUri,
      r.retrievedAt,
      r.negated,
      f?.raw ?? null,
      f?.kind === 'hpo-term' ? resolvePhenotype('hpo', f.hpo) : null,
      f?.kind === 'ratio' ? f.numerator : null,
      f?.kind === 'ratio' ? f.denominator : null,
      f?.kind === 'percent' ? f.percent : null,
      r.evidence,
      r.onset?.startsWith('HP:') ? resolvePhenotype('hpo', r.onset) : null,
      r.sex,
      JSON.stringify(r.references ?? []),
      JSON.stringify({
        source: r.source,
        sourceLabel: r.sourceLabel,
        diseaseAsPublished: r.diseaseAsPublished ?? r.disease.curie,
        diseaseIdNormalized: r.diseaseIdNormalized ?? null,
        diseaseNameAsPublished: r.diseaseName,
        diseaseResolvedVia: d.via,
        phenotypeAsPublished: r.phenotypeAsPublished ?? r.phenotype,
        phenotypeRemap: r.phenotypeRemap ?? null,
        aspect: r.aspect,
        predicate: r.predicate ?? null,
        onset: r.onset,
        modifiers: r.modifiers,
        biocuration: r.biocuration,
        description: r.description ?? null,
        license: r.license,
      }),
    ]);
    stats.evidence++;
  }
  stats.relationships = relationships.size;
  return { relationships: [...relationships.values()], evidence, stats, unresolvedDiseases: Object.fromEntries([...unresolvedDiseases].map(([k, v]) => [k, v.size])) };
}

/** Resolución de fenotipos contra los conceptos de este corpus (ids deterministas, con remapeo). */
export function phenotypeResolver(codesBySystem, idMap = new Map()) {
  return (system, code) => {
    if (!codesBySystem[system]?.has(code)) return null;
    const planned = conceptId(system, code);
    return idMap.get(planned) ?? planned;
  };
}

export const RELATION_SOURCES = {
  hpoa: { code: 'HPO_CONSORTIUM', file: 'relations-hpoa' },
  mondo: { code: 'MONDO', file: 'relations-mondo', name: 'Mondo Disease Ontology (Monarch Initiative)', owner: 'Monarch Initiative', url: 'https://mondo.monarchinitiative.org/', license: 'CC BY 4.0' },
  doid: { code: 'DISEASE_ONTOLOGY', file: 'relations-doid', name: 'Human Disease Ontology', owner: 'Institute for Genome Sciences, University of Maryland School of Medicine', url: 'https://disease-ontology.org/', license: 'CC0 1.0' },
  'hpo-common-disease': { code: 'HPO_CONSORTIUM', file: 'relations-hpo-common-disease' },
};
