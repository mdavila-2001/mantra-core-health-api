// =============================================================================
// Plan de carga (puro, sin base) del corpus de procedimientos a `terminology.*`.
//
// Qué se crea y qué solo se referencia:
//  - Code systems PROPIOS de esta importación: `maxo` (MAxO) y
//    `procedure-relationship-types` (un concepto por tipo de relación literal).
//    `ncit` se crea solo si ninguna otra sesión lo creó antes; se resuelve
//    SIEMPRE por `code_systems.internal_code` (índice único), nunca por id.
//  - Enfermedades (MONDO…) y sitios (UBERON, NCIt anatomía) NO se crean: los
//    cargan `justin/seed-diseases` y `justin/seed-medical-dictionaries`. Una
//    relación cuyo extremo no existe queda sin cargar y se reporta.
//  - ICHI / ICD-10-PCS / CUPS los carga `justin/seed-specialty-services`.
//
// Relaciones: `concept_relationships` (SALUD v4.0.10) no tiene dónde guardar
// fuente ni evidencia. La consigna es no cargar relaciones que pierdan su
// procedencia, así que el cargador las escribe solo si existe la tabla
// propuesta al repo del modelo (`PROVENANCE_TABLE`, ver
// docs/seed-research/procedures-treatments.md). Hasta entonces, se bloquean.
// =============================================================================

import { md5uuid } from './common.mjs';
import { RELATION_TYPES } from './relation-types.mjs';

export const RELATION_TYPE_SYSTEM = 'procedure-relationship-types';

export const OWNED_CODE_SYSTEMS = {
  maxo: {
    internalCode: 'maxo',
    name: 'Medical Action Ontology (MAxO)',
    canonicalUrl: 'http://purl.obolibrary.org/obo/maxo.owl',
    source: {
      code: 'MONARCH_MAXO',
      name: 'Medical Action Ontology (Monarch Initiative)',
      owner: 'Monarch Initiative',
      officialUrl: 'https://github.com/monarch-initiative/MAxO',
      license: 'CC BY 4.0',
    },
    createIfAbsent: true,
  },
  ohd: {
    internalCode: 'ohd',
    name: 'Oral Health and Disease Ontology (OHD)',
    canonicalUrl: 'http://purl.obolibrary.org/obo/ohd.owl',
    source: {
      code: 'OBO_OHD',
      name: 'Oral Health and Disease Ontology (OBO Foundry)',
      owner: 'OHD project',
      officialUrl:
        'https://github.com/oral-health-and-disease-ontologies/ohd-ontology',
      license: 'CC BY 4.0',
    },
    createIfAbsent: true,
  },
  ncit: {
    internalCode: 'ncit',
    name: 'NCI Thesaurus',
    canonicalUrl: 'http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl',
    source: {
      code: 'NCI_EVS_NCIT',
      name: 'NCI Thesaurus (NCI EVS)',
      owner: 'National Cancer Institute — Enterprise Vocabulary Services',
      officialUrl: 'https://ncit.nci.nih.gov/',
      license: 'CC BY 4.0',
    },
    createIfAbsent: true,
  },
  // ICD-10-PCS: misma fuente y mismo code system que el catálogo de análisis (lab-tests, subconjunto
  // diagnóstico de FY2026). Esta importación agrega una versión propia (FY2027) con TODOS los códigos;
  // los conceptos de cada versión son filas distintas y los ids no chocan.
  'icd10pcs-cms': {
    internalCode: 'icd10pcs-cms',
    name: 'ICD-10-PCS — International Classification of Diseases, 10th Revision, Procedure Coding System (EE. UU.)',
    canonicalUrl: 'http://www.cms.gov/Medicare/Coding/ICD10',
    source: {
      code: 'CMS_ICD10PCS',
      name: 'ICD-10-PCS — International Classification of Diseases, 10th Revision, Procedure Coding System (EE. UU.)',
      owner: 'Centers for Medicare & Medicaid Services (CMS), EE. UU.',
      officialUrl: 'https://www.cms.gov/medicare/coding-billing/icd-10-codes',
      license: 'Obra del gobierno federal de EE. UU. (CMS), dominio público.',
    },
    createIfAbsent: true,
  },
  'icd10pcs-site': {
    internalCode: 'icd10pcs-site',
    name: 'ICD-10-PCS — sitios (valores del eje 4 por sección y sistema corporal)',
    canonicalUrl: 'https://mantracore.health/fhir/CodeSystem/icd10pcs-site',
    source: {
      code: 'CMS_ICD10PCS',
      name: 'ICD-10-PCS — International Classification of Diseases, 10th Revision, Procedure Coding System (EE. UU.)',
      owner: 'Centers for Medicare & Medicaid Services (CMS), EE. UU.',
      officialUrl: 'https://www.cms.gov/medicare/coding-billing/icd-10-codes',
      license: 'Obra del gobierno federal de EE. UU. (CMS), dominio público.',
    },
    createIfAbsent: true,
  },
  [RELATION_TYPE_SYSTEM]: {
    internalCode: RELATION_TYPE_SYSTEM,
    name: 'Tipos de relación de procedimientos (predicado literal de cada fuente)',
    canonicalUrl: `https://mantracore.health/fhir/CodeSystem/${RELATION_TYPE_SYSTEM}`,
    source: {
      code: 'MANTRA_PROCEDURES_TREATMENTS',
      name: 'AloVida — importador de procedimientos y tratamientos',
      owner: 'Mantra Core Health',
      officialUrl: 'https://mantracore.health/',
      license: 'Interno',
    },
    createIfAbsent: true,
  },
};

