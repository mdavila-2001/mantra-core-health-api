// =============================================================================
// Registro de fuentes del catálogo de enfermedades (pasada 1).
//
// Cada entrada dice de dónde sale el archivo, qué versión es, bajo qué licencia
// se publica y en qué ruta queda dentro de `<BUILD_DIR>/diseases-sources/`
// (fuera de git). `fetch-sources.mjs` baja exactamente esto y registra el
// SHA-256; `build-catalog.mjs` sólo lee archivos de esta lista.
//
// Las URL son las del editor o su espejo oficial en GitHub: el proxy de esta
// red bloquea orphadata.com, icd.who.int, nlm.nih.gov, ebi.ac.uk y Wikidata, y
// Orphanet publica sus productos también en `github.com/Orphanet/Orphadata_aggregated`
// (mismo contenido, misma licencia CC BY 4.0; ver SOURCES.md).
// =============================================================================

import { join } from 'node:path';
import { BUILD_DIR } from '../../lib/glossary-es/common.mjs';

export const SOURCES_DIR = process.env.DISEASES_SOURCES_DIR ?? join(BUILD_DIR, 'diseases-sources');
export const NDJSON_DIR = join(BUILD_DIR, 'ndjson', 'diseases');

const ORPHA_GH = 'https://github.com/Orphanet/Orphadata_aggregated';
const ORPHA_LFS = 'https://media.githubusercontent.com/media/Orphanet/Orphadata_aggregated/master';
const enc = (p) => p.split('/').map(encodeURIComponent).join('/');

/** Clasificaciones de Orphanet (product3), una por especialidad; ids de su propio índice. */
export const ORPHANET_CLASSIFICATIONS = [
  146, 147, 148, 150, 152, 156, 181, 182, 183, 184, 185, 186, 187, 188, 189, 193, 194, 195, 196, 197, 198, 199,
  200, 201, 202, 203, 204, 205, 209, 212, 216, 231, 233, 234, 235,
];

export const LICENSES = {
  MONDO: 'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/) — Mondo Disease Ontology, Monarch Initiative',
  DOID: 'CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/) — Human Disease Ontology',
  // El .obo no declara licencia. Fuente: términos de uso de NCI EVS
  // (https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/ThesaurusTermsofUse.htm), revisados en
  // docs/terminology-expansion/SOURCE-REGISTER.md; esa página no es accesible desde esta red.
  NCIT: 'CC BY 4.0 según los términos de uso de NCI EVS (https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/ThesaurusTermsofUse.htm) — National Cancer Institute; subconjunto de la NCIt OBO Edition, no es la edición oficial de NCI',
  ORPHANET: 'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/legalcode) — Orphanet (c) INSERM',
  ICD11: 'CC BY-ND 3.0 IGO (https://icd.who.int/en/docs/icd11-license.pdf) — © Organización Mundial de la Salud; se redistribuye sin modificar',
  HPO: 'Licencia propia de HPO (LICENSE.md del repo remite a https://hpo.jax.org/app/license): uso libre con atribución y versión',
  PHENOPACKET_STORE: 'BSD-3-Clause (https://github.com/monarch-initiative/phenopacket-store/blob/main/LICENSE) — Monarch Initiative',
  EFO: 'Apache-2.0 (https://github.com/EBISPOT/efo/blob/master/LICENSE) — EMBL-EBI',
};

/**
 * Archivos de la pasada 1. `version` es la del editor (tag del release o la
 * fecha que declara el propio archivo); `lfs` marca los que GitHub sirve por
 * Git LFS (media.githubusercontent.com).
 */
