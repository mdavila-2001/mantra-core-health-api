// =============================================================================
// Catálogo de fuentes del corpus de síntomas, signos y fenotipos.
//
// Cada entrada dice de dónde se baja el archivo (URL estable de la release o
// del repositorio oficial), con qué licencia se publica y qué aporta. Los
// archivos quedan FUERA de git, en `<GLOSSARY_BUILD_DIR>/symptoms-sources/`;
// `fetch-symptom-sources.mjs` escribe ahí un `manifest.json` con URL, SHA-256,
// tamaño, fecha y la versión que declara el propio archivo.
//
// La licencia se copia de lo que declara la fuente (encabezado del archivo o
// página oficial). Donde la página oficial no se pudo abrir desde el entorno
// de la corrida, se dice eso: no se completa de memoria.
// =============================================================================

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUILD_DIR } from '../../lib/glossary-es/common.mjs';

export const SOURCES_DIR = process.env.SYMPTOMS_SOURCES_DIR ?? resolve(BUILD_DIR, 'symptoms-sources');
export const OUT_DIR = process.env.SYMPTOMS_OUT_DIR ?? resolve(BUILD_DIR, 'symptoms');
/** Corpus normalizado comprimido y versionado en git (pack-data.mjs / unpack-data.mjs). */
export const DATA_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'data');
/**
 * Cruce HPO ↔ Wikidata (P3841) versionado en git; lo escribe
 * `fetch-hpo-wikidata-crosswalk.mjs` y lo lee `load-symptoms.mjs`. Va aparte de
 * `data/` porque `pack-data.mjs` vacía esa carpeta antes de empaquetar.
 */
export const CROSSWALK_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'crosswalk');
export const CROSSWALK_FILE = resolve(CROSSWALK_DIR, 'hpo-wikidata-p3841.ndjson.gz');
export const CROSSWALK_MANIFEST = resolve(CROSSWALK_DIR, 'MANIFEST.json');

const HPO_RELEASE = 'https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download';
const MONARCH = 'https://storage.googleapis.com/data-public-monarchinitiative';

// Lo que DECLARA el archivo (hp.json: dcterms:license). El texto vigente de esa
// página, leído el 2026-10-24, está resumido en SOURCES.md (nota 1).
export const HPO_LICENSE = 'HPO license — https://hpo.jax.org/app/license (declarada en hp.json, dcterms:license)';

/**
 * `file` es relativo a SOURCES_DIR. `versionFrom` dice cómo se lee la versión
 * del propio archivo (no de la URL «latest»).
 */
export const SOURCE_FILES = [
  {
    key: 'hpo-json',
    file: 'hpo/hp.json',
    url: `${HPO_RELEASE}/hp.json`,
    owner: 'Human Phenotype Ontology Consortium / Monarch Initiative',
    license: HPO_LICENSE,
    versionFrom: 'obographs-versionInfo',
  },
  {
    key: 'hpo-es',
    file: 'hpo/hp-es.babelon.tsv',
    url: 'https://raw.githubusercontent.com/obophenotype/hpo-translations/main/babelon/hp-es.babelon.tsv',
    owner: 'HPO Translation Project (hpo-translations)',
    license: HPO_LICENSE,
    versionFrom: 'retrieved-at',
  },
  {
    key: 'hpoa',
    file: 'hpo/phenotype.hpoa',
    url: `${HPO_RELEASE}/phenotype.hpoa`,
    owner: 'Human Phenotype Ontology Consortium (anotaciones de OMIM, Orphanet y DECIPHER)',
    license: HPO_LICENSE,
    versionFrom: 'hpoa-header',
  },
  {
    key: 'symp',
    file: 'symp/symp.obo',
    url: 'https://raw.githubusercontent.com/DiseaseOntology/SymptomOntology/main/src/ontology/symp.obo',
    owner: 'Symptom Ontology — Disease Ontology project (University of Maryland School of Medicine)',
    license: 'CC0 1.0 (declarada en el encabezado: terms:license https://creativecommons.org/publicdomain/zero/1.0/)',
    versionFrom: 'obo-data-version',
  },
  {
    key: 'doid-owl',
    file: 'doid/doid.owl',
    url: 'https://raw.githubusercontent.com/DiseaseOntology/HumanDiseaseOntology/main/src/ontology/doid.owl',
    owner: 'Human Disease Ontology (University of Maryland School of Medicine)',
    license: 'CC0 1.0 (declarada en el encabezado del OWL)',
    versionFrom: 'owl-versionIRI',
  },
  {
    key: 'mondo',
    file: 'mondo/mondo.obo',
    url: 'https://github.com/monarch-initiative/mondo/releases/latest/download/mondo.obo',
    owner: 'Mondo Disease Ontology — Monarch Initiative',
    license: 'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/, declarada en el encabezado)',
    versionFrom: 'obo-data-version',
  },
  {
    key: 'ncit',
    file: 'ncit/ncit.obo',
    // Repo oficial vigente de la edición OBO (ncit-obo-org); el anterior
    // (NCI-Thesaurus/thesaurus-obo-edition) quedó en 24.04e. Release fijada: es la
    // misma que usa seed-diseases para `ncit-disease`, así el corte contra C2991
    // coincide en los dos lados.
    url: 'https://github.com/ncit-obo-org/ncit-obo-edition/releases/download/v2026-03-19/ncit.obo',
    owner: 'NCI Thesaurus (National Cancer Institute, EVS) — edición OBO (ncit-obo-org)',
    license: 'CC BY 4.0 según los términos de uso de NCI EVS (https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/ThesaurusTermsofUse.htm, registrados en docs/terminology-expansion/SOURCE-REGISTER.md): atribuir a NCI con la versión y no presentar un derivado como la edición oficial; el .obo no la declara — reconfirmar',
    versionFrom: 'obo-data-version',
  },
  {
    key: 'hpo-common-disease',
    file: 'monarch/common_disease_annot.tar.gz',
    url: `${MONARCH}/hpo/common_disease_annot.tar.gz`,
    owner: 'HPO / Monarch Initiative — anotaciones de enfermedades comunes (Groza et al. 2015, AJHG, PMC4572507)',
    license: HPO_LICENSE,
    versionFrom: 'retrieved-at',
  },
  {
    key: 'monarch-hpoa-edges',
    file: 'monarch/hpoa_disease_to_phenotype_edges.tsv',
    url: `${MONARCH}/monarch-kg/latest/transform_output/hpoa_disease_to_phenotype_edges.tsv`,
    owner: 'Monarch Initiative KG (transformación de phenotype.hpoa)',
    license: 'derivado de phenotype.hpoa (licencia de HPO); sólo se usa para medir saturación, no se carga',
    versionFrom: 'retrieved-at',
    optional: true,
  },
];

export const sourcePath = (file) => join(SOURCES_DIR, file);
export const sourceByKey = (key) => SOURCE_FILES.find((s) => s.key === key);
