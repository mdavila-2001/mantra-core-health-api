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
  mesh: {
    internalCode: 'mesh',
    name: 'Medical Subject Headings (MeSH)',
    canonicalUrl: 'http://id.nlm.nih.gov/mesh',
    source: {
      code: 'NLM_MESH',
      name: 'Medical Subject Headings (U.S. National Library of Medicine)',
      owner: 'U.S. National Library of Medicine',
      officialUrl: 'https://www.nlm.nih.gov/mesh/',
      license:
        'Términos de uso de MeSH (NLM): sin cargo, con atribución y versión identificada',
    },
    createIfAbsent: true,
  },
  icd10pcs: {
    internalCode: 'icd10pcs',
    name: 'ICD-10 Procedure Coding System (ICD-10-PCS)',
    canonicalUrl: 'http://www.cms.gov/Medicare/Coding/ICD10',
    source: {
      code: 'CMS_ICD10PCS',
      name: 'ICD-10-PCS (Centers for Medicare & Medicaid Services)',
      owner: 'Centers for Medicare & Medicaid Services (CMS)',
      officialUrl: 'https://www.cms.gov/medicare/coding-billing/icd-10-codes',
      license: 'Dominio público (obra del gobierno de EE. UU.)',
    },
    createIfAbsent: true,
  },
  'icd10pcs-body-part': {
    internalCode: 'icd10pcs-body-part',
    name: 'ICD-10-PCS — valores del eje 4 (parte del cuerpo / región / sitio) por sección y sistema',
    canonicalUrl:
      'https://mantracore.health/fhir/CodeSystem/icd10pcs-body-part',
    source: {
      code: 'CMS_ICD10PCS',
      name: 'ICD-10-PCS (Centers for Medicare & Medicaid Services)',
      owner: 'Centers for Medicare & Medicaid Services (CMS)',
      officialUrl: 'https://www.cms.gov/medicare/coding-billing/icd-10-codes',
      license: 'Dominio público (obra del gobierno de EE. UU.)',
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
  'ncit-evs': 'NCI_EVS_NCIT',
  icd10pcs: 'CMS_ICD10PCS',
  mesh: 'NLM_MESH',
  ctgov: 'NLM_CTGOV',
  'wikidata-p924': 'WIKIDATA',
  'pubmed-cochrane': 'NLM_PUBMED',
};

/**
 * Fuentes que publican relaciones sin ser dueñas de un code system de este
 * importador (p. ej. ClinicalTrials.gov relaciona códigos MeSH). El cargador
 * las crea en `terminology_sources` si faltan, para colgar la procedencia.
 */
export const RELATION_ONLY_SOURCES = [
  {
    code: 'NLM_CTGOV',
    name: 'ClinicalTrials.gov (U.S. National Library of Medicine)',
    owner: 'U.S. National Library of Medicine',
    officialUrl: 'https://clinicaltrials.gov/',
    license: 'Dominio público (NLM); términos de uso de ClinicalTrials.gov',
  },
  {
    code: 'WIKIDATA',
    name: 'Wikidata (Wikimedia Foundation, CC0)',
    owner: 'Comunidad de Wikidata / Wikimedia Foundation',
    officialUrl: 'https://www.wikidata.org/',
    license: 'CC0 1.0',
  },
  {
    code: 'NLM_PUBMED',
    name: 'PubMed / MEDLINE (U.S. National Library of Medicine)',
    owner: 'U.S. National Library of Medicine',
    officialUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    license: 'Metadatos bibliográficos e indexación MeSH de MEDLINE (NLM)',
  },
];

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
  return [
    ['source', p.provenance.source],
    ['source_url', p.provenance.uri],
    ['source_version', p.provenance.version],
    ['source_retrieved_at', p.provenance.retrievedAt],
    ['source_license', p.provenance.license],
    ['source_file_sha256', p.provenance.sha256],
    ['procedure_category', p.category],
  ]
    .filter(([, v]) => v != null)
    .map(([code, value]) => ({ code, dataType: PROPERTY_DATA_TYPE, value }));
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
