// =============================================================================
// Repositorio universal de servicios · plan de carga (puro, sin base).
//
// Del corpus normalizado (`build-service-repository.mjs`) a las tuplas de
// `terminology.*`. Todo en tablas existentes (sin DDL, ADR-0021):
//  - terminology_sources / code_systems / code_system_versions: una por fuente.
//  - catalog_concepts + concept_designations (preferida en castellano y
//    sinónimos, en castellano o inglés).
//  - concept_properties `service-repository:*`: fuente, capítulo, precio de
//    referencia con su unidad (sin convertir), estado de revisión y evidencia
//    de cada especialidad.
//  - concept_relationships servicio → especialidad (`REL_SPECIALTY`), sólo
//    cuando la fuente (o una regla documentada sobre la fuente) lo dice.
//  - value set `VS_SERVICE_REPOSITORY`: todos los servicios importables. Es el
//    conjunto que lee la API (`ServiceRepositoryService`).
//
// Ids deterministas. Los conceptos de FONASA y CUPS usan el MISMO id que ya les
// dio `specialty-services/` (`serviceConceptId`), así que recargar no duplica:
// el concepto existente se reusa y sólo se agrega lo que falta.
// =============================================================================

import { createHash } from 'node:crypto';

import { CONCEPT, RELATION_TYPE, md5uuid } from '../../lib/glossary-es/load-plan.mjs';
import { deterministicId } from '../../lib/glossary-es/common.mjs';
import { serviceConceptId } from '../../specialty-services/lib/corpus.mjs';

export const VALUE_SET_CODE = 'VS_SERVICE_REPOSITORY';
export const VALUE_SET_VERSION = '2026.10.27';

/** Idioma inglés, sembrado por la API (`CONCEPTS.LANG_EN`). */
export const LANG_EN = deterministicId('terminology:language:en');

export const PROPERTY = {
  source: 'service-repository:source',
  chapter: 'service-repository:chapter',
  price: 'service-repository:reference-price',
  unit: 'service-repository:price-unit',
  reviewStatus: 'service-repository:review-status',
  evidence: 'service-repository:evidence',
};

const id = (kind, key) => md5uuid(`mantra:service-repository:${kind}:${key}`);

export function checksum(parts) {
  return createHash('sha256').update(parts.join('\n')).digest('hex');
}

/** El id del concepto de un servicio: el de `specialty-services/` si ya lo tenía. */
export function conceptIdOf(record) {
  return record.conceptId ?? serviceConceptId(record.codeSystem, record.code);
}

/** Fuente / sistema / versión de cada sistema de códigos del corpus. */
export function codeSystemPlans(meta) {
  return meta.codeSystems.map((def) => ({
    key: def.internalCode,
    source: {
      id: id('source', def.source.code),
      code: def.source.code,
      name: def.source.name,
      owner: def.source.owner,
      officialUrl: def.source.officialUrl,
      license: def.source.license,
    },
    codeSystem: {
      id: id('cs', def.internalCode),
      internalCode: def.internalCode,
      name: def.name,
      canonicalUrl: `https://mantracore.health/fhir/CodeSystem/${def.internalCode}`,
    },
    version: { id: id('csv', `${def.internalCode}:${def.version}`), version: def.version, validFrom: def.validFrom ?? null },
  }));
}

/**
 * @param records        corpus normalizado
 * @param specialtyIds   Map código de especialidad → concept id (de la base)
 * @param existingPairs  Set `${conceptId}|${specialtyId}` ya relacionados (de cualquier cargador)
 * @param langEn         id del concepto de idioma inglés
 */