/** Fuente (`terminology_sources.code`) de cada afirmación según la fuente de origen del corpus. */
export const PROVENANCE_SOURCE_CODE = {
  maxo: 'MONARCH_MAXO',
  'maxo-annotations': 'MONARCH_MAXO',
  'ncit-obo': 'NCI_EVS_NCIT',
  ohd: 'OBO_OHD',
  'icd10pcs-cms-2027': 'CMS_ICD10PCS',
};

/** Sistemas cuyo extremo se resuelve en la versión que carga esta importación (no «la versión por defecto»). */
export const PINNED_SYSTEMS = ['icd10pcs-cms', 'icd10pcs-site'];

// --- Evidencia (modelo v4.2.50: terminology.concept_relationship_evidence) ---------------
export const EVIDENCE_TABLE = 'concept_relationship_evidence';
export const EVIDENCE_COLUMNS = ['id', 'concept_relationship_id', 'terminology_source_id', 'code_system_version_id', 'evidence_tier_concept_id', 'source_reference', 'citation_text', 'citation_locator', 'valid_from'];
export const EVIDENCE_TIER_VERSION = '1.0.0-vs_evidence_tier';
export const EVIDENCE_TIER_CODES = ['NATIONAL_STANDARD', 'CURATED_REFERENCE', 'COLLABORATIVE_KNOWLEDGE', 'STATISTICAL_LITERATURE'];

/**
 * Clase de afirmación → nivel de evidencia (vs_evidence_tier). DECISIÓN A CONFIRMAR con el dueño del modelo:
 * el modelo declara los cuatro niveles pero no a qué fuente corresponde cada uno.
 *   by-definition        eje del código de una clasificación nacional oficial (CMS)        → NATIONAL_STANDARD
 *   curated-literature   anotación curada por personas con cita (MAxO/POET)                  → CURATED_REFERENCE
 *   ontology-axiom       axioma de una ontología (MAxO, OHD)                                 → CURATED_REFERENCE
 *   terminology-role     rol declarado por una terminología (NCIt)                           → CURATED_REFERENCE
 *   investigational      registro de ensayos (ClinicalTrials.gov): datos del patrocinador     → STATISTICAL_LITERATURE
 */
export const TIER_OF_ASSERTION = {
  'by-definition': 'NATIONAL_STANDARD',
  'curated-literature': 'CURATED_REFERENCE',
  'ontology-axiom': 'CURATED_REFERENCE',
  'terminology-role': 'CURATED_REFERENCE',
  investigational: 'STATISTICAL_LITERATURE',
};

/** Devuelve el motivo del bloqueo, o null si la tabla de evidencia existe con las columnas que se escriben. */
export function evidenceBlockedReason(columns) {
  const have = new Set(columns);
  const missing = EVIDENCE_COLUMNS.filter((c) => !have.has(c));
  return missing.length ? `terminology.${EVIDENCE_TABLE} no existe o le faltan columnas (${missing.join(', ')}): aplicar el patch 2026-10-25_v4250 del repo del modelo.` : null;
}

/** Fecha de vigencia: la primera fecha que declara la versión de la fuente; si no hay, la de la descarga (base `retrieved`). */
export function validFromOf(p) {
  const m = /(\d{4}-\d{2}-\d{2})/.exec(p.sourceVersion ?? '');
  return m ? { date: m[1], basis: 'release' } : { date: String(p.retrievedAt).slice(0, 10), basis: 'retrieved' };
}

const kv = (obj) => Object.entries(obj ?? {}).filter(([, v]) => v != null && v !== '').map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' | ');

/** Campos publicados de la afirmación, «clave=valor», tal como están en el corpus. */
export function citationTextOf(p) {
  return [p.source, `predicado=${p.sourcePredicate}`, `clase=${p.assertionKind}`, kv(p.evidence), `versión=${p.sourceVersion}`, `fecha_base_vigencia=${validFromOf(p).basis}`].filter(Boolean).join(' | ');
}

