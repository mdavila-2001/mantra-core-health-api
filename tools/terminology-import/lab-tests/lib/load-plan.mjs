// =============================================================================
// Plan de carga del catálogo de análisis (puro, sin base): de los registros
// comunes (`records.mjs`) a las tuplas de `terminology.*`. Separado del
// ejecutor para probarlo sin Postgres y para el `--dry-run`.
//
// Ids deterministas (md5 → uuid, mismo patrón que el resto de
// tools/terminology-import/). LOINC reusa las claves de import-loinc.mjs
// (`mantra:loinc:source|cs|csv|concept|property:…`) para enriquecer —no
// duplicar— lo que ese importador ya hubiera cargado. Los conceptos internos
// (idioma, tipo de designación, tipo de relación, estado) son los que siembra el
// backend (`deterministicId`), así que el cargador exige que la API haya
// arrancado una vez.
// =============================================================================

import { deterministicId } from '../../lib/glossary-es/common.mjs';
import { CONCEPT, md5uuid } from '../../lib/glossary-es/load-plan.mjs';
import { DOMAINS, conceptIdFor, propertyIdFor } from './records.mjs';
import { SOURCES } from './sources.mjs';

export const RELATION = {
  'part-of': deterministicId('terminology:relationship:part-of'),
  'is-a': deterministicId('terminology:relationship:is-a'),
};

export const PREREQUISITE_CONCEPTS = {
  'terminology:state:active': CONCEPT.TERM_ACTIVE,
  'terminology:language:es': CONCEPT.LANG_ES,
  'terminology:designation-type:preferred': CONCEPT.DESIG_PREFERRED,
  'terminology:designation-type:synonym': CONCEPT.DESIG_SYNONYM,
  'terminology:relationship:part-of': RELATION['part-of'],
  'terminology:relationship:is-a': RELATION['is-a'],
};

export const VALUE_SET_VERSION = '1';

const LANG = { es: CONCEPT.LANG_ES };
const DESIGNATION_TYPE = { preferred: CONCEPT.DESIG_PREFERRED, synonym: CONCEPT.DESIG_SYNONYM };

/** Ids de fuente / code system / versión. */
export function sourceId(sourceKey) {
  const def = SOURCES[sourceKey];
  return sourceKey === 'loinc' ? md5uuid(`mantra:loinc:source:${def.sourceCode}`) : md5uuid(`mantra:lab-tests:source:${def.sourceCode}`);
}
export function codeSystemId(internalCode) {
  return internalCode === 'loinc' ? md5uuid('mantra:loinc:cs:loinc') : md5uuid(`mantra:lab-tests:cs:${internalCode}`);
}
export function codeSystemVersionId(internalCode, version) {
  return internalCode === 'loinc' ? md5uuid(`mantra:loinc:csv:${version}`) : md5uuid(`mantra:lab-tests:csv:${internalCode}:${version}`);
}

