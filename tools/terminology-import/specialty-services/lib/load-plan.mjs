// =============================================================================
// Plan de carga (puro, sin base): del corpus a las tuplas de `terminology.*`.
//
// Qué se escribe, todo en tablas existentes (sin DDL, ADR-0021):
//  - terminology_sources / code_systems / code_system_versions: FONASA y CUPS.
//  - catalog_concepts + concept_designations (es, preferida): los servicios de
//    FONASA y CUPS. Los del arancel boliviano NO: ya los siembra la API
//    (`VS_BO_MEDICAL_PROCEDURE`) y se reusan por su id.
//  - concept_properties: `specialty-service:evidence` (todos) y, para los
//    conceptos nuevos, `specialty-service:source` y `specialty-service:review-status`.
//  - concept_relationships: servicio → especialidad, tipo `REL_SPECIALTY`
//    («el origen lo atiende la especialidad destino», ya sembrado por la API).
//  - value_sets / versions / members: `VS_SPECIALTY_SERVICES_<CÓDIGO>`, uno por
//    especialidad con al menos un servicio.
//  - catalog_import_batches: uno por fuente y contenido (id por checksum).
// NO se escribe `concept_maps`: ningún mapeo entre nomencladores tiene fuente.
//
// Ids: `md5('mantra:specialty-services:<tipo>:<clave>')::uuid`, mismo patrón que
// el resto de `tools/terminology-import/`; los conceptos internos de la API
// (estado, idioma, tipo de designación y de relación) se reusan.
// =============================================================================

import { createHash } from 'node:crypto';

import { CONCEPT, RELATION_TYPE, md5uuid } from '../../lib/glossary-es/load-plan.mjs';
import { SOURCES } from './sources.mjs';

export const VALUE_SET_VERSION = '2026.10.24';
export const PROPERTY = {
  evidence: 'specialty-service:evidence',
  source: 'specialty-service:source',
  reviewStatus: 'specialty-service:review-status',
};

const id = (kind, key) => md5uuid(`mantra:specialty-services:${kind}:${key}`);
export const valueSetCode = (specialty) => `VS_SPECIALTY_SERVICES_${specialty}`;

export function checksum(parts) {
  return createHash('sha256').update(parts.join('\n')).digest('hex');
}

/** Fuentes / code systems / versiones de los conceptos nuevos (FONASA, CUPS). */
export function codeSystemPlans() {
  return [SOURCES.fonasa, SOURCES.cups].map((def) => ({
    key: def.key,
    source: { id: id('source', def.sourceCode), code: def.sourceCode, name: def.sourceName, owner: def.owner, officialUrl: def.officialUrl, license: def.license },
    codeSystem: { id: id('cs', def.codeSystem), internalCode: def.codeSystem, name: def.codeSystemName, canonicalUrl: `https://mantracore.health/fhir/CodeSystem/${def.codeSystem}` },
    version: { id: id('csv', `${def.codeSystem}:${def.version}`), version: def.version, validFrom: def.validFrom },
  }));
}

/** La fuente bajo la que se registra el lote de las relaciones del arancel boliviano. */
export function boSourcePlan() {
  const def = SOURCES.boArancel;
  return { id: id('source', def.sourceCode), code: def.sourceCode, name: def.sourceName, owner: def.owner, officialUrl: def.officialUrl, license: def.license };
}

/**
 * @param records   corpus (`buildCorpus().records`)
 * @param specialtyIds  Map código de especialidad → concept id (resuelto contra la base, o la foto del modelo en dry-run)
 * @param modelDisplay  Map código → nombre visible de la especialidad
 */
