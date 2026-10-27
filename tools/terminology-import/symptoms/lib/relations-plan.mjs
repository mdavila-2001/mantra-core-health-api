// =============================================================================
// Plan de carga de RELACIONES enfermedad → síntoma/fenotipo (puro, sin base).
//
// Una arista (`concept_relationships`) por par enfermedad-fenotipo y tipo; una
// fila de evidencia (`concept_relationship_evidence`, modelo v4.2.50) por cada
// línea/axioma de la fuente que la afirma.
//
// Columnas del modelo REAL (SQL/03_terminology/02_tables.sql, patch
// 2026-10-25_v4250, commit e8bd453 del repo del modelo):
//   concept_relationship_id · terminology_source_id · code_system_version_id ·
//   evidence_tier_concept_id (NOT NULL) · source_reference (NOT NULL) ·
//   citation_text · citation_locator · frequency_concept_id ·
//   frequency_numerator/denominator · statistic_value · sex_concept_id ·
//   age_min_days/age_max_days · valid_from (NOT NULL) · valid_to
// y la clave natural única (concept_relationship_id, terminology_source_id,
// source_reference).
//
// Lo que el modelo NO tiene columna para guardar (código de evidencia PCS/TAS/
// IEA/ITM, inicio, sexo, modificadores, biocuración, referencias) NO se pierde:
// va, tal como lo publica la fuente, en `citation_text` (campos publicados,
// «clave=valor», en el orden de la fuente) y `citation_locator`. Qué columnas
// convendría agregar queda como propuesta en docs/seed-research/symptoms.md.
//
// La enfermedad se resuelve SIEMPRE por código contra los sistemas que carga la
// sesión hermana `seed-diseases`; si el código no está cargado pero Mondo lo
// declara equivalente a un MONDO id que sí lo está, se usa ése y se anota.
// =============================================================================

import { md5uuid } from '../../lib/glossary-es/load-plan.mjs';
import { deterministicId } from '../../lib/glossary-es/common.mjs';
import { conceptId } from './load-plan.mjs';
import { ORPHADATA_LICENSE } from './sources.mjs';

export const REL = {
  SYMPTOM: deterministicId('terminology:relationship:symptom'),
  SYMPTOM_EXCLUDED: deterministicId('terminology:relationship:symptom-excluded'),
};

/**
 * Dónde buscar cada prefijo de enfermedad: `internal_code` y forma exacta del
 * código, tal como los carga la sesión hermana `seed-diseases`
 * (mdavila-2001/mantra-core-health-api#688, docs/seed-research/diseases.md §3):
 * OMIM, Orphanet, DECIPHER y MeSH sin prefijo; MONDO y DOID con prefijo.
 * Se puede reemplazar con `--disease-systems <json>`.
 */
export const DEFAULT_DISEASE_SYSTEMS = {
  OMIM: { internalCodes: ['omim'], codes: (id) => [id] },
  ORPHA: { internalCodes: ['orphanet'], codes: (id) => [id] },
  DECIPHER: { internalCodes: ['decipher'], codes: (id) => [id] },
  MONDO: { internalCodes: ['mondo'], codes: (id) => [`MONDO:${id}`] },
  DOID: { internalCodes: ['doid'], codes: (id) => [`DOID:${id}`] },
  MESH: { internalCodes: ['mesh'], codes: (id) => [id] },
};

/** JSON `{ "OMIM": { "internalCodes": ["omim"], "codeFormat": "local" | "curie" } }` → config. */
export function diseaseSystemsFromJson(json) {
  const out = {};
  for (const [prefix, v] of Object.entries(json)) {
    out[prefix] = { internalCodes: v.internalCodes, codes: v.codeFormat === 'curie' ? (id) => [`${prefix}:${id}`] : (id) => [id] };
  }
  return out;
}

/** ¿Qué filas del corpus son relaciones enfermedad → síntoma? (HPOA y Orphadata: sólo aspecto P). */
export const isPhenotypeRelation = (r) => !r.aspect || r.aspect === 'P';

export const relationshipId = (diseaseConceptId, phenotypeConceptId, typeId) => md5uuid(`mantra:symptoms:disease-phenotype:${diseaseConceptId}:${phenotypeConceptId}:${typeId}`);

// --- Value sets del modelo v4.2.50 (los siembra gen_seeds.py; acá sólo se buscan por código) ---

/** Versión de code system (en SALUD_CORE) y códigos de cada value set de evidencia. */
export const EVIDENCE_VALUE_SETS = {
  tier: { version: '1.0.0-vs_evidence_tier', codes: ['NATIONAL_STANDARD', 'CURATED_REFERENCE', 'COLLABORATIVE_KNOWLEDGE', 'STATISTICAL_LITERATURE'] },
  frequency: { version: '1.0.0-vs_relationship_frequency', codes: ['OBLIGATE', 'VERY_FREQUENT', 'FREQUENT', 'OCCASIONAL', 'VERY_RARE', 'EXCLUDED'] },
};

