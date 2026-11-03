// =============================================================================
// Registro de fuentes. Cada entrada dice de dónde se baja (y si se puede bajar
// desde este entorno), quién la publica y con qué licencia. Las bloqueadas
// quedan registradas igual: son huecos documentados con el host que falta.
// =============================================================================

export const GITHUB_SOURCES = {
  'maxo-annotations': {
    name: 'MAxO annotations — curación POET (Monarch Initiative)',
    publisher: 'Monarch Initiative / Medical Action Ontology team',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    homepage: 'https://github.com/monarch-initiative/maxo-annotations',
    kind: 'github-raw',
    repo: 'monarch-initiative/maxo-annotations',
    files: { 'annotations.tsv': 'data/poet/annotations.tsv' },
  },
  maxo: {
    name: 'Medical Action Ontology (MAxO)',
    publisher: 'Monarch Initiative / Medical Action Ontology team',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    homepage: 'https://github.com/monarch-initiative/MAxO',
    kind: 'github-raw',
    repo: 'monarch-initiative/MAxO',
    files: { 'maxo.obo': 'maxo.obo' },
  },
  ohd: {
    name: 'Oral Health and Disease Ontology (OHD)',
    publisher: 'OHD project (OBO Foundry)',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    homepage:
      'https://github.com/oral-health-and-disease-ontologies/ohd-ontology',
    kind: 'github-raw',
    repo: 'oral-health-and-disease-ontologies/ohd-ontology',
    files: { 'ohd.obo': 'ohd.obo' },
  },
  'ncit-obo': {
    name: 'NCI Thesaurus OBO Edition',
    publisher: 'NCIt OBO Edition project (derivado de NCI Thesaurus, NCI EVS)',
    license:
      'CC BY 4.0 (términos de uso de NCI Thesaurus). Edición OBO derivada: no se presenta como la edición oficial de NCI.',
    licenseUrl:
      'https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/ThesaurusTermsofUse.htm',
    homepage: 'https://github.com/NCI-Thesaurus/thesaurus-obo-edition',
    kind: 'github-release',
    repo: 'NCI-Thesaurus/thesaurus-obo-edition',
    files: { 'ncit.obo': 'ncit.obo' },
  },
  mondo: {
    name: 'Mondo Disease Ontology',
    publisher: 'Monarch Initiative',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    homepage: 'https://github.com/monarch-initiative/mondo',
    kind: 'github-release',
    repo: 'monarch-initiative/mondo',
    files: { 'mondo.obo': 'mondo.obo' },
  },
  uberon: {
    name: 'Uberon multi-species anatomy ontology',
    publisher: 'Uberon consortium (OBO Foundry)',
    license: 'CC BY 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    homepage: 'https://github.com/obophenotype/uberon',
    kind: 'github-release',
    repo: 'obophenotype/uberon',
    files: { 'uberon.obo': 'uberon.obo' },
  },
};

/**
 * Fuentes oficiales descargadas desde el sitio del editor (alcanzables desde el
 * 2026-10-24 16:29 UTC, cuando el entorno pasó a red completa).
 */
export const OFFICIAL_URL_SOURCES = {
  mesh: {
    name: 'Medical Subject Headings (MeSH) 2026 — descriptores',
    publisher: 'U.S. National Library of Medicine',
    license:
      'Términos de uso de MeSH (NLM): sin cargo, con atribución y versión identificada; no implica respaldo de NLM',
    licenseUrl:
      'https://www.nlm.nih.gov/databases/download/terms_and_conditions_mesh.html',
    homepage: 'https://www.nlm.nih.gov/mesh/',
    kind: 'url',
    files: {
      'desc2026.xml.gz':
        'https://nlmpubs.nlm.nih.gov/projects/mesh/MESH_FILES/xmlmesh/desc2026.gz',
    },
  },
  icd10pcs: {
    name: 'ICD-10-PCS FY2027 — tablas oficiales e índice (CMS)',
    publisher: 'Centers for Medicare & Medicaid Services (CMS)',
    license: 'Dominio público (obra del gobierno de EE. UU.)',
    licenseUrl: 'https://www.cms.gov/medicare/coding-billing/icd-10-codes',
    homepage: 'https://www.cms.gov/medicare/coding-billing/icd-10-codes',
    kind: 'url',
    files: {
      'icd10pcs-tables-index-2027.zip':
        'https://www.cms.gov/files/zip/2027-icd-10-pcs-code-tables-index.zip',
      'icd10pcs-order-2027.zip':
        'https://www.cms.gov/files/zip/2027-icd-10-pcs-order-file-long-abbreviated-titles.zip',
    },
  },
  'ncit-evs': {
    name: 'NCI Thesaurus — edición oficial (OWL)',
    publisher: 'National Cancer Institute — Enterprise Vocabulary Services',
    license: 'CC BY 4.0 (términos de uso de NCI Thesaurus)',
    licenseUrl:
      'https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/ThesaurusTermsofUse.htm',
    homepage: 'https://ncit.nci.nih.gov/',
    kind: 'url',
    files: {
      'Thesaurus.OWL.zip':
        'https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/Thesaurus.OWL.zip',
    },
  },
};