export function buildPlan(records, specialtyIds, modelDisplay) {
  const concepts = [];
  const designations = [];
  const properties = [];
  const relationships = [];
  const unresolved = new Map();
  const membersBySpecialty = new Map();

  for (const r of records) {
    if (!r.reuse) {
      concepts.push({ codeSystem: r.codeSystem, tuple: [r.id, null, r.code, r.display, null, CONCEPT.TERM_ACTIVE] });
      designations.push([id('designation', `${r.id}:es:preferred`), r.id, CONCEPT.LANG_ES, CONCEPT.DESIG_PREFERRED, r.display, true]);
      properties.push([id('property', `${PROPERTY.source}:${r.id}`), r.id, PROPERTY.source, 'json', JSON.stringify({ ...r.source, code: r.code })]);
      properties.push([id('property', `${PROPERTY.reviewStatus}:${r.id}`), r.id, PROPERTY.reviewStatus, 'string', JSON.stringify(r.reviewStatus)]);
    }
    properties.push([id('property', `${PROPERTY.evidence}:${r.id}`), r.id, PROPERTY.evidence, 'json', JSON.stringify(r.evidence)]);

    for (const specialty of new Set(r.evidence.map((e) => e.specialty))) {
      const target = specialtyIds.get(specialty);
      if (!target) {
        unresolved.set(specialty, (unresolved.get(specialty) ?? 0) + 1);
        continue;
      }
      relationships.push([id('relationship', `${r.id}:${specialty}`), r.id, target, RELATION_TYPE.SPECIALTY, null]);
      if (!membersBySpecialty.has(specialty)) membersBySpecialty.set(specialty, []);
      membersBySpecialty.get(specialty).push(r);
    }
  }

  const valueSets = [];
  const valueSetVersions = [];
  const valueSetMembers = [];
  for (const [specialty, list] of [...membersBySpecialty].sort(([a], [b]) => a.localeCompare(b))) {
    const code = valueSetCode(specialty);
    const vsId = id('value-set', code);
    const verId = id('value-set-version', `${code}:${VALUE_SET_VERSION}`);
    const display = modelDisplay.get(specialty) ?? specialty;
    valueSets.push([
      vsId,
      code,
      `Servicios de ${display}`,
      `https://mantracore.health/fhir/ValueSet/specialty-services-${specialty.toLowerCase().replace(/_/g, '-')}`,
      `Servicios que la fuente atribuye a ${display}, con la evidencia en la propiedad «${PROPERTY.evidence}» de cada concepto. Fuentes: FONASA MLE 2026, CUPS (Colombia) y aranceles bolivianos ya cargados. Ver docs/seed-research/specialty-services.md.`,
      CONCEPT.TERM_ACTIVE,
    ]);
    valueSetVersions.push([verId, vsId, VALUE_SET_VERSION, true, CONCEPT.TERM_ACTIVE]);
    list
      .sort((a, b) => a.codeSystem.localeCompare(b.codeSystem) || a.code.localeCompare(b.code, 'es'))
      .forEach((r, ordinal) => valueSetMembers.push([id('value-set-member', `${code}:${r.id}`), verId, r.id, true, ordinal]));
  }

  return { concepts, designations, properties, relationships, valueSets, valueSetVersions, valueSetMembers, unresolved: Object.fromEntries(unresolved) };
}

/** Lotes de importación: uno por fuente, id derivado del contenido (re-correr = 0 lotes nuevos). */
export function batchPlans(records, codeSystems, boSource) {
  const groups = [
    ...codeSystems.map((cs) => ({ sourceId: cs.source.id, csvId: cs.version.id, key: cs.codeSystem.internalCode, list: records.filter((r) => r.codeSystem === cs.codeSystem.internalCode) })),
    { sourceId: boSource.id, csvId: null, key: 'VS_BO_MEDICAL_PROCEDURE:relations', list: records.filter((r) => r.reuse) },
  ];
  return groups.map((g) => {
    const sum = checksum(g.list.map((r) => `${r.id}|${r.evidence.map((e) => e.specialty).sort().join(',')}`));
    return { id: id('batch', `${g.key}:${sum}`), sourceId: g.sourceId, csvId: g.csvId, totalRead: g.list.length, checksum: sum, key: g.key };
  });
}
