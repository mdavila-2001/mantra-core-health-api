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
  // GARD: el sitio no declara licencia; es una obra del NCATS/NIH (gobierno federal de EE. UU.). Ver SOURCES.md.
  GARD: 'Sin licencia declarada en el sitio; obra del NCATS/NIH (gobierno federal de EE. UU.), dominio público por 17 U.S.C. §105 salvo el material de terceros que GARD reproduce (OMIM, Orphanet, MONDO) — https://rarediseases.info.nih.gov/',
  MONDO: 'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/) — Mondo Disease Ontology, Monarch Initiative',
  DOID: 'CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/) — Human Disease Ontology',
  // El .obo no declara licencia. Fuente: términos de uso de NCI EVS
  // (https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/ThesaurusTermsofUse.htm), revisados en
  // docs/terminology-expansion/SOURCE-REGISTER.md; esa página no es accesible desde esta red.
  NCIT: 'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/legalcode), según los términos de uso de NCI EVS (https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/ThesaurusTermsofUse.htm, leídos el 2026-10-27: «The NCI Thesaurus is released under the Creative Commons Attribution 4.0 International license») — National Cancer Institute, NCI Thesaurus 26.09d; el nombre «NCI Thesaurus» es marca registrada: lo cargado es un subconjunto, no la edición oficial',
  ORPHANET: 'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/legalcode) — Orphanet (c) INSERM',
  ICD11: 'CC BY-ND 3.0 IGO (https://icd.who.int/en/docs/icd11-license.pdf) — © Organización Mundial de la Salud; se redistribuye sin modificar',
  HPO: 'Licencia propia de HPO (LICENSE.md del repo remite a https://hpo.jax.org/app/license): uso libre con atribución y versión',
  PHENOPACKET_STORE: 'BSD-3-Clause (https://github.com/monarch-initiative/phenopacket-store/blob/main/LICENSE) — Monarch Initiative',
  MEDLINEPLUS: 'MedlinePlus (U.S. National Library of Medicine): los resúmenes de temas de salud son de dominio público; atribución pedida: «Fuente: MedlinePlus, National Library of Medicine». La Enciclopedia A.D.A.M. y las monografías de medicamentos NO son de dominio público y no se usan; de este archivo sólo se toman los pares descriptor MeSH → tema. https://medlineplus.gov/about/using/usingcontent/',
  MEDLINEPLUS_GENETICS: 'Dominio público (obra del gobierno federal de EE. UU.): «Summaries on Genetics pages, including health condition, gene, and chromosome pages» figuran como contenido sin copyright en https://medlineplus.gov/about/using/usingcontent/ ; se pide atribución: «Fuente: MedlinePlus, National Library of Medicine»',
  WIKIDATA: 'CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/) — datos estructurados de Wikidata (https://www.wikidata.org/wiki/Wikidata:Licensing); las etiquetas en castellano las escribe la comunidad, no son traducción oficial',
  MESH: 'Uso libre con atribución («Courtesy of the U.S. National Library of Medicine», https://www.nlm.nih.gov/databases/download/terms_and_conditions_mesh.html) — MeSH 2026, National Library of Medicine',
  NANDO: 'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/), declarada en el README del repositorio aidrd/nando («Licens: CC-BY 4.0 | DBCLS») — DBCLS / NIBIOHN',
  ONCOTREE: 'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/), declarada en la sección License del README de cBioPortal/oncotree — Memorial Sloan Kettering Cancer Center',
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
    // Archivo plano OFICIAL de NCI EVS (reemplaza a la NCIt OBO Edition 26.02d de ncit-obo-org, la más nueva que
    // publica ese espejo). El nombre sin versión (`Thesaurus.FLAT.zip`) apunta siempre al último: se fija el versionado.
    key: 'ncit-evs-flat',
    file: 'ncit-evs/Thesaurus_26.09d.FLAT.zip',
    url: 'https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/Thesaurus_26.09d.FLAT.zip',
    expectedSha256: '3c2743ffb33302226f6f4df3ee683d2812d2c8726f4094237b80a496cf48411b',
    publisher: 'National Cancer Institute — NCI Enterprise Vocabulary Services (archivo plano oficial)',
    version: '26.09d',
    license: LICENSES.NCIT,
    unzipTo: 'ncit-evs',
  },
  {
    // «código|CUI|…|»: lo publica EVS junto a cada NCIt; generado con NCI Metathesaurus 202402 (ReadMe.txt).
    key: 'ncit-evs-cui-map',
    file: 'ncit-evs/nci_code_cui_map_202402.dat',
    url: 'https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/nci_code_cui_map_202402.dat',
    expectedSha256: 'a68bd56fd0ab6a56907a06064e972af5cd4569b79a6dacb40911b52adb177fd9',
    publisher: 'National Cancer Institute — NCI Enterprise Vocabulary Services',
    version: 'NCIt 26.09d · NCI Metathesaurus 202402',
    license: LICENSES.NCIT,
  },
  {
    key: 'ncit-evs-readme',
    file: 'ncit-evs/ReadMe.txt',
    url: 'https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/ReadMe.txt',
    publisher: 'National Cancer Institute — NCI Enterprise Vocabulary Services',
    version: '26.09d',
    license: LICENSES.NCIT,
  },
  {
    // Evidencia de licencia: los términos de uso que publica EVS (CC BY 4.0).
    key: 'ncit-evs-terms',
    file: 'ncit-evs/ThesaurusTermsofUse.htm',
    url: 'https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/ThesaurusTermsofUse.htm',
    publisher: 'National Cancer Institute — NCI Enterprise Vocabulary Services',
    version: 'última modificación 2026-07-11',
    license: LICENSES.NCIT,
  },
  {
    // Zip OFICIAL de la OMS (icdcdn.who.int, accesible desde el 2026-10-27). Su SHA-256 es el mismo que tenía la copia de
    // terceros que se usó antes (Wulfgardr/mediflow), así que el contenido de las cargas anteriores no cambia.
    key: 'icd11-mms',
    file: 'icd11/SimpleTabulation-ICD-11-MMS-en-2026-01.zip',
    url: 'https://icdcdn.who.int/static/releasefiles/2026-01/SimpleTabulation-ICD-11-MMS-en.zip',
    expectedSha256: 'f1356588f40953a83e3af2b662deab47c5e269f944d1ea4ed0cfeb2007c7cd39',
    publisher: 'Organización Mundial de la Salud — CIE-11 MMS (tabulación simple, inglés)',
    version: '2026-01',
    license: LICENSES.ICD11,
    unzipTo: 'icd11/mms-2026-01',
  },
  {
    // La misma release en castellano (títulos oficiales de la OMS). Lleva una columna más (`TitleEN`).
    key: 'icd11-mms-es',
    file: 'icd11/SimpleTabulation-ICD-11-MMS-es-2026-01.zip',
    url: 'https://icdcdn.who.int/static/releasefiles/2026-01/SimpleTabulation-ICD-11-MMS-es.zip',
    expectedSha256: '7c7e5a02706aefd6ff2c95675ad4d33e3f2b2a518a1cabc8bf9f10c07b33113f',
    publisher: 'Organización Mundial de la Salud — CIE-11 MMS (tabulación simple, castellano)',
    version: '2026-01',
    license: LICENSES.ICD11,
    unzipTo: 'icd11/mms-es-2026-01',
  },
  {
    // Tablas de correspondencia CIE-10 ↔ CIE-11 de la release 2026-01 (archivos fechados 2026-02-16): reemplazan a las
    // de 2025-01 que se tomaban de una copia de terceros.
    key: 'icd11-mapping',
    file: 'icd11/mapping-2026-01.zip',
    url: 'https://icdcdn.who.int/static/releasefiles/2026-01/mapping.zip',
    expectedSha256: '2eb158cf2a0d53690d6e9baf0956f7617e1315e4f2a44dfc3db3be8f49193a1d',
    publisher: 'Organización Mundial de la Salud — tablas de correspondencia CIE-11 ↔ CIE-10',
    version: '2026-01 (2026-Jan-17)',
    license: LICENSES.ICD11,
    unzipTo: 'icd11/mapping-2026-01',
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
    // XML oficial de NLM. El zip se re-publica de vez en cuando con otros bytes (el SHA-256 de los zips que lista
    // mantra-core-health-model/seedsProd/sources/mesh-2026-source-manifest.json ya no coincide con los que sirve NLM);
    // lo que se fija es el XML de adentro (`expectedInner`), idéntico byte a byte al desc2026.xml que sirve NLM directo.
    key: 'mesh-desc',
    file: 'mesh2026/desc2026.zip',
    url: 'https://nlmpubs.nlm.nih.gov/projects/mesh/MESH_FILES/xmlmesh/desc2026.zip',
    expectedInner: { 'desc2026.xml': '449792ed59ba4d60035e44724352f7361ec0dc945b67dcd821a50ff32f81bcdb' },
    publisher: 'U.S. National Library of Medicine — MeSH 2026, descriptores',
    version: '2026 (DTD 2026-01-01; archivo del 2026-08-12)',
    license: LICENSES.MESH,
    unzipTo: 'mesh2026',
  },
  {
    key: 'mesh-supp',
    file: 'mesh2026/supp2026.zip',
    url: 'https://nlmpubs.nlm.nih.gov/projects/mesh/MESH_FILES/xmlmesh/supp2026.zip',
    expectedInner: { 'supp2026.xml': '8ec0efa76e050813ffefad4f6cff280cd85e2a26110119949e987aba564824ca' },
    publisher: 'U.S. National Library of Medicine — MeSH 2026, conceptos suplementarios (SCR)',
    version: '2026 (archivo del 2026-08-12)',
    license: LICENSES.MESH,
    unzipTo: 'mesh2026',
  },
  {
    key: 'nando',
    file: 'nando/nando.ttl',
    url: 'https://raw.githubusercontent.com/aidrd/nando/9af59ee203fabf7ca479a9a30e972d44124f1843/results/nando.ttl',
    expectedSha256: '7a20340bb122d8c51b5d619d20e1abe043585a8e5c9bed12c9b60b1040097637',
    publisher: 'NANDO — Nanbyo Disease Ontology (DBCLS / NIBIOHN, Japón)',
    version: '1.0.0 (2023-11-27) · commit 9af59ee (2024-07-23, el último del repositorio al 2026-10-27)',
    license: LICENSES.NANDO,
  },
  {
    // Evidencia de licencia (el propio nando.ttl también la declara con `dcterms:license`).
    key: 'nando-readme',
    file: 'nando/README.md',
    url: 'https://raw.githubusercontent.com/aidrd/nando/9af59ee203fabf7ca479a9a30e972d44124f1843/README.md',
    publisher: 'NANDO — Nanbyo Disease Ontology (DBCLS / NIBIOHN, Japón)',
    version: 'commit 9af59ee',
    license: LICENSES.NANDO,
  },
  {
    key: 'oncotree',
    file: 'oncotree/oncotree_2025_10_03.json',
    url: 'https://raw.githubusercontent.com/cBioPortal/oncotree/0ff6ef4b8f16d76edc6554e6ea9fe063db5790f7/trees/oncotree_2025_10_03.json',
    expectedSha256: '613c84ebecce7b47fb6800a94efecf8c7edbc25120401d898591d3b478c36231',
    publisher: 'OncoTree — Memorial Sloan Kettering Cancer Center',
    version: '2025-10-03 (la última versión publicada; commit 0ff6ef4 del 2026-10-26)',
    license: LICENSES.ONCOTREE,
  },
  {
    key: 'oncotree-readme',
    file: 'oncotree/README.md',
    url: 'https://raw.githubusercontent.com/cBioPortal/oncotree/0ff6ef4b8f16d76edc6554e6ea9fe063db5790f7/README.md',
    publisher: 'OncoTree — Memorial Sloan Kettering Cancer Center',
    version: 'commit 0ff6ef4',
    license: LICENSES.ONCOTREE,
  },
  {
    // Un solo archivo que https://medlineplus.gov/xml.html ofrece explícitamente para bajar (igual que
    // `import-medlineplus-es.mjs`; `/xml/` figura como Disallow para rastreadores, esto no rastrea el sitio).
    // De acá sólo se toman los pares «descriptor MeSH → tema en español» que publica MedlinePlus.
    key: 'medlineplus-topics',
    file: 'medlineplus/mplus_topics_2026-10-27.xml',
    url: 'https://medlineplus.gov/xml/mplus_topics_2026-10-27.xml',
    publisher: 'MedlinePlus (U.S. National Library of Medicine) — temas de salud',
    version: '2026-10-27',
    license: LICENSES.MEDLINEPLUS,
  },
  {
    key: 'medlineplus-genetics',
    file: 'medlineplus/ghr-summaries.xml',
    url: 'https://medlineplus.gov/download/ghr-summaries.xml',
    publisher: 'MedlinePlus Genetics (U.S. National Library of Medicine) — compendio de resúmenes (condiciones, genes y cromosomas; sólo se usan las condiciones)',
    version: '2026-10-27 (esquema ghr-summaries-20250602)',
    license: LICENSES.MEDLINEPLUS_GENETICS,
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
    key: 'hetionet',
    file: 'hetionet/hetionet-v1.0-nodes.tsv',
    url: 'https://raw.githubusercontent.com/hetio/hetionet/8a6cc0c5604d0e2908786e4de38af67b8e46ee4a/hetnet/tsv/hetionet-v1.0-nodes.tsv',
    publisher: 'Hetionet (Himmelstein et al.)',
    version: 'v1.0',
    license: 'CC0 1.0',
  },
];