/** Nombre y descripción de cada value set del catálogo (los códigos los generan los parsers). */
export function valueSetDefinition(code, context = {}) {
  const fixed = {
    'lab-catalog-loinc-panels': ['Catálogo de análisis — paneles LOINC', 'Términos LOINC que son paneles o formularios (tienen miembros en PanelsAndForms o PanelType).'],
    'lab-catalog-loinc-orderable': ['Catálogo de análisis — pedibles (LOINC ORDER_OBS)', 'Términos que LOINC declara pedibles: ORDER_OBS = Order o Both.'],
    'lab-catalog-loinc-universal-lab-orders': ['Catálogo de análisis — LOINC Universal Lab Orders', 'Miembros del value set oficial «LOINC Universal Lab Order Codes».'],
    'lab-catalog-loinc-top2000-us': ['Catálogo de análisis — LOINC Top 2000 (unidades US)', 'Resultados de laboratorio más frecuentes según LOINC (lista US).'],
    'lab-catalog-loinc-top2000-si': ['Catálogo de análisis — LOINC Top 2000 (unidades SI)', 'Resultados de laboratorio más frecuentes según LOINC (lista SI).'],
    'lab-catalog-specimen-types': ['Tipo de espécimen (HL7 v2 tabla 0487)', 'Tabla HL7 0487 completa, verbatim de HL7 Terminology.'],
    'lab-catalog-specimen-additives': ['Aditivo o conservante de la muestra (HL7 v2 tabla 0371)', 'Tabla HL7 0371 completa: aditivos de tubos y conservantes.'],
    'lab-catalog-specimen-collection-methods': ['Método de recolección de la muestra (HL7 v2 tabla 0488)', 'Tabla HL7 0488 completa.'],
    'lab-catalog-specimen-conditions': ['Condición de la muestra (HL7 v2 tabla 0493)', 'Tabla HL7 0493 completa.'],
    'lab-catalog-diagnostic-service-sections': ['Sección del servicio diagnóstico (HL7 v2 tabla 0074)', 'Tabla HL7 0074 completa: hematología, química, microbiología, radiología, etc.'],
    'lab-catalog-observation-categories': ['Categoría de la observación (HL7 FHIR)', 'Code system observation-category de HL7 Terminology.'],
    'lab-catalog-ucum-units': ['Unidades UCUM', 'Unidades de ucum-lhc (UCUM + combinaciones usadas por LOINC) y unidades comunes de HL7.'],
    'lab-catalog-ucum-common-units': ['Unidades UCUM comunes (HL7)', 'ValueSet ucum-common de HL7 Terminology.'],
    'lab-catalog-fonasa-mle': ['Catálogo de análisis — FONASA MLE (Chile)', 'Prestaciones diagnósticas del arancel MLE de FONASA incluidas por prefijo (ver tariffs.mjs).'],
    'lab-catalog-sigtap-sus': ['Catálogo de análisis — SIGTAP grupo 02 (Brasil)', 'Procedimentos com finalidade diagnóstica de la Tabela Unificada del SUS.'],
    'lab-catalog-tuss-ans': ['Catálogo de análisis — TUSS tabla 22 (Brasil)', 'Procedimientos diagnósticos de la TUSS (ANS) incluidos por prefijo (ver tariffs.mjs).'],
    'lab-catalog-icd10pcs-cms': ['Catálogo de análisis — ICD-10-PCS (secciones diagnósticas)', 'Códigos ICD-10-PCS de imagen (B), medicina nuclear diagnóstica (C1–C6), medición y monitoreo (4) y evaluaciones (F0–F5).'],
    'lab-catalog-pami-nomenclador': ['Catálogo de análisis — Nomenclador PAMI (Argentina)', 'Prácticas diagnósticas del nomenclador de PAMI incluidas por prefijo (ver tariffs.mjs).'],
  };
  if (fixed[code]) return { name: fixed[code][0], description: fixed[code][1] };
  const domain = code.match(/^lab-catalog-domain-(.+)$/)?.[1];
  if (domain && DOMAINS[domain]) return { name: `Catálogo de análisis — ${DOMAINS[domain]}`, description: `Términos con dominio «${DOMAINS[domain]}» según las reglas de domains.mjs (derivadas de CLASS/CLASSTYPE de LOINC).` };
  const cat = code.match(/^lab-catalog-(.+)-cat-.+$/);
  if (cat && context.category) {
    const src = SOURCES[cat[1]];
    return { name: `Catálogo de análisis — ${src?.name.split(' — ')[0] ?? cat[1]} · ${context.category.display}`, description: `Categoría «${context.category.display}» (${context.category.scheme} ${context.category.code}) de ${src?.name ?? cat[1]}.` };
  }
  if (code.startsWith('lab-catalog-loinc-class-')) {
    const c = context.loincClass;
    return { name: `Catálogo de análisis — clase LOINC ${c?.code ?? code.slice(24)}`, description: c?.display && c.display !== c.code ? `Clase LOINC ${c.code}: ${c.display}.` : `Clase LOINC ${c?.code ?? ''}.` };
  }
  throw new Error(`value set sin definición: ${code}`);
}

const dataTypeOf = (v) => (typeof v === 'boolean' ? 'boolean' : typeof v === 'number' ? (Number.isInteger(v) ? 'integer' : 'decimal') : typeof v === 'string' ? 'string' : 'json');

/** Propiedades de un registro, más la categoría y la procedencia como propiedades. */
export function propertyTuples(r) {
  const p = r.provenance;
  const all = {
    ...r.properties,
    ...(r.category ? { lab_catalog_category: r.category } : {}),
    source: p.source,
    source_name: p.sourceName,
    source_id: p.sourceId,
    source_version: p.sourceVersion,
    source_url: p.sourceUrl,
    source_retrieved_at: p.retrievedAt,
    source_license: p.license,
    ...(p.sourceFile ? { source_file: p.sourceFile } : {}),
    ...(p.sourceSha256 ? { source_file_sha256: p.sourceSha256 } : {}),
    ...(r.alsoIn?.length ? { source_also_in: r.alsoIn.map((x) => ({ source: x.source, sourceName: x.sourceName, sourceId: x.sourceId, sourceVersion: x.sourceVersion, sourceUrl: x.sourceUrl })) } : {}),
  };
  return Object.entries(all).map(([code, value]) => [propertyIdFor(r.codeSystem, r.code, code), r.id, code, dataTypeOf(value), JSON.stringify(value)]);
}

export function designationTuples(r) {
  return r.designations.map((d, i) => [
    r.codeSystem === 'loinc' ? md5uuid(`mantra:loinc:designation:${d.lang}:${d.type}:${r.code}:${i}`) : md5uuid(`mantra:lab-tests:designation:${r.codeSystem}:${d.lang}:${d.type}:${r.code}:${i}`),
    r.id,
    LANG[d.lang] ?? (() => { throw new Error(`idioma sin concepto interno: ${d.lang}`); })(),
    DESIGNATION_TYPE[d.type],
    d.value,
    d.type === 'preferred',
  ]);
}