export const SOURCE_FILES = [
  {
    key: 'mondo',
    file: 'mondo/mondo.obo',
    url: 'https://github.com/monarch-initiative/mondo/releases/download/v2026-10-06/mondo.obo',
    publisher: 'Monarch Initiative',
    version: '2026-10-06',
    license: LICENSES.MONDO,
  },
  {
    key: 'doid',
    file: 'doid/doid.obo',
    url: 'https://raw.githubusercontent.com/DiseaseOntology/HumanDiseaseOntology/v2026-09-30/src/ontology/doid.obo',
    publisher: 'Disease Ontology Knowledgebase (University of Maryland School of Medicine)',
    version: '2026-09-30',
    license: LICENSES.DOID,
  },
  {
    key: 'ncit',
    file: 'ncit2026/ncit.obo',
    url: 'https://github.com/ncit-obo-org/ncit-obo-edition/releases/download/v2026-03-19/ncit.obo',
    publisher: 'NCI Thesaurus OBO Edition (ncit-obo-org)',
    version: '26.02d (release 2026-03-19)',
    license: LICENSES.NCIT,
  },
  {
    // Zip ORIGINAL de la OMS (icdcdn.who.int/static/releasefiles/2026-01/SimpleTabulation-ICD-11-MMS-en.zip,
    // bloqueado en esta red) tal como lo versiona un tercero; su SHA-256 coincide con el manifiesto
    // publicado junto al archivo y el TSV declara «Version:2026 Jan 17 - 05:30 UTC». Ver SOURCES.md.
    key: 'icd11-mms',
    file: 'icd11/SimpleTabulation-ICD-11-MMS-en-2026-01.zip',
    url: 'https://raw.githubusercontent.com/Wulfgardr/mediflow/3fa8899af07bbf70e802c9f2b01607820bd437c7/assets/reference-data/icd11/catalog.zip',
    officialUrl: 'https://icdcdn.who.int/static/releasefiles/2026-01/SimpleTabulation-ICD-11-MMS-en.zip',
    expectedSha256: 'f1356588f40953a83e3af2b662deab47c5e269f944d1ea4ed0cfeb2007c7cd39',
    publisher: 'Organización Mundial de la Salud — CIE-11 MMS (tabulación simple, inglés)',
    version: '2026-01',
    license: LICENSES.ICD11,
    unzipTo: 'icd11/mms-2026-01',
  },
  {
    // Tabla oficial de la OMS «11To10MapToOneCategory» de la release 2025-01, extraída sin cambios
    // por un tercero (README del repo); la del 2026-01 no está accesible desde esta red.
    key: 'icd11-to-icd10',
    file: 'icd11/map-2025-01-11To10MapToOneCategory.txt',
    url: 'https://raw.githubusercontent.com/drguptavivek/DigitVA/9aeff9688e1a9951a102e03a2768a067fdd22c9b/docs/icd-causegrp-mappings/migration-artifacts/icd11-icd10-mapping-tables-2025-01-base-2026-09-16/11To10MapToOneCategory.txt',
    officialUrl: 'https://icdcdn.who.int/static/releasefiles/2025-01/mapping.zip',
    publisher: 'Organización Mundial de la Salud — tablas de correspondencia CIE-11 ↔ CIE-10',
    version: '2025-01 (2025-Jan-24)',
    license: LICENSES.ICD11,
  },
  {
    key: 'icd10-to-icd11',
    file: 'icd11/map-2025-01-10To11MapToOneCategory.txt',
    url: 'https://raw.githubusercontent.com/drguptavivek/DigitVA/9aeff9688e1a9951a102e03a2768a067fdd22c9b/docs/icd-causegrp-mappings/migration-artifacts/icd11-icd10-mapping-tables-2025-01-base-2026-09-16/10To11MapToOneCategory.txt',
    officialUrl: 'https://icdcdn.who.int/static/releasefiles/2025-01/mapping.zip',
    // MD5 publicado por el repo que lo conserva: baae34f03596f46d198169b7bf94c0ea (coincide).
    expectedSha256: '1af732d79829d1752457bcc5d254098e576f19ac8f447534ce31744c873224e7',
    publisher: 'Organización Mundial de la Salud — tablas de correspondencia CIE-10 ↔ CIE-11',
    version: '2025-01 (2025-Jan-24)',
    license: LICENSES.ICD11,
  },
  {
    // Sólo los identificadores de enfermedad (OMIM, ORPHA, DECIPHER): los nombres de OMIM son de OMIM.
    key: 'hpo-annotations',
    file: 'hpo/phenotype.hpoa',
    url: 'https://github.com/obophenotype/human-phenotype-ontology/releases/download/v2026-09-01/phenotype.hpoa',
    publisher: 'Human Phenotype Ontology (Monarch Initiative / JAX)',
    version: '2026-09-02 (hp 2026-09-01)',
    license: LICENSES.HPO,
  },
  {
    // Groza et al. 2015 (AJHG 97:111-124, PMC4572507): anotaciones HPO de enfermedades comunes, por DOID o MeSH.
    // Archivo fijo de 2015 en el bucket público de Monarch (data.monarchinitiative.org/hpo/); sólo los ids.
    key: 'hpo-common-diseases',
    file: 'hpo-common/common_disease_annot.tar.gz',
    url: 'https://storage.googleapis.com/data-public-monarchinitiative/hpo/common_disease_annot.tar.gz',
    expectedSha256: '4c871573d57199cd944cac991ecdbbe60272420376a4064db92f39691afc93d2',
    publisher: 'Human Phenotype Ontology — Groza et al. 2015 (Monarch Initiative)',
    version: '2015 (archivo fijo)',
    license: LICENSES.HPO,
    untarTo: 'hpo-common/x',
  },
  {
    key: 'phenopacket-store',
    file: 'phenopacket-store/all_phenopackets.zip',
    url: 'https://github.com/monarch-initiative/phenopacket-store/releases/download/0.1.27/all_phenopackets.zip',
    publisher: 'Monarch Initiative — phenopacket-store',
    version: '0.1.27',
    license: LICENSES.PHENOPACKET_STORE,
    unzipTo: 'phenopacket-store/x',
  },
  {
    key: 'efo',
    file: 'efo/efo.obo',
    url: 'https://github.com/EBISPOT/efo/releases/download/v3.95.0/efo.obo',
    publisher: 'EMBL-EBI — Experimental Factor Ontology',
    version: '3.95.0',
    license: LICENSES.EFO,
  },
  {
    key: 'orphanet-es-product1',
    file: 'orphanet/es_product1.xml',
    url: `${ORPHA_LFS}/${enc('Rare diseases and classifications/Cross-referencing of rare diseases/XML/es_product1.xml')}`,
    publisher: 'Orphanet (INSERM US14) — espejo oficial en GitHub',
    version: '2026-06-23',
    license: LICENSES.ORPHANET,
  },
  {
    key: 'orphanet-en-product1',
    file: 'orphanet/en_product1.xml',
    url: `${ORPHA_LFS}/${enc('Rare diseases and classifications/Cross-referencing of rare diseases/XML/en_product1.xml')}`,
    publisher: 'Orphanet (INSERM US14) — espejo oficial en GitHub',
    version: '2026-06-23',
    license: LICENSES.ORPHANET,
  },
  {
    key: 'orphanet-en-product7',
    file: 'orphanet/en_product7.xml',
    url: `${ORPHA_LFS}/${enc('Rare diseases and classifications/Linearisation of disorders/en_product7.xml')}`,
    publisher: 'Orphanet (INSERM US14) — espejo oficial en GitHub',
    version: '2026-06-23',
    license: LICENSES.ORPHANET,
  },
  ...ORPHANET_CLASSIFICATIONS.map((id) => ({
    key: `orphanet-en-product3-${id}`,
    file: `orphanet/product3/en_product3_${id}.xml`,
    url: `${ORPHA_LFS}/${enc(`Rare diseases and classifications/Classifications of rare diseases/en_product3_${id}.xml`)}`,
    publisher: 'Orphanet (INSERM US14) — espejo oficial en GitHub',
    version: '2026-06-23',
    license: LICENSES.ORPHANET,
  })),
];