/** Más fuentes independientes que sólo se MIDEN (ids de enfermedad que citan): ninguna aporta nomenclatura propia que cargar. */
MEASURE_FILES.push(
  {
    key: 'gencc',
    file: 'gencc/gencc-submissions.tsv',
    url: 'https://search.thegencc.org/download/action/submissions-export-tsv',
    publisher: 'GenCC — Gene Curation Coalition (envíos gen-enfermedad de ClinGen, Orphanet, PanelApp y otros)',
    version: 'descarga del 2026-10-27',
    license: 'CC0 1.0 según la política de GenCC (https://thegencc.org); sólo se miden los ids de enfermedad (columna disease_curie), no se carga nada.',
  },
  {
    key: 'orphadata-en-product6',
    file: 'orphanet/en_product6.xml',
    url: 'https://www.orphadata.com/data/xml/en_product6.xml',
    publisher: 'Orphanet (INSERM US14) — enfermedades raras con sus genes (producto 6; no existe versión es_product6)',
    version: 'descarga del 2026-10-27',
    license: LICENSES.ORPHANET,
  },
  {
    key: 'orphadata-en-product9-prev',
    file: 'orphanet/en_product9_prev.xml',
    url: 'https://www.orphadata.com/data/xml/en_product9_prev.xml',
    publisher: 'Orphanet (INSERM US14) — prevalencia y epidemiología (producto 9)',
    version: 'descarga del 2026-10-27',
    license: LICENSES.ORPHANET,
  },
);

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