export function relationshipTuples(r) {
  return r.relations.map((x) => {
    const target = conceptIdFor(x.targetCodeSystem, x.targetCode);
    return [md5uuid(`mantra:lab-tests:rel:${x.type}:${r.id}:${target}`), r.id, target, RELATION[x.type], x.ordinal ?? null];
  });
}

/**
 * Plan completo. `layers` = [{ layer, meta, records }] tal como los escribe
 * build-lab-tests.mjs; `meta.codeSystems` = [{ internalCode, name, canonicalUrl, version, sourceKey }].
 */
export function buildPlan(layers) {
  const sources = new Map();
  const codeSystems = new Map();
  const concepts = [];
  const properties = [];
  const designations = [];
  const relationships = [];
  const vsMembers = new Map(); // vsCode → { version, conceptIds:Set, context }
  const seenConcept = new Set();

  for (const { meta, records } of layers) {
    for (const cs of meta.codeSystems) {
      const def = SOURCES[cs.sourceKey];
      sources.set(cs.sourceKey, { key: cs.sourceKey, id: sourceId(cs.sourceKey), code: def.sourceCode, name: def.name, owner: def.owner, officialUrl: def.officialUrl, license: def.license });
      codeSystems.set(cs.internalCode, {
        id: codeSystemId(cs.internalCode),
        sourceKey: cs.sourceKey,
        internalCode: cs.internalCode,
        name: cs.name,
        canonicalUrl: cs.canonicalUrl,
        version: cs.version,
        versionId: codeSystemVersionId(cs.internalCode, cs.version),
        records: 0,
      });
    }
    for (const r of records) {
      if (seenConcept.has(r.id)) throw new Error(`concepto repetido entre capas: ${r.codeSystem}|${r.code}`);
      seenConcept.add(r.id);
      const cs = codeSystems.get(r.codeSystem);
      if (!cs) throw new Error(`code system sin declarar en el meta de su capa: ${r.codeSystem}`);
      cs.records += 1;
      concepts.push([r.id, cs.versionId, r.code, r.display, r.definition ?? null, false, r.selectable, CONCEPT.TERM_ACTIVE]);
      properties.push(...propertyTuples(r));
      designations.push(...designationTuples(r));
      relationships.push(...relationshipTuples(r));
      for (const vs of r.valueSets) {
        // Versión estable '1' (como los value sets del seed de la API): un dominio junta
        // varias fuentes, y atarlo a la versión de la primera haría depender el id del
        // orden de las capas. La membresía es acumulativa; revisar contenido sería '2'.
        if (!vsMembers.has(vs)) vsMembers.set(vs, { version: VALUE_SET_VERSION, conceptIds: new Set(), context: {} });
        const entry = vsMembers.get(vs);
        entry.conceptIds.add(r.id);
        if (vs.startsWith('lab-catalog-loinc-class-') && r.category) entry.context.loincClass = r.category;
        if (vs.includes('-cat-') && r.category) entry.context.category = r.category;
      }
    }
  }

  // Las relaciones sólo pueden apuntar a conceptos que este plan carga (o el destino quedaría colgando).
  const danglingRelationships = relationships.filter((t) => !seenConcept.has(t[2]));
  if (danglingRelationships.length) throw new Error(`${danglingRelationships.length} relaciones apuntan a conceptos fuera del plan`);

  const valueSets = [...vsMembers].map(([code, { version, conceptIds, context }]) => {
    const { name, description } = valueSetDefinition(code, context);
    const id = md5uuid(`mantra:lab-tests:vs:${code}`);
    const versionId = md5uuid(`mantra:lab-tests:vsv:${code}:${version}`);
    return {
      id,
      code,
      name,
      description,
      canonicalUrl: `https://mantracore.health/fhir/ValueSet/${code}`,
      version,
      versionId,
      members: [...conceptIds].map((cid, i) => [md5uuid(`mantra:lab-tests:vsm:${code}:${version}:${cid}`), versionId, cid, true, i + 1]),
    };
  });

  return { sources: [...sources.values()], codeSystems: [...codeSystems.values()], concepts, properties, designations, relationships, valueSets };
}

export function planSummary(plan) {
  return {
    sources: plan.sources.length,
    codeSystems: plan.codeSystems.map((c) => ({ internalCode: c.internalCode, version: c.version, concepts: c.records })),
    concepts: plan.concepts.length,
    properties: plan.properties.length,
    designations: plan.designations.length,
    relationships: plan.relationships.length,
    valueSets: plan.valueSets.length,
    valueSetMembers: plan.valueSets.reduce((n, v) => n + v.members.length, 0),
  };
}
