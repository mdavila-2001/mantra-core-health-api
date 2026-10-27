// =============================================================================
// Plan de carga de la farmacología clínica (puro, sin base): de las monografías
// NDJSON a las tuplas de `terminology.*`. Sin DDL: todo cabe en las tablas del
// módulo 03 tal como están (ver SOURCES.md, «Encaje en el modelo»).
//
//   code_systems          `clinical-pharmacology` (uno; la procedencia va por fila)
//   catalog_concepts      un concepto por código ATC de los 5 niveles; el nivel 5
//                         es el principio activo y lleva la monografía
//   concept_designations  nombre ES de la AEMPS (preferido) cuando existe
//   concept_properties    una fila por SECCIÓN de cada documento de cada fuente
//                         (`pharmacology_section_<clave>`) + datos del concepto
//   concept_relationships IS_A de cada nivel ATC a su padre
//   concept_maps          ATC 5 → concepto `vademecum` del mismo código (se
//                         resuelve contra la base al cargar; ver el cargador)
//
// Identificadores estables: `md5('mantra:clinical-pharmacology:<tipo>:<clave>')`.
// Las propiedades incluyen la huella del contenido en su clave: una ficha que
// cambia produce una fila nueva y el cargador retira la anterior (`--prune`),
// así la segunda corrida con la misma fuente inserta y borra 0.
// =============================================================================

import { createHash } from 'node:crypto';

import { deterministicId } from '../../lib/glossary-es/common.mjs';
import { CONCEPT, md5uuid } from '../../lib/glossary-es/load-plan.mjs';
import { sectionPropertyCode } from './sections.mjs';

export const CODE_SYSTEM = 'clinical-pharmacology';
/**
 * Versión única del code system. Los conceptos (códigos ATC) no cambian entre
 * corridas; lo que cambia es la versión de cada documento fuente, y esa viaja
 * en cada sección (`document.version`). Una versión por fecha de corrida dejaría
 * conceptos de id estable colgados de versiones viejas sin aportar nada.
 */
export const CODE_SYSTEM_VERSION = '1';
export const PROPERTY_PREFIX = 'pharmacology_';

export const REL_IS_A = deterministicId('terminology:relationship:is-a');
export const EQUIV_EQUIVALENT = deterministicId('terminology:equivalence:equivalent');

export const SOURCE = {
  code: 'MANTRA_CLINICAL_PHARMACOLOGY',
  name: 'Farmacología clínica — monografías literales de fuentes oficiales',
  owner: 'Compilación de Mantra Core Technologies; el contenido de cada sección es de la fuente que cita',
  officialUrl: 'https://cima.aemps.es/cima/publico/home.html',
  license:
    'Compilación sin contenido propio. Cada sección guarda en value_json su fuente, documento, número de sección, versión, URL, fecha de consulta, ' +
    'licencia y cita (AEMPS/CIMA: reproducción autorizada citando el origen; openFDA: dominio público). Ver tools/terminology-import/clinical-pharmacology/SOURCES.md.',
};

export const PROPERTY = {
  ATC_LEVEL: 'pharmacology_atc_level',
  ATC_PATH: 'pharmacology_atc_path',
  NAME_SOURCE: 'pharmacology_name_source',
  CIMA_SUBSTANCES: 'pharmacology_cima_substances',
  FORMS_ROUTES: 'pharmacology_dosage_forms_routes',
  RXNORM: 'pharmacology_rxnorm_bridge',
  SAFETY_NOTES: 'pharmacology_safety_notes',
  FDA_CLASSES: 'pharmacology_fda_pharm_classes',
  COVERAGE: 'pharmacology_section_coverage',
};

export const conceptId = (code) => md5uuid(`mantra:${CODE_SYSTEM}:concept:${code}`);
const sha = (value) => createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex').slice(0, 16);

export function codeSystemPlan(version) {
  return {
    source: { id: md5uuid(`mantra:${CODE_SYSTEM}:source:${SOURCE.code}`), ...SOURCE },
    codeSystem: {
      id: md5uuid(`mantra:${CODE_SYSTEM}:cs`),
      internalCode: CODE_SYSTEM,
      name: 'Farmacología clínica por principio activo (ATC)',
      canonicalUrl: `https://mantracore.health/fhir/CodeSystem/${CODE_SYSTEM}`,
    },
    version: { id: md5uuid(`mantra:${CODE_SYSTEM}:csv:${version}`), version },
  };
}

function prop(conceptCode, code, dataType, value, discriminator = sha(value)) {
  return { id: md5uuid(`mantra:${CODE_SYSTEM}:property:${conceptCode}:${code}:${discriminator}`), conceptId: conceptId(conceptCode), code, dataType, value };
}

