// Rutas de trabajo de los diccionarios, todas FUERA de git, bajo la misma
// carpeta de build que el glosario ES (`GLOSSARY_BUILD_DIR`, por defecto
// `../glossary-data-build` hermana del repo).
import { join } from 'node:path';
import { BUILD_DIR } from '../../lib/glossary-es/common.mjs';

/** Archivos fuente tal cual se bajaron, uno por carpeta de fuente. */
export const SOURCES_DIR = join(BUILD_DIR, 'dictionaries-sources');
export const MANIFEST_PATH = join(SOURCES_DIR, 'manifest.json');
/** Corpus normalizado: `<fuente>.ndjson` + `<fuente>.meta.json`. */
export const NDJSON_DIR = join(BUILD_DIR, 'dictionaries', 'ndjson');
export const REPORT_PATH = join(BUILD_DIR, 'dictionaries', 'coverage.json');