/**
 * Subrama «Frequency» de HPO → miembro de vs_relationship_frequency. Es la
 * correspondencia que declara el propio modelo (gen_seeds.py: «HPO
 * HP:0040280–HP:0040285», en este orden) y coincide con el nombre del término.
 */
export const HPO_FREQUENCY_TO_VS = {
  'HP:0040280': 'OBLIGATE',
  'HP:0040281': 'VERY_FREQUENT',
  'HP:0040282': 'FREQUENT',
  'HP:0040283': 'OCCASIONAL',
  'HP:0040284': 'VERY_RARE',
  'HP:0040285': 'EXCLUDED',
};

/**
 * Nivel de evidencia de la fila (vs_evidence_tier). DECISIÓN A CONFIRMAR con el
 * dueño del modelo (docs/seed-research/symptoms.md § Decisiones): el modelo
 * declara los cuatro niveles pero no a qué fuente corresponde cada uno.
 *   - Afirmación curada por personas o axioma de una ontología (HPOA TAS/PCS,
 *     Mondo, Disease Ontology, Orphadata)  → CURATED_REFERENCE
 *   - Extraída automáticamente de texto/literatura (HPOA IEA, enfermedades
 *     comunes ITM/IEA)                       → STATISTICAL_LITERATURE
 * Un código de evidencia desconocido es un error, no un valor por defecto.
 */
export function evidenceTierCode(row) {
  const code = row.evidence;
  if (row.source === 'mondo' || row.source === 'doid' || row.source === 'orphadata') return 'CURATED_REFERENCE';
  if (code === 'TAS' || code === 'PCS') return 'CURATED_REFERENCE';
  if (code === 'IEA' || code === 'ITM') return 'STATISTICAL_LITERATURE';
  throw new Error(`Código de evidencia sin nivel asignado: ${row.source} ${row.disease?.curie} ${row.phenotype} evidence=${code}`);
}

/** Fecha de vigencia desde la versión que declara la fuente; si no es una fecha, la de la descarga. */
export function validFromOf(row) {
  const m = /^(?:releases\/)?(\d{4}-\d{2}-\d{2})/.exec(row.version ?? '');
  if (m) return { date: m[1], basis: 'release' };
  return { date: String(row.retrievedAt).slice(0, 10), basis: 'retrieved' };
}

const kv = (pairs) => pairs.filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0)).map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(';') : v}`).join(' | ');

/** Campos publicados de la línea/axioma, «clave=valor», con los nombres de columna de cada fuente. */
export function citationText(r) {
  switch (r.source) {
    case 'hpoa':
      return `phenotype.hpoa | ${kv([['database_id', r.disease.curie], ['disease_name', r.diseaseName], ['qualifier', r.negated ? 'NOT' : null], ['hpo_id', r.phenotype], ['reference', r.references], ['evidence', r.evidence], ['onset', r.onset], ['frequency', r.frequency?.raw], ['sex', r.sex], ['modifier', r.modifiers], ['aspect', r.aspect], ['biocuration', r.biocuration]])}`;
    case 'orphadata':
      return `Orphadata producto 4 | ${kv([['OrphaCode', r.disease.id], ['Name', r.diseaseName], ['Name_es', r.diseaseNameEs], ['HPOId', r.phenotypeAsPublished], ['HPOTerm', r.phenotypeTermAsPublished], ['HPOFrequency', r.frequency?.raw], ['HPOFrequency_es', r.frequency?.rawEs], ['DiagnosticCriteria', r.diagnosticCriteria?.en], ['Source', r.references], ['ValidationDate', r.validationDate]])}`;
    case 'mondo':
      return `mondo.obo | ${kv([['id', r.disease.curie], ['name', r.diseaseName], ['relationship', r.predicate], ['target', r.phenotype], ['qualifiers', r.evidence]])}`;
    case 'doid':
      return `doid.owl | ${kv([['id', r.disease.curie], ['label', r.diseaseName], ['restriction', `${r.predicate} ${r.phenotype}`]])}`;
    case 'hpo-common-disease':
      return `common_disease_annot | ${kv([['Disease ID', r.diseaseAsPublished ?? r.disease.curie], ['Disease Name', r.diseaseName], ['Phenotype ID', r.phenotypeAsPublished ?? r.phenotype], ['Negation', r.negated ? 'yes' : null], ['Evidence ID', r.evidence], ['Pub', r.references], ['Description', r.description], ['Assigned by / Date Created', r.biocuration]])}`;
    default:
      throw new Error(`Fuente de relaciones desconocida: ${r.source}`);
  }
}

/** Dónde está la línea dentro del archivo de origen. */
export function citationLocator(r) {
  switch (r.source) {
    case 'hpoa':
      return `phenotype.hpoa#${r.disease.curie}/${r.phenotype}`;
    case 'orphadata':
      return `${'en_product4.xml'}#HPODisorderAssociation@id=${r.orphanetAssociationId}`;
    case 'mondo':
      return `mondo.obo#${r.disease.curie}`;
    case 'doid':
      return `doid.owl#${r.disease.curie}`;
    case 'hpo-common-disease':
      return r.sourceUri?.split('#')[1] ?? 'common_disease_annot.tar.gz';
    default:
      return null;
  }
}