export const ORPHANET_REPO = ORPHA_GH;

/**
 * Fuentes que sólo se MIDEN en la saturación (no se cargan): su licencia no está
 * declarada en el repositorio de origen, o no aportan conceptos (Hetionet).
 */
export const MEASURE_FILES = [
  {
    key: 'nando',
    file: 'nando/nando.ttl',
    url: 'https://raw.githubusercontent.com/aidrd/nando/9af59ee203fabf7ca479a9a30e972d44124f1843/results/nando.ttl',
    publisher: 'NANDO — Nanbyo Disease Ontology (DBCLS / NIBIOHN, Japón)',
    version: 'commit 9af59ee (2024-07-23)',
    license: 'No declarada en el repositorio (sin LICENSE): no se carga hasta confirmarla.',
  },
  {
    key: 'oncotree',
    file: 'oncotree/oncotree_2025_10_03.json',
    url: 'https://raw.githubusercontent.com/cBioPortal/oncotree/3cf9fb3035cbdf75ac8983700935f9daa5dc08eb/trees/oncotree_2025_10_03.json',
    publisher: 'OncoTree — Memorial Sloan Kettering Cancer Center',
    version: '2025-10-03',
    license: 'No declarada en el repositorio (sin LICENSE): no se carga hasta confirmarla.',
  },
  {
    key: 'mesh-c',
    file: 'mesh/mesh-2025.obo',
    url: 'https://raw.githubusercontent.com/biopragmatics/obo-db-ingest/77e65923b484a2aa1c38306a03e916592f1d5f36/export/mesh/2025/mesh.obo',
    publisher: 'MeSH 2025 (NLM) convertido a OBO por PyOBO (biopragmatics/obo-db-ingest)',
    version: 'MeSH 2025 (conversión 2025-10-30)',
    license: 'CC0 1.0 según la cabecera; es una conversión de terceros sin números de árbol: sólo se mide.',
  },
  {
    key: 'gard',
    file: 'gard/gard.obo',
    url: 'https://raw.githubusercontent.com/biopragmatics/obo-db-ingest/77e65923b484a2aa1c38306a03e916592f1d5f36/export/gard/gard.obo',
    publisher: 'GARD (NCATS) convertido a OBO por PyOBO (biopragmatics/obo-db-ingest)',
    version: 'conversión 2025-10-31',
    license: 'No declarada en la conversión; GARD oficial (rarediseases.info.nih.gov) no es accesible: sólo se mide.',
  },
  {
    key: 'hetionet',
    file: 'hetionet/hetionet-v1.0-nodes.tsv',
    url: 'https://raw.githubusercontent.com/hetio/hetionet/8a6cc0c5604d0e2908786e4de38af67b8e46ee4a/hetnet/tsv/hetionet-v1.0-nodes.tsv',
    publisher: 'Hetionet (Himmelstein et al.)',
    version: 'v1.0',
    license: 'CC0 1.0',
  },
];

