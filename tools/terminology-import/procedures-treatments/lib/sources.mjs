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
 * Fuentes oficiales por HTTP directo (sin cuenta, sin token). Alcanzables desde el sondeo del
 * 2026-10-27 (antes respondían 403). Cada archivo se baja con curl, con reintentos y User-Agent
 * identificable, y su SHA-256 y Last-Modified quedan en `cache/<fuente>/meta.json`.
 */
export const HTTP_SOURCES = {
  'icd10pcs-cms-2027': {
    name: 'ICD-10-PCS FY2027 — tablas, códigos y orden (CMS)',
    publisher: 'Centers for Medicare & Medicaid Services (CMS), EE. UU.',
    license: 'Obra del gobierno federal de EE. UU. (CMS): dominio público.',
    licenseUrl: 'https://www.cms.gov/medicare/coding-billing/icd-10-codes',
    homepage: 'https://www.cms.gov/medicare/coding-billing/icd-10-codes',
    kind: 'http',
    files: {
      'tables.zip': 'https://www.cms.gov/files/zip/2027-icd-10-pcs-code-tables-index.zip',
      'codes.zip': 'https://www.cms.gov/files/zip/2027-icd-10-pcs-codes-file.zip',
      'order.zip': 'https://www.cms.gov/files/zip/2027-icd-10-pcs-order-file-long-abbreviated-titles.zip',
    },
  },
  'cie10es-procedimientos': {
    name: 'CIE-10-ES Procedimientos, edición 2026 (Ministerio de Sanidad de España)',
    publisher: 'Ministerio de Sanidad, España',
    license:
      'Aviso legal del Ministerio de Sanidad (https://www.sanidad.gob.es/avisoLegal/home.htm): reutilización autorizada, también comercial, citando la fuente y la fecha de última actualización y sin desnaturalizar el contenido. CIE-10-ES es la traducción oficial de ICD-10-PCS (© CMS), obra del gobierno de EE. UU.',
    licenseUrl: 'https://www.sanidad.gob.es/avisoLegal/home.htm',
    homepage: 'https://www.sanidad.gob.es/estadEstudios/estadisticas/normalizacion/home.htm',
    kind: 'http',
    files: {
      'Procedimientos_Tabla_Referencia_CIE10ES_2026.xlsx':
        'https://www.sanidad.gob.es/estadEstudios/estadisticas/normalizacion/CIE10/2026/Procedimientos_Tabla_Referencia_CIE10ES_2026.xlsx',
    },
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