/** Columnas mínimas de la tabla de procedencia propuesta (ver la propuesta para el modelo). */
export const PROVENANCE_TABLE = 'concept_relationship_assertions';
export const PROVENANCE_COLUMNS = [
  'concept_relationship_id',
  'source_id',
  'source_record_id',
  'source_version',
  'source_uri',
  'source_predicate',
  'assertion_kind',
  'evidence_json',
  'retrieved_at',
];

/** Devuelve el motivo del bloqueo, o null si la tabla de procedencia existe con sus columnas. */
export function relationshipsBlockedReason(columns) {
  const have = new Set(columns);
  const missing = PROVENANCE_COLUMNS.filter((c) => !have.has(c));
  if (!missing.length) return null;
  return (
    `terminology.${PROVENANCE_TABLE} no existe o le faltan columnas (${missing.join(', ')}): ` +
    'concept_relationships no puede guardar fuente ni evidencia y la consigna prohíbe cargar relaciones sin su procedencia. ' +
    'Ver «Propuesta para el repo del modelo» en docs/seed-research/procedures-treatments.md.'
  );
}

const PROPERTY_DATA_TYPE = 'string';

/** Propiedades de procedencia por concepto propio, con los nombres que ya usa el resto de terminology. */
export function conceptProperties(p) {
  // Propiedades propias del registro (ejes de PCS, descripción corta…): valores tal como la fuente los publica.
  const own = Object.entries(p.properties ?? {}).map(([code, value]) => [code, value]);
  return [
    ...own,
    ['source', p.provenance.source],
    ['source_url', p.provenance.uri],
    ['source_version', p.provenance.version],
    ['source_retrieved_at', p.provenance.retrievedAt],
    ['source_license', p.provenance.license],
    ['source_file_sha256', p.provenance.sha256],
    ['procedure_category', p.category],
  ]
    .filter(([, v]) => v != null)
    .map(([code, value]) => ({ code, dataType: typeof value === 'string' ? 'string' : 'json', value }));
}

export function relationTypeConcepts() {
  return Object.entries(RELATION_TYPES).map(([code, t]) => ({
    system: RELATION_TYPE_SYSTEM,
    code,
    display: t.label,
    definition: `Predicado literal de la fuente: ${t.sourcePredicate}. Clase de afirmación: ${t.assertion}.`,
    properties: [
      {
        code: 'relationship_kind',
        dataType: PROPERTY_DATA_TYPE,
        value: t.kind,
      },
      {
        code: 'source_predicate',
        dataType: PROPERTY_DATA_TYPE,
        value: t.sourcePredicate,
      },
      {
        code: 'assertion_kind',
        dataType: PROPERTY_DATA_TYPE,
        value: t.assertion,
      },
    ],
  }));
}

/**
 * @param {{procedures: object[], assertions: object[], loadedAt: string}} corpus
 */
export function buildLoadPlan({ procedures, assertions }) {
  const concepts = [
    ...procedures
      .filter((p) => p.owned)
      .map((p) => ({
        system: p.system,
        code: p.code,
        display: p.display,
        definition: null,
        properties: conceptProperties(p),
        designations: p.designations ?? [],
      })),
    ...relationTypeConcepts(),
  ];
  const relationships = new Map();
  for (const a of assertions) {
    if (!relationships.has(a.relationshipId)) {
      relationships.set(a.relationshipId, {
        id: a.relationshipId,
        subject: a.subject,
        object: a.object,
        typeCode: a.relationType.code,
        // Sitio alternativo por mapeo publicado (Uberon xref NCIt, uno a uno); se usa solo si el objeto original no existe.
        objectAlternates: a.objectAlternates ?? [],
      });
    }
  }
  const provenance = assertions.map((a) => ({
    id: a.id,
    relationshipId: a.relationshipId,
    source: a.provenance.source,
    sourceRecordId: a.provenance.sourceRecordId,
    sourceVersion: a.provenance.version,
    sourceUri: a.provenance.uri,
    sourcePredicate: a.relationType.sourcePredicate,
    assertionKind: a.relationType.assertion,
    evidence: a.evidence,
    retrievedAt: a.provenance.retrievedAt,
  }));
  return { concepts, relationships: [...relationships.values()], provenance };
}

/** Id determinista de un concepto propio dentro de una versión concreta (resuelta en la base). */
/** Id de la relación cuando se resuelve por el sitio alternativo: distinto par, distinto id. */
export const alternateRelationshipId = (typeCode, subject, alt) =>
  md5uuid(
    `mantra:procedures-treatments:relationship:${typeCode}:${subject.system}|${subject.code}:${alt.system}|${alt.code}`,
  );

export const conceptRowId = (versionId, code) =>
  md5uuid(`mantra:procedures-treatments:concept:${versionId}:${code}`);
export const propertyRowId = (conceptId, code) =>
  md5uuid(`mantra:procedures-treatments:property:${conceptId}:${code}`);