const MONARCH_KG = 'https://storage.googleapis.com/data-public-monarchinitiative/monarch-kg/2026-10-07/transform_output';
/**
 * Ingestas del Monarch KG 2026-10-07 (bucket público de Monarch = data.monarchinitiative.org):
 * curaciones independientes cuyos hosts están bloqueados en esta red. Sólo se
 * miden los ids de enfermedad que citan (columna `object`); no se carga nada.
 */
for (const [key, file, publisher, version, sha] of [
  ['monarch-clingen', 'clingen_gene_disease_edges.tsv', 'ClinGen — validez gen-enfermedad (vía Monarch KG)', 'clingen-ingest 2026-08-31', 'f03a332f62a919ed63510baa8c5a9411ad46ebef906b7e8e214b0f6e34964ad3'],
  ['monarch-clinvar', 'clinvar_variant_edges.tsv', 'ClinVar (NCBI) — variante-enfermedad (vía Monarch KG)', 'clinvar-ingest 2026-09-29', 'e6ad45de40a836922efc2333290b0d61dc05c64383efa83ce73259abcf4b5935'],
  ['monarch-alliance', 'alliance_disease_edges.tsv', 'Alliance of Genome Resources — modelos de enfermedad (vía Monarch KG)', 'alliance-ingest 9.1.0', '46f46d474564ab31064d3340948d0610aabe79518ee7a6669e40e82f19910ed6'],
  ['monarch-cureid', 'cureid_edges.tsv', 'CURE ID (FDA/NCATS) — usos en enfermedades (vía Monarch KG)', 'cureid-ingest 2026-05-28', 'f5d98832b4698d7f7746adfd724f3f21c18bb1afefd1d89220b44b6c03eb1c07'],
]) {
  MEASURE_FILES.push({
    key,
    file: `monarch-kg/${file}`,
    url: `${MONARCH_KG}/${file}`,
    expectedSha256: sha,
    publisher,
    version: `Monarch KG 2026-10-07 · ${version}`,
    license: 'Licencia no declarada en metadata.yaml del Monarch KG; sólo se usan los ids de enfermedad para medir.',
  });
}