export const sourceReferenceOf = (r) => (r.source === 'orphadata' ? `orphadata:HPODisorderAssociation/${r.orphanetAssociationId}` : `${r.source}:${r.key}`);

/**
 * @param rows        filas del corpus (una fuente o varias)
 * @param resolveDisease (curie) → { conceptId, via } | null
 * @param resolvePhenotype (system, code) → conceptId | null
 * @param ctx.sourceIdOf      (corpusSource) → terminology_sources.id
 * @param ctx.versionIdOf     (phenotypeSystem) → code_system_versions.id del fenotipo
 * @param ctx.tierIdOf        (código de vs_evidence_tier) → concept id
 * @param ctx.frequencyIdOf   (código de vs_relationship_frequency) → concept id
 * @param ctx.excludedTypeAvailable  ¿existe REL_SYMPTOM_EXCLUDED en la base?
 */
export function relationsPlan(rows, { resolveDisease, resolvePhenotype, sourceIdOf, versionIdOf, tierIdOf, frequencyIdOf, excludedTypeAvailable }) {
  const relationships = new Map();
  const evidence = [];
  const stats = { read: rows.length, notPhenotype: 0, negatedSkipped: 0, diseaseUnresolved: 0, phenotypeUnresolved: 0, viaMondo: 0, evidence: 0, duplicateEvidence: 0, byTier: {}, validFromBasis: {} };
  const unresolvedDiseases = new Map();
  const seenEvidence = new Set();
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
    const sourceReference = sourceReferenceOf(r);
    const sourceId = sourceIdOf(r.source);
    const dedupe = `${relId}|${sourceId}|${sourceReference}`;
    if (seenEvidence.has(dedupe)) {
      stats.duplicateEvidence++;
      continue;
    }
    seenEvidence.add(dedupe);
    const f = r.frequency;
    const vsFrequency = f?.kind === 'hpo-term' ? HPO_FREQUENCY_TO_VS[f.hpo] ?? null : null;
    const tier = evidenceTierCode(r);
    const validFrom = validFromOf(r);
    stats.byTier[tier] = (stats.byTier[tier] ?? 0) + 1;
    stats.validFromBasis[validFrom.basis] = (stats.validFromBasis[validFrom.basis] ?? 0) + 1;
    evidence.push({
      id: md5uuid(`mantra:symptoms:evidence:${relId}:${r.source}:${sourceReference}`),
      relationshipId: relId,
      terminologySourceId: sourceId,
      codeSystemVersionId: versionIdOf(r.phenotypeSystem),
      evidenceTierConceptId: tierIdOf(tier),
      sourceReference,
      citationText: citationText(r),
      citationLocator: citationLocator(r),
      frequencyConceptId: vsFrequency ? frequencyIdOf(vsFrequency) : null,
      frequencyNumerator: f?.kind === 'ratio' ? f.numerator : null,
      frequencyDenominator: f?.kind === 'ratio' ? f.denominator : null,
      statisticValue: f?.kind === 'percent' ? f.percent : null,
      validFrom: validFrom.date,
      // Para el informe y las pruebas, no son columnas:
      meta: { tier, via: d.via, evidenceCode: r.evidence, corpusSource: r.source },
    });
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

/**
 * Fuentes de relaciones. `code` es el `terminology_sources.code`: se reusa el de
 * la sesión hermana `seed-diseases` cuando la organización es la misma (Mondo,
 * Disease Ontology, Orphanet), así no quedan dos fuentes para lo mismo.
 */
export const RELATION_SOURCES = {
  hpoa: { code: 'HPO_CONSORTIUM', file: 'relations-hpoa' },
  orphadata: { code: 'INSERM_ORPHANET', file: 'relations-orphadata', name: 'Orphanet (INSERM) — Orphadata', owner: 'INSERM — Orphanet', url: 'https://www.orphadata.com/', license: ORPHADATA_LICENSE },
  mondo: { code: 'MONARCH_MONDO', file: 'relations-mondo', name: 'Mondo Disease Ontology (Monarch Initiative)', owner: 'Monarch Initiative', url: 'https://mondo.monarchinitiative.org/', license: 'CC BY 4.0' },
  doid: { code: 'DO_DOID', file: 'relations-doid', name: 'Human Disease Ontology', owner: 'Institute for Genome Sciences, University of Maryland School of Medicine', url: 'https://disease-ontology.org/', license: 'CC0 1.0' },
  'hpo-common-disease': { code: 'HPO_CONSORTIUM', file: 'relations-hpo-common-disease' },
};
