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
  NCIT: 'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/) — NCI Thesaurus, National Cancer Institute (EVS)',
  ORPHANET: 'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/legalcode) — Orphanet (c) INSERM',
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
    file: 'ncit/ncit.obo',
    url: 'https://github.com/NCI-Thesaurus/thesaurus-obo-edition/releases/download/v2024-05-07/ncit.obo',
    publisher: 'National Cancer Institute — NCI Thesaurus OBO Edition',
    version: '24.04e (release 2024-05-07)',
    license: LICENSES.NCIT,
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