/** Clave estable de una sección: fuente, documento, versión, número y huella del texto. */
export const sectionDiscriminator = (s) => `${s.source}:${s.document.id}:${s.document.version ?? s.document.effectiveDate ?? ''}:${s.section.number}:${s.textSha256.slice(0, 16)}`;

/** Propiedades de una monografía (ATC 5). Lo que no hay no genera fila. */
export function monographProperties(m) {
  const out = [prop(m.code, PROPERTY.ATC_LEVEL, 'integer', 5, '5'), prop(m.code, PROPERTY.ATC_PATH, 'json', m.atcPath)];
  if (m.displaySource) out.push(prop(m.code, PROPERTY.NAME_SOURCE, 'string', m.displaySource));
  if (m.cima) {
    out.push(prop(m.code, PROPERTY.CIMA_SUBSTANCES, 'json', m.cima.substances));
    out.push(prop(m.code, PROPERTY.FORMS_ROUTES, 'json', { source: 'aemps-cima', products: m.cima.products, commercialized: m.cima.commercialized, items: m.cima.formsAndRoutes }));
  }
  if (m.rxnorm) out.push(prop(m.code, PROPERTY.RXNORM, 'json', m.rxnorm));
  if (m.safetyNotes.length) out.push(prop(m.code, PROPERTY.SAFETY_NOTES, 'json', m.safetyNotes));
  if (m.fdaPharmClasses.length) out.push(prop(m.code, PROPERTY.FDA_CLASSES, 'json', m.fdaPharmClasses));
  if (Object.keys(m.coverage).length) out.push(prop(m.code, PROPERTY.COVERAGE, 'json', m.coverage));
  for (const s of m.sections) out.push(prop(m.code, sectionPropertyCode(s.key), 'json', s, sectionDiscriminator(s)));
  return out;
}

/**
 * Plan completo. Conceptos de niveles 1–4: los de la ruta ATC de cada
 * monografía (abstractos, no seleccionables). `display` es el nombre oficial; si
 * ninguna fuente nombra el nivel, el propio código (no se inventa un nombre).
 * `seenNodes` permite planear por lotes sin repetir los niveles ya emitidos.
 */
export function planFor(monographs, version = CODE_SYSTEM_VERSION, seenNodes = new Set()) {
  const base = codeSystemPlan(version);
  const nodes = new Map();
  for (const m of monographs) {
    for (const n of m.atcPath) {
      if (seenNodes.has(n.code)) continue; // ya planeado en un lote anterior (la carga va por lotes)
      const prev = nodes.get(n.code);
      if (!prev || (!prev.name && n.name)) nodes.set(n.code, { ...n, display: n.level === 5 ? (m.display ?? n.name) : n.name });
    }
  }
  for (const code of nodes.keys()) seenNodes.add(code);
  const concepts = [];
  const designations = [];
  const properties = [];
  const relationships = [];
  for (const n of [...nodes.values()].sort((a, b) => a.code.localeCompare(b.code))) {
    const id = conceptId(n.code);
    const leaf = n.level === 5;
    concepts.push([id, base.version.id, n.code, n.display ?? n.code, null, !leaf, leaf, CONCEPT.TERM_ACTIVE]);
    if (n.display) designations.push([md5uuid(`mantra:${CODE_SYSTEM}:designation:${n.code}:es:${n.display}`), id, CONCEPT.LANG_ES, CONCEPT.DESIG_PREFERRED, n.display, true]);
    if (!leaf) {
      properties.push(prop(n.code, PROPERTY.ATC_LEVEL, 'integer', n.level, String(n.level)));
      if (n.nameSource) properties.push(prop(n.code, PROPERTY.NAME_SOURCE, 'string', n.nameSource));
    }
    if (n.level > 1) {
      const parent = n.code.slice(0, { 2: 1, 3: 3, 4: 4, 5: 5 }[n.level]);
      relationships.push([md5uuid(`mantra:${CODE_SYSTEM}:is-a:${n.code}`), id, conceptId(parent), REL_IS_A, null]);
    }
  }
  for (const m of monographs) properties.push(...monographProperties(m));
  return {
    ...base,
    monographs: monographs.length,
    concepts,
    designations,
    properties: properties.map((p) => [p.id, p.conceptId, p.code, p.dataType, JSON.stringify(p.value)]),
    relationships,
    atc5: monographs.map((m) => m.code),
  };
}

/** Fila de `concept_maps` ATC 5 → concepto de `vademecum` con el mismo código. */
export const vademecumMapTuple = (code, vademecumConceptId, version) => [
  md5uuid(`mantra:${CODE_SYSTEM}:map:vademecum:${code}`),
  conceptId(code),
  vademecumConceptId,
  EQUIV_EQUIVALENT,
  'ATC nivel 5: mismo código en clinical-pharmacology y vademecum',
  version,
  CONCEPT.TERM_ACTIVE,
];
