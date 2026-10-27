// =============================================================================
// Registro de fuentes de relaciones fármaco → enfermedad (puro, sin red).
//
// Cada fuente se baja con `git clone` del repositorio que publica el propio
// autor y se fija en un commit: así la versión es reproducible aunque el
// repositorio siga cambiando. `files` son las rutas que se leen (se guarda su
// SHA-256 en el manifiesto). La licencia es la que declara la fuente, con la
// URL donde se verificó.
//
// Los tipos de relación (`RELATION_TYPES`) son los que DECLARA cada fuente,
// sin colapsar: una indicación rotulada no es un «modificador de enfermedad»
// de PharmacotherapyDB ni un camino mecanístico de DrugMechDB. La definición
// en inglés es literal de la documentación de la fuente; la etiqueta en
// castellano es traducción propia (`labelEsOfficial: false`).
// =============================================================================

import { OPEN_CROSSWALKS, OPEN_RELATION_TYPES, OPEN_SOURCES } from './open-sources.mjs';

const GIT_SOURCES = {
  labeledin: {
    name: 'LabeledIn — indicaciones rotuladas en fichas de la FDA (NLM/NCBI)',
    owner: 'National Library of Medicine, NCBI (Khare R, Li J, Lu Z)',
    officialUrl: 'https://ftp.ncbi.nlm.nih.gov/pub/lu/LabeledIn/',
    repo: 'https://github.com/dhimmel/indications.git',
    commit: '11d535ba0884ee56c3cd5756fdfb4985f313bd80',
    files: {
      expert: 'labeledin/download/LabeledIn_Structured_Results.txt',
      crowd: 'labeledin/download/Crowdsourcing/Crowdsourced_Results.txt',
      notice: 'labeledin/download/README.txt',
    },
    version: 'LabeledIn 2014-09-04 (experto) y 2015-01-31 (crowdsourcing); DailyMed 2012-08-28',
    license: 'Dominio público (United States Government Work, NLM/NCBI); citar a los autores.',
    licenseUrl: 'labeledin/download/README.txt («PUBLIC DOMAIN NOTICE»)',
    mirrorNote:
      'Copia íntegra del FTP de NCBI dentro del repositorio de PharmacotherapyDB (CC0). El original (ftp.ncbi.nlm.nih.gov) está bloqueado por la red del entorno: el hash no se contrastó contra él.',
  },
  pharmacotherapydb: {
    name: 'PharmacotherapyDB 1.0 — catálogo de indicaciones curado por médicos',
    owner: 'Himmelstein DS et al. (proyecto Rephetio / Hetionet)',
    officialUrl: 'https://github.com/dhimmel/indications',
    repo: 'https://github.com/dhimmel/indications.git',
    commit: '11d535ba0884ee56c3cd5756fdfb4985f313bd80',
    files: { indications: 'catalog/indications.tsv', readme: 'README.md' },
    version: 'PharmacotherapyDB 1.0 (initial release, figshare doi:10.6084/m9.figshare.3103054)',
    license: 'CC0 1.0 (contenido original del repositorio). Identificadores DOID (CC0) y DrugBank (vocabulario abierto CC0).',
    licenseUrl: 'https://github.com/dhimmel/indications#license',
  },
  'drugcentral-2016': {
    name: 'DrugCentral — tabla de indicaciones (extracto 2016 publicado por su autor)',
    owner: 'Ursu O et al., University of New Mexico (DrugCentral)',
    officialUrl: 'https://drugcentral.org/',
    repo: 'https://github.com/olegursu/drugtarget.git',
    commit: '64630f7c2bc050f5af0a7cac7b08e778125284bc',
    files: { indications: 'drug_indication.tsv', identifiers: 'identifiers.tsv', readme: 'README.md', license: 'LICENSE' },
    version: 'drugtarget @ 2016-11-16 (indicaciones tomadas de OMOP v4)',
    license: 'CC BY 4.0 (archivo LICENSE del repositorio). Atribución: DrugCentral.',
    licenseUrl: 'https://github.com/olegursu/drugtarget/blob/master/LICENSE',
    dropNote:
      'La columna SNOMEDCT_CUI se descarta: Bolivia no es miembro de SNOMED International. Se conservan UMLS CUI y DOID tal cual los da la fuente.',
  },
  drugmechdb: {
    name: 'DrugMechDB — caminos mecanísticos curados de indicaciones',
    owner: 'Su Lab, Scripps Research (Gonzalez-Cavazos AC et al., Sci Data 2023)',
    officialUrl: 'https://sulab.github.io/DrugMechDB/',
    repo: 'https://github.com/SuLab/DrugMechDB.git',
    commit: 'aef224217071216748740c10faeb6db8e3f15901',
    files: { paths: 'indication_paths.yaml', license: 'LICENSE', citation: 'CITATION.cff' },
    version: 'DrugMechDB 2.0.1 (CITATION.cff) @ commit aef22421 (2026-06-02)',
    license: 'CC0 1.0 (archivo LICENSE del repositorio)',
    licenseUrl: 'https://github.com/SuLab/DrugMechDB/blob/main/LICENSE',
  },
  maxo: {
    name: 'MAxO annotations — acciones médicas para enfermedades raras (Monarch Initiative)',
    owner: 'Monarch Initiative (Medical Action Ontology)',
    officialUrl: 'https://github.com/monarch-initiative/maxo-annotations',
    repo: 'https://github.com/monarch-initiative/maxo-annotations.git',
    commit: '42edd966faac5229ce7c35fc3848f2e6b3d45bda',
    files: { annotations: 'data/maxo-annotations.tsv', license: 'LICENSE' },
    version: 'maxo-annotations @ commit 42edd966 (2026-08-18)',
    license: 'CC BY 4.0 (archivo LICENSE del repositorio)',
    licenseUrl: 'https://github.com/monarch-initiative/maxo-annotations/blob/main/LICENSE',
  },
};