export function buildPlan(records, specialtyIds, existingPairs = new Set(), langEn = LANG_EN) {
  const concepts = [];
  const designations = [];
  const properties = [];
  const relationships = [];
  const members = [];
  const unresolved = new Map();
  const seen = new Set();

  const vsId = id('value-set', VALUE_SET_CODE);
  const verId = id('value-set-version', `${VALUE_SET_CODE}:${VALUE_SET_VERSION}`);

  const sorted = [...records].sort((a, b) => a.codeSystem.localeCompare(b.codeSystem) || a.code.localeCompare(b.code, 'es'));
  for (const r of sorted) {
    const cid = conceptIdOf(r);
    if (seen.has(cid)) continue;
    seen.add(cid);

    concepts.push({ codeSystem: r.codeSystem, definition: r.definition ?? null, tuple: [cid, null, r.code, r.display, r.definition ?? null, CONCEPT.TERM_ACTIVE] });
    designations.push([id('designation', `${cid}:es:preferred`), cid, CONCEPT.LANG_ES, CONCEPT.DESIG_PREFERRED, r.display, true]);
    (r.synonyms ?? []).forEach((s, i) => {
      const lang = s.lang === 'en' ? langEn : CONCEPT.LANG_ES;
      if (!lang || !s.value) return;
      designations.push([id('designation', `${cid}:syn:${i}`), cid, lang, CONCEPT.DESIG_SYNONYM, s.value, false]);
    });

    const prop = (code, type, value) => properties.push([id('property', `${code}:${cid}`), cid, code, type, JSON.stringify(value)]);
    prop(PROPERTY.source, 'json', { codeSystem: r.codeSystem, code: r.code, ...(r.definitionSource ? { definitionSource: r.definitionSource } : {}), ...(r.sourceRef ?? {}) });
    prop(PROPERTY.reviewStatus, 'string', r.reviewStatus ?? 'source-verbatim');
    if (r.chapter) prop(PROPERTY.chapter, 'string', r.chapter);
    if (r.price && r.price.value !== null && r.price.value !== undefined) {
      prop(PROPERTY.price, 'string', String(r.price.value));
      prop(PROPERTY.unit, 'string', r.price.unit);
    }
    if ((r.specialties ?? []).length > 0) prop(PROPERTY.evidence, 'json', r.specialties);

    for (const sp of new Set((r.specialties ?? []).map((s) => s.code))) {
      const target = specialtyIds.get(sp);
      if (!target) {
        unresolved.set(sp, (unresolved.get(sp) ?? 0) + 1);
        continue;
      }
      if (existingPairs.has(`${cid}|${target}`)) continue;
      relationships.push([id('relationship', `${cid}:${sp}`), cid, target, RELATION_TYPE.SPECIALTY, null]);
    }
    members.push([id('value-set-member', `${VALUE_SET_CODE}:${cid}`), verId, cid, true, members.length]);
  }

  return {
    concepts,
    designations,
    properties,
    relationships,
    valueSet: [
      vsId,
      VALUE_SET_CODE,
      'Repositorio universal de servicios de salud',
      'https://mantracore.health/fhir/ValueSet/service-repository',
      'Todos los servicios que una práctica puede importar a su catálogo, de nomencladores oficiales con su fuente. Ver tools/terminology-import/service-repository/SOURCES.md.',
      CONCEPT.TERM_ACTIVE,
    ],
    valueSetVersion: [verId, vsId, VALUE_SET_VERSION, true, CONCEPT.TERM_ACTIVE],
    members,
    unresolved: Object.fromEntries(unresolved),
  };
}

/** Un lote por sistema de códigos, id por contenido (re-correr = 0 lotes nuevos). */
export function batchPlans(records, codeSystems) {
  return codeSystems.map((cs) => {
    const list = records.filter((r) => r.codeSystem === cs.codeSystem.internalCode);
    const sum = checksum(list.map((r) => `${conceptIdOf(r)}|${r.display}|${(r.specialties ?? []).map((s) => s.code).sort().join(',')}`));
    return { id: id('batch', `${cs.key}:${sum}`), sourceId: cs.source.id, csvId: cs.version.id, totalRead: list.length, checksum: sum, key: cs.key };
  });
}