/**
 * GARD (NCATS/NIH): lista oficial de enfermedades (CSV que enlaza https://rarediseases.info.nih.gov/about)
 * y fichas públicas. Las baja `fetch-gard.mjs` (≈ 6 300 pedidos; por eso va aparte del resto).
 */
export const GARD = {
  dir: join(SOURCES_DIR, 'gard'),
  listUrl:
    'https://ncats.file.force.com/sfc/dist/version/download/?oid=00Dt00000004XG2&ids=068SJ00001TATJDYA5&d=%2Fa%2FSJ00000CxBWn%2FVZw0MJPNEYnFYG_CmsfCRWT1jYRrLizq.xa.3l6Rzq4&asPdf=false',
  trimmedUrl: 'https://rarediseases.info.nih.gov/assets/diseases.trimmed.json',
  singlesUrl: 'https://rarediseases.info.nih.gov/assets/singles/',
  aboutUrl: 'https://rarediseases.info.nih.gov/about',
  version: '2026-09',
  license: LICENSES.GARD,
};

/**
 * Wikidata (CC0): enfermedades con nombre en castellano y las que ningún otro sistema del catálogo identifica.
 * Las baja `fetch-wikidata.mjs` por SPARQL. Las propiedades se verifican por su etiqueta antes de usarlas.
 */
export const WIKIDATA = {
  dir: join(SOURCES_DIR, 'wikidata'),
  endpoint: 'https://query.wikidata.org/sparql',
  license: LICENSES.WIKIDATA,
  properties: {
    P31: { label: 'instance of' },
    P279: { label: 'subclass of' },
    P5270: { label: 'Mondo ID', id: true },
    P699: { label: 'Disease Ontology ID', id: true },
    P1550: { label: 'Orphanet ID', id: true },
    P486: { label: 'MeSH descriptor ID', id: true },
    P6680: { label: 'MeSH term ID', id: true },
    P492: { label: 'OMIM ID', id: true },
    P1748: { label: 'NCI Thesaurus ID', id: true },
    P7329: { label: 'ICD-11 ID (MMS)', id: true },
    P7807: { label: 'ICD-11 ID (Foundation)', id: true },
    P494: { label: 'ICD-10 ID', id: true },
    P4229: { label: 'ICD-10-CM', id: true },
    P2892: { label: 'UMLS CUI', id: true },
  },
};