const GIT_CROSSWALKS = {
  mondo: {
    name: 'MONDO — mapeos SSSOM (skos:exactMatch)',
    owner: 'Monarch Initiative',
    repo: 'https://github.com/monarch-initiative/mondo.git',
    commit: 'a645ab571f5b0881a184c28b84d0f9050432dc53',
    sparse: ['src/ontology/mappings/mondo.sssom.tsv'],
    files: { sssom: 'src/ontology/mappings/mondo.sssom.tsv' },
    version: 'mondo @ commit a645ab57 (2026-10-22)',
    license: 'CC BY 4.0 (ontología MONDO)',
  },
};

/** Fuentes de GitHub (con `repo` y `commit` fijado) más las abiertas por HTTP (ver open-sources.mjs). */
export const SOURCES = { ...GIT_SOURCES, ...OPEN_SOURCES };

/** Cruces publicados para resolver códigos. No aportan relaciones fármaco → enfermedad. */
export const CROSSWALKS = { ...GIT_CROSSWALKS, ...OPEN_CROSSWALKS };

export const isHttp = (def) => def.transport === 'http';

/** Clave de cada fuente/cruce → carpeta del clon (fuentes que comparten repo comparten clon). */
export function cloneDirName(key) {
  const def = SOURCES[key] ?? CROSSWALKS[key];
  if (!def) throw new Error(`fuente desconocida: ${key}`);
  if (isHttp(def)) throw new Error(`${key} se baja por HTTP: no tiene clon (ver fetch-open-sources.mjs)`);
  return def.repo.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '').replace('/', '__') + '@' + def.commit.slice(0, 12);
}

/**
 * Tipos de relación, uno por tipo que declara la fuente. `polarity: negative`
 * marca lo que la fuente publica como «no indicado»: nunca se lee como tratamiento.
 */