export const SPARQL_SOURCES = {
  'wikidata-p924': {
    name: 'Wikidata — P924 «possible treatment» con referencia (fuente colaborativa)',
    publisher: 'Comunidad de Wikidata / Wikimedia Foundation',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    homepage: 'https://www.wikidata.org/',
    kind: 'sparql',
    endpoint: 'https://query.wikidata.org/sparql',
    file: 'p924.json',
  },
};

/**
 * Fuentes candidatas que este entorno NO alcanza (la política de red responde
 * 403 al CONNECT). Se registran con el host exacto para que se pueda permitir
 * y re-correr `fetch.mjs`. Ninguna se reemplaza con un espejo de terceros.
 */
export const BLOCKED_SOURCES = {
  'clinicaltrials-gov': {
    name: 'ClinicalTrials.gov API v2 (intervenciones no farmacológicas ↔ condición, solo «en estudio»)',
    hosts: ['clinicaltrials.gov'],
    license: 'Dominio público (NLM); términos de uso de ClinicalTrials.gov',
  },
  'icd10pcs-cms': {
    name: 'ICD-10-PCS (tablas oficiales, eje Body Part)',
    hosts: ['www.cms.gov'],
    license: 'Dominio público (CMS)',
  },
  'ichi-who': {
    name: 'WHO ICHI (ejes Target/Action/Means)',
    hosts: ['icd.who.int', 'icdcdn.who.int'],
    license: 'CC BY-ND 3.0 IGO',
  },
  'icd11-who': {
    name: 'ICD-11 MMS (API exige credenciales de registro: no se crean cuentas)',
    hosts: ['id.who.int', 'icdaccessmanagement.who.int'],
    license: 'CC BY-ND 3.0 IGO',
  },
  'cups-minsalud': {
    name: 'CUPS Colombia (Resolución vigente, anexo técnico)',
    hosts: ['www.minsalud.gov.co', 'web.sispro.gov.co'],
    license: 'Acto administrativo público (Colombia)',
  },
  'mesh-nlm': {
    name: 'MeSH (árbol E y calificadores therapy/surgery)',
    hosts: ['nlmpubs.nlm.nih.gov', 'id.nlm.nih.gov'],
    license: 'Términos de uso de MeSH (NLM), sin cargo, con atribución',
  },
  'ncit-evs': {
    name: 'NCI Thesaurus edición oficial (OWL completo con todos los roles)',
    hosts: ['evs.nci.nih.gov'],
    license: 'CC BY 4.0',
  },
  'pubmed-europepmc': {
    name: 'PubMed E-utilities / Europe PMC (detección de huecos)',
    hosts: ['eutils.ncbi.nlm.nih.gov', 'www.ebi.ac.uk'],
    license: 'Metadatos NLM/EMBL-EBI',
  },
  wikidata: {
    name: 'Wikidata P924 (tratamiento posible)',
    hosts: ['query.wikidata.org'],
    license: 'CC0',
  },
  'nice-ipg': {
    name: 'NICE interventional procedures guidance (solo cita, sin texto)',
    hosts: ['www.nice.org.uk'],
    license: 'Términos de NICE',
  },
  cochrane: {
    name: 'Cochrane Library (metadatos de revisiones)',
    hosts: ['www.cochranelibrary.com'],
    license: 'Metadatos; texto con copyright',
  },
  'nnac-bolivia': {
    name: 'Guías y normas del Ministerio de Salud de Bolivia (NNAC)',
    hosts: ['www.minsalud.gob.bo'],
    license: 'Por verificar',
  },
  'cie10es-sanidad': {
    name: 'CIE-10-ES Procedimientos (nombres oficiales en castellano de ICD-10-PCS)',
    hosts: ['www.sanidad.gob.es'],
    license: 'Aviso legal del Ministerio de Sanidad: reutilización con cita',
  },
};

/** Clasificación de dominio: MAxO cuelga lo farmacológico de estas raíces (lo cubre `justin/seed-drug-treatments`). */
export const MAXO_PHARMACOLOGICAL_ROOTS = {
  'MAXO:0000058': 'pharmacotherapy',
  'MAXO:0001393': 'route of administration',
  'MAXO:0000118': 'preventative immunization',
};
export const MAXO_DIAGNOSTIC_ROOT = 'MAXO:0000003';