const GIT_RELATION_TYPES = {
  'labeledin:expert-label-indication': {
    source: 'labeledin',
    polarity: 'positive',
    definitionEn: 'Annotations of drug indications in FDA drug labels (DailyMed Version: August 28, 2012), annotated by experts.',
    labelEs: 'Indicación rotulada en la ficha de la FDA (anotación de expertos, LabeledIn)',
  },
  'labeledin:crowd-label-indication': {
    source: 'labeledin',
    polarity: 'positive',
    definitionEn: 'Crowdsourced annotations of drug indications in FDA drug labels; crowdsourced answer by majority voting = "yes".',
    labelEs: 'Indicación rotulada en la ficha de la FDA (mayoría de colaboradores dijo «sí», LabeledIn)',
  },
  'pharmacotherapydb:DM': {
    source: 'pharmacotherapydb',
    polarity: 'positive',
    definitionEn: 'DM -- disease modifying',
    labelEs: 'Tratamiento modificador de la enfermedad (PharmacotherapyDB)',
  },
  'pharmacotherapydb:SYM': {
    source: 'pharmacotherapydb',
    polarity: 'positive',
    definitionEn: 'SYM -- symptomatic',
    labelEs: 'Tratamiento sintomático (PharmacotherapyDB)',
  },
  'pharmacotherapydb:NOT': {
    source: 'pharmacotherapydb',
    polarity: 'negative',
    definitionEn: 'NOT -- non-indication',
    labelEs: 'No es una indicación (PharmacotherapyDB)',
  },
  'drugcentral-2016:indication': {
    source: 'drugcentral-2016',
    polarity: 'positive',
    definitionEn: 'INDICATION_FDB: drug indication extracted from OMOP v4.',
    labelEs: 'Indicación (DrugCentral, tomada de OMOP v4)',
  },
  'drugmechdb:indication-mechanism-path': {
    source: 'drugmechdb',
    polarity: 'positive',
    definitionEn: 'Mechanistic paths from a drug to a disease within a given indication.',
    labelEs: 'Indicación con camino mecanístico curado (DrugMechDB)',
  },
  'maxo:treats': {
    source: 'maxo',
    polarity: 'positive',
    definitionEn: 'relation = TREATS (MAxO annotation with a CHEBI extension).',
    labelEs: 'Trata (anotación MAxO con sustancia CHEBI)',
  },
  'maxo:prevents': {
    source: 'maxo',
    polarity: 'positive',
    definitionEn: 'relation = PREVENTS (MAxO annotation with a CHEBI extension).',
    labelEs: 'Previene (anotación MAxO con sustancia CHEBI)',
  },
  'maxo:contraindicated': {
    source: 'maxo',
    polarity: 'negative',
    definitionEn: 'relation = contraindicated (MAxO annotation with a CHEBI extension).',
    labelEs: 'Contraindicado (anotación MAxO con sustancia CHEBI; literal de la fuente)',
  },
  'maxo:lack-of-observed-response': {
    source: 'maxo',
    polarity: 'negative',
    definitionEn: 'relation = lack of observed response (MAxO annotation with a CHEBI extension).',
    labelEs: 'Sin respuesta observada (anotación MAxO con sustancia CHEBI)',
  },
  'maxo:no-observed-benefit': {
    source: 'maxo',
    polarity: 'negative',
    definitionEn: 'relation = no_observed_benefit (MAxO annotation with a CHEBI extension).',
    labelEs: 'Sin beneficio observado (anotación MAxO con sustancia CHEBI)',
  },
  'maxo:investigates': {
    source: 'maxo',
    polarity: 'investigational',
    definitionEn: 'relation = investigates (MAxO annotation with a CHEBI extension).',
    labelEs: 'En estudio (anotación MAxO con sustancia CHEBI)',
  },
};

export const RELATION_TYPES = { ...GIT_RELATION_TYPES, ...OPEN_RELATION_TYPES };

/** Tipos estructurales de la afirmación (no clínicos). */
export const STRUCTURAL_TYPES = {
  'assertion:drug': { labelEs: 'Fármaco de la afirmación', definitionEn: 'The drug the published assertion is about.' },
  'assertion:condition': { labelEs: 'Enfermedad o condición de la afirmación', definitionEn: 'The disease or condition the published assertion is about.' },
};
